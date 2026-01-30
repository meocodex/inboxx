import { eq, and, ne, count, asc, isNull } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { fluxosChatbot, nosChatbot } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarNoDTO,
  AtualizarNoDTO,
  ListarNosQuery,
  AtualizarPosicoesDTO,
  ConectarNosDTO,
} from './nos.schema.js';

// =============================================================================
// Servico de Nos do Chatbot
// =============================================================================

export const nosServico = {
  // ---------------------------------------------------------------------------
  // Listar Nos de um Fluxo
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, fluxoId: string, query: ListarNosQuery) {
    const { pagina, limite } = query;
    const offset = (pagina - 1) * limite;

    // Verificar se o fluxo pertence ao cliente
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    const [nos, totalResult] = await Promise.all([
      db.select({
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
        .where(eq(nosChatbot.fluxoId, fluxoId))
        .orderBy(asc(nosChatbot.tipo), asc(nosChatbot.posicaoY))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(nosChatbot)
        .where(eq(nosChatbot.fluxoId, fluxoId)),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: nos,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter No por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, fluxoId: string, id: string) {
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    const noResult = await db.select({
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
      .where(and(eq(nosChatbot.id, id), eq(nosChatbot.fluxoId, fluxoId)))
      .limit(1);

    if (noResult.length === 0) {
      throw new ErroNaoEncontrado('Nó não encontrado');
    }

    return noResult[0];
  },

  // ---------------------------------------------------------------------------
  // Criar No
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, fluxoId: string, dados: CriarNoDTO) {
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    // Validar tipo INICIO (so pode ter um)
    if (dados.tipo === 'INICIO') {
      const inicioExistente = await db.select({ id: nosChatbot.id })
        .from(nosChatbot)
        .where(and(eq(nosChatbot.fluxoId, fluxoId), eq(nosChatbot.tipo, 'INICIO')))
        .limit(1);

      if (inicioExistente.length > 0) {
        throw new ErroValidacao('Fluxo já possui um nó de início');
      }
    }

    // Validar proximoNoId se fornecido
    if (dados.proximoNoId) {
      const proximoNo = await db.select({ id: nosChatbot.id })
        .from(nosChatbot)
        .where(and(eq(nosChatbot.id, dados.proximoNoId), eq(nosChatbot.fluxoId, fluxoId)))
        .limit(1);

      if (proximoNo.length === 0) {
        throw new ErroValidacao('Nó de destino não encontrado');
      }
    }

    const [no] = await db.insert(nosChatbot).values({
      clienteId,
      fluxoId,
      tipo: dados.tipo,
      nome: dados.nome,
      configuracao: dados.configuracao,
      posicaoX: dados.posicaoX,
      posicaoY: dados.posicaoY,
      proximoNoId: dados.proximoNoId,
    }).returning({
      id: nosChatbot.id,
      fluxoId: nosChatbot.fluxoId,
      tipo: nosChatbot.tipo,
      nome: nosChatbot.nome,
      configuracao: nosChatbot.configuracao,
      posicaoX: nosChatbot.posicaoX,
      posicaoY: nosChatbot.posicaoY,
      proximoNoId: nosChatbot.proximoNoId,
    });

    return no;
  },

  // ---------------------------------------------------------------------------
  // Atualizar No
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, fluxoId: string, id: string, dados: AtualizarNoDTO) {
    const noExistente = await this.obterPorId(clienteId, fluxoId, id);

    // Validar mudanca de tipo para INICIO
    if (dados.tipo === 'INICIO' && noExistente.tipo !== 'INICIO') {
      const inicioExistente = await db.select({ id: nosChatbot.id })
        .from(nosChatbot)
        .where(and(
          eq(nosChatbot.fluxoId, fluxoId),
          eq(nosChatbot.tipo, 'INICIO'),
          ne(nosChatbot.id, id),
        ))
        .limit(1);

      if (inicioExistente.length > 0) {
        throw new ErroValidacao('Fluxo já possui um nó de início');
      }
    }

    // Validar proximoNoId se fornecido
    if (dados.proximoNoId) {
      if (dados.proximoNoId === id) {
        throw new ErroValidacao('Nó não pode apontar para si mesmo');
      }

      const proximoNo = await db.select({ id: nosChatbot.id })
        .from(nosChatbot)
        .where(and(eq(nosChatbot.id, dados.proximoNoId), eq(nosChatbot.fluxoId, fluxoId)))
        .limit(1);

      if (proximoNo.length === 0) {
        throw new ErroValidacao('Nó de destino não encontrado');
      }
    }

    const [no] = await db.update(nosChatbot)
      .set({
        ...(dados.tipo && { tipo: dados.tipo }),
        ...(dados.nome !== undefined && { nome: dados.nome }),
        ...(dados.configuracao && { configuracao: dados.configuracao }),
        ...(dados.posicaoX !== undefined && { posicaoX: dados.posicaoX }),
        ...(dados.posicaoY !== undefined && { posicaoY: dados.posicaoY }),
        ...(dados.proximoNoId !== undefined && { proximoNoId: dados.proximoNoId }),
      })
      .where(eq(nosChatbot.id, id))
      .returning({
        id: nosChatbot.id,
        fluxoId: nosChatbot.fluxoId,
        tipo: nosChatbot.tipo,
        nome: nosChatbot.nome,
        configuracao: nosChatbot.configuracao,
        posicaoX: nosChatbot.posicaoX,
        posicaoY: nosChatbot.posicaoY,
        proximoNoId: nosChatbot.proximoNoId,
      });

    return no;
  },

  // ---------------------------------------------------------------------------
  // Excluir No
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, fluxoId: string, id: string) {
    const no = await this.obterPorId(clienteId, fluxoId, id);

    // Nao permitir excluir no de inicio se for o unico
    if (no.tipo === 'INICIO') {
      throw new ErroValidacao('Não é possível excluir o nó de início');
    }

    // Remover referencias a este no
    await db.update(nosChatbot)
      .set({ proximoNoId: null })
      .where(and(eq(nosChatbot.fluxoId, fluxoId), eq(nosChatbot.proximoNoId, id)));

    await db.delete(nosChatbot).where(eq(nosChatbot.id, id));
  },

  // ---------------------------------------------------------------------------
  // Atualizar Posicoes em Lote
  // ---------------------------------------------------------------------------
  async atualizarPosicoes(clienteId: string, fluxoId: string, dados: AtualizarPosicoesDTO) {
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    // Atualizar cada no
    await Promise.all(
      dados.nos.map((item) =>
        db.update(nosChatbot)
          .set({ posicaoX: item.posicaoX, posicaoY: item.posicaoY })
          .where(and(eq(nosChatbot.id, item.id), eq(nosChatbot.fluxoId, fluxoId)))
      )
    );

    return { atualizado: true };
  },

  // ---------------------------------------------------------------------------
  // Conectar Nos
  // ---------------------------------------------------------------------------
  async conectar(clienteId: string, fluxoId: string, dados: ConectarNosDTO) {
    const fluxoResult = await db.select({ id: fluxosChatbot.id })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo não encontrado');
    }

    // Verificar origem
    const noOrigem = await db.select({ id: nosChatbot.id })
      .from(nosChatbot)
      .where(and(eq(nosChatbot.id, dados.origemId), eq(nosChatbot.fluxoId, fluxoId)))
      .limit(1);

    if (noOrigem.length === 0) {
      throw new ErroNaoEncontrado('Nó de origem não encontrado');
    }

    // Verificar destino se fornecido
    if (dados.destinoId) {
      if (dados.destinoId === dados.origemId) {
        throw new ErroValidacao('Nó não pode conectar a si mesmo');
      }

      const noDestino = await db.select({ id: nosChatbot.id })
        .from(nosChatbot)
        .where(and(eq(nosChatbot.id, dados.destinoId), eq(nosChatbot.fluxoId, fluxoId)))
        .limit(1);

      if (noDestino.length === 0) {
        throw new ErroNaoEncontrado('Nó de destino não encontrado');
      }
    }

    await db.update(nosChatbot)
      .set({ proximoNoId: dados.destinoId })
      .where(eq(nosChatbot.id, dados.origemId));

    return { conectado: true };
  },
};
