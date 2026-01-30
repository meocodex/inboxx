import { eq, and, asc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  fluxosChatbot,
  nosChatbot,
  transicoesChatbot,
} from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Tipos para XState Machine
// =============================================================================

export interface MachineContext {
  conversaId?: string;
  contatoId?: string;
  mensagens: string[];
  variaveis: Record<string, unknown>;
  ultimaMensagem?: string;
  ultimoEvento?: string;
}

export interface StateConfig {
  type?: 'atomic' | 'compound' | 'parallel' | 'final';
  entry?: ActionConfig[];
  exit?: ActionConfig[];
  on?: Record<string, TransitionConfig | TransitionConfig[]>;
  after?: Record<number, TransitionConfig>;
  meta?: Record<string, unknown>;
}

export interface TransitionConfig {
  target: string;
  guard?: GuardConfig;
  actions?: ActionConfig[];
}

export interface GuardConfig {
  type: string;
  params?: Record<string, unknown>;
}

export interface ActionConfig {
  type: string;
  params?: Record<string, unknown>;
}

export interface MachineDefinition {
  id: string;
  initial: string;
  context: MachineContext;
  states: Record<string, StateConfig>;
}

// Tipo de no vindo do banco
interface NoDb {
  id: string;
  tipo: string;
  nome: string | null;
  configuracao: unknown;
  posicaoX: number;
  posicaoY: number;
}

// Tipo de transicao vindo do banco
interface TransicaoDb {
  id: string;
  noOrigemId: string;
  noDestinoId: string;
  evento: string;
  condicao: unknown;
  ordem: number;
}

// =============================================================================
// Motor de Fluxo (Conversor para XState)
// =============================================================================

