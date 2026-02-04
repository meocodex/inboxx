import { eq, and, or, ilike, ne, count, sql, desc, asc, notInArray, inArray } from 'drizzle-orm';
import { createHash } from 'crypto';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  conversas,
  contatos,
  conexoes,
  usuarios,
  equipes,
  mensagens,
  notasInternas,
  contatosEtiquetas,
  etiquetas,
} from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import { buscar, meilisearchDisponivel, INDICES } from '../../infraestrutura/busca/index.js';
import { enviarJob } from '../../infraestrutura/filas/index.js';
import { cacheConversas } from '../../infraestrutura/cache/redis.servico.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import type { ConversaDocumento } from '../../infraestrutura/busca/index.js';
import type {
  CriarConversaDTO,
  AtualizarConversaDTO,
  ListarConversasQuery,
  TransferirConversaDTO,
} from './conversas.schema.js';

// =============================================================================
// Helpers
// =============================================================================

function gerarChaveCache(clienteId: string, usuarioId: string, query: ListarConversasQuery): string {
  const hash = createHash('md5')
    .update(JSON.stringify({ clienteId, usuarioId, ...query }))
    .digest('hex');
  return `listar:${clienteId}:${hash}`;
}

async function invalidarCacheConversas(clienteId: string): Promise<void> {
  try {
    const total = await cacheConversas.invalidar(`listar:${clienteId}:*`);
    if (total > 0) {
      logger.debug({ clienteId, total }, 'Cache de conversas invalidado');
    }
  } catch (erro) {
    logger.error({ erro, clienteId }, 'Erro ao invalidar cache de conversas');
  }
}

// =============================================================================
// Servico de Conversas
// =============================================================================

