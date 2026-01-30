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
// Gatilho (JSONB no backend)
// =============================================================================

export type TipoGatilho = 'PALAVRA_CHAVE' | 'PRIMEIRA_MENSAGEM' | 'HORARIO' | 'ETIQUETA';

export interface Gatilho {
  tipo: TipoGatilho;
  valor?: string;
  configuracao?: Record<string, unknown>;
}

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
  gatilho: Gatilho;
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
  gatilho: Gatilho;
  totalNos: number;
  criadoEm: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarFluxoDTO {
  nome: string;
  descricao?: string;
  gatilho: Gatilho;
}

export interface AtualizarFluxoDTO {
  nome?: string;
  descricao?: string;
  gatilho?: Gatilho;
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
