import { z } from 'zod';
import { paginacaoComBuscaSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Enums
// =============================================================================

export const CanalConexao = {
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
} as const;

export const ProvedorConexao = {
  META_API: 'META_API',
  UAIZAP: 'UAIZAP',
  GRAPH_API: 'GRAPH_API',
} as const;

export const StatusConexao = {
  CONECTADO: 'CONECTADO',
  DESCONECTADO: 'DESCONECTADO',
  RECONECTANDO: 'RECONECTANDO',
  ERRO: 'ERRO',
} as const;

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarConexaoBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  provedor: z.enum(['META_API', 'UAIZAP', 'GRAPH_API']),
  credenciais: z.object({
    token: z.string().optional(),
    phoneNumberId: z.string().optional(),
    businessAccountId: z.string().optional(),
    apiKey: z.string().optional(),
    webhookSecret: z.string().optional(),
  }),
  configuracoes: z
    .object({
      webhookUrl: z.string().url().optional(),
      mensagemBoasVindas: z.string().optional(),
      horarioAtendimento: z
        .object({
          inicio: z.string().optional(),
          fim: z.string().optional(),
          diasSemana: z.array(z.number().min(0).max(6)).optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

export const atualizarConexaoBodySchema = z.object({
  nome: z.string().min(2).max(100).optional(),
  credenciais: z
    .object({
      token: z.string().optional(),
      phoneNumberId: z.string().optional(),
      businessAccountId: z.string().optional(),
      apiKey: z.string().optional(),
      webhookSecret: z.string().optional(),
    })
    .optional(),
  configuracoes: z
    .object({
      webhookUrl: z.string().url().optional(),
      mensagemBoasVindas: z.string().optional(),
      horarioAtendimento: z
        .object({
          inicio: z.string().optional(),
          fim: z.string().optional(),
          diasSemana: z.array(z.number().min(0).max(6)).optional(),
        })
        .optional(),
    })
    .optional()
    .nullable(),
});

export const listarConexoesQuerySchema = paginacaoComBuscaSchema.extend({
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']).optional(),
  status: z.enum(['CONECTADO', 'DESCONECTADO', 'RECONECTANDO', 'ERRO']).optional(),
});

export const atualizarStatusBodySchema = z.object({
  status: z.enum(['CONECTADO', 'DESCONECTADO', 'RECONECTANDO', 'ERRO']),
});

// =============================================================================
// Types
// =============================================================================

export type CriarConexaoDTO = z.infer<typeof criarConexaoBodySchema>;
export type AtualizarConexaoDTO = z.infer<typeof atualizarConexaoBodySchema>;
export type ListarConexoesQuery = z.infer<typeof listarConexoesQuerySchema>;
export type AtualizarStatusDTO = z.infer<typeof atualizarStatusBodySchema>;
