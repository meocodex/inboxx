import { z } from 'zod';

// =============================================================================
// Schemas de Relatórios
// =============================================================================

export const periodoQuerySchema = z.object({
  dataInicio: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Data de início inválida'
  ),
  dataFim: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Data de fim inválida'
  ),
});

export const relatorioConversasQuerySchema = periodoQuerySchema.extend({
  conexaoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  equipeId: z.string().uuid().optional(),
});

export const relatorioCampanhasQuerySchema = periodoQuerySchema.extend({
  status: z
    .enum(['RASCUNHO', 'AGENDADA', 'EM_ANDAMENTO', 'PAUSADA', 'CONCLUIDA', 'CANCELADA'])
    .optional(),
});

export const relatorioKanbanQuerySchema = z.object({
  quadroId: z.string().uuid().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type PeriodoQuery = z.infer<typeof periodoQuerySchema>;
export type RelatorioConversasQuery = z.infer<typeof relatorioConversasQuerySchema>;
export type RelatorioCampanhasQuery = z.infer<typeof relatorioCampanhasQuerySchema>;
export type RelatorioKanbanQuery = z.infer<typeof relatorioKanbanQuerySchema>;
