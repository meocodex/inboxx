// =============================================================================
// Tipos de Kanban
// =============================================================================

export interface Quadro {
  id: string;
  nome: string;
  descricao?: string | null;
  clienteId: string;
  colunas: Coluna[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface QuadroResumo {
  id: string;
  nome: string;
  descricao?: string | null;
  totalColunas: number;
  totalCartoes: number;
}

export interface Coluna {
  id: string;
  nome: string;
  cor?: string | null;
  ordem: number;
  quadroId: string;
  cartoes: Cartao[];
}

export interface ColunaResumo {
  id: string;
  nome: string;
  cor?: string | null;
  ordem: number;
}

export interface Cartao {
  id: string;
  titulo: string;
  descricao?: string | null;
  valor?: number | null;
  ordem: number;
  colunaId: string;
  contatoId?: string | null;
  contato?: {
    id: string;
    nome: string;
  } | null;
  criadoEm: string;
  atualizadoEm: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarQuadroDTO {
  nome: string;
  descricao?: string;
}

export interface AtualizarQuadroDTO {
  nome?: string;
  descricao?: string;
}

export interface CriarColunaDTO {
  nome: string;
  cor?: string;
}

export interface CriarCartaoDTO {
  titulo: string;
  descricao?: string;
  valor?: number;
  contatoId?: string;
}

export interface AtualizarCartaoDTO {
  titulo?: string;
  descricao?: string;
  valor?: number;
  contatoId?: string;
}

export interface MoverCartaoDTO {
  colunaDestinoId: string;
  ordem: number;
}
