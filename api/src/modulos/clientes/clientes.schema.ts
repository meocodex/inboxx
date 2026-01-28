import { z } from 'zod';
import { paginacaoComOrdenacaoSchema } from '../../compartilhado/schemas/paginacao.schema.js';

// =============================================================================
// Schemas de Request
// =============================================================================

export const criarClienteBodySchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres').max(200),
  email: z.string().email('Email invalido'),
  telefone: z.string().optional(),
  documento: z.string().optional(),
  planoId: z.string().uuid('ID do plano invalido'),
});

export const atualizarClienteBodySchema = z.object({
  nome: z.string().min(2).max(200).optional(),
  email: z.string().email('Email invalido').optional(),
  telefone: z.string().optional(),
  documento: z.string().optional(),
  planoId: z.string().uuid('ID do plano invalido').optional(),
  ativo: z.boolean().optional(),
});

export const listarClientesQuerySchema = paginacaoComOrdenacaoSchema.extend({
  ordem: z.enum(['asc', 'desc']).default('desc'),
  ativo: z.enum(['true', 'false', 'todos']).default('todos'),
  planoId: z.string().uuid().optional(),
  ordenarPor: z.enum(['nome', 'email', 'criadoEm']).default('criadoEm'),
});

// =============================================================================
// Tipos inferidos
// =============================================================================

export type CriarClienteDTO = z.infer<typeof criarClienteBodySchema>;
export type AtualizarClienteDTO = z.infer<typeof atualizarClienteBodySchema>;
export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;

// =============================================================================
// Tipos de Resposta
// =============================================================================

export interface ClienteResumo {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  documento: string | null;
  ativo: boolean;
  criadoEm: Date;
  plano: {
    id: string;
    nome: string;
  };
  _count?: {
    usuarios: number;
    conexoes: number;
  };
}

export interface ClienteDetalhado extends ClienteResumo {
  atualizadoEm: Date;
  licencas: {
    id: string;
    ativa: boolean;
    expiraEm: Date;
  }[];
}

export interface ListaClientesPaginada {
  dados: ClienteResumo[];
  paginacao: {
    total: number;
    pagina: number;
    limite: number;
    totalPaginas: number;
  };
}
