import { z } from 'zod';

// =============================================================================
// Schemas de Request
// =============================================================================

export const entrarBodySchema = z.object({
  email: z.string().email('Email invalido'),
  senha: z.string().min(1, 'Senha obrigatoria'),
});

export const renovarBodySchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token obrigatorio'),
});

// =============================================================================
// Tipos inferidos
// =============================================================================

export type EntrarDTO = z.infer<typeof entrarBodySchema>;
export type RenovarDTO = z.infer<typeof renovarBodySchema>;

// =============================================================================
// Tipos de Resposta
// =============================================================================

export interface UsuarioAutenticado {
  id: string;
  nome: string;
  email: string;
  clienteId: string | null;
  perfil: {
    id: string;
    nome: string;
    permissoes: string[];
  };
}

export interface RespostaAutenticacao {
  accessToken: string;
  refreshToken: string;
  usuario: UsuarioAutenticado;
}

export interface RespostaUsuarioAtual {
  usuario: UsuarioAutenticado;
}
