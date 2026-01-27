// =============================================================================
// Tipos de Chatbot/Fluxo
// =============================================================================

export type TipoNo =
  | 'INICIO'
  | 'MENSAGEM'
  | 'PERGUNTA'
  | 'MENU'
  | 'CONDICAO'
  | 'TRANSFERIR'
  | 'WEBHOOK'
  | 'ESPERAR'
  | 'FIM';

export type StatusFluxo = 'RASCUNHO' | 'ATIVO' | 'INATIVO';

// =============================================================================
// Entidades
// =============================================================================

export interface NoFluxo {
  id: string;
  tipo: TipoNo;
  nome: string;
  conteudo: Record<string, unknown>;
  posicaoX: number;
  posicaoY: number;
  conexoes: ConexaoNo[];
}

export interface ConexaoNo {
  id: string;
  noOrigemId: string;
  noDestinoId: string;
  condicao?: string;
  ordem: number;
}

export interface Fluxo {
  id: string;
  nome: string;
  descricao?: string;
  status: StatusFluxo;
  gatilho: string;
  nos: NoFluxo[];
  clienteId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface FluxoResumo {
  id: string;
  nome: string;
  descricao?: string;
  status: StatusFluxo;
  gatilho: string;
  totalNos: number;
  criadoEm: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarFluxoDTO {
  nome: string;
  descricao?: string;
  gatilho: string;
}

export interface AtualizarFluxoDTO {
  nome?: string;
  descricao?: string;
  gatilho?: string;
  status?: StatusFluxo;
}

export interface CriarNoDTO {
  tipo: TipoNo;
  nome: string;
  conteudo: Record<string, unknown>;
  posicaoX: number;
  posicaoY: number;
}

export interface AtualizarNoDTO {
  nome?: string;
  conteudo?: Record<string, unknown>;
  posicaoX?: number;
  posicaoY?: number;
}

export interface CriarConexaoDTO {
  noOrigemId: string;
  noDestinoId: string;
  condicao?: string;
  ordem?: number;
}
