import { z } from 'zod';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarEquipeBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  descricao: z.string().max(500).optional().nullable(),
});

export const atualizarEquipeBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100).optional(),
  descricao: z.string().max(500).optional().nullable(),
});

export const listarEquipesQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
  busca: z.string().optional(),
  ordenarPor: z.enum(['nome', 'criadoEm']).default('nome'),
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

export const adicionarMembroBodySchema = z.object({
  usuarioId: z.string().uuid('ID do usuario invalido'),
});

// =============================================================================
// Types
// =============================================================================

export type CriarEquipeDTO = z.infer<typeof criarEquipeBodySchema>;
export type AtualizarEquipeDTO = z.infer<typeof atualizarEquipeBodySchema>;
export type ListarEquipesQuery = z.infer<typeof listarEquipesQuerySchema>;
export type AdicionarMembroDTO = z.infer<typeof adicionarMembroBodySchema>;
