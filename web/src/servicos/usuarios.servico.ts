import { api } from './api';
import type {
  RespostaApi,
  RespostaPaginada,
  Usuario,
  Perfil,
  Equipe,
  EquipeComMembros,
  CriarUsuarioDTO,
  AtualizarUsuarioDTO,
  CriarEquipeDTO,
  AtualizarEquipeDTO,
  AdicionarMembrosDTO,
} from '@/tipos';

// =============================================================================
// Filtros
// =============================================================================

interface FiltrosUsuario {
  busca?: string;
  perfilId?: string;
  equipeId?: string;
  ativo?: boolean;
  pagina?: number;
  limite?: number;
}

// =============================================================================
// Serviço de Usuários
// =============================================================================

export const usuariosServico = {
  // ---------------------------------------------------------------------------
  // Listar Usuários
  // ---------------------------------------------------------------------------
  async listar(filtros?: FiltrosUsuario): Promise<RespostaPaginada<Usuario>> {
    const response = await api.get<RespostaPaginada<Usuario>>('/usuarios', {
      params: filtros,
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Obter Usuário por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Usuario> {
    const response = await api.get<RespostaApi<Usuario>>(`/usuarios/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Usuário
  // ---------------------------------------------------------------------------
  async criar(dados: CriarUsuarioDTO): Promise<Usuario> {
    const response = await api.post<RespostaApi<Usuario>>('/usuarios', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Usuário
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarUsuarioDTO): Promise<Usuario> {
    const response = await api.put<RespostaApi<Usuario>>(`/usuarios/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Usuário
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/usuarios/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Ativar/Desativar Usuário
  // ---------------------------------------------------------------------------
  async alterarStatus(id: string, ativo: boolean): Promise<Usuario> {
    const response = await api.patch<RespostaApi<Usuario>>(`/usuarios/${id}/status`, {
      ativo,
    });
    return response.data.dados;
  },
};

// =============================================================================
// Serviço de Perfis
// =============================================================================

export const perfisServico = {
  // ---------------------------------------------------------------------------
  // Listar Perfis
  // ---------------------------------------------------------------------------
  async listar(): Promise<Perfil[]> {
    const response = await api.get<RespostaApi<Perfil[]>>('/perfis');
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Obter Perfil por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Perfil> {
    const response = await api.get<RespostaApi<Perfil>>(`/perfis/${id}`);
    return response.data.dados;
  },
};

// =============================================================================
// Serviço de Equipes
// =============================================================================

export const equipesServico = {
  // ---------------------------------------------------------------------------
  // Listar Equipes
  // ---------------------------------------------------------------------------
  async listar(): Promise<Equipe[]> {
    const response = await api.get<RespostaApi<Equipe[]>>('/equipes');
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Obter Equipe por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<EquipeComMembros> {
    const response = await api.get<RespostaApi<EquipeComMembros>>(`/equipes/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Equipe
  // ---------------------------------------------------------------------------
  async criar(dados: CriarEquipeDTO): Promise<Equipe> {
    const response = await api.post<RespostaApi<Equipe>>('/equipes', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Equipe
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarEquipeDTO): Promise<Equipe> {
    const response = await api.put<RespostaApi<Equipe>>(`/equipes/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Equipe
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/equipes/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Adicionar Membros
  // ---------------------------------------------------------------------------
  async adicionarMembros(id: string, dados: AdicionarMembrosDTO): Promise<void> {
    await api.post(`/equipes/${id}/membros`, dados);
  },

  // ---------------------------------------------------------------------------
  // Remover Membro
  // ---------------------------------------------------------------------------
  async removerMembro(equipeId: string, usuarioId: string): Promise<void> {
    await api.delete(`/equipes/${equipeId}/membros/${usuarioId}`);
  },
};
