import { z } from 'zod';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarNotaInternaBodySchema = z.object({
  texto: z.string().min(1, 'Texto obrigatorio').max(2000),
});

export const listarNotasInternasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

// =============================================================================
// Types
// =============================================================================

export type CriarNotaInternaDTO = z.infer<typeof criarNotaInternaBodySchema>;
export type ListarNotasInternasQuery = z.infer<typeof listarNotasInternasQuerySchema>;
