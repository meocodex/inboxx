import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarEtiquetaBodySchema = z.object({
  nome: z.string().min(1, 'Nome obrigatorio').max(50),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um codigo hexadecimal valido (ex: #3B82F6)')
    .default('#3B82F6'),
});

export const atualizarEtiquetaBodySchema = z.object({
  nome: z.string().min(1).max(50).optional(),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um codigo hexadecimal valido')
    .optional(),
});

export const listarEtiquetasQuerySchema = paginacaoComBuscaSchema.extend({
  limite: z.coerce.number().int().positive().max(100).default(50),
});

// =============================================================================
// Types
// =============================================================================

export type CriarEtiquetaDTO = z.infer<typeof criarEtiquetaBodySchema>;
export type AtualizarEtiquetaDTO = z.infer<typeof atualizarEtiquetaBodySchema>;
export type ListarEtiquetasQuery = z.infer<typeof listarEtiquetasQuerySchema>;