export const motorFluxoServico = {
  // ---------------------------------------------------------------------------
  // Compilar Fluxo para XState Machine
  // ---------------------------------------------------------------------------
  async compilar(clienteId: string, fluxoId: string): Promise<MachineDefinition> {
    // Buscar fluxo
    const fluxoResult = await db.select()
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (fluxoResult.length === 0) {
      throw new ErroNaoEncontrado('Fluxo nao encontrado');
    }

    const fluxo = fluxoResult[0];

    // Buscar nos
    const nos = await db.select({
      id: nosChatbot.id,
      tipo: nosChatbot.tipo,
      nome: nosChatbot.nome,
      configuracao: nosChatbot.configuracao,
      posicaoX: nosChatbot.posicaoX,
      posicaoY: nosChatbot.posicaoY,
    })
      .from(nosChatbot)
      .where(eq(nosChatbot.fluxoId, fluxoId))
      .orderBy(asc(nosChatbot.posicaoY));

    if (nos.length === 0) {
      throw new ErroValidacao('Fluxo nao possui nos');
    }

    // Buscar transicoes
    const transicoes = await db.select({
      id: transicoesChatbot.id,
      noOrigemId: transicoesChatbot.noOrigemId,
      noDestinoId: transicoesChatbot.noDestinoId,
      evento: transicoesChatbot.evento,
      condicao: transicoesChatbot.condicao,
      ordem: transicoesChatbot.ordem,
    })
      .from(transicoesChatbot)
      .where(eq(transicoesChatbot.fluxoId, fluxoId))
      .orderBy(asc(transicoesChatbot.ordem));

    // Encontrar no inicial
    const noInicial = nos.find(n => n.tipo === 'INICIO');
    if (!noInicial) {
      throw new ErroValidacao('Fluxo nao possui no de inicio');
    }

    // Construir machine definition
    const machine = this.construirMachine(fluxoId, fluxo.nome, nos, transicoes, noInicial.id);

    // Salvar a definicao no banco
    await db.update(fluxosChatbot)
      .set({ machineDefinition: machine })
      .where(eq(fluxosChatbot.id, fluxoId));

    logger.info({ fluxoId, estados: Object.keys(machine.states).length }, 'Fluxo compilado');

    return machine;
  },

  // ---------------------------------------------------------------------------
  // Construir Machine Definition
  // ---------------------------------------------------------------------------
  construirMachine(
    fluxoId: string,
    nome: string,
    nos: NoDb[],
    transicoes: TransicaoDb[],
    noInicialId: string
  ): MachineDefinition {
    const states: Record<string, StateConfig> = {};

    // Mapear transicoes por no de origem
    const transicoesPorNo = new Map<string, TransicaoDb[]>();
    for (const t of transicoes) {
      const lista = transicoesPorNo.get(t.noOrigemId) || [];
      lista.push(t);
      transicoesPorNo.set(t.noOrigemId, lista);
    }

    // Converter cada no em um estado
    for (const no of nos) {
      const stateId = this.sanitizeId(no.id);
      const transDoNo = transicoesPorNo.get(no.id) || [];

      states[stateId] = this.converterNoParaEstado(no, transDoNo, nos);
    }

    return {
      id: fluxoId,
      initial: this.sanitizeId(noInicialId),
      context: {
        mensagens: [],
        variaveis: {},
      },
      states,
    };
  },

  // ---------------------------------------------------------------------------
  // Converter No para Estado XState
  // ---------------------------------------------------------------------------
  converterNoParaEstado(no: NoDb, transicoes: TransicaoDb[], todosNos: NoDb[]): StateConfig {
    const config = no.configuracao as Record<string, unknown> || {};
    const state: StateConfig = {
      meta: {
        noId: no.id,
        tipo: no.tipo,
        nome: no.nome,
        configuracao: config,
      },
    };

    // Definir tipo de estado
    if (no.tipo === 'FIM') {
      state.type = 'final';
      return state;
    }

    // Entry actions baseadas no tipo
    state.entry = this.obterEntryActions(no.tipo, config);

    // Transicoes
    if (transicoes.length > 0) {
      state.on = {};

      for (const t of transicoes) {
        const targetId = this.sanitizeId(t.noDestinoId);
        const transition: TransitionConfig = { target: targetId };

        // Adicionar guard se houver condicao
        if (t.condicao) {
          const cond = t.condicao as { tipo?: string; valor?: string; campo?: string };
          if (cond.tipo) {
            transition.guard = {
              type: cond.tipo.toLowerCase(),
              params: { valor: cond.valor, campo: cond.campo },
            };
          }
        }

        // Adicionar transicao ao evento
        const evento = t.evento;
        const existente = state.on[evento];

        if (existente) {
          // Multiplas transicoes para o mesmo evento
          if (Array.isArray(existente)) {
            existente.push(transition);
          } else {
            state.on[evento] = [existente, transition];
          }
        } else {
          state.on[evento] = transition;
        }
      }
    }

    // Adicionar timeouts se configurado
    if (config.timeout && typeof config.timeout === 'number') {
      state.after = {
        [config.timeout as number]: {
          target: transicoes.length > 0 ? this.sanitizeId(transicoes[0].noDestinoId) : 'fim',
        },
      };
    }

    return state;
  },

  // ---------------------------------------------------------------------------
  // Obter Entry Actions por Tipo de No
  // ---------------------------------------------------------------------------
  obterEntryActions(tipo: string, config: Record<string, unknown>): ActionConfig[] {
    const actions: ActionConfig[] = [];

    switch (tipo) {
      case 'MENSAGEM':
        actions.push({
          type: 'enviarMensagem',
          params: { mensagem: config.mensagem },
        });
        break;

      case 'PERGUNTA':
        actions.push({
          type: 'enviarPergunta',
          params: {
            mensagem: config.mensagem,
            variavel: config.variavel,
            validacao: config.validacao,
          },
        });
        break;

      case 'MENU':
        actions.push({
          type: 'enviarMenu',
          params: {
            mensagem: config.mensagem,
            opcoes: config.opcoes,
          },
        });
        break;

      case 'CONDICAO':
        actions.push({
          type: 'avaliarCondicao',
          params: {
            condicoes: config.condicoes,
          },
        });
        break;

      case 'TRANSFERIR':
        actions.push({
          type: 'transferir',
          params: {
            equipeId: config.equipeId,
            usuarioId: config.usuarioId,
            mensagem: config.mensagem,
          },
        });
        break;

      case 'WEBHOOK':
        actions.push({
          type: 'chamarWebhook',
          params: {
            url: config.url,
            metodo: config.metodo || 'POST',
            headers: config.headers,
            body: config.body,
            variavel: config.variavel,
          },
        });
        break;

      case 'ESPERAR':
        actions.push({
          type: 'esperar',
          params: { duracao: config.duracao },
        });
        break;

      case 'ACAO':
        actions.push({
          type: 'executarAcao',
          params: {
            acao: config.acao,
            parametros: config.parametros,
          },
        });
        break;
    }

    return actions;
  },

  // ---------------------------------------------------------------------------
  // Obter Machine Definition de um Fluxo
  // ---------------------------------------------------------------------------
  async obterMachine(clienteId: string, fluxoId: string): Promise<MachineDefinition | null> {
    const result = await db.select({ machineDefinition: fluxosChatbot.machineDefinition })
      .from(fluxosChatbot)
      .where(and(eq(fluxosChatbot.id, fluxoId), eq(fluxosChatbot.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Fluxo nao encontrado');
    }

    return result[0].machineDefinition as MachineDefinition | null;
  },

  // ---------------------------------------------------------------------------
  // Validar Fluxo
  // ---------------------------------------------------------------------------
  async validar(clienteId: string, fluxoId: string): Promise<{ valido: boolean; erros: string[] }> {
    const erros: string[] = [];

    // Buscar nos
    const nos = await db.select({
      id: nosChatbot.id,
      tipo: nosChatbot.tipo,
      nome: nosChatbot.nome,
    })
      .from(nosChatbot)
      .where(eq(nosChatbot.fluxoId, fluxoId));

    // Verificar no inicial
    const noInicio = nos.find(n => n.tipo === 'INICIO');
    if (!noInicio) {
      erros.push('Fluxo nao possui no de inicio');
    }

    // Verificar nos de fim (opcional mas recomendado)
    const nosFim = nos.filter(n => n.tipo === 'FIM');
    if (nosFim.length === 0) {
      erros.push('Fluxo nao possui no de fim (recomendado)');
    }

    // Buscar transicoes
    const transicoes = await db.select({
      noOrigemId: transicoesChatbot.noOrigemId,
      noDestinoId: transicoesChatbot.noDestinoId,
    })
      .from(transicoesChatbot)
      .where(eq(transicoesChatbot.fluxoId, fluxoId));

    // Verificar nos orfaos (sem entrada e nao sao inicio)
    const nosComEntrada = new Set(transicoes.map(t => t.noDestinoId));
    for (const no of nos) {
      if (no.tipo !== 'INICIO' && !nosComEntrada.has(no.id)) {
        erros.push(`No "${no.nome || no.id}" nao possui transicao de entrada`);
      }
    }

    // Verificar nos sem saida (que nao sao fim)
    const nosComSaida = new Set(transicoes.map(t => t.noOrigemId));
    for (const no of nos) {
      if (no.tipo !== 'FIM' && !nosComSaida.has(no.id)) {
        erros.push(`No "${no.nome || no.id}" nao possui transicao de saida`);
      }
    }

    return {
      valido: erros.length === 0,
      erros,
    };
  },

  // ---------------------------------------------------------------------------
  // Helper: Sanitizar ID para uso como nome de estado
  // ---------------------------------------------------------------------------
  sanitizeId(id: string): string {
    return id.replace(/-/g, '_');
  },
};
