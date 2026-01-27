import { eq, and, or, ilike, ne, count, sql, asc, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { equipes, usuarios, perfis, conversas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type { CriarEquipeDTO, AtualizarEquipeDTO, ListarEquipesQuery } from './equipes.schema.js';

// =============================================================================
// Servico de Equipes
// =============================================================================

const orderByMap = {
  nome: equipes.nome,
  criadoEm: equipes.criadoEm,
  atualizadoEm: equipes.atualizadoEm,
} as const;

const totalMembrosSubquery = sql<number>`(SELECT count(*) FROM usuarios WHERE usuarios.equipe_id = ${equipes.id})`.mapWith(Number);
const totalConversasSubquery = sql<number>`(SELECT count(*) FROM conversas WHERE conversas.equipe_id = ${equipes.id})`.mapWith(Number);

export const equipesServico = {
  async listar(clienteId: string, query: ListarEquipesQuery) {
    const { pagina, limite, busca, ordenarPor, ordem } = query;
    const offset = (pagina - 1) * limite;

    const baseCondition = eq(equipes.clienteId, clienteId);

    const buscaCondition = busca
      ? or(
          ilike(equipes.nome, `%${busca}%`),
          ilike(equipes.descricao, `%${busca}%`),
        )
      : undefined;

    const where = buscaCondition
      ? and(baseCondition, buscaCondition)
      : baseCondition;

    const orderColumn = orderByMap[ordenarPor as keyof typeof orderByMap] ?? equipes.criadoEm;
    const orderDirection = ordem === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [dados, totalResult] = await Promise.all([
      db
        .select({
          id: equipes.id,
          nome: equipes.nome,
          descricao: equipes.descricao,
          criadoEm: equipes.criadoEm,
          atualizadoEm: equipes.atualizadoEm,
          totalMembros: totalMembrosSubquery,
        })
        .from(equipes)
        .where(where)
        .orderBy(orderDirection)
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(equipes)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const equipesFormatadas = dados.map((equipe) => ({
      id: equipe.id,
      nome: equipe.nome,
      descricao: equipe.descricao,
      totalMembros: equipe.totalMembros,
      criadoEm: equipe.criadoEm,
      atualizadoEm: equipe.atualizadoEm,
    }));

    return {
      dados: equipesFormatadas,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async obterPorId(clienteId: string, id: string) {
    const result = await db
      .select({
        id: equipes.id,
        nome: equipes.nome,
        descricao: equipes.descricao,
        criadoEm: equipes.criadoEm,
        atualizadoEm: equipes.atualizadoEm,
        totalConversas: totalConversasSubquery,
      })
      .from(equipes)
      .where(and(eq(equipes.id, id), eq(equipes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Equipe nao encontrada');
    }

    const equipe = result[0];

    // Buscar membros separadamente com perfil aninhado
    const membros = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        avatarUrl: usuarios.avatarUrl,
        online: usuarios.online,
        perfil: {
          id: perfis.id,
          nome: perfis.nome,
        },
      })
      .from(usuarios)
      .innerJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .where(and(eq(usuarios.equipeId, id), eq(usuarios.clienteId, clienteId)));

    return {
      id: equipe.id,
      nome: equipe.nome,
      descricao: equipe.descricao,
      membros,
      totalMembros: membros.length,
      totalConversas: equipe.totalConversas,
      criadoEm: equipe.criadoEm,
      atualizadoEm: equipe.atualizadoEm,
    };
  },

  async criar(clienteId: string, dados: CriarEquipeDTO) {
    // Verificar se nome ja existe para este cliente
    const nomeExiste = await db
      .select({ id: equipes.id })
      .from(equipes)
      .where(and(eq(equipes.clienteId, clienteId), eq(equipes.nome, dados.nome)))
      .limit(1);

    if (nomeExiste.length > 0) {
      throw new ErroValidacao('Ja existe uma equipe com este nome');
    }

    const [equipe] = await db
      .insert(equipes)
      .values({
        clienteId,
        nome: dados.nome,
        descricao: dados.descricao,
      })
      .returning({
        id: equipes.id,
        nome: equipes.nome,
        descricao: equipes.descricao,
        criadoEm: equipes.criadoEm,
      });

    return {
      id: equipe.id,
      nome: equipe.nome,
      descricao: equipe.descricao,
      totalMembros: 0,
      criadoEm: equipe.criadoEm,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarEquipeDTO) {
    const equipeExisteResult = await db
      .select({
        id: equipes.id,
        nome: equipes.nome,
      })
      .from(equipes)
      .where(and(eq(equipes.id, id), eq(equipes.clienteId, clienteId)))
      .limit(1);

    if (equipeExisteResult.length === 0) {
      throw new ErroNaoEncontrado('Equipe nao encontrada');
    }

    const equipeExiste = equipeExisteResult[0];

    // Se atualizando nome, verificar duplicidade
    if (dados.nome && dados.nome !== equipeExiste.nome) {
      const nomeExiste = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(
          and(
            eq(equipes.clienteId, clienteId),
            eq(equipes.nome, dados.nome),
            ne(equipes.id, id),
          ),
        )
        .limit(1);

      if (nomeExiste.length > 0) {
        throw new ErroValidacao('Ja existe uma equipe com este nome');
      }
    }

    const [equipe] = await db
      .update(equipes)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
      })
      .where(eq(equipes.id, id))
      .returning({
        id: equipes.id,
        nome: equipes.nome,
        descricao: equipes.descricao,
        atualizadoEm: equipes.atualizadoEm,
      });

    const [membrosCount] = await db
      .select({ total: count() })
      .from(usuarios)
      .where(eq(usuarios.equipeId, id));

    return {
      id: equipe.id,
      nome: equipe.nome,
      descricao: equipe.descricao,
      totalMembros: membrosCount.total,
      atualizadoEm: equipe.atualizadoEm,
    };
  },

  async excluir(clienteId: string, id: string) {
    const result = await db
      .select({ id: equipes.id })
      .from(equipes)
      .where(and(eq(equipes.id, id), eq(equipes.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Equipe nao encontrada');
    }

    await db.delete(equipes).where(eq(equipes.id, id));
  },

  async adicionarMembro(clienteId: string, equipeId: string, usuarioId: string) {
    const equipeResult = await db
      .select({ id: equipes.id })
      .from(equipes)
      .where(and(eq(equipes.id, equipeId), eq(equipes.clienteId, clienteId)))
      .limit(1);

    if (equipeResult.length === 0) {
      throw new ErroNaoEncontrado('Equipe nao encontrada');
    }

    const usuarioResult = await db
      .select({
        id: usuarios.id,
        equipeId: usuarios.equipeId,
      })
      .from(usuarios)
      .where(and(eq(usuarios.id, usuarioId), eq(usuarios.clienteId, clienteId)))
      .limit(1);

    if (usuarioResult.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    const usuario = usuarioResult[0];

    if (usuario.equipeId === equipeId) {
      throw new ErroValidacao('Usuario ja pertence a esta equipe');
    }

    await db
      .update(usuarios)
      .set({ equipeId })
      .where(eq(usuarios.id, usuarioId));

    return { mensagem: 'Membro adicionado com sucesso' };
  },

  async removerMembro(clienteId: string, equipeId: string, usuarioId: string) {
    const equipeResult = await db
      .select({ id: equipes.id })
      .from(equipes)
      .where(and(eq(equipes.id, equipeId), eq(equipes.clienteId, clienteId)))
      .limit(1);

    if (equipeResult.length === 0) {
      throw new ErroNaoEncontrado('Equipe nao encontrada');
    }

    const usuarioResult = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(
        and(
          eq(usuarios.id, usuarioId),
          eq(usuarios.clienteId, clienteId),
          eq(usuarios.equipeId, equipeId),
        ),
      )
      .limit(1);

    if (usuarioResult.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao pertence a esta equipe');
    }

    await db
      .update(usuarios)
      .set({ equipeId: null })
      .where(eq(usuarios.id, usuarioId));

    return { mensagem: 'Membro removido com sucesso' };
  },
};
