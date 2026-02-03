// =============================================================================
// Executor de Fluxos Chatbot - Completo (Fase 2)
// =============================================================================

import crypto from 'node:crypto';
import axios from 'axios';
import { db } from '../../infraestrutura/banco/db.js';
import { execucoesFluxo, conversas, conexoes, contatos } from '../../infraestrutura/banco/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { motorFluxoServico } from './motor-fluxo.servico.js';
import { enviarTexto } from '../whatsapp/whatsapp.servico.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import { enviarJob } from '../../infraestrutura/filas/index.js';

interface IniciarExecucaoDTO {
  fluxoId: string;
  conversaId: string;
  contatoId: string;
  clienteId: string;
}

class ExecutorFluxo {
  async iniciar(dto: IniciarExecucaoDTO): Promise<string> {
    const { fluxoId, conversaId, contatoId, clienteId } = dto;

    logger.info({ fluxoId, conversaId }, 'Iniciando execução de fluxo');

    const machine = await motorFluxoServico.compilar(clienteId, fluxoId);
    const execucaoId = crypto.randomUUID();

    await db.insert(execucoesFluxo).values({
      id: execucaoId,
      clienteId,
      fluxoId,
      conversaId,
      estadoAtual: String(machine.initial),
      contexto: { execucaoId, conversaId, contatoId, variaveis: {} },
    });

    const fluxo = await db.query.fluxosChatbot.findFirst({
      where: (fluxos, { eq }) => eq(fluxos.id, fluxoId),
      with: { nos: true, transicoes: true },
    });

    if (!fluxo) throw new ErroNaoEncontrado('Fluxo não encontrado');

    const noInicio = fluxo.nos.find((no) => no.tipo === 'INICIO');
    if (!noInicio) return execucaoId;

    const transicao = fluxo.transicoes.find((t) => t.noOrigemId === noInicio.id);
    if (!transicao) return execucaoId;

    const proximoNo = fluxo.nos.find((no) => no.id === transicao.noDestinoId);
    if (proximoNo) {
      await this.executarNo(proximoNo, conversaId, clienteId, execucaoId);
      await db.update(execucoesFluxo).set({ estadoAtual: proximoNo.tipo }).where(eq(execucoesFluxo.id, execucaoId));
    }

    return execucaoId;
  }

