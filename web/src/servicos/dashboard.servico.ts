import { api } from './api';
import type {
  RespostaApi,
  DashboardGeral,
  AtividadesRecentes,
  PontoGrafico,
  ResumoQuadro,
} from '@/tipos';

// =============================================================================
// Serviço de Dashboard
// =============================================================================

export const dashboardServico = {
  // ---------------------------------------------------------------------------
  // Dashboard Geral
  // ---------------------------------------------------------------------------
  async obterGeral(): Promise<DashboardGeral> {
    const response = await api.get<RespostaApi<DashboardGeral>>('/dashboard');
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atividades Recentes
  // ---------------------------------------------------------------------------
  async obterAtividades(limite?: number): Promise<AtividadesRecentes> {
    const response = await api.get<RespostaApi<AtividadesRecentes>>(
      '/dashboard/atividades',
      { params: { limite } }
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Gráfico de Conversas (7 dias)
  // ---------------------------------------------------------------------------
  async obterGraficoConversas(): Promise<PontoGrafico[]> {
    const response = await api.get<RespostaApi<PontoGrafico[]>>(
      '/dashboard/grafico-conversas'
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Resumo Kanban
  // ---------------------------------------------------------------------------
  async obterResumoKanban(): Promise<ResumoQuadro[]> {
    const response = await api.get<RespostaApi<ResumoQuadro[]>>('/dashboard/kanban');
    return response.data.dados;
  },
};
