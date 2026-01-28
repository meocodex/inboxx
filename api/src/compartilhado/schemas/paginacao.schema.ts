import { z } from 'zod';

// =============================================================================
// Schema Base de Paginacao
// =============================================================================

export const paginacaoBaseSchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
});

export const paginacaoComBuscaSchema = paginacaoBaseSchema.extend({
  busca: z.string().optional(),
});

export const paginacaoComOrdenacaoSchema = paginacaoComBuscaSchema.extend({
  ordem: z.enum(['asc', 'desc']).default('asc'),
});

// =============================================================================
// Tipos
// =============================================================================

export type PaginacaoBase = z.infer<typeof paginacaoBaseSchema>;
export type PaginacaoComBusca = z.infer<typeof paginacaoComBuscaSchema>;
export type PaginacaoComOrdenacao = z.infer<typeof paginacaoComOrdenacaoSchema>;
