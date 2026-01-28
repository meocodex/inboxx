import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Nós do Chatbot
// =============================================================================

// Tipos de nós disponíveis
export const tipoNoEnum = z.enum([
  'INICIO',
  'MENSAGEM',
  'PERGUNTA',
  'CONDICAO',
  'DELAY',
  'WEBHOOK',
  'ATRIBUIR_TAG',
  'TRANSFERIR_HUMANO',
  'FIM',
]);

// Configuração específica por tipo de nó
export const configuracaoNoSchema = z.record(z.unknown());

// Schema para criar nó
export const criarNoBodySchema = z.object({
  tipo: tipoNoEnum,
  nome: z.string().max(100).optional(),
  configuracao: configuracaoNoSchema,
  posicaoX: z.number().int().default(0),
  posicaoY: z.number().int().default(0),
  proximoNoId: z.string().uuid().nullable().optional(),
});

// Schema para atualizar nó
export const atualizarNoBodySchema = z.object({
  tipo: tipoNoEnum.optional(),
  nome: z.string().max(100).nullable().optional(),
  configuracao: configuracaoNoSchema.optional(),
  posicaoX: z.number().int().optional(),
  posicaoY: z.number().int().optional(),
  proximoNoId: z.string().uuid().nullable().optional(),
});

// Schema para listar nós de um fluxo
export const listarNosQuerySchema = paginacaoBaseSchema.extend({
  limite: z.coerce.number().int().positive().max(100).default(50),
});

// Schema para atualizar posições em lote
export const atualizarPosicoesBodySchema = z.object({
  nos: z.array(
    z.object({
      id: z.string().uuid(),
      posicaoX: z.number().int(),
      posicaoY: z.number().int(),
    })
  ),
});

// Schema para conectar nós
export const conectarNosBodySchema = z.object({
  origemId: z.string().uuid(),
  destinoId: z.string().uuid().nullable(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type TipoNo = z.infer<typeof tipoNoEnum>;
export type CriarNoDTO = z.infer<typeof criarNoBodySchema>;
export type AtualizarNoDTO = z.infer<typeof atualizarNoBodySchema>;
export type ListarNosQuery = z.infer<typeof listarNosQuerySchema>;
export type AtualizarPosicoesDTO = z.infer<typeof atualizarPosicoesBodySchema>;
export type ConectarNosDTO = z.infer<typeof conectarNosBodySchema>;
