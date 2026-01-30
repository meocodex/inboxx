import { z } from 'zod';

// =============================================================================
// Schemas de Transicoes do Chatbot
// =============================================================================

// Criar Transicao
export const criarTransicaoSchema = z.object({
  noOrigemId: z.string().uuid(),
  noDestinoId: z.string().uuid(),
  evento: z.string().min(1),
  condicao: z.object({
    tipo: z.enum(['IGUAL', 'CONTEM', 'REGEX', 'QUALQUER']).optional(),
    valor: z.string().optional(),
    campo: z.string().optional(),
  }).optional(),
  ordem: z.number().int().min(0).optional(),
});

// Atualizar Transicao
export const atualizarTransicaoSchema = z.object({
  noDestinoId: z.string().uuid().optional(),
  evento: z.string().min(1).optional(),
  condicao: z.object({
    tipo: z.enum(['IGUAL', 'CONTEM', 'REGEX', 'QUALQUER']).optional(),
    valor: z.string().optional(),
    campo: z.string().optional(),
  }).nullish(),
  ordem: z.number().int().min(0).optional(),
});

// Listar Transicoes
export const listarTransicoesQuerySchema = z.object({
  pagina: z.coerce.number().int().positive().default(1),
  limite: z.coerce.number().int().positive().max(100).default(50),
});

// Conectar Nos em Lote (para o visual builder)
export const conectarNosLoteSchema = z.object({
  transicoes: z.array(z.object({
    id: z.string().uuid().optional(), // ID existente para atualizar
    noOrigemId: z.string().uuid(),
    noDestinoId: z.string().uuid(),
    evento: z.string().min(1),
    condicao: z.object({
      tipo: z.enum(['IGUAL', 'CONTEM', 'REGEX', 'QUALQUER']).optional(),
      valor: z.string().optional(),
      campo: z.string().optional(),
    }).optional(),
  })),
});

// Tipos inferidos
export type CriarTransicaoDTO = z.infer<typeof criarTransicaoSchema>;
export type AtualizarTransicaoDTO = z.infer<typeof atualizarTransicaoSchema>;
export type ListarTransicoesQuery = z.infer<typeof listarTransicoesQuerySchema>;
export type ConectarNosLoteDTO = z.infer<typeof conectarNosLoteSchema>;
