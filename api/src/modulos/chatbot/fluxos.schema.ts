import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Fluxos de Chatbot
// =============================================================================

// Tipos de gatilho
export const gatilhoSchema = z.object({
  tipo: z.enum(['PALAVRA_CHAVE', 'PRIMEIRA_MENSAGEM', 'HORARIO', 'ETIQUETA']),
  valor: z.string().optional(),
  configuracao: z.record(z.unknown()).optional(),
});

// Schema para criar fluxo
export const criarFluxoBodySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(100),
  descricao: z.string().max(500).optional(),
  gatilho: gatilhoSchema,
  ativo: z.boolean().optional().default(false),
});

// Schema para atualizar fluxo
export const atualizarFluxoBodySchema = z.object({
  nome: z.string().min(1).max(100).optional(),
  descricao: z.string().max(500).nullable().optional(),
  gatilho: gatilhoSchema.optional(),
  ativo: z.boolean().optional(),
});

// Schema para listar fluxos
export const listarFluxosQuerySchema = paginacaoComBuscaSchema.extend({
  ativo: z.coerce.boolean().optional(),
});

// Schema para duplicar fluxo
export const duplicarFluxoBodySchema = z.object({
  novoNome: z.string().min(1, 'Nome é obrigatório').max(100),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type GatilhoDTO = z.infer<typeof gatilhoSchema>;
export type CriarFluxoDTO = z.infer<typeof criarFluxoBodySchema>;
export type AtualizarFluxoDTO = z.infer<typeof atualizarFluxoBodySchema>;
export type ListarFluxosQuery = z.infer<typeof listarFluxosQuerySchema>;
export type DuplicarFluxoDTO = z.infer<typeof duplicarFluxoBodySchema>;
