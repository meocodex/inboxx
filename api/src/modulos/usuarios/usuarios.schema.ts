import { z } from 'zod';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarUsuarioBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email invalido'),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  perfilId: z.string().uuid('ID do perfil invalido'),
  equipeId: z.string().uuid('ID da equipe invalido').optional().nullable(),
  avatarUrl: z.string().url('URL do avatar invalida').optional().nullable(),
  ativo: z.boolean().default(true),
});

export const atualizarUsuarioBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
  email: z.string().email('Email invalido').optional(),
  senha: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  perfilId: z.string().uuid('ID do perfil invalido').optional(),
  equipeId: z.string().uuid('ID da equipe invalido').optional().nullable(),
  avatarUrl: z.string().url('URL do avatar invalida').optional().nullable(),
  ativo: z.boolean().optional(),
});

export const listarUsuariosQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
  busca: z.string().optional(),
  perfilId: z.string().uuid().optional(),
  equipeId: z.string().uuid().optional(),
  ativo: z.coerce.boolean().optional(),
  ordenarPor: z.enum(['nome', 'email', 'criadoEm', 'ultimoAcesso']).default('nome'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// Types
// =============================================================================

export type CriarUsuarioDTO = z.infer<typeof criarUsuarioBodySchema>;
export type AtualizarUsuarioDTO = z.infer<typeof atualizarUsuarioBodySchema>;
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>;
