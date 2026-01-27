import { eq, and, or, ilike, ne, count, sql, isNull, asc, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { perfis, usuarios } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type { CriarPerfilDTO, AtualizarPerfilDTO, ListarPerfisQuery } from './perfis.schema.js';

// =============================================================================
// Servico de Perfis
// =============================================================================

const orderByMap = {
  nome: perfis.nome,
  criadoEm: perfis.criadoEm,
  atualizadoEm: perfis.atualizadoEm,
} as const;

const totalUsuariosSubquery = sql<number>`(SELECT count(*) FROM usuarios WHERE usuarios.perfil_id = ${perfis.id})`.mapWith(Number);

export const perfisServico = {
  async listar(clienteId: string | null, query: ListarPerfisQuery) {
    const { pagina, limite, busca, ordenarPor, ordem } = query;
    const offset = (pagina - 1) * limite;

    // Perfis do cliente + perfis globais (clienteId = null)
    const baseCondition = clienteId
      ? or(eq(perfis.clienteId, clienteId), isNull(perfis.clienteId))
      : isNull(perfis.clienteId);

    const buscaCondition = busca
      ? or(
          ilike(perfis.nome, `%${busca}%`),
          ilike(perfis.descricao, `%${busca}%`),
        )
      : undefined;

    const where = buscaCondition
      ? and(baseCondition, buscaCondition)
      : baseCondition;

    const orderColumn = orderByMap[ordenarPor as keyof typeof orderByMap] ?? perfis.criadoEm;
    const orderDirection = ordem === 'asc' ? asc(orderColumn) : desc(orderColumn);

    const [dados, totalResult] = await Promise.all([
      db
        .select({
          id: perfis.id,
          nome: perfis.nome,
          descricao: perfis.descricao,
          permissoes: perfis.permissoes,
          editavel: perfis.editavel,
          clienteId: perfis.clienteId,
          criadoEm: perfis.criadoEm,
          atualizadoEm: perfis.atualizadoEm,
          totalUsuarios: totalUsuariosSubquery,
        })
        .from(perfis)
        .where(where)
        .orderBy(orderDirection)
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(perfis)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const perfisFormatados = dados.map((perfil) => ({
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      permissoes: perfil.permissoes,
      editavel: perfil.editavel,
      global: perfil.clienteId === null,
      totalUsuarios: perfil.totalUsuarios,
      criadoEm: perfil.criadoEm,
      atualizadoEm: perfil.atualizadoEm,
    }));

    return {
      dados: perfisFormatados,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async obterPorId(clienteId: string | null, id: string) {
    const baseCondition = clienteId
      ? or(eq(perfis.clienteId, clienteId), isNull(perfis.clienteId))
      : isNull(perfis.clienteId);

    const result = await db
      .select({
        id: perfis.id,
        nome: perfis.nome,
        descricao: perfis.descricao,
        permissoes: perfis.permissoes,
        editavel: perfis.editavel,
        clienteId: perfis.clienteId,
        criadoEm: perfis.criadoEm,
        atualizadoEm: perfis.atualizadoEm,
        totalUsuarios: totalUsuariosSubquery,
      })
      .from(perfis)
      .where(and(eq(perfis.id, id), baseCondition))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Perfil nao encontrado');
    }

    const perfil = result[0];

    return {
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      permissoes: perfil.permissoes,
      editavel: perfil.editavel,
      global: perfil.clienteId === null,
      totalUsuarios: perfil.totalUsuarios,
      criadoEm: perfil.criadoEm,
      atualizadoEm: perfil.atualizadoEm,
    };
  },

  async criar(clienteId: string, dados: CriarPerfilDTO) {
    // Verificar se nome ja existe para este cliente
    const nomeExiste = await db
      .select({ id: perfis.id })
      .from(perfis)
      .where(and(eq(perfis.clienteId, clienteId), eq(perfis.nome, dados.nome)))
      .limit(1);

    if (nomeExiste.length > 0) {
      throw new ErroValidacao('Ja existe um perfil com este nome');
    }

    const [perfil] = await db
      .insert(perfis)
      .values({
        clienteId,
        nome: dados.nome,
        descricao: dados.descricao,
        permissoes: dados.permissoes,
        editavel: true,
      })
      .returning({
        id: perfis.id,
        nome: perfis.nome,
        descricao: perfis.descricao,
        permissoes: perfis.permissoes,
        editavel: perfis.editavel,
        criadoEm: perfis.criadoEm,
      });

    return {
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      permissoes: perfil.permissoes,
      editavel: perfil.editavel,
      global: false,
      criadoEm: perfil.criadoEm,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarPerfilDTO) {
    const perfilExisteResult = await db
      .select({
        id: perfis.id,
        nome: perfis.nome,
        editavel: perfis.editavel,
      })
      .from(perfis)
      .where(and(eq(perfis.id, id), eq(perfis.clienteId, clienteId)))
      .limit(1);

    if (perfilExisteResult.length === 0) {
      // Verificar se e um perfil global (nao pode editar)
      const perfilGlobal = await db
        .select({ id: perfis.id })
        .from(perfis)
        .where(and(eq(perfis.id, id), isNull(perfis.clienteId)))
        .limit(1);

      if (perfilGlobal.length > 0) {
        throw new ErroValidacao('Perfis globais nao podem ser editados');
      }

      throw new ErroNaoEncontrado('Perfil nao encontrado');
    }

    const perfilExiste = perfilExisteResult[0];

    if (!perfilExiste.editavel) {
      throw new ErroValidacao('Este perfil nao pode ser editado');
    }

    // Se atualizando nome, verificar duplicidade
    if (dados.nome && dados.nome !== perfilExiste.nome) {
      const nomeExiste = await db
        .select({ id: perfis.id })
        .from(perfis)
        .where(
          and(
            eq(perfis.clienteId, clienteId),
            eq(perfis.nome, dados.nome),
            ne(perfis.id, id),
          ),
        )
        .limit(1);

      if (nomeExiste.length > 0) {
        throw new ErroValidacao('Ja existe um perfil com este nome');
      }
    }

    const [perfil] = await db
      .update(perfis)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.permissoes && { permissoes: dados.permissoes }),
      })
      .where(eq(perfis.id, id))
      .returning({
        id: perfis.id,
        nome: perfis.nome,
        descricao: perfis.descricao,
        permissoes: perfis.permissoes,
        editavel: perfis.editavel,
        atualizadoEm: perfis.atualizadoEm,
      });

    return {
      id: perfil.id,
      nome: perfil.nome,
      descricao: perfil.descricao,
      permissoes: perfil.permissoes,
      editavel: perfil.editavel,
      global: false,
      atualizadoEm: perfil.atualizadoEm,
    };
  },

  async excluir(clienteId: string, id: string) {
    const result = await db
      .select({
        id: perfis.id,
        editavel: perfis.editavel,
        totalUsuarios: totalUsuariosSubquery,
      })
      .from(perfis)
      .where(and(eq(perfis.id, id), eq(perfis.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      // Verificar se e um perfil global (nao pode excluir)
      const perfilGlobal = await db
        .select({ id: perfis.id })
        .from(perfis)
        .where(and(eq(perfis.id, id), isNull(perfis.clienteId)))
        .limit(1);

      if (perfilGlobal.length > 0) {
        throw new ErroValidacao('Perfis globais nao podem ser excluidos');
      }

      throw new ErroNaoEncontrado('Perfil nao encontrado');
    }

    const perfil = result[0];

    if (!perfil.editavel) {
      throw new ErroValidacao('Este perfil nao pode ser excluido');
    }

    if (perfil.totalUsuarios > 0) {
      throw new ErroValidacao(
        `Este perfil possui ${perfil.totalUsuarios} usuario(s) vinculado(s). ` +
          'Remova os usuarios do perfil antes de excluir.'
      );
    }

    await db.delete(perfis).where(eq(perfis.id, id));
  },

  async duplicar(clienteId: string, id: string, novoNome: string) {
    const baseCondition = or(eq(perfis.clienteId, clienteId), isNull(perfis.clienteId));

    const result = await db
      .select({
        id: perfis.id,
        descricao: perfis.descricao,
        permissoes: perfis.permissoes,
      })
      .from(perfis)
      .where(and(eq(perfis.id, id), baseCondition))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Perfil nao encontrado');
    }

    const perfilOriginal = result[0];

    // Verificar se nome ja existe
    const nomeExiste = await db
      .select({ id: perfis.id })
      .from(perfis)
      .where(and(eq(perfis.clienteId, clienteId), eq(perfis.nome, novoNome)))
      .limit(1);

    if (nomeExiste.length > 0) {
      throw new ErroValidacao('Ja existe um perfil com este nome');
    }

    const [novoPerfil] = await db
      .insert(perfis)
      .values({
        clienteId,
        nome: novoNome,
        descricao: perfilOriginal.descricao,
        permissoes: perfilOriginal.permissoes,
        editavel: true,
      })
      .returning({
        id: perfis.id,
        nome: perfis.nome,
        descricao: perfis.descricao,
        permissoes: perfis.permissoes,
        editavel: perfis.editavel,
        criadoEm: perfis.criadoEm,
      });

    return {
      id: novoPerfil.id,
      nome: novoPerfil.nome,
      descricao: novoPerfil.descricao,
      permissoes: novoPerfil.permissoes,
      editavel: novoPerfil.editavel,
      global: false,
      criadoEm: novoPerfil.criadoEm,
    };
  },
};
