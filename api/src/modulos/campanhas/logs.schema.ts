import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Logs de Campanha
// =============================================================================

// Status de envio
export const statusEnvioEnum = z.enum([
  'PENDENTE',
  'ENVIADO',
  'ENTREGUE',
  'LIDO',
  'ERRO',
]);

// Schema para listar logs
export const listarLogsQuerySchema = paginacaoBaseSchema.extend({
  limite: z.coerce.number().int().positive().max(100).default(50),
  status: statusEnvioEnum.optional(),
});

// Schema para atualizar status do log
export const atualizarStatusLogBodySchema = z.object({
  status: statusEnvioEnum,
  erro: z.string().max(500).optional(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type StatusEnvio = z.infer<typeof statusEnvioEnum>;
export type ListarLogsQuery = z.infer<typeof listarLogsQuerySchema>;
export type AtualizarStatusLogDTO = z.infer<typeof atualizarStatusLogBodySchema>;
