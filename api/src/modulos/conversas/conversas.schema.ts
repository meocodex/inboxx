import { z } from 'zod';

// =============================================================================
// Enums
// =============================================================================

export const StatusConversa = {
  ABERTA: 'ABERTA',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  AGUARDANDO: 'AGUARDANDO',
  RESOLVIDA: 'RESOLVIDA',
  ARQUIVADA: 'ARQUIVADA',
} as const;

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarConversaBodySchema = z.object({
  contatoId: z.string().uuid('ID do contato invalido'),
  conexaoId: z.string().uuid('ID da conexao invalido'),
  usuarioId: z.string().uuid('ID do usuario invalido').optional().nullable(),
  equipeId: z.string().uuid('ID da equipe invalido').optional().nullable(),
});

export const atualizarConversaBodySchema = z.object({
  usuarioId: z.string().uuid('ID do usuario invalido').optional().nullable(),
  equipeId: z.string().uuid('ID da equipe invalido').optional().nullable(),
  status: z.enum(['ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO', 'RESOLVIDA', 'ARQUIVADA']).optional(),
});

export const listarConversasQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(20),
  status: z.enum(['ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO', 'RESOLVIDA', 'ARQUIVADA']).optional(),
  conexaoId: z.string().uuid().optional(),
  usuarioId: z.string().uuid().optional(),
  equipeId: z.string().uuid().optional(),
  contatoId: z.string().uuid().optional(),
  busca: z.string().optional(),
  apenasMinhas: z.coerce.boolean().optional(),
  ordenarPor: z.enum(['ultimaMensagemEm', 'criadoEm']).default('ultimaMensagemEm'),
  ordem: z.enum(['asc', 'desc']).default('desc'),
});

export const transferirConversaBodySchema = z.object({
  usuarioId: z.string().uuid('ID do usuario invalido').optional().nullable(),
  equipeId: z.string().uuid('ID da equipe invalido').optional().nullable(),
});

export const alterarStatusBodySchema = z.object({
  status: z.enum(['ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO', 'RESOLVIDA', 'ARQUIVADA']),
});

// =============================================================================
// Types
// =============================================================================

export type CriarConversaDTO = z.infer<typeof criarConversaBodySchema>;
export type AtualizarConversaDTO = z.infer<typeof atualizarConversaBodySchema>;
export type ListarConversasQuery = z.infer<typeof listarConversasQuerySchema>;
export type TransferirConversaDTO = z.infer<typeof transferirConversaBodySchema>;
export type AlterarStatusDTO = z.infer<typeof alterarStatusBodySchema>;