export const conversasServico = {
  async listar(clienteId: string, usuarioId: string, query: ListarConversasQuery) {
    const {
      pagina,
      limite,
      status,
      conexaoId,
      usuarioId: filtroUsuarioId,
      equipeId,
      contatoId,
      busca,
      apenasMinhas,
      ordenarPor,
      ordem,
    } = query;
    const skip = (pagina - 1) * limite;

    // ==========================================================================
    // CACHE: Verificar cache Redis (TTL 60s)
    // ==========================================================================
    const chaveCache = gerarChaveCache(clienteId, usuarioId, query);
    const cached = await cacheConversas.get<{
      dados: unknown[];
      meta: { total: number; pagina: number; limite: number; totalPaginas: number };
    }>(chaveCache);

    if (cached) {
      logger.debug({ chaveCache }, 'Conversas: Cache HIT');
      return cached;
    }

    logger.debug({ chaveCache }, 'Conversas: Cache MISS - executando query');

    // Build dynamic conditions
    const conditions = [eq(conversas.clienteId, clienteId)];

    if (status) {
      conditions.push(eq(conversas.status, status));
    }
    if (conexaoId) {
      conditions.push(eq(conversas.conexaoId, conexaoId));
    }
    if (filtroUsuarioId) {
      conditions.push(eq(conversas.usuarioId, filtroUsuarioId));
    }
    if (equipeId) {
      conditions.push(eq(conversas.equipeId, equipeId));
    }
    if (contatoId) {
      conditions.push(eq(conversas.contatoId, contatoId));
    }
    if (apenasMinhas) {
      conditions.push(eq(conversas.usuarioId, usuarioId));
    }
    // Busca via Meilisearch (se disponivel) ou fallback PostgreSQL ILIKE
    let idsMeilisearch: string[] | null = null;

    if (busca && meilisearchDisponivel()) {
      const resultado = await buscar<ConversaDocumento>(
        INDICES.CONVERSAS,
        busca,
        { filtro: `clienteId = "${clienteId}"`, limite: 1000 },
      );
      if (resultado) {
        idsMeilisearch = resultado.hits.map((h) => h.id);
        if (idsMeilisearch.length === 0) {
          return { dados: [], meta: { total: 0, pagina, limite, totalPaginas: 0 } };
        }
        conditions.push(inArray(conversas.id, idsMeilisearch));
      }
    }

    // Fallback: PostgreSQL subquery quando Meilisearch nao disponivel
    if (busca && !idsMeilisearch) {
      conditions.push(
        sql`${conversas.contatoId} IN (
          SELECT ${contatos.id} FROM ${contatos}
          WHERE ${or(
            ilike(contatos.nome, `%${busca}%`),
            ilike(contatos.telefone, `%${busca}%`)
          )}
        )`
      );
    }

    const whereClause = and(...conditions);

    // Determine ordering
    const orderColumn = ordenarPor === 'ultimaMensagemEm' ? conversas.ultimaMensagemEm : conversas.criadoEm;
    const orderDirection = ordem === 'asc' ? asc(orderColumn) : desc(orderColumn);

    // ==========================================================================
    // OTIMIZAÇÃO: 1 query com LEFT JOIN + COUNT + GROUP BY (antes: 101 queries)
    // ==========================================================================
    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: conversas.id,
          status: conversas.status,
          ultimaMensagemEm: conversas.ultimaMensagemEm,
          criadoEm: conversas.criadoEm,
          atualizadoEm: conversas.atualizadoEm,
          contatoId: contatos.id,
          contatoNome: contatos.nome,
          contatoTelefone: contatos.telefone,
          contatoFotoUrl: contatos.fotoUrl,
          conexaoId: conexoes.id,
          conexaoNome: conexoes.nome,
          conexaoCanal: conexoes.canal,
          usuarioIdRel: usuarios.id,
          usuarioNome: usuarios.nome,
          usuarioAvatarUrl: usuarios.avatarUrl,
          equipeIdRel: equipes.id,
          equipeNome: equipes.nome,
          // COUNT com LEFT JOIN (evita N+1 queries)
          totalMensagens: sql<number>`COUNT(DISTINCT ${mensagens.id})`.mapWith(Number),
          totalNotas: sql<number>`COUNT(DISTINCT ${notasInternas.id})`.mapWith(Number),
          // Contador de mensagens nao lidas (direcao ENTRADA, sem lidoEm)
          naoLidas: sql<number>`COUNT(DISTINCT CASE WHEN ${mensagens.direcao} = 'ENTRADA' AND ${mensagens.lidoEm} IS NULL THEN ${mensagens.id} END)`.mapWith(Number),
        })
        .from(conversas)
        .leftJoin(contatos, eq(conversas.contatoId, contatos.id))
        .leftJoin(conexoes, eq(conversas.conexaoId, conexoes.id))
        .leftJoin(usuarios, eq(conversas.usuarioId, usuarios.id))
        .leftJoin(equipes, eq(conversas.equipeId, equipes.id))
        .leftJoin(mensagens, eq(mensagens.conversaId, conversas.id))
        .leftJoin(notasInternas, eq(notasInternas.conversaId, conversas.id))
        .where(whereClause)
        .groupBy(
          conversas.id,
          contatos.id,
          conexoes.id,
          usuarios.id,
          equipes.id
        )
        .orderBy(orderDirection)
        .limit(limite)
        .offset(skip),
      db.select({ total: count() }).from(conversas).where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const conversasFormatadas = rows.map((row) => ({
      id: row.id,
      status: row.status,
      ultimaMensagemEm: row.ultimaMensagemEm,
      criadoEm: row.criadoEm,
      atualizadoEm: row.atualizadoEm,
      contato: {
        id: row.contatoId,
        nome: row.contatoNome,
        telefone: row.contatoTelefone,
        fotoUrl: row.contatoFotoUrl,
      },
      conexao: {
        id: row.conexaoId,
        nome: row.conexaoNome,
        canal: row.conexaoCanal,
      },
      usuario: row.usuarioIdRel
        ? {
            id: row.usuarioIdRel,
            nome: row.usuarioNome,
            avatarUrl: row.usuarioAvatarUrl,
          }
        : null,
      equipe: row.equipeIdRel
        ? {
            id: row.equipeIdRel,
            nome: row.equipeNome,
          }
        : null,
      totalMensagens: row.totalMensagens,
      totalNotas: row.totalNotas,
      naoLidas: row.naoLidas,
    }));

    const resultado = {
      dados: conversasFormatadas,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };

    // ==========================================================================
    // CACHE: Armazenar resultado (TTL 60s)
    // ==========================================================================
    await cacheConversas.set(chaveCache, resultado, 60);

    return resultado;
  },

  async obterPorId(clienteId: string, id: string) {
    // Subqueries for counts
    const totalMensagensSubquery = sql<number>`(SELECT count(*) FROM ${mensagens} WHERE ${mensagens.conversaId} = ${conversas.id})`.mapWith(Number);
    const totalNotasSubquery = sql<number>`(SELECT count(*) FROM ${notasInternas} WHERE ${notasInternas.conversaId} = ${conversas.id})`.mapWith(Number);

    const rows = await db
      .select({
        id: conversas.id,
        status: conversas.status,
        ultimaMensagemEm: conversas.ultimaMensagemEm,
        criadoEm: conversas.criadoEm,
        atualizadoEm: conversas.atualizadoEm,
        contatoId: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
        contatoEmail: contatos.email,
        contatoFotoUrl: contatos.fotoUrl,
        conexaoId: conexoes.id,
        conexaoNome: conexoes.nome,
        conexaoCanal: conexoes.canal,
        conexaoStatus: conexoes.status,
        usuarioIdRel: usuarios.id,
        usuarioNome: usuarios.nome,
        usuarioEmail: usuarios.email,
        usuarioAvatarUrl: usuarios.avatarUrl,
        equipeIdRel: equipes.id,
        equipeNome: equipes.nome,
        totalMensagens: totalMensagensSubquery,
        totalNotas: totalNotasSubquery,
      })
      .from(conversas)
      .leftJoin(contatos, eq(conversas.contatoId, contatos.id))
      .leftJoin(conexoes, eq(conversas.conexaoId, conexoes.id))
      .leftJoin(usuarios, eq(conversas.usuarioId, usuarios.id))
      .leftJoin(equipes, eq(conversas.equipeId, equipes.id))
      .where(and(eq(conversas.id, id), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (rows.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const row = rows[0];

    // Fetch etiquetas for the contato separately
    const etiquetasRows = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
      })
      .from(contatosEtiquetas)
      .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
      .where(eq(contatosEtiquetas.contatoId, row.contatoId!));

    return {
      id: row.id,
      status: row.status,
      ultimaMensagemEm: row.ultimaMensagemEm,
      criadoEm: row.criadoEm,
      atualizadoEm: row.atualizadoEm,
      contato: {
        id: row.contatoId,
        nome: row.contatoNome,
        telefone: row.contatoTelefone,
        email: row.contatoEmail,
        fotoUrl: row.contatoFotoUrl,
        etiquetas: etiquetasRows,
      },
      conexao: {
        id: row.conexaoId,
        nome: row.conexaoNome,
        canal: row.conexaoCanal,
        status: row.conexaoStatus,
      },
      usuario: row.usuarioIdRel
        ? {
            id: row.usuarioIdRel,
            nome: row.usuarioNome,
            email: row.usuarioEmail,
            avatarUrl: row.usuarioAvatarUrl,
          }
        : null,
      equipe: row.equipeIdRel
        ? {
            id: row.equipeIdRel,
            nome: row.equipeNome,
          }
        : null,
      totalMensagens: row.totalMensagens,
      totalNotas: row.totalNotas,
    };
  },

  async criar(clienteId: string, dados: CriarConversaDTO) {
    // Verificar se contato existe
    const contatoResult = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoResult.length === 0) {
      throw new ErroValidacao('Contato nao encontrado');
    }

    // Verificar se conexao existe
    const conexaoResult = await db
      .select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.id, dados.conexaoId), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (conexaoResult.length === 0) {
      throw new ErroValidacao('Conexao nao encontrada');
    }

    // Verificar se ja existe conversa aberta para este contato/conexao
    const conversaExisteResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(
        and(
          eq(conversas.clienteId, clienteId),
          eq(conversas.contatoId, dados.contatoId),
          eq(conversas.conexaoId, dados.conexaoId),
          notInArray(conversas.status, ['RESOLVIDA', 'ARQUIVADA'])
        )
      )
      .limit(1);

    if (conversaExisteResult.length > 0) {
      throw new ErroValidacao('Ja existe uma conversa ativa para este contato nesta conexao');
    }

    // Verificar usuario se fornecido
    if (dados.usuarioId) {
      const usuarioResult = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(and(eq(usuarios.id, dados.usuarioId), eq(usuarios.clienteId, clienteId)))
        .limit(1);

      if (usuarioResult.length === 0) {
        throw new ErroValidacao('Usuario nao encontrado');
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

    const [conversaCriada] = await db
      .insert(conversas)
      .values({
        clienteId,
        contatoId: dados.contatoId,
        conexaoId: dados.conexaoId,
        usuarioId: dados.usuarioId,
        equipeId: dados.equipeId,
        status: dados.usuarioId ? 'EM_ATENDIMENTO' : 'ABERTA',
      })
      .returning({
        id: conversas.id,
        status: conversas.status,
        criadoEm: conversas.criadoEm,
        contatoId: conversas.contatoId,
        conexaoId: conversas.conexaoId,
      });

    // Fetch related contato and conexao info
    const [contatoInfo] = await db
      .select({ id: contatos.id, nome: contatos.nome, telefone: contatos.telefone })
      .from(contatos)
      .where(eq(contatos.id, conversaCriada.contatoId))
      .limit(1);

    let conexaoInfo: { id: string; nome: string; canal: string } | null = null;
    if (conversaCriada.conexaoId) {
      const [info] = await db
        .select({ id: conexoes.id, nome: conexoes.nome, canal: conexoes.canal })
        .from(conexoes)
        .where(eq(conexoes.id, conversaCriada.conexaoId))
        .limit(1);
      conexaoInfo = info ?? null;
    }

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'indexar', indice: 'conversas', clienteId, documentoId: conversaCriada.id }).catch((erro) => {
      logger.warn({ erro, indice: 'conversas', operacao: 'indexar', documentoId: conversaCriada.id }, 'Falha ao sincronizar busca');
    });

    // Invalidar cache
    await invalidarCacheConversas(clienteId);

    return {
      id: conversaCriada.id,
      status: conversaCriada.status,
      criadoEm: conversaCriada.criadoEm,
      contato: contatoInfo,
      conexao: conexaoInfo,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarConversaDTO) {
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, id), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    // Verificar usuario se fornecido
    if (dados.usuarioId) {
      const usuarioResult = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(and(eq(usuarios.id, dados.usuarioId), eq(usuarios.clienteId, clienteId)))
        .limit(1);

      if (usuarioResult.length === 0) {
        throw new ErroValidacao('Usuario nao encontrado');
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

    const updateData: Record<string, unknown> = {};
    if (dados.usuarioId !== undefined) {
      updateData.usuarioId = dados.usuarioId;
    }
    if (dados.equipeId !== undefined) {
      updateData.equipeId = dados.equipeId;
    }
    if (dados.status) {
      updateData.status = dados.status;
    }

    const [updated] = await db
      .update(conversas)
      .set(updateData)
      .where(eq(conversas.id, id))
      .returning({
        id: conversas.id,
        status: conversas.status,
        atualizadoEm: conversas.atualizadoEm,
        usuarioId: conversas.usuarioId,
        equipeId: conversas.equipeId,
      });

    // Fetch related usuario and equipe info
    let usuarioInfo: { id: string; nome: string } | null = null;
    if (updated.usuarioId) {
      const [u] = await db
        .select({ id: usuarios.id, nome: usuarios.nome })
        .from(usuarios)
        .where(eq(usuarios.id, updated.usuarioId))
        .limit(1);
      usuarioInfo = u ?? null;
    }

    let equipeInfo: { id: string; nome: string } | null = null;
    if (updated.equipeId) {
      const [e] = await db
        .select({ id: equipes.id, nome: equipes.nome })
        .from(equipes)
        .where(eq(equipes.id, updated.equipeId))
        .limit(1);
      equipeInfo = e ?? null;
    }

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'atualizar', indice: 'conversas', clienteId, documentoId: id }).catch((erro) => {
      logger.warn({ erro, indice: 'conversas', operacao: 'atualizar', documentoId: id }, 'Falha ao sincronizar busca');
    });

    // Invalidar cache
    await invalidarCacheConversas(clienteId);

    return {
      id: updated.id,
      status: updated.status,
      atualizadoEm: updated.atualizadoEm,
      usuario: usuarioInfo,
      equipe: equipeInfo,
    };
  },

  async transferir(clienteId: string, id: string, dados: TransferirConversaDTO) {
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, id), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    if (!dados.usuarioId && !dados.equipeId) {
      throw new ErroValidacao('Informe usuario ou equipe para transferir');
    }

    // Verificar usuario se fornecido
    if (dados.usuarioId) {
      const usuarioResult = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(and(eq(usuarios.id, dados.usuarioId), eq(usuarios.clienteId, clienteId)))
        .limit(1);

      if (usuarioResult.length === 0) {
        throw new ErroValidacao('Usuario nao encontrado');
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

    const [updated] = await db
      .update(conversas)
      .set({
        usuarioId: dados.usuarioId ?? null,
        equipeId: dados.equipeId ?? null,
        status: dados.usuarioId ? 'EM_ATENDIMENTO' : 'ABERTA',
      })
      .where(eq(conversas.id, id))
      .returning({
        id: conversas.id,
        status: conversas.status,
        usuarioId: conversas.usuarioId,
        equipeId: conversas.equipeId,
      });

    // Fetch related usuario and equipe info
    let usuarioInfo: { id: string; nome: string } | null = null;
    if (updated.usuarioId) {
      const [u] = await db
        .select({ id: usuarios.id, nome: usuarios.nome })
        .from(usuarios)
        .where(eq(usuarios.id, updated.usuarioId))
        .limit(1);
      usuarioInfo = u ?? null;
    }

    let equipeInfo: { id: string; nome: string } | null = null;
    if (updated.equipeId) {
      const [e] = await db
        .select({ id: equipes.id, nome: equipes.nome })
        .from(equipes)
        .where(eq(equipes.id, updated.equipeId))
        .limit(1);
      equipeInfo = e ?? null;
    }

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'atualizar', indice: 'conversas', clienteId, documentoId: id }).catch((erro) => {
      logger.warn({ erro, indice: 'conversas', operacao: 'atualizar', documentoId: id }, 'Falha ao sincronizar busca');
    });

    // Invalidar cache
    await invalidarCacheConversas(clienteId);

    return {
      id: updated.id,
      status: updated.status,
      usuario: usuarioInfo,
      equipe: equipeInfo,
    };
  },

  async alterarStatus(
    clienteId: string,
    id: string,
    status: 'ABERTA' | 'EM_ATENDIMENTO' | 'AGUARDANDO' | 'RESOLVIDA' | 'ARQUIVADA'
  ) {
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, id), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const [updated] = await db
      .update(conversas)
      .set({ status })
      .where(eq(conversas.id, id))
      .returning({
        id: conversas.id,
        status: conversas.status,
        atualizadoEm: conversas.atualizadoEm,
      });

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'atualizar', indice: 'conversas', clienteId, documentoId: id }).catch((erro) => {
      logger.warn({ erro, indice: 'conversas', operacao: 'atualizar', documentoId: id }, 'Falha ao sincronizar busca');
    });

    // Invalidar cache
    await invalidarCacheConversas(clienteId);

    return updated;
  },

  async arquivar(clienteId: string, id: string) {
    return this.alterarStatus(clienteId, id, 'ARQUIVADA');
  },

  async resolver(clienteId: string, id: string) {
    return this.alterarStatus(clienteId, id, 'RESOLVIDA');
  },

  async reabrir(clienteId: string, id: string) {
    return this.alterarStatus(clienteId, id, 'ABERTA');
  },
};
