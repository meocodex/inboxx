import { api } from './api';
import type {
  RespostaApi,
  Fluxo,
  FluxoResumo,
  NoFluxo,
  CriarFluxoDTO,
  AtualizarFluxoDTO,
  CriarNoDTO,
  AtualizarNoDTO,
  CriarConexaoDTO,
} from '@/tipos';

// =============================================================================
// Serviço de Chatbot/Fluxos
// =============================================================================

export const chatbotServico = {
  // ---------------------------------------------------------------------------
  // Fluxos
  // ---------------------------------------------------------------------------
  async listarFluxos(): Promise<FluxoResumo[]> {
    const response = await api.get<RespostaApi<FluxoResumo[]>>('/chatbot/fluxos');
    return response.data.dados;
  },

  async obterFluxo(id: string): Promise<Fluxo> {
    const response = await api.get<RespostaApi<Fluxo>>(`/chatbot/fluxos/${id}`);
    return response.data.dados;
  },

  async criarFluxo(dados: CriarFluxoDTO): Promise<Fluxo> {
    const response = await api.post<RespostaApi<Fluxo>>('/chatbot/fluxos', dados);
    return response.data.dados;
  },

  async atualizarFluxo(id: string, dados: AtualizarFluxoDTO): Promise<Fluxo> {
    const response = await api.put<RespostaApi<Fluxo>>(`/chatbot/fluxos/${id}`, dados);
    return response.data.dados;
  },

  async excluirFluxo(id: string): Promise<void> {
    await api.delete(`/chatbot/fluxos/${id}`);
  },

  async ativarFluxo(id: string): Promise<Fluxo> {
    const response = await api.patch<RespostaApi<Fluxo>>(`/chatbot/fluxos/${id}/ativar`);
    return response.data.dados;
  },

  async desativarFluxo(id: string): Promise<Fluxo> {
    const response = await api.patch<RespostaApi<Fluxo>>(`/chatbot/fluxos/${id}/desativar`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Nós do Fluxo
  // ---------------------------------------------------------------------------
  async criarNo(fluxoId: string, dados: CriarNoDTO): Promise<NoFluxo> {
    const response = await api.post<RespostaApi<NoFluxo>>(
      `/chatbot/fluxos/${fluxoId}/nos`,
      dados
    );
    return response.data.dados;
  },

  async atualizarNo(fluxoId: string, noId: string, dados: AtualizarNoDTO): Promise<NoFluxo> {
    const response = await api.put<RespostaApi<NoFluxo>>(
      `/chatbot/fluxos/${fluxoId}/nos/${noId}`,
      dados
    );
    return response.data.dados;
  },

  async excluirNo(fluxoId: string, noId: string): Promise<void> {
    await api.delete(`/chatbot/fluxos/${fluxoId}/nos/${noId}`);
  },

  // ---------------------------------------------------------------------------
  // Conexões entre Nós
  // ---------------------------------------------------------------------------
  async conectarNos(fluxoId: string, dados: CriarConexaoDTO): Promise<void> {
    await api.post(`/chatbot/fluxos/${fluxoId}/nos/conectar`, dados);
  },
};
