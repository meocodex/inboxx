import { eq, and, or, ilike, count, sql, desc, asc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { fluxosChatbot, nosChatbot } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type { CriarFluxoDTO, AtualizarFluxoDTO, ListarFluxosQuery, DuplicarFluxoDTO } from './fluxos.schema.js';

// =============================================================================
// Servico de Fluxos de Chatbot
// =============================================================================

export const fluxosServico = {
  // ---------------------------------------------------------------------------
  // Listar Fluxos
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarFluxosQuery) {
    const { pagina, limite, busca, ativo } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(fluxosChatbot.clienteId, clienteId)];

    if (busca) {
      conditions.push(
        or(
          ilike(fluxosChatbot.nome, `%${busca}%`),
          ilike(fluxosChatbot.descricao, `%${busca}%`),
        )!
      );
    }

    if (ativo !== undefined) {
      conditions.push(eq(fluxosChatbot.ativo, ativo));
    }

    const whereClause = and(...conditions);

    const [fluxos, totalResult] = await Promise.all([
      db.select({
        id: fluxosChatbot.id,
        clienteId: fluxosChatbot.clienteId,
        nome: fluxosChatbot.nome,
        descricao: fluxosChatbot.descricao,
        gatilho: fluxosChatbot.gatilho,
        ativo: fluxosChatbot.ativo,
        criadoEm: fluxosChatbot.criadoEm,
        atualizadoEm: fluxosChatbot.atualizadoEm,
        totalNos: sql<number>`(SELECT count(*) FROM nos_chatbot WHERE nos_chatbot.fluxo_id = ${fluxosChatbot.id})`.mapWith(Number),
      })
        .from(fluxosChatbot)
        .where(whereClause)
        .orderBy(desc(fluxosChatbot.criadoEm))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(fluxosChatbot)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: fluxos,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Fluxo por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const fluxoResult = await db.select({
      id: fluxosChatbot.id,
      clienteId: fluxosChatbot.clienteId,
      nome: fluxosChatbot.nome,
      descricao: fluxosChatbot.descricao,
      gatilho: fluxosChatbot.gatilho,
      ativo: fluxosChatbot.ativo,
      criadoEm: fluxosChatbot.criadoEm,
      atualizadoEm: fluxosChatbot.atualizadoEm,
    })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, id), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    const nos = await db.select({
      id: nosChatbot.id,
      fluxoId: nosChatbot.fluxoId,
      tipo: nosChatbot.tipo,
      nome: nosChatbot.nome,
      configuracao: nosChatbot.configuracao,
      posicaoX: nosChatbot.posicaoX,
      posicaoY: nosChatbot.posicaoY,
      proximoNoId: nosChatbot.proximoNoId,
    })
      .from(nosChatbot)
      .where(eq(nosChatbot.fluxoId, id))
      .orderBy(asc(nosChatbot.tipo));

    return {
      ...fluxoResult[0],
      nos,
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Fluxo
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarFluxoDTO) {
    const [fluxo] = await db.insert(fluxosChatbot).values({
      clienteId,
      nome: dados.nome,
      descricao: dados.descricao,
      gatilho: dados.gatilho,
      ativo: dados.ativo ?? false,
    }).returning({ id: fluxosChatbot.id });

    // Criar no inicial automaticamente
    await db.insert(nosChatbot).values({
      clienteId,
      fluxoId: fluxo.id,
      tipo: 'INICIO',
      nome: 'Início',
      configuracao: {},
      posicaoX: 100,
      posicaoY: 100,
    });

    return this.obterPorId(clienteId, fluxo.id);
  },

  // ---------------------------------------------------------------------------
  // Atualizar Fluxo
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarFluxoDTO) {
    const fluxoExistenteResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, id), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoExistenteResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    await db.update(fluxosChatbot)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.gatilho && { gatilho: dados.gatilho }),
        ...(dados.ativo !== undefined && { ativo: dados.ativo }),
      })
      .where(eq(fluxosChatbot.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Excluir Fluxo
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, id), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    await db.delete(fluxosChatbot).where(eq(fluxosChatbot.id, id));
  },

  // ---------------------------------------------------------------------------
  // Duplicar Fluxo
  // ---------------------------------------------------------------------------
  async duplicar(clienteId: string, id: string, dados: DuplicarFluxoDTO) {
    const fluxoOriginal = await this.obterPorId(clienteId, id);

    // Criar novo fluxo
    const [novoFluxo] = await db.insert(fluxosChatbot).values({
      clienteId,
      nome: dados.novoNome,
      descricao: fluxoOriginal.descricao,
      gatilho: fluxoOriginal.gatilho,
      ativo: false,
    }).returning({ id: fluxosChatbot.id });

    // Mapear IDs antigos para novos
    const mapaIds = new Map<string, string>();

    // Criar copias dos nos
    for (const no of fluxoOriginal.nos) {
      const [novoNo] = await db.insert(nosChatbot).values({
        clienteId,
        fluxoId: novoFluxo.id,
        tipo: no.tipo,
        nome: no.nome,
        configuracao: no.configuracao,
        posicaoX: no.posicaoX,
        posicaoY: no.posicaoY,
      }).returning({ id: nosChatbot.id });

      mapaIds.set(no.id, novoNo.id);
    }

    // Atualizar conexoes (proximoNoId)
    for (const no of fluxoOriginal.nos) {
      if (no.proximoNoId && mapaIds.has(no.proximoNoId)) {
        const novoNoId = mapaIds.get(no.id);
        const novoProximoId = mapaIds.get(no.proximoNoId);
        if (novoNoId && novoProximoId) {
          await db.update(nosChatbot)
            .set({ proximoNoId: novoProximoId })
            .where(eq(nosChatbot.id, novoNoId));
        }
      }
    }

    return this.obterPorId(clienteId, novoFluxo.id);
  },

  // ---------------------------------------------------------------------------
  // Ativar/Desativar Fluxo
  // ---------------------------------------------------------------------------
  async alterarStatus(clienteId: string, id: string, ativo: boolean) {
    const fluxoResult = await db.select({
      id: fluxosChatbot.id,
    })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, id), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    // Validar fluxo antes de ativar
    if (ativo) {
      const nos = await db.select({
        id: nosChatbot.id,
        tipo: nosChatbot.tipo,
      })
        .from(nosChatbot)
        .where(eq(nosChatbot.fluxoId, id));

      const temInicio = nos.some((n) => n.tipo === 'INICIO');
      if (!temInicio) {
        throw new ErroValidacao('Fluxo deve ter um nó de início');
      }
    }

    await db.update(fluxosChatbot)
      .set({ ativo })
      .where(eq(fluxosChatbot.id, id));

    return this.obterPorId(clienteId, id);
  },
};
