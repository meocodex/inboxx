import { z } from 'zod';
import { paginacaoComOrdenacaoSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Validacao
// =============================================================================

export const criarContatoBodySchema = z.object({
  nome: z.string().max(100).optional().nullable(),
  telefone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 digitos')
    .max(20)
    .regex(/^[0-9]+$/, 'Telefone deve conter apenas numeros'),
  email: z.string().email('Email invalido').optional().nullable(),
  fotoUrl: z.string().url('URL da foto invalida').optional().nullable(),
  camposPersonalizados: z.record(z.unknown()).optional().nullable(),
  etiquetaIds: z.array(z.string().uuid()).optional(),
});

export const atualizarContatoBodySchema = z.object({
  nome: z.string().max(100).optional().nullable(),
  email: z.string().email('Email invalido').optional().nullable(),
  fotoUrl: z.string().url('URL da foto invalida').optional().nullable(),
  camposPersonalizados: z.record(z.unknown()).optional().nullable(),
});

export const listarContatosQuerySchema = paginacaoComOrdenacaoSchema.extend({
  ordem: z.enum(['asc', 'desc']).default('desc'),
  etiquetaId: z.string().uuid().optional(),
  ordenarPor: z.enum(['nome', 'telefone', 'criadoEm']).default('criadoEm'),
});

export const adicionarEtiquetaBodySchema = z.object({
  etiquetaId: z.string().uuid('ID da etiqueta invalido'),
});

export const importarContatosBodySchema = z.object({
  contatos: z.array(
    z.object({
      nome: z.string().max(100).optional(),
      telefone: z.string().min(10).max(20),
      email: z.string().email().optional(),
    })
  ),
  etiquetaIds: z.array(z.string().uuid()).optional(),
});

// =============================================================================
// Types
// =============================================================================

export type CriarContatoDTO = z.infer<typeof criarContatoBodySchema>;
export type AtualizarContatoDTO = z.infer<typeof atualizarContatoBodySchema>;
export type ListarContatosQuery = z.infer<typeof listarContatosQuerySchema>;
export type AdicionarEtiquetaDTO = z.infer<typeof adicionarEtiquetaBodySchema>;
export type ImportarContatosDTO = z.infer<typeof importarContatosBodySchema>;
