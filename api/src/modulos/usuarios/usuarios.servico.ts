import { eq, and, or, ilike, ne, count, asc, desc, sql } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { usuarios, perfis, equipes } from '../../infraestrutura/banco/schema/index.js';
import { hashSenha } from '../../compartilhado/utilitarios/criptografia.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type { CriarUsuarioDTO, AtualizarUsuarioDTO, ListarUsuariosQuery } from './usuarios.schema.js';

// =============================================================================
// Campos de selecao base para usuario com joins
// =============================================================================

const camposUsuarioResumo = {
  id: usuarios.id,
  nome: usuarios.nome,
  email: usuarios.email,
  avatarUrl: usuarios.avatarUrl,
  online: usuarios.online,
  ultimoAcesso: usuarios.ultimoAcesso,
  ativo: usuarios.ativo,
  criadoEm: usuarios.criadoEm,
  perfilId: perfis.id,
  perfilNome: perfis.nome,
  equipeId: equipes.id,
  equipeNome: equipes.nome,
};

// =============================================================================
// Helpers para formatar resultado com perfil/equipe aninhados
// =============================================================================

const formatarUsuarioComRelacoes = (row: {
  id: string;
  nome: string;
  email: string;
  avatarUrl: string | null;
  online: boolean;
  ultimoAcesso: Date | null;
  ativo: boolean;
  criadoEm: Date;
  atualizadoEm?: Date;
  perfilId: string | null;
  perfilNome: string | null;
  perfilPermissoes?: string[] | null;
  equipeId: string | null;
  equipeNome: string | null;
}) => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  avatarUrl: row.avatarUrl,
  online: row.online,
  ultimoAcesso: row.ultimoAcesso,
  ativo: row.ativo,
  criadoEm: row.criadoEm,
  ...(row.atualizadoEm !== undefined && { atualizadoEm: row.atualizadoEm }),
  perfil: row.perfilId
    ? {
        id: row.perfilId,
        nome: row.perfilNome!,
        ...(row.perfilPermissoes !== undefined && { permissoes: row.perfilPermissoes }),
      }
    : null,
  equipe: row.equipeId
    ? {
        id: row.equipeId,
        nome: row.equipeNome!,
      }
    : null,
});

// =============================================================================
// Mapa de ordenacao
// =============================================================================

const mapaOrdenacao: Record<string, Parameters<typeof asc>[0]> = {
  nome: usuarios.nome,
  email: usuarios.email,
  criadoEm: usuarios.criadoEm,
  ativo: usuarios.ativo,
};

// =============================================================================
// Servico de Usuarios
// =============================================================================

