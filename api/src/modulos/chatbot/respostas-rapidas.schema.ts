import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Respostas Rápidas
// =============================================================================

// Schema para criar resposta rápida
export const criarRespostaRapidaBodySchema = z.object({
  titulo: z.string().min(1, 'Título é obrigatório').max(100),
  atalho: z
    .string()
    .min(1, 'Atalho é obrigatório')
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Atalho deve conter apenas letras minúsculas, números, _ ou -'),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').max(4000),
  categoria: z.string().max(50).optional(),
  anexoUrl: z.string().url().optional(),
});

// Schema para atualizar resposta rápida
export const atualizarRespostaRapidaBodySchema = z.object({
  titulo: z.string().min(1).max(100).optional(),
  atalho: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, 'Atalho deve conter apenas letras minúsculas, números, _ ou -')
    .optional(),
  conteudo: z.string().min(1).max(4000).optional(),
  categoria: z.string().max(50).nullable().optional(),
  anexoUrl: z.string().url().nullable().optional(),
});

// Schema para listar respostas rápidas
export const listarRespostasRapidasQuerySchema = paginacaoComBuscaSchema.extend({
  categoria: z.string().optional(),
});

// Schema para buscar por atalho
export const buscarPorAtalhoQuerySchema = z.object({
  atalho: z.string().min(1),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type CriarRespostaRapidaDTO = z.infer<typeof criarRespostaRapidaBodySchema>;
export type AtualizarRespostaRapidaDTO = z.infer<typeof atualizarRespostaRapidaBodySchema>;
export type ListarRespostasRapidasQuery = z.infer<typeof listarRespostasRapidasQuerySchema>;
export type BuscarPorAtalhoQuery = z.infer<typeof buscarPorAtalhoQuerySchema>;
