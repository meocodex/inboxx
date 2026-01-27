import { eq, and, or, ilike, count, asc, gte, lte, lt, gt, sql } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { compromissos, lembretes, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import type {
  CriarCompromissoDTO,
  AtualizarCompromissoDTO,
  ListarCompromissosQuery,
} from './compromissos.schema.js';

// =============================================================================
// Servico de Compromissos
// =============================================================================

export const compromissosServico = {
  // ---------------------------------------------------------------------------
  // Listar Compromissos
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarCompromissosQuery) {
    const { pagina, limite, dataInicio, dataFim, contatoId, busca } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(compromissos.clienteId, clienteId)];

    if (dataInicio && dataFim) {
      conditions.push(gte(compromissos.dataHora, new Date(dataInicio)));
      conditions.push(lte(compromissos.dataHora, new Date(dataFim)));
    } else if (dataInicio && !dataFim) {
      conditions.push(gte(compromissos.dataHora, new Date(dataInicio)));
    } else if (!dataInicio && dataFim) {
      conditions.push(lte(compromissos.dataHora, new Date(dataFim)));
    }

    if (contatoId) {
      conditions.push(eq(compromissos.contatoId, contatoId));
    }

    if (busca) {
      conditions.push(
        or(
          ilike(compromissos.titulo, `%${busca}%`),
          ilike(compromissos.descricao, `%${busca}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const lembretesCountSub = db
      .select({ total: count() })
      .from(lembretes)
      .where(eq(lembretes.compromissoId, compromissos.id));

    const [compromissosResult, totalResult] = await Promise.all([
      db
        .select({
          id: compromissos.id,
          clienteId: compromissos.clienteId,
          contatoId: compromissos.contatoId,
          titulo: compromissos.titulo,
          descricao: compromissos.descricao,
          dataHora: compromissos.dataHora,
          duracaoMin: compromissos.duracaoMin,
          lembreteMin: compromissos.lembreteMin,
          criadoEm: compromissos.criadoEm,
          atualizadoEm: compromissos.atualizadoEm,
          contatoIdJoin: contatos.id,
          contatoNome: contatos.nome,
          contatoTelefone: contatos.telefone,
          totalLembretes: sql<number>`(${lembretesCountSub})`.as('total_lembretes'),
        })
        .from(compromissos)
        .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
        .where(whereClause)
        .orderBy(asc(compromissos.dataHora))
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: compromissosResult.map((c) => ({
        id: c.id,
        clienteId: c.clienteId,
        contatoId: c.contatoId,
        titulo: c.titulo,
        descricao: c.descricao,
        dataHora: c.dataHora,
        duracaoMin: c.duracaoMin,
        lembreteMin: c.lembreteMin,
        criadoEm: c.criadoEm,
        atualizadoEm: c.atualizadoEm,
        contato: c.contatoIdJoin
          ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone! }
          : null,
        totalLembretes: c.totalLembretes,
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
  // Listar Compromissos do Dia
  // ---------------------------------------------------------------------------
  async listarHoje(clienteId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const resultado = await db
      .select({
        id: compromissos.id,
        clienteId: compromissos.clienteId,
        contatoId: compromissos.contatoId,
        titulo: compromissos.titulo,
        descricao: compromissos.descricao,
        dataHora: compromissos.dataHora,
        duracaoMin: compromissos.duracaoMin,
        lembreteMin: compromissos.lembreteMin,
        criadoEm: compromissos.criadoEm,
        atualizadoEm: compromissos.atualizadoEm,
        contatoIdJoin: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(compromissos)
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(
        and(
          eq(compromissos.clienteId, clienteId),
          gte(compromissos.dataHora, hoje),
          lt(compromissos.dataHora, amanha)
        )
      )
      .orderBy(asc(compromissos.dataHora));

    return resultado.map((c) => ({
      id: c.id,
      clienteId: c.clienteId,
      contatoId: c.contatoId,
      titulo: c.titulo,
      descricao: c.descricao,
      dataHora: c.dataHora,
      duracaoMin: c.duracaoMin,
      lembreteMin: c.lembreteMin,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      contato: c.contatoIdJoin
        ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone! }
        : null,
    }));
  },

  // ---------------------------------------------------------------------------
  // Listar Proximos Compromissos
  // ---------------------------------------------------------------------------
  async listarProximos(clienteId: string, limite: number = 5) {
    const agora = new Date();

    const resultado = await db
      .select({
        id: compromissos.id,
        clienteId: compromissos.clienteId,
        contatoId: compromissos.contatoId,
        titulo: compromissos.titulo,
        descricao: compromissos.descricao,
        dataHora: compromissos.dataHora,
        duracaoMin: compromissos.duracaoMin,
        lembreteMin: compromissos.lembreteMin,
        criadoEm: compromissos.criadoEm,
        atualizadoEm: compromissos.atualizadoEm,
        contatoIdJoin: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(compromissos)
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(
        and(
          eq(compromissos.clienteId, clienteId),
          gte(compromissos.dataHora, agora)
        )
      )
      .orderBy(asc(compromissos.dataHora))
      .limit(limite);

    return resultado.map((c) => ({
      id: c.id,
      clienteId: c.clienteId,
      contatoId: c.contatoId,
      titulo: c.titulo,
      descricao: c.descricao,
      dataHora: c.dataHora,
      duracaoMin: c.duracaoMin,
      lembreteMin: c.lembreteMin,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      contato: c.contatoIdJoin
        ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone! }
        : null,
    }));
  },

  // ---------------------------------------------------------------------------
  // Obter Compromisso por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const resultado = await db
      .select({
        id: compromissos.id,
        clienteId: compromissos.clienteId,
        contatoId: compromissos.contatoId,
        titulo: compromissos.titulo,
        descricao: compromissos.descricao,
        dataHora: compromissos.dataHora,
        duracaoMin: compromissos.duracaoMin,
        lembreteMin: compromissos.lembreteMin,
        criadoEm: compromissos.criadoEm,
        atualizadoEm: compromissos.atualizadoEm,
        contatoIdJoin: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
        contatoEmail: contatos.email,
      })
      .from(compromissos)
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(and(eq(compromissos.id, id), eq(compromissos.clienteId, clienteId)))
      .limit(1);

    if (resultado.length === 0) {
      throw new ErroNaoEncontrado('Compromisso não encontrado');
    }

    const c = resultado[0];

    // Buscar lembretes do compromisso
    const lembretesResult = await db
      .select()
      .from(lembretes)
      .where(eq(lembretes.compromissoId, id))
      .orderBy(asc(lembretes.enviarEm));

    return {
      id: c.id,
      clienteId: c.clienteId,
      contatoId: c.contatoId,
      titulo: c.titulo,
      descricao: c.descricao,
      dataHora: c.dataHora,
      duracaoMin: c.duracaoMin,
      lembreteMin: c.lembreteMin,
      criadoEm: c.criadoEm,
      atualizadoEm: c.atualizadoEm,
      contato: c.contatoIdJoin
        ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone!, email: c.contatoEmail }
        : null,
      lembretes: lembretesResult,
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Compromisso
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarCompromissoDTO) {
    // Validar contato se fornecido
    if (dados.contatoId) {
      const contatoResult = await db
        .select()
        .from(contatos)
        .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
        .limit(1);

      if (contatoResult.length === 0) {
        throw new ErroNaoEncontrado('Contato não encontrado');
      }
    }

    const dataHora = new Date(dados.dataHora);

    const [compromisso] = await db
      .insert(compromissos)
      .values({
        clienteId,
        contatoId: dados.contatoId,
        titulo: dados.titulo,
        descricao: dados.descricao,
        dataHora,
        duracaoMin: dados.duracaoMin,
        lembreteMin: dados.lembreteMin,
      })
      .returning();

    // Criar lembrete automatico se especificado
    if (dados.lembreteMin) {
      await db.insert(lembretes).values({
        compromissoId: compromisso.id,
        enviarEm: new Date(dataHora.getTime() - dados.lembreteMin * 60000),
      });
    }

    // Buscar com contato e lembretes para retorno
    const contatoResult = dados.contatoId
      ? await db
          .select({ id: contatos.id, nome: contatos.nome, telefone: contatos.telefone })
          .from(contatos)
          .where(eq(contatos.id, dados.contatoId))
          .limit(1)
      : [];

    const lembretesResult = await db
      .select()
      .from(lembretes)
      .where(eq(lembretes.compromissoId, compromisso.id));

    return {
      ...compromisso,
      contato: contatoResult.length > 0 ? contatoResult[0] : null,
      lembretes: lembretesResult,
    };
  },

  // ---------------------------------------------------------------------------
  // Atualizar Compromisso
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarCompromissoDTO) {
    await this.obterPorId(clienteId, id);

    // Validar contato se fornecido
    if (dados.contatoId) {
      const contatoResult = await db
        .select()
        .from(contatos)
        .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
        .limit(1);

      if (contatoResult.length === 0) {
        throw new ErroNaoEncontrado('Contato não encontrado');
      }
    }

    const [compromissoAtualizado] = await db
      .update(compromissos)
      .set({
        ...(dados.titulo && { titulo: dados.titulo }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.contatoId !== undefined && { contatoId: dados.contatoId }),
        ...(dados.dataHora && { dataHora: new Date(dados.dataHora) }),
        ...(dados.duracaoMin !== undefined && { duracaoMin: dados.duracaoMin }),
        ...(dados.lembreteMin !== undefined && { lembreteMin: dados.lembreteMin }),
      })
      .where(eq(compromissos.id, id))
      .returning();

    // Buscar contato
    const contatoResult = compromissoAtualizado.contatoId
      ? await db
          .select({ id: contatos.id, nome: contatos.nome, telefone: contatos.telefone })
          .from(contatos)
          .where(eq(contatos.id, compromissoAtualizado.contatoId))
          .limit(1)
      : [];

    // Buscar lembretes
    const lembretesResult = await db
      .select()
      .from(lembretes)
      .where(eq(lembretes.compromissoId, id));

    return {
      ...compromissoAtualizado,
      contato: contatoResult.length > 0 ? contatoResult[0] : null,
      lembretes: lembretesResult,
    };
  },

  // ---------------------------------------------------------------------------
  // Excluir Compromisso
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    await this.obterPorId(clienteId, id);
    await db.delete(compromissos).where(eq(compromissos.id, id));
  },

  // ---------------------------------------------------------------------------
  // Obter Estatisticas de Agenda
  // ---------------------------------------------------------------------------
  async obterEstatisticas(clienteId: string) {
    const agora = new Date();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - hoje.getDay());
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    const [totalHojeR, totalSemanaR, totalMesR, proximosR, atrasadosR] = await Promise.all([
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(eq(compromissos.clienteId, clienteId), gte(compromissos.dataHora, hoje), lt(compromissos.dataHora, amanha))
        ),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(eq(compromissos.clienteId, clienteId), gte(compromissos.dataHora, inicioSemana), lt(compromissos.dataHora, fimSemana))
        ),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(eq(compromissos.clienteId, clienteId), gte(compromissos.dataHora, inicioMes), lte(compromissos.dataHora, fimMes))
        ),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(eq(compromissos.clienteId, clienteId), gt(compromissos.dataHora, agora))
        ),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(eq(compromissos.clienteId, clienteId), lt(compromissos.dataHora, agora))
        ),
    ]);

    return {
      hoje: totalHojeR[0]?.total ?? 0,
      estaSemana: totalSemanaR[0]?.total ?? 0,
      esteMes: totalMesR[0]?.total ?? 0,
      proximos: proximosR[0]?.total ?? 0,
      passados: atrasadosR[0]?.total ?? 0,
    };
  },
};
