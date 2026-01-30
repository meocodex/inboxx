import { eq, and, or, ilike, count, sql, asc, desc, exists, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { contatos, contatosEtiquetas, etiquetas, conversas, cartoesKanban, compromissos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import { buscar, meilisearchDisponivel, INDICES } from '../../infraestrutura/busca/index.js';
import { enviarJob } from '../../infraestrutura/filas/index.js';
import { cacheContatos } from '../../infraestrutura/cache/redis.servico.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import type { ContatoDocumento } from '../../infraestrutura/busca/index.js';
import type {
  CriarContatoDTO,
  AtualizarContatoDTO,
  ListarContatosQuery,
  ImportarContatosDTO,
} from './contatos.schema.js';

// =============================================================================
// Helpers
// =============================================================================

async function invalidarCacheContato(contatoId: string): Promise<void> {
  try {
    await cacheContatos.delete(`obter:${contatoId}`);
    logger.debug({ contatoId }, 'Cache de contato invalidado');
  } catch (erro) {
    logger.error({ erro, contatoId }, 'Erro ao invalidar cache de contato');
  }
}

// =============================================================================
// Servico de Contatos
// =============================================================================

export const contatosServico = {
  async listar(clienteId: string, query: ListarContatosQuery) {
    const { pagina, limite, busca, etiquetaId, ordenarPor, ordem } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(contatos.clienteId, clienteId)];

    // Busca via Meilisearch (se disponivel) ou fallback PostgreSQL ILIKE
    let idsMeilisearch: string[] | null = null;

    if (busca && meilisearchDisponivel()) {
      const resultado = await buscar<ContatoDocumento>(
        INDICES.CONTATOS,
        busca,
        { filtro: `clienteId = "${clienteId}"`, limite: 1000 },
      );
      if (resultado) {
        idsMeilisearch = resultado.hits.map((h) => h.id);
        if (idsMeilisearch.length === 0) {
          return { dados: [], meta: { total: 0, pagina, limite, totalPaginas: 0 } };
        }
        conditions.push(inArray(contatos.id, idsMeilisearch));
      }
    }

    // Fallback: PostgreSQL ILIKE quando Meilisearch nao disponivel
    if (busca && !idsMeilisearch) {
      conditions.push(
        or(
          ilike(contatos.nome, `%${busca}%`),
          ilike(contatos.telefone, `%${busca}%`),
          ilike(contatos.email, `%${busca}%`)
        )!
      );
    }

    if (etiquetaId) {
      const subquery = db
        .select({ contatoId: contatosEtiquetas.contatoId })
        .from(contatosEtiquetas)
        .where(
          and(
            eq(contatosEtiquetas.contatoId, contatos.id),
            eq(contatosEtiquetas.etiquetaId, etiquetaId)
          )
        );
      conditions.push(exists(subquery));
    }

    const where = and(...conditions);

    // Determinar ordenacao
    const colunaOrdem = ordenarPor === 'nome' ? contatos.nome
      : ordenarPor === 'telefone' ? contatos.telefone
      : contatos.criadoEm;
    const direcaoOrdem = ordem === 'asc' ? asc(colunaOrdem) : desc(colunaOrdem);

    const [dados, [totalResult]] = await Promise.all([
      db
        .select({
          id: contatos.id,
          nome: contatos.nome,
          telefone: contatos.telefone,
          email: contatos.email,
          fotoUrl: contatos.fotoUrl,
          criadoEm: contatos.criadoEm,
        })
        .from(contatos)
        .where(where)
        .orderBy(direcaoOrdem)
        .limit(limite)
        .offset(offset),
      db.select({ total: count() }).from(contatos).where(where),
    ]);

    // Buscar etiquetas para cada contato
    const contatoIds = dados.map((c) => c.id);
    let etiquetasPorContato: Record<string, Array<{ id: string; nome: string; cor: string }>> = {};

    if (contatoIds.length > 0) {
      const vinculosEtiquetas = await db
        .select({
          contatoId: contatosEtiquetas.contatoId,
          etiquetaId: etiquetas.id,
          etiquetaNome: etiquetas.nome,
          etiquetaCor: etiquetas.cor,
        })
        .from(contatosEtiquetas)
        .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
        .where(inArray(contatosEtiquetas.contatoId, contatoIds));

      etiquetasPorContato = {};
      for (const v of vinculosEtiquetas) {
        if (!etiquetasPorContato[v.contatoId]) {
          etiquetasPorContato[v.contatoId] = [];
        }
        etiquetasPorContato[v.contatoId].push({
          id: v.etiquetaId,
          nome: v.etiquetaNome,
          cor: v.etiquetaCor,
        });
      }
    }

    const contatosFormatados = dados.map((contato) => ({
      id: contato.id,
      nome: contato.nome,
      telefone: contato.telefone,
      email: contato.email,
      fotoUrl: contato.fotoUrl,
      criadoEm: contato.criadoEm,
      etiquetas: etiquetasPorContato[contato.id] ?? [],
    }));

    return {
      dados: contatosFormatados,
      meta: {
        total: totalResult.total,
        pagina,
        limite,
        totalPaginas: Math.ceil(totalResult.total / limite),
      },
    };
  },

  async obterPorId(clienteId: string, id: string) {
    // ==========================================================================
    // CACHE: Verificar cache Redis (TTL 300s - 5 min)
    // Contatos mudam com média frequência
    // ==========================================================================
    const chaveCache = `obter:${id}`;
    const cached = await cacheContatos.get<unknown>(chaveCache);

    if (cached) {
      logger.debug({ chaveCache, contatoId: id }, 'Contato: Cache HIT');
      return cached;
    }

    logger.debug({ chaveCache, contatoId: id }, 'Contato: Cache MISS - executando query');

    const totalConversasSubquery = db
      .select({ total: count() })
      .from(conversas)
      .where(eq(conversas.contatoId, contatos.id));

    const totalCartoesSubquery = db
      .select({ total: count() })
      .from(cartoesKanban)
      .where(eq(cartoesKanban.contatoId, contatos.id));

    const totalCompromissosSubquery = db
      .select({ total: count() })
      .from(compromissos)
      .where(eq(compromissos.contatoId, contatos.id));

    const result = await db
      .select({
        id: contatos.id,
        nome: contatos.nome,
        telefone: contatos.telefone,
        email: contatos.email,
        fotoUrl: contatos.fotoUrl,
        camposPersonalizados: contatos.camposPersonalizados,
        criadoEm: contatos.criadoEm,
        atualizadoEm: contatos.atualizadoEm,
        totalConversas: sql<number>`(${totalConversasSubquery})`.as('total_conversas'),
        totalCartoes: sql<number>`(${totalCartoesSubquery})`.as('total_cartoes'),
        totalCompromissos: sql<number>`(${totalCompromissosSubquery})`.as('total_compromissos'),
      })
      .from(contatos)
      .where(and(eq(contatos.id, id), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Contato nao encontrado');
    }

    const contato = result[0];

    // Buscar etiquetas separadamente
    const vinculosEtiquetas = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
      })
      .from(contatosEtiquetas)
      .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
      .where(eq(contatosEtiquetas.contatoId, id));

    const resultado = {
      id: contato.id,
      nome: contato.nome,
      telefone: contato.telefone,
      email: contato.email,
      fotoUrl: contato.fotoUrl,
      camposPersonalizados: contato.camposPersonalizados,
      criadoEm: contato.criadoEm,
      atualizadoEm: contato.atualizadoEm,
      etiquetas: vinculosEtiquetas,
      totalConversas: Number(contato.totalConversas),
      totalCartoes: Number(contato.totalCartoes),
      totalCompromissos: Number(contato.totalCompromissos),
    };

    // ==========================================================================
    // CACHE: Armazenar resultado (TTL 300s - 5 min)
    // ==========================================================================
    await cacheContatos.set(chaveCache, resultado, 300);

    return resultado;
  },

  async criar(clienteId: string, dados: CriarContatoDTO) {
    // Verificar se telefone ja existe para este cliente
    const telefoneExiste = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.clienteId, clienteId), eq(contatos.telefone, dados.telefone)))
      .limit(1);

    if (telefoneExiste.length > 0) {
      throw new ErroValidacao('Ja existe um contato com este telefone');
    }

    // Verificar etiquetas se fornecidas
    if (dados.etiquetaIds && dados.etiquetaIds.length > 0) {
      const [etiquetasValidasResult] = await db
        .select({ total: count() })
        .from(etiquetas)
        .where(
          and(
            inArray(etiquetas.id, dados.etiquetaIds),
            eq(etiquetas.clienteId, clienteId)
          )
        );

      if (etiquetasValidasResult.total !== dados.etiquetaIds.length) {
        throw new ErroValidacao('Uma ou mais etiquetas nao foram encontradas');
      }
    }

    // Inserir contato
    const [contato] = await db
      .insert(contatos)
      .values({
        clienteId,
        nome: dados.nome,
        telefone: dados.telefone,
        email: dados.email,
        fotoUrl: dados.fotoUrl,
        camposPersonalizados: dados.camposPersonalizados ?? null,
      })
      .returning({
        id: contatos.id,
        nome: contatos.nome,
        telefone: contatos.telefone,
        email: contatos.email,
        criadoEm: contatos.criadoEm,
      });

    // Inserir etiquetas na tabela de juncao
    let etiquetasResult: Array<{ id: string; nome: string; cor: string }> = [];

    if (dados.etiquetaIds && dados.etiquetaIds.length > 0) {
      await db.insert(contatosEtiquetas).values(
        dados.etiquetaIds.map((etiquetaId) => ({
          contatoId: contato.id,
          etiquetaId,
          clienteId,
        }))
      );

      // Buscar etiquetas inseridas para retorno
      etiquetasResult = await db
        .select({
          id: etiquetas.id,
          nome: etiquetas.nome,
          cor: etiquetas.cor,
        })
        .from(contatosEtiquetas)
        .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
        .where(eq(contatosEtiquetas.contatoId, contato.id));
    }

    // Sincronizar com Meilisearch (async, nao bloqueia resposta)
    enviarJob('busca.sincronizar', { operacao: 'indexar', indice: 'contatos', clienteId, documentoId: contato.id }).catch(() => {});

    return {
      ...contato,
      etiquetas: etiquetasResult,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarContatoDTO) {
    const contatoExiste = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, id), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoExiste.length === 0) {
      throw new ErroNaoEncontrado('Contato nao encontrado');
    }

    const updateData: Record<string, unknown> = {};
    if (dados.nome !== undefined) updateData.nome = dados.nome;
    if (dados.email !== undefined) updateData.email = dados.email;
    if (dados.fotoUrl !== undefined) updateData.fotoUrl = dados.fotoUrl;
    if (dados.camposPersonalizados !== undefined) {
      updateData.camposPersonalizados = dados.camposPersonalizados ?? null;
    }

    const [contato] = await db
      .update(contatos)
      .set(updateData)
      .where(eq(contatos.id, id))
      .returning({
        id: contatos.id,
        nome: contatos.nome,
        telefone: contatos.telefone,
        email: contatos.email,
        fotoUrl: contatos.fotoUrl,
        atualizadoEm: contatos.atualizadoEm,
      });

    // Buscar etiquetas para retorno
    const vinculosEtiquetas = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
      })
      .from(contatosEtiquetas)
      .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
      .where(eq(contatosEtiquetas.contatoId, id));

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'atualizar', indice: 'contatos', clienteId, documentoId: id }).catch(() => {});

    // Invalidar cache
    await invalidarCacheContato(id);

    return {
      ...contato,
      etiquetas: vinculosEtiquetas,
    };
  },

  async excluir(clienteId: string, id: string) {
    const contatoExiste = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, id), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoExiste.length === 0) {
      throw new ErroNaoEncontrado('Contato nao encontrado');
    }

    await db.delete(contatos).where(eq(contatos.id, id));

    // Sincronizar com Meilisearch
    enviarJob('busca.sincronizar', { operacao: 'remover', indice: 'contatos', clienteId, documentoId: id }).catch(() => {});

    // Invalidar cache
    await invalidarCacheContato(id);
  },

  async adicionarEtiqueta(clienteId: string, contatoId: string, etiquetaId: string) {
    const contatoExiste = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoExiste.length === 0) {
      throw new ErroNaoEncontrado('Contato nao encontrado');
    }

    const etiquetaExiste = await db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(and(eq(etiquetas.id, etiquetaId), eq(etiquetas.clienteId, clienteId)))
      .limit(1);

    if (etiquetaExiste.length === 0) {
      throw new ErroNaoEncontrado('Etiqueta nao encontrada');
    }

    // Verificar se ja possui a etiqueta
    const jaTemEtiqueta = await db
      .select({ contatoId: contatosEtiquetas.contatoId })
      .from(contatosEtiquetas)
      .where(
        and(
          eq(contatosEtiquetas.contatoId, contatoId),
          eq(contatosEtiquetas.etiquetaId, etiquetaId)
        )
      )
      .limit(1);

    if (jaTemEtiqueta.length > 0) {
      throw new ErroValidacao('Contato ja possui esta etiqueta');
    }

    await db.insert(contatosEtiquetas).values({
      contatoId,
      etiquetaId,
      clienteId,
    });

    // Invalidar cache (etiquetas fazem parte do cache do contato)
    await invalidarCacheContato(contatoId);

    return { mensagem: 'Etiqueta adicionada com sucesso' };
  },

  async removerEtiqueta(clienteId: string, contatoId: string, etiquetaId: string) {
    const contatoExiste = await db
      .select({ id: contatos.id })
      .from(contatos)
      .where(and(eq(contatos.id, contatoId), eq(contatos.clienteId, clienteId)))
      .limit(1);

    if (contatoExiste.length === 0) {
      throw new ErroNaoEncontrado('Contato nao encontrado');
    }

    const vinculo = await db
      .select({ contatoId: contatosEtiquetas.contatoId })
      .from(contatosEtiquetas)
      .where(
        and(
          eq(contatosEtiquetas.contatoId, contatoId),
          eq(contatosEtiquetas.etiquetaId, etiquetaId)
        )
      )
      .limit(1);

    if (vinculo.length === 0) {
      throw new ErroNaoEncontrado('Contato nao possui esta etiqueta');
    }

    await db
      .delete(contatosEtiquetas)
      .where(
        and(
          eq(contatosEtiquetas.contatoId, contatoId),
          eq(contatosEtiquetas.etiquetaId, etiquetaId)
        )
      );

    // Invalidar cache (etiquetas fazem parte do cache do contato)
    await invalidarCacheContato(contatoId);

    return { mensagem: 'Etiqueta removida com sucesso' };
  },

  async importar(clienteId: string, dados: ImportarContatosDTO) {
    const resultados = {
      criados: 0,
      duplicados: 0,
      erros: [] as string[],
    };

    for (const contatoData of dados.contatos) {
      try {
        // Verificar duplicidade
        const existe = await db
          .select({ id: contatos.id })
          .from(contatos)
          .where(and(eq(contatos.clienteId, clienteId), eq(contatos.telefone, contatoData.telefone)))
          .limit(1);

        if (existe.length > 0) {
          resultados.duplicados++;
          continue;
        }

        const [novoContato] = await db
          .insert(contatos)
          .values({
            clienteId,
            nome: contatoData.nome,
            telefone: contatoData.telefone,
            email: contatoData.email,
          })
          .returning({ id: contatos.id });

        // Inserir etiquetas na tabela de juncao se fornecidas
        if (dados.etiquetaIds && dados.etiquetaIds.length > 0) {
          await db.insert(contatosEtiquetas).values(
            dados.etiquetaIds.map((etiquetaId) => ({
              contatoId: novoContato.id,
              etiquetaId,
              clienteId,
            }))
          );
        }

        // Sincronizar com Meilisearch
        enviarJob('busca.sincronizar', { operacao: 'indexar', indice: 'contatos', clienteId, documentoId: novoContato.id }).catch(() => {});

        resultados.criados++;
      } catch (erro) {
        resultados.erros.push(`Erro ao importar ${contatoData.telefone}: ${(erro as Error).message}`);
      }
    }

    return resultados;
  },
};
