import { api } from './api';
import type {
  RespostaApi,
  Quadro,
  QuadroResumo,
  Coluna,
  Cartao,
  CriarQuadroDTO,
  AtualizarQuadroDTO,
  CriarColunaDTO,
  CriarCartaoDTO,
  AtualizarCartaoDTO,
  MoverCartaoDTO,
} from '@/tipos';

// =============================================================================
// Serviço de Kanban - Quadros
// =============================================================================

export const kanbanServico = {
  // ---------------------------------------------------------------------------
  // Quadros
  // ---------------------------------------------------------------------------
  async listarQuadros(): Promise<QuadroResumo[]> {
    const response = await api.get<RespostaApi<QuadroResumo[]>>('/kanban/quadros');
    return response.data.dados;
  },

  async obterQuadro(id: string): Promise<Quadro> {
    const response = await api.get<RespostaApi<Quadro>>(`/kanban/quadros/${id}`);
    return response.data.dados;
  },

  async criarQuadro(dados: CriarQuadroDTO): Promise<Quadro> {
    const response = await api.post<RespostaApi<Quadro>>('/kanban/quadros', dados);
    return response.data.dados;
  },

  async atualizarQuadro(id: string, dados: AtualizarQuadroDTO): Promise<Quadro> {
    const response = await api.put<RespostaApi<Quadro>>(`/kanban/quadros/${id}`, dados);
    return response.data.dados;
  },

  async excluirQuadro(id: string): Promise<void> {
    await api.delete(`/kanban/quadros/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Colunas
  // ---------------------------------------------------------------------------
  async criarColuna(quadroId: string, dados: CriarColunaDTO): Promise<Coluna> {
    const response = await api.post<RespostaApi<Coluna>>(
      `/kanban/quadros/${quadroId}/colunas`,
      dados
    );
    return response.data.dados;
  },

  async atualizarColuna(colunaId: string, dados: Partial<CriarColunaDTO>): Promise<Coluna> {
    const response = await api.put<RespostaApi<Coluna>>(
      `/kanban/colunas/${colunaId}`,
      dados
    );
    return response.data.dados;
  },

  async excluirColuna(colunaId: string): Promise<void> {
    await api.delete(`/kanban/colunas/${colunaId}`);
  },

  // ---------------------------------------------------------------------------
  // Cartões
  // ---------------------------------------------------------------------------
  async criarCartao(colunaId: string, dados: CriarCartaoDTO): Promise<Cartao> {
    const response = await api.post<RespostaApi<Cartao>>(
      `/kanban/colunas/${colunaId}/cartoes`,
      dados
    );
    return response.data.dados;
  },

  async atualizarCartao(cartaoId: string, dados: AtualizarCartaoDTO): Promise<Cartao> {
    const response = await api.put<RespostaApi<Cartao>>(
      `/kanban/cartoes/${cartaoId}`,
      dados
    );
    return response.data.dados;
  },

  async moverCartao(cartaoId: string, dados: MoverCartaoDTO): Promise<Cartao> {
    const response = await api.post<RespostaApi<Cartao>>(
      `/kanban/cartoes/${cartaoId}/mover`,
      dados
    );
    return response.data.dados;
  },

  async excluirCartao(cartaoId: string): Promise<void> {
    await api.delete(`/kanban/cartoes/${cartaoId}`);
  },
};
