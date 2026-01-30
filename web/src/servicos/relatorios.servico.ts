import { api } from './api';
import type { RespostaApi } from '@/tipos';

// =============================================================================
// Tipos de Resposta do Backend
// =============================================================================

// Resposta real do endpoint /relatorios/conversas
export interface RespostaRelatorioConversas {
  periodo: { inicio: string; fim: string };
  resumo: {
    total: number;
    abertas: number;
    emAtendimento: number;
    resolvidas: number;
    aguardando: number;
    totalMensagens: number;
  };
  porConexao: Array<{ conexaoId: string; _count: { id: number } }>;
  porUsuario: Array<{ usuarioId: string | null; total: number }>;
}

// Resposta real do endpoint /relatorios/kanban
export interface RespostaRelatorioKanban {
  resumo: {
    totalQuadros: number;
    totalCartoes: number;
    valorTotal: number;
  };
  porQuadro: Array<{
    id: string;
    nome: string;
    colunas: Array<{ id: string; nome: string; totalCartoes: number }>;
  }>;
  valorPorColuna: Record<string, { total: number; valor: number }>;
}

// Resposta real do endpoint /relatorios/campanhas
export interface RespostaRelatorioCampanhas {
  periodo: { inicio: string; fim: string };
  resumo: {
    total: number;
    concluidas: number;
    emAndamento: number;
    agendadas: number;
  };
  envios: {
    enviados: number;
    entregues: number;
    lidos: number;
    erros: number;
    taxaEntrega: string;
    taxaLeitura: string;
  };
  topCampanhas: Array<{
    id: string;
    nome: string;
    _count: { logs: number };
  }>;
}

// =============================================================================
// Tipos para o Frontend (compatibilidade)
// =============================================================================

export interface RelatorioConversasProcessado {
  resumo: RespostaRelatorioConversas['resumo'];
  porConexao: RespostaRelatorioConversas['porConexao'];
}

export interface RelatorioKanbanProcessado {
  resumo: RespostaRelatorioKanban['resumo'];
  porQuadro: RespostaRelatorioKanban['porQuadro'];
  valorPorColuna: RespostaRelatorioKanban['valorPorColuna'];
}

export interface RelatorioCampanhasProcessado {
  resumo: RespostaRelatorioCampanhas['resumo'];
  envios: RespostaRelatorioCampanhas['envios'];
  topCampanhas: RespostaRelatorioCampanhas['topCampanhas'];
}

export interface FiltrosRelatorio {
  dataInicio: string;
  dataFim: string;
}

// =============================================================================
// Utilitario para calcular datas
// =============================================================================

export function calcularPeriodo(filtroPeriodo: '7d' | '30d' | '90d' | '365d'): FiltrosRelatorio {
  const dataFim = new Date();
  const dataInicio = new Date();

  const dias = parseInt(filtroPeriodo.replace('d', ''), 10);
  dataInicio.setDate(dataInicio.getDate() - dias);

  return {
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: dataFim.toISOString().split('T')[0],
  };
}

// =============================================================================
// Servico de Relatorios
// =============================================================================

export const relatoriosServico = {
  async conversas(filtros: FiltrosRelatorio): Promise<RelatorioConversasProcessado> {
    const response = await api.get<RespostaApi<RespostaRelatorioConversas>>(
      '/relatorios/conversas',
      { params: filtros }
    );
    const dados = response.data.dados;
    return {
      resumo: dados.resumo,
      porConexao: dados.porConexao,
    };
  },

  async kanban(): Promise<RelatorioKanbanProcessado> {
    const response = await api.get<RespostaApi<RespostaRelatorioKanban>>(
      '/relatorios/kanban'
    );
    const dados = response.data.dados;
    return {
      resumo: dados.resumo,
      porQuadro: dados.porQuadro,
      valorPorColuna: dados.valorPorColuna,
    };
  },

  async campanhas(filtros: FiltrosRelatorio): Promise<RelatorioCampanhasProcessado> {
    const response = await api.get<RespostaApi<RespostaRelatorioCampanhas>>(
      '/relatorios/campanhas',
      { params: filtros }
    );
    const dados = response.data.dados;
    return {
      resumo: dados.resumo,
      envios: dados.envios,
      topCampanhas: dados.topCampanhas,
    };
  },
};
