import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Enums
// =============================================================================

export const DirecaoMensagem = {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
} as const;

export const TipoMensagem = {
  TEXTO: 'TEXTO',
  IMAGEM: 'IMAGEM',
  AUDIO: 'AUDIO',
  VIDEO: 'VIDEO',
  DOCUMENTO: 'DOCUMENTO',
  LOCALIZACAO: 'LOCALIZACAO',
  CONTATO: 'CONTATO',
  STICKER: 'STICKER',
  REACAO: 'REACAO',
} as const;

export const StatusMensagem = {
  PENDENTE: 'PENDENTE',
  ENVIADA: 'ENVIADA',
  ENTREGUE: 'ENTREGUE',
  LIDA: 'LIDA',
  ERRO: 'ERRO',
} as const;

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const enviarMensagemBodySchema = z.object({
  conversaId: z.string().uuid('ID da conversa invalido'),
  tipo: z.enum(['TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'LOCALIZACAO', 'CONTATO']),
  conteudo: z.string().optional(),
  midiaUrl: z.string().url('URL de midia invalida').optional(),
  midiaTipo: z.string().optional(),
  midiaNome: z.string().optional(),
});

export const listarMensagensQuerySchema = paginacaoBaseSchema.extend({
  limite: z.coerce.number().int().positive().max(100).default(50),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

export const atualizarStatusMensagemBodySchema = z.object({
  status: z.enum(['ENVIADA', 'ENTREGUE', 'LIDA', 'ERRO']),
  idExterno: z.string().optional(),
});

export const receberMensagemWebhookSchema = z.object({
  idExterno: z.string(),
  conexaoId: z.string().uuid(),
  telefoneRemetente: z.string(),
  tipo: z.enum(['TEXTO', 'IMAGEM', 'AUDIO', 'VIDEO', 'DOCUMENTO', 'LOCALIZACAO', 'CONTATO', 'STICKER', 'REACAO']),
  conteudo: z.string().optional(),
  midiaUrl: z.string().url().optional(),
  midiaTipo: z.string().optional(),
  midiaNome: z.string().optional(),
  timestamp: z.coerce.date().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type EnviarMensagemDTO = z.infer<typeof enviarMensagemBodySchema>;
export type ListarMensagensQuery = z.infer<typeof listarMensagensQuerySchema>;
export type AtualizarStatusMensagemDTO = z.infer<typeof atualizarStatusMensagemBodySchema>;
export type ReceberMensagemWebhookDTO = z.infer<typeof receberMensagemWebhookSchema>;
