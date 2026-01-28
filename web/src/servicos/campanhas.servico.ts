import { api } from './api';
import type {
  RespostaApi,
  RespostaPaginada,
  Campanha,
  CriarCampanhaDTO,
  AtualizarCampanhaDTO,
} from '@/tipos';

// =============================================================================
// Serviço de Campanhas
// =============================================================================

export const campanhasServico = {
  // ---------------------------------------------------------------------------
  // Listar
  // ---------------------------------------------------------------------------
  async listar(params?: { pagina?: number; limite?: number }): Promise<RespostaPaginada<Campanha>> {
    const response = await api.get<RespostaPaginada<Campanha>>('/campanhas', { params });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Obter por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Campanha> {
    const response = await api.get<RespostaApi<Campanha>>(`/campanhas/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar
  // ---------------------------------------------------------------------------
  async criar(dados: CriarCampanhaDTO): Promise<Campanha> {
    const response = await api.post<RespostaApi<Campanha>>('/campanhas', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarCampanhaDTO): Promise<Campanha> {
    const response = await api.put<RespostaApi<Campanha>>(`/campanhas/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Ações
  // ---------------------------------------------------------------------------
  async iniciar(id: string): Promise<Campanha> {
    const response = await api.post<RespostaApi<Campanha>>(`/campanhas/${id}/iniciar`);
    return response.data.dados;
  },

  async pausar(id: string): Promise<Campanha> {
    const response = await api.post<RespostaApi<Campanha>>(`/campanhas/${id}/pausar`);
    return response.data.dados;
  },

  async cancelar(id: string): Promise<Campanha> {
    const response = await api.post<RespostaApi<Campanha>>(`/campanhas/${id}/cancelar`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/campanhas/${id}`);
  },
};
