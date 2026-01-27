// =============================================================================
// Tipos de Agenda/Eventos
// =============================================================================

export type TipoEvento = 'REUNIAO' | 'LIGACAO' | 'TAREFA' | 'LEMBRETE' | 'OUTRO';
export type StatusEvento = 'AGENDADO' | 'CONCLUIDO' | 'CANCELADO';

// =============================================================================
// Entidades
// =============================================================================

export interface Evento {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: TipoEvento;
  status: StatusEvento;
  dataInicio: string;
  dataFim?: string;
  diaInteiro: boolean;
  cor?: string;
  contatoId?: string;
  contatoNome?: string;
  usuarioId: string;
  usuarioNome: string;
  clienteId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface EventoResumo {
  id: string;
  titulo: string;
  tipo: TipoEvento;
  status: StatusEvento;
  dataInicio: string;
  dataFim?: string;
  diaInteiro: boolean;
  cor?: string;
  contatoNome?: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarEventoDTO {
  titulo: string;
  descricao?: string;
  tipo: TipoEvento;
  dataInicio: string;
  dataFim?: string;
  diaInteiro?: boolean;
  cor?: string;
  contatoId?: string;
}

export interface AtualizarEventoDTO {
  titulo?: string;
  descricao?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
  dataInicio?: string;
  dataFim?: string;
  diaInteiro?: boolean;
  cor?: string;
  contatoId?: string;
}

export interface FiltrosEvento {
  dataInicio?: string;
  dataFim?: string;
  tipo?: TipoEvento;
  status?: StatusEvento;
}
