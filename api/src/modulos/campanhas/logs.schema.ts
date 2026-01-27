import { z } from 'zod';

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
export const listarLogsQuerySchema = z.object({
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(50),
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
