// =============================================================================
// Gateway de Integração Chatbot com WhatsApp
// =============================================================================

import { db } from '../../infraestrutura/banco/db.js';
import { execucoesFluxo, fluxosChatbot, conversas } from '../../infraestrutura/banco/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';

import { executorFluxo } from './executor-fluxo.servico.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

type TipoGatilho = 'PRIMEIRA_MENSAGEM' | 'PALAVRA_CHAVE' | 'HORARIO' | 'ETIQUETA';

class ChatbotGateway {
  /**
   * Processa uma mensagem recebida no contexto do chatbot
   */
  async processar(conversaId: string, clienteId: string, mensagemTexto: string): Promise<void> {
    logger.info({ conversaId, mensagemTexto: mensagemTexto.substring(0, 50) }, 'Processando mensagem no chatbot');

    // 1. Verificar se há execução ativa para esta conversa
    const execucaoAtiva = await db.query.execucoesFluxo.findFirst({
      where: and(eq(execucoesFluxo.conversaId, conversaId), eq(execucoesFluxo.clienteId, clienteId)),
      orderBy: (execucoes, { desc }) => [desc(execucoes.criadoEm)],
    });

    if (execucaoAtiva) {
      logger.debug({ execucaoId: execucaoAtiva.id, estadoAtual: execucaoAtiva.estadoAtual }, 'Execução ativa encontrada');

      const contexto = execucaoAtiva.contexto as Record<string, unknown>;

      // 2a. Se está aguardando resposta, processar como resposta
      if (contexto.aguardandoResposta) {
        const variavel = contexto.variavel as string;

        logger.info({ execucaoId: execucaoAtiva.id, variavel }, 'Processando resposta de pergunta');

        // Atualizar variável no contexto
        const novoContexto = {
          ...contexto,
          aguardandoResposta: false,
          variaveis: {
            ...(contexto.variaveis as Record<string, unknown>),
            [variavel]: mensagemTexto,
          },
        };

        await db
          .update(execucoesFluxo)
          .set({
            contexto: novoContexto as typeof execucoesFluxo.$inferSelect.contexto,
            atualizadoEm: new Date(),
          })
          .where(eq(execucoesFluxo.id, execucaoAtiva.id));

        // Processar evento de resposta recebida
        await executorFluxo.processar({
          execucaoId: execucaoAtiva.id,
          evento: 'RESPOSTA_RECEBIDA',
          payload: { [variavel]: mensagemTexto },
        });
      } else {
        // 2b. Processar como evento de mensagem genérica
        logger.debug({ execucaoId: execucaoAtiva.id }, 'Processando mensagem como evento genérico');

        await executorFluxo.processar({
          execucaoId: execucaoAtiva.id,
          evento: 'MENSAGEM_RECEBIDA',
          payload: { texto: mensagemTexto },
        });
      }
    } else {
      // 3. Não há execução ativa - verificar gatilho por palavra-chave
      logger.debug({ conversaId }, 'Nenhuma execução ativa - verificando gatilhos');
      await this.verificarGatilhoPalavraChave(conversaId, clienteId, mensagemTexto);
    }
  }

  /**
   * Inicia um fluxo baseado em um gatilho específico
   */
  async iniciarFluxoPorGatilho(
    conversaId: string,
    contatoId: string,
    clienteId: string,
    gatilho: TipoGatilho
  ): Promise<void> {
    logger.info({ conversaId, gatilho }, 'Iniciando fluxo por gatilho');

    // Buscar fluxo ativo com o gatilho especificado
    const fluxo = await db.query.fluxosChatbot.findFirst({
      where: and(
        eq(fluxosChatbot.clienteId, clienteId),
        eq(fluxosChatbot.ativo, true),
        sql`${fluxosChatbot.gatilho}->>'tipo' = ${gatilho}`
      ),
    });

    if (!fluxo) {
      logger.debug({ gatilho, clienteId }, 'Nenhum fluxo encontrado para o gatilho');
      return;
    }

    logger.info({ fluxoId: fluxo.id, nome: fluxo.nome }, 'Fluxo encontrado - iniciando execução');

    // Iniciar execução do fluxo
    const execucaoId = await executorFluxo.iniciar({
      fluxoId: fluxo.id,
      conversaId,
      contatoId,
      clienteId,
    });

    logger.info({ execucaoId, fluxoId: fluxo.id }, 'Fluxo iniciado com sucesso');
  }

  /**
   * Verifica se a mensagem contém palavra-chave que deve disparar um fluxo
   */
  private async verificarGatilhoPalavraChave(
    conversaId: string,
    clienteId: string,
    texto: string
  ): Promise<void> {
    logger.debug({ conversaId, texto: texto.substring(0, 50) }, 'Verificando gatilho por palavra-chave');

    // Buscar fluxos com gatilho PALAVRA_CHAVE
    const fluxos = await db.query.fluxosChatbot.findMany({
      where: and(
        eq(fluxosChatbot.clienteId, clienteId),
        eq(fluxosChatbot.ativo, true),
        sql`${fluxosChatbot.gatilho}->>'tipo' = 'PALAVRA_CHAVE'`
      ),
    });

    if (fluxos.length === 0) {
      logger.debug({ clienteId }, 'Nenhum fluxo com gatilho PALAVRA_CHAVE encontrado');
      return;
    }

    const textoLower = texto.toLowerCase().trim();

    // Verificar cada fluxo
    for (const fluxo of fluxos) {
      const gatilho = fluxo.gatilho as { tipo: string; palavrasChave?: string[] };
      const palavrasChave = gatilho.palavrasChave || [];

      // Verificar se alguma palavra-chave está presente
      const match = palavrasChave.some((palavra) => textoLower.includes(palavra.toLowerCase()));

      if (match) {
        logger.info({
          fluxoId: fluxo.id,
          palavrasChave,
          textoRecebido: texto,
        }, 'Palavra-chave encontrada - iniciando fluxo');

        // Buscar dados da conversa
        const conversa = await db.query.conversas.findFirst({
          where: and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)),
        });

        if (conversa) {
          await executorFluxo.iniciar({
            fluxoId: fluxo.id,
            conversaId,
            contatoId: conversa.contatoId,
            clienteId,
          });

          // Iniciar apenas o primeiro fluxo que der match
          break;
        }
      }
    }
  }

  /**
   * Finaliza uma execução de fluxo
   */
  async finalizarExecucao(execucaoId: string): Promise<void> {
    logger.info({ execucaoId }, 'Finalizando execução de fluxo');

    // Atualizar estado para FINALIZADA
    await db
      .update(execucoesFluxo)
      .set({
        estadoAtual: 'FIM',
        atualizadoEm: new Date(),
      })
      .where(eq(execucoesFluxo.id, execucaoId));

    // Limpar actor da memória
    await executorFluxo.finalizarExecucao(execucaoId);

    logger.info({ execucaoId }, 'Execução finalizada com sucesso');
  }
}

export const chatbotGateway = new ChatbotGateway();
