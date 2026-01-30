import { api } from './api';
import type {
  RespostaApi,
  RespostaPaginada,
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
// Tipos de Transicoes
// =============================================================================

interface Transicao {
  id: string;
  fluxoId: string;
  noOrigemId: string;
  noDestinoId: string;
  evento: string;
  condicao?: Record<string, unknown>;
  ordem: number;
  criadoEm: string;
}

interface CriarTransicaoDTO {
  noOrigemId: string;
  noDestinoId: string;
  evento: string;
  condicao?: Record<string, unknown>;
  ordem?: number;
}

interface SincronizarTransicoesDTO {
  transicoes: Array<{
    noOrigemId: string;
    noDestinoId: string;
    evento: string;
    condicao?: Record<string, unknown>;
  }>;
}

interface AtualizarPosicoesDTO {
  posicoes: Array<{
    id: string;
    posicaoX: number;
    posicaoY: number;
  }>;
}

interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

interface MachineDefinition {
  id: string;
  initial: string;
  context: Record<string, unknown>;
  states: Record<string, unknown>;
}

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
  // Conexões entre Nós (legado)
  // ---------------------------------------------------------------------------
  async conectarNos(fluxoId: string, dados: CriarConexaoDTO): Promise<void> {
    await api.post(`/chatbot/fluxos/${fluxoId}/nos/conectar`, dados);
  },

  // ---------------------------------------------------------------------------
  // Listar Nós do Fluxo
  // ---------------------------------------------------------------------------
  async listarNos(fluxoId: string): Promise<RespostaPaginada<NoFluxo>> {
    const response = await api.get<RespostaApi<RespostaPaginada<NoFluxo>>>(
      `/chatbot/fluxos/${fluxoId}/nos`
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Posições dos Nós
  // ---------------------------------------------------------------------------
  async atualizarPosicoes(fluxoId: string, dados: AtualizarPosicoesDTO): Promise<void> {
    await api.put(`/chatbot/fluxos/${fluxoId}/nos/posicoes`, dados);
  },

  // ---------------------------------------------------------------------------
  // Transições (XState)
  // ---------------------------------------------------------------------------
  async listarTransicoes(fluxoId: string): Promise<RespostaPaginada<Transicao>> {
    const response = await api.get<RespostaApi<RespostaPaginada<Transicao>>>(
      `/chatbot/fluxos/${fluxoId}/transicoes`
    );
    return response.data.dados;
  },

  async criarTransicao(fluxoId: string, dados: CriarTransicaoDTO): Promise<Transicao> {
    const response = await api.post<RespostaApi<Transicao>>(
      `/chatbot/fluxos/${fluxoId}/transicoes`,
      dados
    );
    return response.data.dados;
  },

  async excluirTransicao(fluxoId: string, transicaoId: string): Promise<void> {
    await api.delete(`/chatbot/fluxos/${fluxoId}/transicoes/${transicaoId}`);
  },

  async sincronizarTransicoes(
    fluxoId: string,
    dados: SincronizarTransicoesDTO
  ): Promise<{ transicoes: Transicao[] }> {
    const response = await api.post<RespostaApi<{ transicoes: Transicao[] }>>(
      `/chatbot/fluxos/${fluxoId}/transicoes/sincronizar`,
      dados
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Motor de Fluxo (XState)
  // ---------------------------------------------------------------------------
  async compilarFluxo(fluxoId: string): Promise<{ machine: MachineDefinition }> {
    const response = await api.post<RespostaApi<{ machine: MachineDefinition }>>(
      `/chatbot/fluxos/${fluxoId}/compilar`
    );
    return response.data.dados;
  },

  async obterMachine(fluxoId: string): Promise<{ machine: MachineDefinition | null }> {
    const response = await api.get<RespostaApi<{ machine: MachineDefinition | null }>>(
      `/chatbot/fluxos/${fluxoId}/machine`
    );
    return response.data.dados;
  },

  async validarFluxo(fluxoId: string): Promise<ResultadoValidacao> {
    const response = await api.get<RespostaApi<ResultadoValidacao>>(
      `/chatbot/fluxos/${fluxoId}/validar`
    );
    return response.data.dados;
  },
};
