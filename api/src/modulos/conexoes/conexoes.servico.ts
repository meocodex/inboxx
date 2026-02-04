import { eq, and, ilike, ne, count, sql, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { conexoes, conversas, mensagensAgendadas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import { uaiZapAdmin } from '../whatsapp/provedores/uaizap-admin.servico.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import { env } from '../../configuracao/ambiente.js';
import type {
  CriarConexaoDTO,
  AtualizarConexaoDTO,
  ListarConexoesQuery,
} from './conexoes.schema.js';

// =============================================================================
// Servico de Conexoes
// =============================================================================

export const conexoesServico = {
  async listar(clienteId: string, query: ListarConexoesQuery) {
    const { pagina, limite, canal, status, busca } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(conexoes.clienteId, clienteId)];
    if (canal) conditions.push(eq(conexoes.canal, canal));
    if (status) conditions.push(eq(conexoes.status, status));
    if (busca) conditions.push(ilike(conexoes.nome, `%${busca}%`));

    const where = and(...conditions);

    const totalConversasSubquery = db
      .select({ total: count() })
      .from(conversas)
      .where(eq(conversas.conexaoId, conexoes.id));

    const [dados, [totalResult]] = await Promise.all([
      db
        .select({
          id: conexoes.id,
          nome: conexoes.nome,
          canal: conexoes.canal,
          provedor: conexoes.provedor,
          status: conexoes.status,
          ultimoStatus: conexoes.ultimoStatus,
          criadoEm: conexoes.criadoEm,
          atualizadoEm: conexoes.atualizadoEm,
          totalConversas: sql<number>`(${totalConversasSubquery})`.as('total_conversas'),
        })
        .from(conexoes)
        .where(where)
        .orderBy(desc(conexoes.criadoEm))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() }).from(conexoes).where(where),
    ]);

    const total = totalResult.total;

    const conexoesFormatadas = dados.map((conexao) => ({
      id: conexao.id,
      nome: conexao.nome,
      canal: conexao.canal,
      provedor: conexao.provedor,
      status: conexao.status,
      ultimoStatus: conexao.ultimoStatus,
      totalConversas: Number(conexao.totalConversas),
      criadoEm: conexao.criadoEm,
      atualizadoEm: conexao.atualizadoEm,
    }));

    return {
      dados: conexoesFormatadas,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async obterPorId(clienteId: string, id: string) {
    const totalConversasSubquery = db
      .select({ total: count() })
      .from(conversas)
      .where(eq(conversas.conexaoId, conexoes.id));

    const totalMensagensAgendadasSubquery = db
      .select({ total: count() })
      .from(mensagensAgendadas)
      .where(eq(mensagensAgendadas.conexaoId, conexoes.id));

    const result = await db
      .select({
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
        provedor: conexoes.provedor,
        credenciais: conexoes.credenciais,
        configuracoes: conexoes.configuracoes,
        status: conexoes.status,
        ultimoStatus: conexoes.ultimoStatus,
        criadoEm: conexoes.criadoEm,
        atualizadoEm: conexoes.atualizadoEm,
        totalConversas: sql<number>`(${totalConversasSubquery})`.as('total_conversas'),
        totalMensagensAgendadas: sql<number>`(${totalMensagensAgendadasSubquery})`.as('total_mensagens_agendadas'),
      })
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    const conexao = result[0];

    // Mascarar credenciais sensiveis
    const credenciaisMascaradas = mascararCredenciais(
      conexao.credenciais as Record<string, string>
    );

    return {
      id: conexao.id,
      nome: conexao.nome,
      canal: conexao.canal,
      provedor: conexao.provedor,
      credenciais: credenciaisMascaradas,
      configuracoes: conexao.configuracoes,
      status: conexao.status,
      ultimoStatus: conexao.ultimoStatus,
      totalConversas: Number(conexao.totalConversas),
      totalMensagensAgendadas: Number(conexao.totalMensagensAgendadas),
      criadoEm: conexao.criadoEm,
      atualizadoEm: conexao.atualizadoEm,
    };
  },

  async criar(clienteId: string, dados: CriarConexaoDTO) {
    // Verificar se ja existe conexao com mesmo nome
    const nomeExiste = await db
      .select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.clienteId, clienteId), eq(conexoes.nome, dados.nome)))
      .limit(1);

    if (nomeExiste.length > 0) {
      throw new ErroValidacao('Ja existe uma conexao com este nome');
    }

    // Se provedor for UAIZAP, criar instância automaticamente
    let credenciaisFinais = dados.credenciais;
    let webhookUrl: string | undefined;
    let qrcodeGerado: string | null = null;

    if (dados.provedor === 'UAIZAP' && env.UAIZAP_API_URL && env.UAIZAP_API_KEY) {
      try {
        logger.info(
          { nome: dados.nome },
          'Criando instância UaiZap automaticamente'
        );

        // Criar instância no UaiZap - já retorna QR Code pois chama /instance/connect internamente
        const instancia = await uaiZapAdmin.criarInstancia({
          nome: dados.nome,
          // Webhook será configurado depois se BASE_URL estiver definido
        });

        // O QR Code já vem da criação da instância
        qrcodeGerado = instancia.qrcode ?? null;

        // URL do webhook para esta conexão (requer URL pública)
        // Formato: /api/webhooks/uaizap/:instanciaId
        const baseUrl = env.BASE_URL || (env.HOST !== '0.0.0.0' ? `https://${env.HOST}` : null);
        if (baseUrl && instancia.id) {
          webhookUrl = `${baseUrl}/api/webhooks/uaizap/${instancia.id}`;
          // Configurar webhook na instância
          await uaiZapAdmin.configurarWebhook(instancia.token, webhookUrl);
          logger.info({ webhookUrl }, 'Webhook configurado');
        }

        // Salvar credenciais com o token da instância (usado para autenticação)
        // IMPORTANTE: apiKey aqui é o token da instância específica, não o admin token
        credenciaisFinais = {
          ...(dados.credenciais || {}),
          apiUrl: env.UAIZAP_API_URL,
          apiKey: instancia.token, // Token da instância para autenticação
          instanciaId: instancia.id,
          instanciaToken: instancia.token, // Guardar também explicitamente
          webhookUrl,
        } as any;

        logger.info(
          { instanciaId: instancia.id, hasToken: !!instancia.token, hasQRCode: !!qrcodeGerado },
          'Instância UaiZap criada com sucesso'
        );
      } catch (erro) {
        logger.error(
          { erro: erro instanceof Error ? erro.message : 'Erro desconhecido' },
          'Erro ao criar instância UaiZap, prosseguindo sem credenciais automáticas'
        );
        // Continua sem instância - usuário pode configurar manualmente
      }
    }

    const [conexao] = await db
      .insert(conexoes)
      .values({
        clienteId,
        nome: dados.nome,
        canal: dados.canal,
        provedor: dados.provedor,
        credenciais: credenciaisFinais,
        configuracoes: dados.configuracoes ?? null,
        status: 'AGUARDANDO_QR',
      })
      .returning({
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
        provedor: conexoes.provedor,
        status: conexoes.status,
        criadoEm: conexoes.criadoEm,
      });

    // Retornar conexão com QR Code se disponível
    return {
      ...conexao,
      qrcode: qrcodeGerado,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarConexaoDTO) {
    const conexaoExisteResult = await db
      .select()
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (conexaoExisteResult.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    const conexaoExiste = conexaoExisteResult[0];

    // Se atualizando nome, verificar duplicidade
    if (dados.nome && dados.nome !== conexaoExiste.nome) {
      const nomeExiste = await db
        .select({ id: conexoes.id })
        .from(conexoes)
        .where(
          and(
            eq(conexoes.clienteId, clienteId),
            eq(conexoes.nome, dados.nome),
            ne(conexoes.id, id)
          )
        )
        .limit(1);

      if (nomeExiste.length > 0) {
        throw new ErroValidacao('Ja existe uma conexao com este nome');
      }
    }

    // Mesclar credenciais existentes com novas
    const credenciaisAtuais = conexaoExiste.credenciais as Record<string, unknown>;
    const novasCredenciais = dados.credenciais
      ? { ...credenciaisAtuais, ...dados.credenciais }
      : credenciaisAtuais;

    const updateData: Record<string, unknown> = {
      credenciais: novasCredenciais,
    };
    if (dados.nome) updateData.nome = dados.nome;
    if (dados.configuracoes !== undefined) {
      updateData.configuracoes = dados.configuracoes ?? null;
    }

    const [conexao] = await db
      .update(conexoes)
      .set(updateData)
      .where(eq(conexoes.id, id))
      .returning({
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
        provedor: conexoes.provedor,
        status: conexoes.status,
        atualizadoEm: conexoes.atualizadoEm,
      });

    return conexao;
  },

  async excluir(clienteId: string, id: string) {
    const result = await db
      .select({
        id: conexoes.id,
        provedor: conexoes.provedor,
        credenciais: conexoes.credenciais,
      })
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    const conexao = result[0];

    const [countResult] = await db
      .select({ total: count() })
      .from(conversas)
      .where(eq(conversas.conexaoId, id));

    if (countResult.total > 0) {
      throw new ErroValidacao(
        `Esta conexao possui ${countResult.total} conversa(s). ` +
          'Arquive ou exclua as conversas antes de excluir a conexao.'
      );
    }

    // Se provedor for UAIZAP, desconectar e excluir instância também
    if (conexao.provedor === 'UAIZAP' && env.UAIZAP_API_URL && env.UAIZAP_API_KEY) {
      const credenciais = conexao.credenciais as Record<string, string>;
      const instanciaToken = credenciais.instanciaToken || credenciais.apiKey;
      const instanciaId = credenciais.instanciaId;

      if (instanciaToken) {
        logger.info(
          { conexaoId: id, instanciaId, provedor: conexao.provedor },
          'Iniciando exclusão de conexão UAIZAP'
        );

        try {
          // Excluir instância do servidor (já faz logout internamente)
          await uaiZapAdmin.excluirInstancia(instanciaToken, instanciaId);
          logger.info(
            { conexaoId: id, instanciaId },
            'Conexão excluída com sucesso (banco local e servidor UAZAPI)'
          );
        } catch (erro) {
          const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
          logger.warn(
            { erro: mensagemErro, conexaoId: id, instanciaId },
            'Falha ao excluir instância UaiZap do servidor (instância pode permanecer órfã)'
          );
          // Continua com a exclusão da conexão no banco
        }
      }
    }

    await db.delete(conexoes).where(eq(conexoes.id, id));
  },

  async atualizarStatus(
    clienteId: string,
    id: string,
    status: 'CONECTADO' | 'DESCONECTADO' | 'AGUARDANDO_QR' | 'RECONECTANDO' | 'ERRO'
  ) {
    const result = await db
      .select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    const [conexao] = await db
      .update(conexoes)
      .set({
        status,
        ultimoStatus: new Date(),
      })
      .where(eq(conexoes.id, id))
      .returning({
        id: conexoes.id,
        nome: conexoes.nome,
        status: conexoes.status,
        ultimoStatus: conexoes.ultimoStatus,
      });

    return conexao;
  },

  async testarConexao(clienteId: string, id: string) {
    const [conexao] = await db
      .select()
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (!conexao) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    let sucesso = false;
    let mensagem = 'Falha ao testar conexao';
    let novoStatus: 'CONECTADO' | 'DESCONECTADO' | 'ERRO' = 'ERRO';

    // Testar conexão real baseado no provedor
    if (conexao.provedor === 'UAIZAP') {
      try {
        const { UaiZapProvedor } = await import('../whatsapp/provedores/uaizap.provedor.js');
        const credenciais = conexao.credenciais as { apiUrl: string; apiKey: string; instanciaId: string };

        if (!credenciais?.instanciaId) {
          mensagem = 'Credenciais UaiZap não configuradas';
          novoStatus = 'ERRO';
        } else {
          const provedor = new UaiZapProvedor(credenciais);
          const statusInstancia = await provedor.verificarStatus();

          if (statusInstancia.conectado) {
            sucesso = true;
            mensagem = 'Conexao testada com sucesso';
            novoStatus = 'CONECTADO';
          } else {
            mensagem = statusInstancia.mensagem || 'WhatsApp não conectado';
            novoStatus = 'DESCONECTADO';
          }
        }
      } catch (erro) {
        logger.error(
          { erro: erro instanceof Error ? erro.message : 'Erro desconhecido', conexaoId: id },
          'Erro ao testar conexão UaiZap'
        );
        mensagem = erro instanceof Error ? erro.message : 'Erro ao verificar conexão';
        novoStatus = 'ERRO';
      }
    } else if (conexao.provedor === 'META_API') {
      // Para Meta API, verificar se as credenciais estão configuradas
      const credenciais = conexao.credenciais as { token?: string; phoneNumberId?: string };
      if (credenciais?.token && credenciais?.phoneNumberId) {
        // Aqui poderia fazer uma chamada real para a Meta API
        // Por enquanto, assume que está conectado se tiver credenciais
        sucesso = true;
        mensagem = 'Credenciais Meta API configuradas';
        novoStatus = 'CONECTADO';
      } else {
        mensagem = 'Credenciais Meta API incompletas';
        novoStatus = 'ERRO';
      }
    } else {
      // Outros provedores - verificar apenas se tem credenciais
      mensagem = 'Provedor não suporta teste de conexão';
      novoStatus = 'DESCONECTADO';
    }

    // Atualizar status no banco
    await db
      .update(conexoes)
      .set({
        status: novoStatus,
        ultimoStatus: new Date(),
      })
      .where(eq(conexoes.id, id));

    return {
      sucesso,
      mensagem,
      status: novoStatus,
    };
  },

  async obterQRCode(clienteId: string, id: string) {
    const [conexao] = await db
      .select()
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (!conexao) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    if (conexao.provedor !== 'UAIZAP') {
      throw new ErroValidacao('Apenas conexoes UaiZap suportam QR Code');
    }

    // Instanciar provedor UaiZap
    const { UaiZapProvedor } = await import('../whatsapp/provedores/uaizap.provedor.js');
    const credenciais = conexao.credenciais as { apiUrl: string; apiKey: string; instanciaId: string };
    const provedor = new UaiZapProvedor(credenciais);

    // Primeiro verificar o status atual
    const statusAtual = await provedor.verificarStatus();

    // Se está conectado, atualizar o status no banco
    if (statusAtual.conectado && conexao.status !== 'CONECTADO') {
      await db
        .update(conexoes)
        .set({ status: 'CONECTADO', ultimoStatus: new Date() })
        .where(eq(conexoes.id, id));

      logger.info(
        { conexaoId: id },
        'Status atualizado para CONECTADO via polling'
      );

      // Retornar sem QR Code pois já está conectado
      return { qrcode: null, status: 'CONECTADO' };
    }

    // Se não está conectado, obter novo QR Code
    const qrcode = await provedor.obterQRCode();

    // Mapear status do UAZAPI para enum da aplicação
    // Estados UazAPI: 'disconnected', 'connecting', 'connected'
    const statusMapeado = statusAtual.conectado
      ? 'CONECTADO'
      : (statusAtual.status === 'disconnected' ? 'DESCONECTADO' : 'AGUARDANDO_QR');

    return { qrcode, status: statusMapeado };
  },

  async reconectar(clienteId: string, id: string) {
    const [conexao] = await db
      .select()
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (!conexao) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    if (conexao.provedor !== 'UAIZAP') {
      throw new ErroValidacao('Apenas conexoes UaiZap suportam reconexao');
    }

    await db
      .update(conexoes)
      .set({ status: sql`'AGUARDANDO_QR'::"StatusConexao"`, ultimoStatus: new Date() })
      .where(eq(conexoes.id, id));

    const { UaiZapProvedor } = await import('../whatsapp/provedores/uaizap.provedor.js');
    const credenciais = conexao.credenciais as { apiUrl: string; apiKey: string; instanciaId: string };
    const provedor = new UaiZapProvedor(credenciais);

    const resultado = await provedor.reiniciar();

    return { sucesso: true, mensagem: 'Reconexao iniciada', qrcode: resultado.qrcode };
  },

  async desconectar(clienteId: string, id: string) {
    const [conexao] = await db
      .select()
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (!conexao) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    await db
      .update(conexoes)
      .set({ status: 'DESCONECTADO', ultimoStatus: new Date() })
      .where(eq(conexoes.id, id));

    const { UaiZapProvedor } = await import('../whatsapp/provedores/uaizap.provedor.js');
    const credenciais = conexao.credenciais as { apiUrl: string; apiKey: string; instanciaId: string };
    const provedor = new UaiZapProvedor(credenciais);

    await provedor.desconectar();

    return { sucesso: true, mensagem: 'Desconectado com sucesso' };
  },
};

// =============================================================================
// Helpers
// =============================================================================

function mascararCredenciais(credenciais: Record<string, string>): Record<string, string> {
  if (!credenciais) return {};

  const mascaradas: Record<string, string> = {};

  for (const [chave, valor] of Object.entries(credenciais)) {
    if (typeof valor === 'string' && valor.length > 8) {
      mascaradas[chave] = valor.substring(0, 4) + '****' + valor.substring(valor.length - 4);
    } else if (typeof valor === 'string') {
      mascaradas[chave] = '****';
    } else {
      mascaradas[chave] = valor;
    }
  }

  return mascaradas;
}
