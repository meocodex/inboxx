import { z } from 'zod';

// =============================================================================
// Schemas de Quadros Kanban
// =============================================================================

// Schema para criar quadro
export const criarQuadroBodySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
});

// Schema para atualizar quadro
export const atualizarQuadroBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(500).nullable().optional(),
});

// Schema para listar quadros
export const listarQuadrosQuerySchema = z.object({
  pagina: z.coerce.number().min(1).default(1),
  limite: z.coerce.number().min(1).max(100).default(20),
  busca: z.string().optional(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type CriarQuadroDTO = z.infer<typeof criarQuadroBodySchema>;
export type AtualizarQuadroDTO = z.infer<typeof atualizarQuadroBodySchema>;
export type ListarQuadrosQuery = z.infer<typeof listarQuadrosQuerySchema>;
