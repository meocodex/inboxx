import { api } from './api';
import type { RespostaApi } from '@/tipos';

// =============================================================================
// Tipos de Relatórios
// =============================================================================

export interface RelatorioConversas {
  periodo: string;
  total: number;
  abertas: number;
  encerradas: number;
  tempoMedioAtendimento: number;
}

export interface RelatorioAtendentes {
  atendenteId: string;
  nome: string;
  conversasAtendidas: number;
  mensagensEnviadas: number;
  tempoMedioResposta: number;
}

export interface RelatorioCampanhas {
  campanhaId: string;
  nome: string;
  totalContatos: number;
  enviados: number;
  erros: number;
  taxaSucesso: number;
}

export interface FiltrosRelatorio {
  dataInicio?: string;
  dataFim?: string;
}

// =============================================================================
// Serviço de Relatórios
// =============================================================================

export const relatoriosServico = {
  async conversas(filtros?: FiltrosRelatorio): Promise<RelatorioConversas[]> {
    const response = await api.get<RespostaApi<RelatorioConversas[]>>(
      '/relatorios/conversas',
      { params: filtros }
    );
    return response.data.dados;
  },

  async kanban(filtros?: FiltrosRelatorio): Promise<RelatorioAtendentes[]> {
    const response = await api.get<RespostaApi<RelatorioAtendentes[]>>(
      '/relatorios/kanban',
      { params: filtros }
    );
    return response.data.dados;
  },

  async campanhas(filtros?: FiltrosRelatorio): Promise<RelatorioCampanhas[]> {
    const response = await api.get<RespostaApi<RelatorioCampanhas[]>>(
      '/relatorios/campanhas',
      { params: filtros }
    );
    return response.data.dados;
  },
};
