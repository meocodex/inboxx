import { z } from 'zod';

// =============================================================================
// Schemas de Colunas Kanban
// =============================================================================

// Schema para criar coluna
export const criarColunaBodySchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório').max(50),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hexadecimal válido')
    .default('#3B82F6'),
  ordem: z.number().int().min(0).optional(),
});

// Schema para atualizar coluna
export const atualizarColunaBodySchema = z.object({
  nome: z.string().min(1).max(50).optional(),
  cor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve ser um hexadecimal válido')
    .optional(),
  ordem: z.number().int().min(0).optional(),
});

// Schema para reordenar colunas
export const reordenarColunasBodySchema = z.object({
  colunas: z.array(
    z.object({
      id: z.string().uuid(),
      ordem: z.number().int().min(0),
    })
  ),
});

// =============================================================================
// Tipos exportados
// =============================================================================

export type CriarColunaDTO = z.infer<typeof criarColunaBodySchema>;
export type AtualizarColunaDTO = z.infer<typeof atualizarColunaBodySchema>;
export type ReordenarColunasDTO = z.infer<typeof reordenarColunasBodySchema>;
