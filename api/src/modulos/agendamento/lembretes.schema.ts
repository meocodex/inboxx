import { z } from 'zod';

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

export const listarLembretesQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  pendentes: z.coerce.boolean().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type CriarLembreteDTO = z.infer<typeof criarLembreteBodySchema>;
export type AtualizarLembreteDTO = z.infer<typeof atualizarLembreteBodySchema>;
export type ListarLembretesQuery = z.infer<typeof listarLembretesQuerySchema>;