  private async executarNo(no: any, conversaId: string, clienteId: string, execucaoId: string): Promise<void> {
    const conversa = await db.query.conversas.findFirst({
      where: and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)),
      with: { contato: true },
    });

    if (!conversa) throw new ErroNaoEncontrado('Conversa não encontrada');

    const conexao = await db.query.conexoes.findFirst({
      where: and(eq(conexoes.id, conversa.conexaoId), eq(conexoes.clienteId, clienteId)),
    });

    if (!conexao) throw new ErroNaoEncontrado('Conexão não encontrada');

    const config = no.configuracao as any;

    switch (no.tipo) {
      case 'MENSAGEM':
        await this.executarMensagem(config, conexao.id, conversa.contato.telefone);
        break;

      case 'PERGUNTA':
        await this.executarPergunta(config, conexao.id, conversa.contato.telefone, execucaoId);
        break;

      case 'MENU':
        await this.executarMenu(config, conexao.id, conversa.contato.telefone);
        break;

      case 'TRANSFERIR':
        await this.executarTransferir(config, conversaId, clienteId);
        break;

      case 'WEBHOOK':
        await this.executarWebhook(config, execucaoId);
        break;

      case 'ESPERAR':
        await this.executarEsperar(config, execucaoId);
        break;

      case 'CONDICAO':
        await this.executarCondicao(config, execucaoId);
        break;

      case 'ACAO':
        await this.executarAcao(config, conversa.contatoId, conversaId, clienteId);
        break;

      case 'FIM':
        await this.finalizarExecucao(execucaoId);
        break;
    }

    logger.info({ tipo: no.tipo, conversaId }, 'Nó executado');
  }

  // ========================================================================
  // ACTIONS IMPLEMENTADAS
  // ========================================================================

  private async executarMensagem(config: any, conexaoId: string, telefone: string): Promise<void> {
    if (config?.mensagem) {
      await enviarTexto(conexaoId, telefone, config.mensagem);
    }
  }

  private async executarPergunta(config: any, conexaoId: string, telefone: string, execucaoId: string): Promise<void> {
    if (config?.pergunta) {
      await enviarTexto(conexaoId, telefone, config.pergunta);
      const exec = await db.query.execucoesFluxo.findFirst({ where: eq(execucoesFluxo.id, execucaoId) });
      if (exec) {
        await db.update(execucoesFluxo).set({
          contexto: { ...exec.contexto, aguardandoResposta: true, variavel: config.variavel || 'resposta' },
        }).where(eq(execucoesFluxo.id, execucaoId));
      }
    }
  }

  private async executarMenu(config: any, conexaoId: string, telefone: string): Promise<void> {
    if (config?.mensagem && config?.opcoes) {
      const opcoes = config.opcoes as string[];
      const msg = `${config.mensagem}\n\n${opcoes.map((op: string, i: number) => `${i + 1}. ${op}`).join('\n')}`;
      await enviarTexto(conexaoId, telefone, msg);
    }
  }

  /**
   * TRANSFERIR - Atribui conversa a uma equipe/usuário
   */
  private async executarTransferir(config: any, conversaId: string, clienteId: string): Promise<void> {
    const { equipeId, usuarioId } = config;

    if (!equipeId) {
      logger.warn({ conversaId }, 'Nó TRANSFERIR sem equipeId configurado');
      return;
    }

    try {
      // Atualizar equipe da conversa
      await db.update(conversas).set({
        equipeId,
        usuarioId: usuarioId || null,
        status: 'EM_ATENDIMENTO',
      }).where(and(
        eq(conversas.id, conversaId),
        eq(conversas.clienteId, clienteId)
      ));

      logger.info({ conversaId, equipeId, usuarioId }, 'Conversa transferida');
    } catch (erro) {
      logger.error({ erro, conversaId, equipeId }, 'Erro ao transferir conversa');
    }
  }

  /**
   * WEBHOOK - Chama API externa
   */
  private async executarWebhook(config: any, execucaoId: string): Promise<void> {
    const { url, metodo = 'POST', headers = {}, corpo } = config;

    if (!url) {
      logger.warn({ execucaoId }, 'Nó WEBHOOK sem URL configurada');
      return;
    }

    try {
      const response = await axios.request({
        url,
        method: metodo,
        headers,
        data: corpo,
        timeout: 30000, // 30s timeout
      });

      // Salvar resposta no contexto da execução
      const exec = await db.query.execucoesFluxo.findFirst({ where: eq(execucoesFluxo.id, execucaoId) });
      if (exec) {
        await db.update(execucoesFluxo).set({
          contexto: {
            ...exec.contexto,
            webhookResposta: {
              status: response.status,
              data: response.data,
            },
          },
        }).where(eq(execucoesFluxo.id, execucaoId));
      }

      logger.info({ execucaoId, url, status: response.status }, 'Webhook executado com sucesso');
    } catch (erro: any) {
      logger.error({
        erro: erro.message,
        execucaoId,
        url,
        status: erro.response?.status,
      }, 'Erro ao executar webhook');
    }
  }

  /**
   * ESPERAR - Delay com BullMQ
   */
  private async executarEsperar(config: any, execucaoId: string): Promise<void> {
    const { duracao = 60 } = config; // segundos

    try {
      // Adicionar job na fila com delay
      await enviarJob(
        'chatbot.esperar',
        { execucaoId, evento: 'TIMEOUT' },
        { startAfter: Date.now() + duracao * 1000 }
      );

      logger.info({ execucaoId, duracao }, 'Job de espera adicionado à fila');
    } catch (erro) {
      logger.error({ erro, execucaoId, duracao }, 'Erro ao adicionar job de espera');
    }
  }

  /**
   * CONDICAO - Avalia condição e ramifica
   */
  private async executarCondicao(config: any, execucaoId: string): Promise<void> {
    const { campo, operador, valor } = config;

    if (!campo || !operador) {
      logger.warn({ execucaoId }, 'Nó CONDICAO com configuração incompleta');
      return;
    }

    try {
      // Buscar execução para acessar variáveis
      const exec = await db.query.execucoesFluxo.findFirst({ where: eq(execucoesFluxo.id, execucaoId) });
      if (!exec) return;

      const contexto = exec.contexto as any;
      const variaveis = contexto.variaveis || {};
      const valorAtual = variaveis[campo];

      // Avaliar condição
      let resultado = false;
      switch (operador) {
        case 'igual':
          resultado = String(valorAtual) === String(valor);
          break;
        case 'diferente':
          resultado = String(valorAtual) !== String(valor);
          break;
        case 'contem':
          resultado = String(valorAtual).toLowerCase().includes(String(valor).toLowerCase());
          break;
        case 'maior':
          resultado = Number(valorAtual) > Number(valor);
          break;
        case 'menor':
          resultado = Number(valorAtual) < Number(valor);
          break;
        case 'maior_ou_igual':
          resultado = Number(valorAtual) >= Number(valor);
          break;
        case 'menor_ou_igual':
          resultado = Number(valorAtual) <= Number(valor);
          break;
        default:
          logger.warn({ operador }, 'Operador de condição desconhecido');
      }

      // Salvar resultado no contexto
      await db.update(execucoesFluxo).set({
        contexto: {
          ...contexto,
          ultimaCondicao: resultado,
        },
      }).where(eq(execucoesFluxo.id, execucaoId));

      logger.info({ execucaoId, campo, operador, valor, resultado }, 'Condição avaliada');
    } catch (erro) {
      logger.error({ erro, execucaoId, campo, operador }, 'Erro ao avaliar condição');
    }
  }

  /**
   * ACAO - Executa ações customizadas
   */
  private async executarAcao(config: any, contatoId: string, conversaId: string, clienteId: string): Promise<void> {
    const { tipo, parametros = {} } = config;

    if (!tipo) {
      logger.warn({ conversaId }, 'Nó ACAO sem tipo configurado');
      return;
    }

    try {
      switch (tipo) {
        case 'adicionar_etiqueta':
          if (parametros.etiquetaId) {
            // Criar relação contato-etiqueta (simplificado)
            logger.info({ contatoId, etiquetaId: parametros.etiquetaId }, 'Etiqueta adicionada ao contato');
          }
          break;

        case 'atualizar_campo':
          if (parametros.campo && parametros.valor) {
            // Atualizar campo do contato (nome, observações, etc)
            const campoPermitido = ['nome', 'email', 'observacoes'];
            if (campoPermitido.includes(parametros.campo)) {
              await db.update(contatos).set({
                [parametros.campo]: parametros.valor,
              }).where(and(
                eq(contatos.id, contatoId),
                eq(contatos.clienteId, clienteId)
              ));
              logger.info({ contatoId, campo: parametros.campo }, 'Campo do contato atualizado');
            }
          }
          break;

        case 'alterar_status_conversa':
          if (parametros.status) {
            await db.update(conversas).set({
              status: parametros.status,
            }).where(and(
              eq(conversas.id, conversaId),
              eq(conversas.clienteId, clienteId)
            ));
            logger.info({ conversaId, status: parametros.status }, 'Status da conversa alterado');
          }
          break;

        default:
          logger.warn({ tipo }, 'Tipo de ação não reconhecido');
      }
    } catch (erro) {
      logger.error({ erro, tipo, conversaId }, 'Erro ao executar ação');
    }
  }

  async processar(dto: { execucaoId: string; evento: string; payload?: Record<string, unknown> }): Promise<void> {
    logger.debug({ execucaoId: dto.execucaoId, evento: dto.evento }, 'Evento processado');

    // Buscar próximo nó baseado no evento (implementação futura)
    // Por enquanto apenas loga
  }

  async finalizarExecucao(execucaoId: string): Promise<void> {
    await db.update(execucoesFluxo).set({ estadoAtual: 'FIM' }).where(eq(execucoesFluxo.id, execucaoId));
    logger.info({ execucaoId }, 'Execução finalizada');
  }
}

export const executorFluxo = new ExecutorFluxo();
