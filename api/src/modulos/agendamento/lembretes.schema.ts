import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Lembretes
// =============================================================================

export const criarLembreteBodySchema = z.object({
  enviarEm: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Data/hora inválida'
  ),
});

export const atualizarLembreteBodySchema = z.object({
  enviarEm: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Data/hora inválida')
    .optional(),
  enviado: z.boolean().optional(),
});

export const listarLembretesQuerySchema = paginacaoBaseSchema.extend({
  pendentes: z.coerce.boolean().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type CriarLembreteDTO = z.infer<typeof criarLembreteBodySchema>;
export type AtualizarLembreteDTO = z.infer<typeof atualizarLembreteBodySchema>;
export type ListarLembretesQuery = z.infer<typeof listarLembretesQuerySchema>;
