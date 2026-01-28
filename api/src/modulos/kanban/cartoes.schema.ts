import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Cartões Kanban
// =============================================================================

// Schema para criar cartão
export const criarCartaoBodySchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  descricao: z.string().max(2000).optional(),
  contatoId: z.string().uuid().optional(),
  valor: z.number().min(0).optional(),
  dataLimite: z.string().datetime().optional(),
  ordem: z.number().int().min(0).optional(),
});

// Schema para atualizar cartão
export const atualizarCartaoBodySchema = z.object({
  titulo: z.string().min(1).max(200).optional(),
  descricao: z.string().max(2000).nullable().optional(),
  contatoId: z.string().uuid().nullable().optional(),
  valor: z.number().min(0).nullable().optional(),
  dataLimite: z.string().datetime().nullable().optional(),
  ordem: z.number().int().min(0).optional(),
});

// Schema para mover cartão
export const moverCartaoBodySchema = z.object({
  colunaDestinoId: z.string().uuid(),
  ordem: z.number().int().min(0).optional(),
});

// Schema para listar cartões
export const listarCartoesQuerySchema = paginacaoComBuscaSchema.extend({
  limite: z.coerce.number().int().positive().max(100).default(50),
  contatoId: z.string().uuid().optional(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type CriarCartaoDTO = z.infer<typeof criarCartaoBodySchema>;
export type AtualizarCartaoDTO = z.infer<typeof atualizarCartaoBodySchema>;
export type MoverCartaoDTO = z.infer<typeof moverCartaoBodySchema>;
export type ListarCartoesQuery = z.infer<typeof listarCartoesQuerySchema>;
