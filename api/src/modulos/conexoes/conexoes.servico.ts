import { eq, and, ilike, ne, count, sql, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { conexoes, conversas, mensagensAgendadas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
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

    const [conexao] = await db
      .insert(conexoes)
      .values({
        clienteId,
        nome: dados.nome,
        canal: dados.canal,
        provedor: dados.provedor,
        credenciais: dados.credenciais,
        configuracoes: dados.configuracoes ?? null,
        status: 'DESCONECTADO',
      })
      .returning({
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
        provedor: conexoes.provedor,
        status: conexoes.status,
        criadoEm: conexoes.criadoEm,
      });

    return conexao;
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
      })
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

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

    await db.delete(conexoes).where(eq(conexoes.id, id));
  },

  async atualizarStatus(
    clienteId: string,
    id: string,
    status: 'CONECTADO' | 'DESCONECTADO' | 'RECONECTANDO' | 'ERRO'
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
    const result = await db
      .select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.id, id), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    // Simulacao de teste de conexao
    // Em producao, aqui faria a chamada real para a API do provedor
    const sucesso = true; // Simular sucesso

    if (sucesso) {
      await db
        .update(conexoes)
        .set({
          status: 'CONECTADO',
          ultimoStatus: new Date(),
        })
        .where(eq(conexoes.id, id));
    }

    return {
      sucesso,
      mensagem: sucesso ? 'Conexao testada com sucesso' : 'Falha ao testar conexao',
      status: sucesso ? 'CONECTADO' : 'ERRO',
    };
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
