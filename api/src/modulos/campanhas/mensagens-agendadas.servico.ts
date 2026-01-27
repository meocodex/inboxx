import { eq, and, count, asc, lte, gte, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { mensagensAgendadas, conexoes, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarMensagemAgendadaDTO,
  AtualizarMensagemAgendadaDTO,
  ListarMensagensAgendadasQuery,
} from './mensagens-agendadas.schema.js';

// =============================================================================
// Servico de Mensagens Agendadas
// =============================================================================

export const mensagensAgendadasServico = {
  // ---------------------------------------------------------------------------
  // Listar Mensagens Agendadas
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarMensagensAgendadasQuery) {
    const { pagina, limite, status, contatoId, dataInicio, dataFim } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(mensagensAgendadas.clienteId, clienteId)];

    if (status) {
      conditions.push(eq(mensagensAgendadas.status, status));
    }

    if (contatoId) {
      conditions.push(eq(mensagensAgendadas.contatoId, contatoId));
    }

    if (dataInicio) {
      conditions.push(gte(mensagensAgendadas.agendarPara, new Date(dataInicio)));
    }

    if (dataFim) {
      conditions.push(lte(mensagensAgendadas.agendarPara, new Date(dataFim)));
    }

    const whereClause = and(...conditions);

    const [mensagens, totalResult] = await Promise.all([
      db.select({
        id: mensagensAgendadas.id,
        clienteId: mensagensAgendadas.clienteId,
        contatoId: mensagensAgendadas.contatoId,
        conexaoId: mensagensAgendadas.conexaoId,
        conteudo: mensagensAgendadas.conteudo,
        midiaUrl: mensagensAgendadas.midiaUrl,
        agendarPara: mensagensAgendadas.agendarPara,
        status: mensagensAgendadas.status,
        enviadaEm: mensagensAgendadas.enviadaEm,
        criadoEm: mensagensAgendadas.criadoEm,
        conexao: {
          id: conexoes.id,
          nome: conexoes.nome,
          canal: conexoes.canal,
        },
      })
        .from(mensagensAgendadas)
        .leftJoin(conexoes, eq(mensagensAgendadas.conexaoId, conexoes.id))
        .where(whereClause)
        .orderBy(asc(mensagensAgendadas.agendarPara))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(mensagensAgendadas)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    // Buscar dados dos contatos
    const contatoIds = mensagens.map((m) => m.contatoId);
    const contatosResult = contatoIds.length > 0
      ? await db.select({
          id: contatos.id,
          nome: contatos.nome,
          telefone: contatos.telefone,
        })
          .from(contatos)
          .where(inArray(contatos.id, contatoIds))
      : [];

    const contatosMap = new Map(contatosResult.map((c) => [c.id, c]));

    return {
      dados: mensagens.map((m) => ({
        ...m,
        contato: contatosMap.get(m.contatoId) || null,
      })),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Mensagem Agendada por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const result = await db.select({
      id: mensagensAgendadas.id,
      clienteId: mensagensAgendadas.clienteId,
      contatoId: mensagensAgendadas.contatoId,
      conexaoId: mensagensAgendadas.conexaoId,
      conteudo: mensagensAgendadas.conteudo,
      midiaUrl: mensagensAgendadas.midiaUrl,
      agendarPara: mensagensAgendadas.agendarPara,
      status: mensagensAgendadas.status,
      enviadaEm: mensagensAgendadas.enviadaEm,
      criadoEm: mensagensAgendadas.criadoEm,
      conexao: {
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
      },
    })
      .from(mensagensAgendadas)
      .leftJoin(conexoes, eq(mensagensAgendadas.conexaoId, conexoes.id))
      .where(and(eq(mensagensAgendadas.id, id), eq(mensagensAgendadas.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Mensagem agendada não encontrada');
    }

    const mensagem = result[0];

    const contatoResult = await db.select({
      id: contatos.id,
      nome: contatos.nome,
      telefone: contatos.telefone,
      email: contatos.email,
    })
      .from(contatos)
      .where(eq(contatos.id, mensagem.contatoId))
      .limit(1);

    return {
      ...mensagem,
      contato: contatoResult[0] ?? null,
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Mensagem Agendada
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarMensagemAgendadaDTO) {
    // Verificar se o contato pertence ao cliente
    const contatoResult = await db.select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoResult.length === 0) {
      throw new ErroNaoEncontrado('Contato não encontrado');
    }

    // Verificar se a conexao pertence ao cliente
    const conexaoResult = await db.select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.id, dados.conexaoId), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (conexaoResult.length === 0) {
      throw new ErroNaoEncontrado('Conexão não encontrada');
    }

    // Validar data futura
    const dataAgendamento = new Date(dados.agendarPara);
    if (dataAgendamento <= new Date()) {
      throw new ErroValidacao('Data de agendamento deve ser no futuro');
    }

    const [mensagem] = await db.insert(mensagensAgendadas).values({
      clienteId,
      contatoId: dados.contatoId,
      conexaoId: dados.conexaoId,
      conteudo: dados.conteudo,
      midiaUrl: dados.midiaUrl,
      agendarPara: dataAgendamento,
      status: 'PENDENTE',
    }).returning({ id: mensagensAgendadas.id });

    return this.obterPorId(clienteId, mensagem.id);
  },

  // ---------------------------------------------------------------------------
  // Atualizar Mensagem Agendada
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarMensagemAgendadaDTO) {
    const mensagemExistenteResult = await db.select({
      id: mensagensAgendadas.id,
      status: mensagensAgendadas.status,
    })
      .from(mensagensAgendadas)
      .where(and(eq(mensagensAgendadas.id, id), eq(mensagensAgendadas.clienteId, clienteId)))
      .limit(1);

    if (mensagemExistenteResult.length === 0) {
      throw new ErroNaoEncontrado('Mensagem agendada não encontrada');
    }

    if (mensagemExistenteResult[0].status !== 'PENDENTE') {
      throw new ErroValidacao('Só é possível editar mensagens pendentes');
    }

    // Validar data futura se fornecida
    if (dados.agendarPara) {
      const dataAgendamento = new Date(dados.agendarPara);
      if (dataAgendamento <= new Date()) {
        throw new ErroValidacao('Data de agendamento deve ser no futuro');
      }
    }

    await db.update(mensagensAgendadas)
      .set({
        ...(dados.conteudo && { conteudo: dados.conteudo }),
        ...(dados.midiaUrl !== undefined && { midiaUrl: dados.midiaUrl }),
        ...(dados.agendarPara && { agendarPara: new Date(dados.agendarPara) }),
      })
      .where(eq(mensagensAgendadas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Cancelar Mensagem Agendada
  // ---------------------------------------------------------------------------
  async cancelar(clienteId: string, id: string) {
    const mensagemResult = await db.select({
      id: mensagensAgendadas.id,
      status: mensagensAgendadas.status,
    })
      .from(mensagensAgendadas)
      .where(and(eq(mensagensAgendadas.id, id), eq(mensagensAgendadas.clienteId, clienteId)))
      .limit(1);

    if (mensagemResult.length === 0) {
      throw new ErroNaoEncontrado('Mensagem agendada não encontrada');
    }

    if (mensagemResult[0].status !== 'PENDENTE') {
      throw new ErroValidacao('Só é possível cancelar mensagens pendentes');
    }

    await db.update(mensagensAgendadas)
      .set({ status: 'CANCELADA' })
      .where(eq(mensagensAgendadas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Excluir Mensagem Agendada
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    const mensagemResult = await db.select({
      id: mensagensAgendadas.id,
      status: mensagensAgendadas.status,
    })
      .from(mensagensAgendadas)
      .where(and(eq(mensagensAgendadas.id, id), eq(mensagensAgendadas.clienteId, clienteId)))
      .limit(1);

    if (mensagemResult.length === 0) {
      throw new ErroNaoEncontrado('Mensagem agendada não encontrada');
    }

    if (!['PENDENTE', 'CANCELADA'].includes(mensagemResult[0].status)) {
      throw new ErroValidacao('Só é possível excluir mensagens pendentes ou canceladas');
    }

    await db.delete(mensagensAgendadas).where(eq(mensagensAgendadas.id, id));
  },

  // ---------------------------------------------------------------------------
  // Obter Proximas a Enviar (para processamento)
  // ---------------------------------------------------------------------------
  async obterProximasAEnviar(limite: number = 10) {
    const agora = new Date();

    const mensagens = await db.select({
      id: mensagensAgendadas.id,
      clienteId: mensagensAgendadas.clienteId,
      contatoId: mensagensAgendadas.contatoId,
      conexaoId: mensagensAgendadas.conexaoId,
      conteudo: mensagensAgendadas.conteudo,
      midiaUrl: mensagensAgendadas.midiaUrl,
      agendarPara: mensagensAgendadas.agendarPara,
      status: mensagensAgendadas.status,
      enviadaEm: mensagensAgendadas.enviadaEm,
      criadoEm: mensagensAgendadas.criadoEm,
      conexao: {
        id: conexoes.id,
        nome: conexoes.nome,
        canal: conexoes.canal,
        credenciais: conexoes.credenciais,
      },
    })
      .from(mensagensAgendadas)
      .leftJoin(conexoes, eq(mensagensAgendadas.conexaoId, conexoes.id))
      .where(and(
        eq(mensagensAgendadas.status, 'PENDENTE'),
        lte(mensagensAgendadas.agendarPara, agora),
      ))
      .orderBy(asc(mensagensAgendadas.agendarPara))
      .limit(limite);

    // Buscar dados dos contatos
    const contatoIds = mensagens.map((m) => m.contatoId);
    const contatosResult = contatoIds.length > 0
      ? await db.select({
          id: contatos.id,
          nome: contatos.nome,
          telefone: contatos.telefone,
        })
          .from(contatos)
          .where(inArray(contatos.id, contatoIds))
      : [];

    const contatosMap = new Map(contatosResult.map((c) => [c.id, c]));

    return mensagens.map((m) => ({
      ...m,
      contato: contatosMap.get(m.contatoId) || null,
    }));
  },

  // ---------------------------------------------------------------------------
  // Marcar como Enviada
  // ---------------------------------------------------------------------------
  async marcarEnviada(id: string) {
    const [result] = await db.update(mensagensAgendadas)
      .set({
        status: 'ENVIADA',
        enviadaEm: new Date(),
      })
      .where(eq(mensagensAgendadas.id, id))
      .returning({
        id: mensagensAgendadas.id,
        clienteId: mensagensAgendadas.clienteId,
        contatoId: mensagensAgendadas.contatoId,
        conexaoId: mensagensAgendadas.conexaoId,
        conteudo: mensagensAgendadas.conteudo,
        midiaUrl: mensagensAgendadas.midiaUrl,
        agendarPara: mensagensAgendadas.agendarPara,
        status: mensagensAgendadas.status,
        enviadaEm: mensagensAgendadas.enviadaEm,
        criadoEm: mensagensAgendadas.criadoEm,
      });

    return result;
  },

  // ---------------------------------------------------------------------------
  // Marcar como Erro
  // ---------------------------------------------------------------------------
  async marcarErro(id: string) {
    const [result] = await db.update(mensagensAgendadas)
      .set({ status: 'ERRO' })
      .where(eq(mensagensAgendadas.id, id))
      .returning({
        id: mensagensAgendadas.id,
        clienteId: mensagensAgendadas.clienteId,
        contatoId: mensagensAgendadas.contatoId,
        conexaoId: mensagensAgendadas.conexaoId,
        conteudo: mensagensAgendadas.conteudo,
        midiaUrl: mensagensAgendadas.midiaUrl,
        agendarPara: mensagensAgendadas.agendarPara,
        status: mensagensAgendadas.status,
        enviadaEm: mensagensAgendadas.enviadaEm,
        criadoEm: mensagensAgendadas.criadoEm,
      });

    return result;
  },
};