export const usuariosServico = {
  async listar(clienteId: string, query: ListarUsuariosQuery) {
    const { pagina, limite, busca, perfilId, equipeId, ativo, ordenarPor, ordem } = query;
    const offset = (pagina - 1) * limite;

    // Construir condicoes de filtro
    const condicoes = [eq(usuarios.clienteId, clienteId)];

    if (busca) {
      condicoes.push(
        or(
          ilike(usuarios.nome, `%${busca}%`),
          ilike(usuarios.email, `%${busca}%`),
        )!,
      );
    }

    if (perfilId) {
      condicoes.push(eq(usuarios.perfilId, perfilId));
    }

    if (equipeId) {
      condicoes.push(eq(usuarios.equipeId, equipeId));
    }

    if (ativo !== undefined) {
      condicoes.push(eq(usuarios.ativo, ativo));
    }

    const where = and(...condicoes);

    // Determinar coluna e direcao de ordenacao
    const coluna = mapaOrdenacao[ordenarPor] ?? usuarios.criadoEm;
    const direcao = ordem === 'asc' ? asc(coluna) : desc(coluna);

    const [dados, totalResult] = await Promise.all([
      db
        .select(camposUsuarioResumo)
        .from(usuarios)
        .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
        .leftJoin(equipes, eq(usuarios.equipeId, equipes.id))
        .where(where)
        .orderBy(direcao)
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(usuarios)
        .where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: dados.map(formatarUsuarioComRelacoes),
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
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        avatarUrl: usuarios.avatarUrl,
        online: usuarios.online,
        ultimoAcesso: usuarios.ultimoAcesso,
        ativo: usuarios.ativo,
        criadoEm: usuarios.criadoEm,
        atualizadoEm: usuarios.atualizadoEm,
        perfilId: perfis.id,
        perfilNome: perfis.nome,
        perfilPermissoes: perfis.permissoes,
        equipeId: equipes.id,
        equipeNome: equipes.nome,
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .leftJoin(equipes, eq(usuarios.equipeId, equipes.id))
      .where(and(eq(usuarios.id, id), eq(usuarios.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    return formatarUsuarioComRelacoes(result[0]);
  },

  async criar(clienteId: string, dados: CriarUsuarioDTO) {
    // Verificar se email ja existe para este cliente
    const emailExiste = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.clienteId, clienteId), eq(usuarios.email, dados.email)))
      .limit(1);

    if (emailExiste.length > 0) {
      throw new ErroValidacao('Email ja esta em uso');
    }

    // Verificar se perfil pertence ao cliente
    const perfilResult = await db
      .select({ id: perfis.id })
      .from(perfis)
      .where(
        and(
          eq(perfis.id, dados.perfilId),
          or(eq(perfis.clienteId, clienteId), sql`${perfis.clienteId} IS NULL`),
        ),
      )
      .limit(1);

    if (perfilResult.length === 0) {
      throw new ErroValidacao('Perfil nao encontrado ou nao pertence ao cliente');
    }

    // Verificar equipe se fornecida
    if (dados.equipeId) {
      const equipeResult = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(and(eq(equipes.id, dados.equipeId), eq(equipes.clienteId, clienteId)))
        .limit(1);

      if (equipeResult.length === 0) {
        throw new ErroValidacao('Equipe nao encontrada');
      }
    }

    const senhaHash = await hashSenha(dados.senha);

    const [novoUsuario] = await db
      .insert(usuarios)
      .values({
        clienteId,
        nome: dados.nome,
        email: dados.email,
        senhaHash,
        perfilId: dados.perfilId,
        equipeId: dados.equipeId,
        avatarUrl: dados.avatarUrl,
        ativo: dados.ativo,
      })
      .returning({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        avatarUrl: usuarios.avatarUrl,
        ativo: usuarios.ativo,
        criadoEm: usuarios.criadoEm,
        perfilId: usuarios.perfilId,
        equipeId: usuarios.equipeId,
      });

    // Buscar com joins para retornar perfil e equipe
    const result = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        avatarUrl: usuarios.avatarUrl,
        online: usuarios.online,
        ultimoAcesso: usuarios.ultimoAcesso,
        ativo: usuarios.ativo,
        criadoEm: usuarios.criadoEm,
        perfilId: perfis.id,
        perfilNome: perfis.nome,
        equipeId: equipes.id,
        equipeNome: equipes.nome,
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .leftJoin(equipes, eq(usuarios.equipeId, equipes.id))
      .where(eq(usuarios.id, novoUsuario.id))
      .limit(1);

    return formatarUsuarioComRelacoes(result[0]);
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarUsuarioDTO) {
    const usuarioExisteResult = await db
      .select({ id: usuarios.id, email: usuarios.email })
      .from(usuarios)
      .where(and(eq(usuarios.id, id), eq(usuarios.clienteId, clienteId)))
      .limit(1);

    if (usuarioExisteResult.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    const usuarioExiste = usuarioExisteResult[0];

    // Se atualizando email, verificar duplicidade
    if (dados.email && dados.email !== usuarioExiste.email) {
      const emailExiste = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(
          and(
            eq(usuarios.clienteId, clienteId),
            eq(usuarios.email, dados.email),
            ne(usuarios.id, id),
          ),
        )
        .limit(1);

      if (emailExiste.length > 0) {
        throw new ErroValidacao('Email ja esta em uso');
      }
    }

    // Verificar perfil se fornecido
    if (dados.perfilId) {
      const perfilResult = await db
        .select({ id: perfis.id })
        .from(perfis)
        .where(
          and(
            eq(perfis.id, dados.perfilId),
            or(eq(perfis.clienteId, clienteId), sql`${perfis.clienteId} IS NULL`),
          ),
        )
        .limit(1);

      if (perfilResult.length === 0) {
        throw new ErroValidacao('Perfil nao encontrado');
      }
    }

    // Verificar equipe se fornecida
    if (dados.equipeId) {
      const equipeResult = await db
        .select({ id: equipes.id })
        .from(equipes)
        .where(and(eq(equipes.id, dados.equipeId), eq(equipes.clienteId, clienteId)))
        .limit(1);

      if (equipeResult.length === 0) {
        throw new ErroValidacao('Equipe nao encontrada');
      }
    }

    const dadosAtualizacao: Record<string, unknown> = {
      nome: dados.nome,
      email: dados.email,
      perfilId: dados.perfilId,
      equipeId: dados.equipeId,
      avatarUrl: dados.avatarUrl,
      ativo: dados.ativo,
    };

    // Hash da nova senha se fornecida
    if (dados.senha) {
      dadosAtualizacao.senhaHash = await hashSenha(dados.senha);
    }

    // Remover campos undefined
    Object.keys(dadosAtualizacao).forEach((key) => {
      if (dadosAtualizacao[key] === undefined) {
        delete dadosAtualizacao[key];
      }
    });

    await db
      .update(usuarios)
      .set(dadosAtualizacao)
      .where(eq(usuarios.id, id));

    // Buscar com joins para retornar perfil e equipe
    const result = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        avatarUrl: usuarios.avatarUrl,
        online: usuarios.online,
        ultimoAcesso: usuarios.ultimoAcesso,
        ativo: usuarios.ativo,
        criadoEm: usuarios.criadoEm,
        atualizadoEm: usuarios.atualizadoEm,
        perfilId: perfis.id,
        perfilNome: perfis.nome,
        equipeId: equipes.id,
        equipeNome: equipes.nome,
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .leftJoin(equipes, eq(usuarios.equipeId, equipes.id))
      .where(eq(usuarios.id, id))
      .limit(1);

    return formatarUsuarioComRelacoes(result[0]);
  },

  async excluir(clienteId: string, id: string) {
    const usuarioResult = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.id, id), eq(usuarios.clienteId, clienteId)))
      .limit(1);

    if (usuarioResult.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    await db.delete(usuarios).where(eq(usuarios.id, id));
  },

  async alterarStatus(clienteId: string, id: string, ativo: boolean) {
    const usuarioResult = await db
      .select({ id: usuarios.id })
      .from(usuarios)
      .where(and(eq(usuarios.id, id), eq(usuarios.clienteId, clienteId)))
      .limit(1);

    if (usuarioResult.length === 0) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    const [atualizado] = await db
      .update(usuarios)
      .set({ ativo })
      .where(eq(usuarios.id, id))
      .returning({
        id: usuarios.id,
        nome: usuarios.nome,
        ativo: usuarios.ativo,
      });

    return atualizado;
  },
};
