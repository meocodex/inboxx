import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarNotaInternaBodySchema = z.object({
  texto: z.string().min(1, 'Texto obrigatorio').max(2000),
});

export const listarNotasInternasQuerySchema = paginacaoBaseSchema.extend({});

// =============================================================================
// Types
// =============================================================================

export type CriarNotaInternaDTO = z.infer<typeof criarNotaInternaBodySchema>;
export type ListarNotasInternasQuery = z.infer<typeof listarNotasInternasQuerySchema>;
