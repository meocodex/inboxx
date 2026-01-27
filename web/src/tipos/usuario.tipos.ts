// =============================================================================
// Tipos de Usuário e Autenticação
// =============================================================================

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  clienteId: string;
  perfilId: string;
  equipeId?: string | null;
  perfil: Perfil;
  equipe?: Equipe | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioResumo {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
}

export interface Perfil {
  id: string;
  nome: string;
  permissoes: string[];
}

export interface Equipe {
  id: string;
  nome: string;
  descricao?: string | null;
}

export interface EquipeComMembros extends Equipe {
  membros: UsuarioResumo[];
}

// =============================================================================
// DTOs de Autenticação
// =============================================================================

export interface LoginDTO {
  email: string;
  senha: string;
}

export interface RespostaLogin {
  accessToken: string;
  refreshToken: string;
  usuario: Usuario;
}

export interface RefreshTokenDTO {
  refreshToken: string;
}

// =============================================================================
// DTOs de Usuário
// =============================================================================

export interface CriarUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  perfilId: string;
  equipeId?: string;
}

export interface AtualizarUsuarioDTO {
  nome?: string;
  email?: string;
  senha?: string;
  perfilId?: string;
  equipeId?: string;
  ativo?: boolean;
}

// =============================================================================
// DTOs de Equipe
// =============================================================================

export interface CriarEquipeDTO {
  nome: string;
  descricao?: string;
}

export interface AtualizarEquipeDTO {
  nome?: string;
  descricao?: string;
}

export interface AdicionarMembrosDTO {
  usuarioIds: string[];
}
