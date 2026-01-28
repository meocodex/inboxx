import { z } from 'zod';
import { paginacaoBaseSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Mensagens Agendadas
// =============================================================================

// Status da mensagem agendada
export const statusMensagemAgendadaEnum = z.enum([
  'PENDENTE',
  'ENVIADA',
  'CANCELADA',
  'ERRO',
]);

// Schema para criar mensagem agendada
export const criarMensagemAgendadaBodySchema = z.object({
  contatoId: z.string().uuid(),
  conexaoId: z.string().uuid(),
  conteudo: z.string().min(1, 'Conteúdo é obrigatório').max(4000),
  midiaUrl: z.string().url().optional(),
  agendarPara: z.string().datetime(),
});

// Schema para atualizar mensagem agendada
export const atualizarMensagemAgendadaBodySchema = z.object({
  conteudo: z.string().min(1).max(4000).optional(),
  midiaUrl: z.string().url().nullable().optional(),
  agendarPara: z.string().datetime().optional(),
});

// Schema para listar mensagens agendadas
export const listarMensagensAgendadasQuerySchema = paginacaoBaseSchema.extend({
  status: statusMensagemAgendadaEnum.optional(),
  contatoId: z.string().uuid().optional(),
  dataInicio: z.string().datetime().optional(),
  dataFim: z.string().datetime().optional(),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type StatusMensagemAgendada = z.infer<typeof statusMensagemAgendadaEnum>;
export type CriarMensagemAgendadaDTO = z.infer<typeof criarMensagemAgendadaBodySchema>;
export type AtualizarMensagemAgendadaDTO = z.infer<typeof atualizarMensagemAgendadaBodySchema>;
export type ListarMensagensAgendadasQuery = z.infer<typeof listarMensagensAgendadasQuerySchema>;
