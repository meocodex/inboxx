import { api } from './api';
import type {
  RespostaApi,
  RespostaPaginada,
  Contato,
  Etiqueta,
  FiltrosContato,
  CriarContatoDTO,
  AtualizarContatoDTO,
  CriarEtiquetaDTO,
} from '@/tipos';

// =============================================================================
// Serviço de Contatos
// =============================================================================

export const contatosServico = {
  // ---------------------------------------------------------------------------
  // Listar Contatos
  // ---------------------------------------------------------------------------
  async listar(filtros?: FiltrosContato): Promise<RespostaPaginada<Contato>> {
    const response = await api.get<RespostaPaginada<Contato>>('/contatos', {
      params: filtros,
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Obter Contato por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Contato> {
    const response = await api.get<RespostaApi<Contato>>(`/contatos/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Contato
  // ---------------------------------------------------------------------------
  async criar(dados: CriarContatoDTO): Promise<Contato> {
    const response = await api.post<RespostaApi<Contato>>('/contatos', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Contato
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarContatoDTO): Promise<Contato> {
    const response = await api.put<RespostaApi<Contato>>(`/contatos/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Contato
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/contatos/${id}`);
  },
};

// =============================================================================
// Serviço de Etiquetas
// =============================================================================

export const etiquetasServico = {
  // ---------------------------------------------------------------------------
  // Listar Etiquetas
  // ---------------------------------------------------------------------------
  async listar(): Promise<Etiqueta[]> {
    const response = await api.get<RespostaApi<Etiqueta[]>>('/etiquetas');
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Etiqueta
  // ---------------------------------------------------------------------------
  async criar(dados: CriarEtiquetaDTO): Promise<Etiqueta> {
    const response = await api.post<RespostaApi<Etiqueta>>('/etiquetas', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Etiqueta
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: Partial<CriarEtiquetaDTO>): Promise<Etiqueta> {
    const response = await api.put<RespostaApi<Etiqueta>>(`/etiquetas/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Etiqueta
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/etiquetas/${id}`);
  },
};
