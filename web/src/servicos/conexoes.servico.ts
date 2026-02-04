import { api } from './api';
import type { RespostaApi } from '@/tipos';
import type {
  CanalConexao,
  CanalConexaoResumo,
  CriarCanalConexaoDTO,
  AtualizarCanalConexaoDTO,
  FiltrosCanalConexao,
  CriarConexaoResposta,
  TestarConexaoResposta,
  ObterQRCodeResposta,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Serviço de Conexões
// =============================================================================

export const conexoesServico = {
  // ---------------------------------------------------------------------------
  // Listar Conexões
  // ---------------------------------------------------------------------------
  async listar(filtros?: FiltrosCanalConexao): Promise<CanalConexaoResumo[]> {
    const response = await api.get<RespostaApi<CanalConexaoResumo[]>>('/conexoes', {
      params: filtros,
    });
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Obter Conexão por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<CanalConexao> {
    const response = await api.get<RespostaApi<CanalConexao>>(`/conexoes/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Conexão (retorna QR Code se UaiZap)
  // ---------------------------------------------------------------------------
  async criar(dados: CriarCanalConexaoDTO): Promise<CriarConexaoResposta> {
    const response = await api.post<RespostaApi<CriarConexaoResposta>>('/conexoes', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Conexão
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarCanalConexaoDTO): Promise<CanalConexao> {
    const response = await api.put<RespostaApi<CanalConexao>>(`/conexoes/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Conexão
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/conexoes/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Testar Conexão
  // ---------------------------------------------------------------------------
  async testar(id: string): Promise<TestarConexaoResposta> {
    const response = await api.post<RespostaApi<TestarConexaoResposta>>(
      `/conexoes/${id}/testar`
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Status (ativar/desativar)
  // ---------------------------------------------------------------------------
  async atualizarStatus(id: string, ativo: boolean): Promise<void> {
    await api.patch(`/conexoes/${id}/status`, { ativo });
  },

  // ---------------------------------------------------------------------------
  // Obter QR Code (UaiZap)
  // ---------------------------------------------------------------------------
  async obterQRCode(id: string): Promise<ObterQRCodeResposta> {
    const response = await api.get<RespostaApi<ObterQRCodeResposta>>(`/conexoes/${id}/qrcode`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Reconectar (UaiZap)
  // ---------------------------------------------------------------------------
  async reconectar(id: string): Promise<RespostaApi<void>> {
    const response = await api.post<RespostaApi<void>>(`/conexoes/${id}/reconectar`);
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Desconectar (UaiZap)
  // ---------------------------------------------------------------------------
  async desconectar(id: string): Promise<RespostaApi<void>> {
    const response = await api.post<RespostaApi<void>>(`/conexoes/${id}/desconectar`);
    return response.data;
  },
};
