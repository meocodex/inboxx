import { eq, and, count, asc, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  fluxosChatbot,
  nosChatbot,
  transicoesChatbot,
} from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarTransicaoDTO,
  AtualizarTransicaoDTO,
  ListarTransicoesQuery,
  ConectarNosLoteDTO,
} from './transicoes.schema.js';

// =============================================================================
// Servico de Transicoes do Chatbot
// =============================================================================

export const transicoesServico = {
  // ---------------------------------------------------------------------------
  // Listar Transicoes de um Fluxo
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, fluxoId: string, query: ListarTransicoesQuery) {
    const { pagina, limite } = query;
    const offset = (pagina - 1) * limite;

    await this.verificarFluxo(clienteId, fluxoId);

    const [transicoes, totalResult] = await Promise.all([
      db.select({
        id: transicoesChatbot.id,
        fluxoId: transicoesChatbot.fluxoId,
        noOrigemId: transicoesChatbot.noOrigemId,
        noDestinoId: transicoesChatbot.noDestinoId,
        evento: transicoesChatbot.evento,
        condicao: transicoesChatbot.condicao,
        ordem: transicoesChatbot.ordem,
        criadoEm: transicoesChatbot.criadoEm,
      })
        .from(transicoesChatbot)
        .where(eq(transicoesChatbot.fluxoId, fluxoId))
        .orderBy(asc(transicoesChatbot.ordem), asc(transicoesChatbot.criadoEm))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(transicoesChatbot)
        .where(eq(transicoesChatbot.fluxoId, fluxoId)),
    ]);

    return {
      dados: transicoes,
      paginacao: {
        pagina,
        limite,
        total: totalResult[0]?.total ?? 0,
        totalPaginas: Math.ceil((totalResult[0]?.total ?? 0) / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Transicao por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, fluxoId: string, id: string) {
    await this.verificarFluxo(clienteId, fluxoId);

    const result = await db.select({
      id: transicoesChatbot.id,
      fluxoId: transicoesChatbot.fluxoId,
      noOrigemId: transicoesChatbot.noOrigemId,
      noDestinoId: transicoesChatbot.noDestinoId,
      evento: transicoesChatbot.evento,
      condicao: transicoesChatbot.condicao,
      ordem: transicoesChatbot.ordem,
      criadoEm: transicoesChatbot.criadoEm,
    })
      .from(transicoesChatbot)
      .where(and(eq(transicoesChatbot.id, id), eq(transicoesChatbot.fluxoId, fluxoId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Transicao nao encontrada');
    }

    return result[0];
  },

  // ---------------------------------------------------------------------------
  // Criar Transicao
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, fluxoId: string, dados: CriarTransicaoDTO) {
    await this.verificarFluxo(clienteId, fluxoId);
    await this.verificarNo(clienteId, fluxoId, dados.noOrigemId);
    await this.verificarNo(clienteId, fluxoId, dados.noDestinoId);

    if (dados.noOrigemId === dados.noDestinoId) {
      throw new ErroValidacao('No nao pode ter transicao para si mesmo');
    }

    const [transicao] = await db.insert(transicoesChatbot).values({
      fluxoId,
      noOrigemId: dados.noOrigemId,
      noDestinoId: dados.noDestinoId,
      evento: dados.evento,
      condicao: dados.condicao ?? null,
      ordem: dados.ordem ?? 0,
    }).returning({
      id: transicoesChatbot.id,
      fluxoId: transicoesChatbot.fluxoId,
      noOrigemId: transicoesChatbot.noOrigemId,
      noDestinoId: transicoesChatbot.noDestinoId,
      evento: transicoesChatbot.evento,
      condicao: transicoesChatbot.condicao,
      ordem: transicoesChatbot.ordem,
      criadoEm: transicoesChatbot.criadoEm,
    });

    return transicao;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Transicao
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, fluxoId: string, id: string, dados: AtualizarTransicaoDTO) {
    const transicao = await this.obterPorId(clienteId, fluxoId, id);

    if (dados.noDestinoId) {
      await this.verificarNo(clienteId, fluxoId, dados.noDestinoId);

      if (transicao.noOrigemId === dados.noDestinoId) {
        throw new ErroValidacao('No nao pode ter transicao para si mesmo');
      }
    }

    const [atualizado] = await db.update(transicoesChatbot)
      .set({
        ...(dados.noDestinoId && { noDestinoId: dados.noDestinoId }),
        ...(dados.evento && { evento: dados.evento }),
        ...(dados.condicao !== undefined && { condicao: dados.condicao ?? null }),
        ...(dados.ordem !== undefined && { ordem: dados.ordem }),
      })
      .where(eq(transicoesChatbot.id, id))
      .returning({
        id: transicoesChatbot.id,
        fluxoId: transicoesChatbot.fluxoId,
        noOrigemId: transicoesChatbot.noOrigemId,
        noDestinoId: transicoesChatbot.noDestinoId,
        evento: transicoesChatbot.evento,
        condicao: transicoesChatbot.condicao,
        ordem: transicoesChatbot.ordem,
        criadoEm: transicoesChatbot.criadoEm,
      });

    return atualizado;
  },

  // ---------------------------------------------------------------------------
  // Excluir Transicao
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, fluxoId: string, id: string) {
    await this.obterPorId(clienteId, fluxoId, id);
    await db.delete(transicoesChatbot).where(eq(transicoesChatbot.id, id));
  },

  // ---------------------------------------------------------------------------
  // Sincronizar Transicoes em Lote (para visual builder)
  // ---------------------------------------------------------------------------
  async sincronizarLote(clienteId: string, fluxoId: string, dados: ConectarNosLoteDTO) {
    // 1. Validar fluxo
    await this.verificarFluxo(clienteId, fluxoId);

    // 2. Validar self-loops
    for (const t of dados.transicoes) {
      if (t.noOrigemId === t.noDestinoId) {
        throw new ErroValidacao('No nao pode ter transicao para si mesmo');
      }
    }

    // 3. Coletar todos os IDs de nós
    const todosNosIds = dados.transicoes.flatMap(t => [t.noOrigemId, t.noDestinoId]);

    // 4. Validar TODOS os nós em 1 query
    await this.verificarNosBatch(todosNosIds, clienteId, fluxoId);

    // 5. Transação atômica: delete + bulk insert
    return await db.transaction(async (tx) => {
      // Delete transições existentes
      await tx.delete(transicoesChatbot)
        .where(eq(transicoesChatbot.fluxoId, fluxoId));

      // Bulk insert (1 query para todas)
      if (dados.transicoes.length === 0) {
        return [];
      }

      const valores = dados.transicoes.map((t, index) => ({
        fluxoId,
        noOrigemId: t.noOrigemId,
        noDestinoId: t.noDestinoId,
        evento: t.evento,
        condicao: t.condicao ?? null,
        ordem: index,
      }));

      return await tx.insert(transicoesChatbot)
        .values(valores)
        .returning();
    });
  },

  // ---------------------------------------------------------------------------
  // Obter Transicoes de um No
  // ---------------------------------------------------------------------------
  async obterTransicoesDoNo(clienteId: string, fluxoId: string, noId: string) {
    await this.verificarFluxo(clienteId, fluxoId);

    const transicoes = await db.select({
      id: transicoesChatbot.id,
      fluxoId: transicoesChatbot.fluxoId,
      noOrigemId: transicoesChatbot.noOrigemId,
      noDestinoId: transicoesChatbot.noDestinoId,
      evento: transicoesChatbot.evento,
      condicao: transicoesChatbot.condicao,
      ordem: transicoesChatbot.ordem,
    })
      .from(transicoesChatbot)
      .where(and(
        eq(transicoesChatbot.fluxoId, fluxoId),
        eq(transicoesChatbot.noOrigemId, noId)
      ))
      .orderBy(asc(transicoesChatbot.ordem));

    return transicoes;
  },

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------
  async verificarFluxo(clienteId: string, fluxoId: string) {
    const result = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Fluxo nao encontrado');
    }

    return result[0];
  },

  async verificarNo(clienteId: string, fluxoId: string, noId: string) {
    const result = await db.select({ id: nosChatbot.id })
      .from(nosChatbot)
      .where(
        and(
          eq(nosChatbot.id, noId),
          eq(nosChatbot.fluxoId, fluxoId),
          eq(nosChatbot.clienteId, clienteId)
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado(`No ${noId} nao encontrado para este cliente`);
    }

    return result[0];
  },

  async verificarNosBatch(nosIds: string[], clienteId: string, fluxoId: string): Promise<void> {
    if (nosIds.length === 0) return;

    // Remover duplicatas
    const nosUnicos = [...new Set(nosIds)];

    // Buscar TODOS os nós em 1 query
    const nosEncontrados = await db.select({ id: nosChatbot.id })
      .from(nosChatbot)
      .where(
        and(
          inArray(nosChatbot.id, nosUnicos),
          eq(nosChatbot.clienteId, clienteId),
          eq(nosChatbot.fluxoId, fluxoId)
        )
      );

    // Validar que todos foram encontrados
    if (nosEncontrados.length !== nosUnicos.length) {
      const encontradosIds = new Set(nosEncontrados.map(n => n.id));
      const nosFaltando = nosUnicos.filter(id => !encontradosIds.has(id));
      throw new ErroValidacao(
        `Nos nao encontrados para este cliente: ${nosFaltando.join(', ')}`
      );
    }
  },
};
