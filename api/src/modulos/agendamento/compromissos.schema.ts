import { z } from 'zod';

// =============================================================================
// Schemas de Compromissos
// =============================================================================

export const criarCompromissoBodySchema = z.object({
  contatoId: z.string().uuid('ID do contato inválido').optional(),
  titulo: z.string().min(1, 'Título é obrigatório').max(200),
  descricao: z.string().max(1000).optional(),
  dataHora: z.string().refine(
    (val) => !isNaN(Date.parse(val)),
    'Data/hora inválida'
  ),
  duracaoMin: z.number().int().min(5).max(480).default(30),
  lembreteMin: z.number().int().min(5).max(10080).optional(), // até 7 dias antes
});

export const atualizarCompromissoBodySchema = z.object({
  contatoId: z.string().uuid('ID do contato inválido').optional().nullable(),
  titulo: z.string().min(1).max(200).optional(),
  descricao: z.string().max(1000).optional().nullable(),
  dataHora: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Data/hora inválida')
    .optional(),
  duracaoMin: z.number().int().min(5).max(480).optional(),
  lembreteMin: z.number().int().min(5).max(10080).optional().nullable(),
});

export const listarCompromissosQuerySchema = z.object({
  pagina: z.coerce.number().int().min(1).default(1),
  limite: z.coerce.number().int().min(1).max(100).default(20),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  contatoId: z.string().uuid().optional(),
  busca: z.string().optional(),
});

// =============================================================================
// Types
// =============================================================================

export type CriarCompromissoDTO = z.infer<typeof criarCompromissoBodySchema>;
export type AtualizarCompromissoDTO = z.infer<typeof atualizarCompromissoBodySchema>;
export type ListarCompromissosQuery = z.infer<typeof listarCompromissosQuerySchema>;
