import { api } from './api';
import type { RespostaApi } from '@/tipos';
import type {
  CanalConexao,
  CanalConexaoResumo,
  CriarCanalConexaoDTO,
  AtualizarCanalConexaoDTO,
  FiltrosCanalConexao,
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
  // Criar Conexão
  // ---------------------------------------------------------------------------
  async criar(dados: CriarCanalConexaoDTO): Promise<CanalConexao> {
    const response = await api.post<RespostaApi<CanalConexao>>('/conexoes', dados);
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
  // Conectar (Gerar QR Code)
  // ---------------------------------------------------------------------------
  async conectar(id: string): Promise<{ qrCode?: string }> {
    const response = await api.post<RespostaApi<{ qrCode?: string }>>(
      `/conexoes/${id}/conectar`
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Desconectar
  // ---------------------------------------------------------------------------
  async desconectar(id: string): Promise<void> {
    await api.post(`/conexoes/${id}/desconectar`);
  },

  // ---------------------------------------------------------------------------
  // Sincronizar
  // ---------------------------------------------------------------------------
  async sincronizar(id: string): Promise<void> {
    await api.post(`/conexoes/${id}/sincronizar`);
  },

  // ---------------------------------------------------------------------------
  // Verificar Status
  // ---------------------------------------------------------------------------
  async verificarStatus(id: string): Promise<{ status: string; conectado: boolean }> {
    const response = await api.get<RespostaApi<{ status: string; conectado: boolean }>>(
      `/conexoes/${id}/status`
    );
    return response.data.dados;
  },
};
