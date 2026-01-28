import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Campanhas
// =============================================================================

// Status de campanha
export const statusCampanhaEnum = z.enum([
  'RASCUNHO',
  'AGENDADA',
  'EM_ANDAMENTO',
  'PAUSADA',
  'CONCLUIDA',
  'CANCELADA',
]);

// Schema para criar campanha
export const criarCampanhaBodySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  template: z.string().min(1, 'Template é obrigatório').max(4000),
  midiaUrl: z.string().url().optional(),
  filtros: z
    .object({
      etiquetas: z.array(z.string().uuid()).optional(),
      excluirEtiquetas: z.array(z.string().uuid()).optional(),
      criadoApos: z.string().datetime().optional(),
      criadoAntes: z.string().datetime().optional(),
    })
    .optional(),
  agendadoPara: z.string().datetime().optional(),
  intervaloMs: z.number().int().min(1000).max(60000).default(3000),
});

// Schema para atualizar campanha
export const atualizarCampanhaBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  template: z.string().min(1).max(4000).optional(),
  midiaUrl: z.string().url().nullable().optional(),
  filtros: z
    .object({
      etiquetas: z.array(z.string().uuid()).optional(),
      excluirEtiquetas: z.array(z.string().uuid()).optional(),
      criadoApos: z.string().datetime().optional(),
      criadoAntes: z.string().datetime().optional(),
    })
    .nullable()
    .optional(),
  agendadoPara: z.string().datetime().nullable().optional(),
  intervaloMs: z.number().int().min(1000).max(60000).optional(),
});

// Schema para listar campanhas
export const listarCampanhasQuerySchema = paginacaoComBuscaSchema.extend({
  status: statusCampanhaEnum.optional(),
});

// Schema para agendar campanha
export const agendarCampanhaBodySchema = z.object({
  agendadoPara: z.string().datetime(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type StatusCampanha = z.infer<typeof statusCampanhaEnum>;
export type CriarCampanhaDTO = z.infer<typeof criarCampanhaBodySchema>;
export type AtualizarCampanhaDTO = z.infer<typeof atualizarCampanhaBodySchema>;
export type ListarCampanhasQuery = z.infer<typeof listarCampanhasQuerySchema>;
export type AgendarCampanhaDTO = z.infer<typeof agendarCampanhaBodySchema>;
