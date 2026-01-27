import type { StatusCampanha } from './api.tipos';

// =============================================================================
// Tipos de Campanha
// =============================================================================

export interface Campanha {
  id: string;
  nome: string;
  descricao?: string | null;
  mensagem: string;
  status: StatusCampanha;
  agendadaPara?: string | null;
  iniciadaEm?: string | null;
  concluidaEm?: string | null;
  totalContatos: number;
  totalEnviados: number;
  totalErros: number;
  clienteId: string;
  conexaoId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CampanhaResumo {
  id: string;
  nome: string;
  status: StatusCampanha;
  totalContatos: number;
  totalEnviados: number;
  agendadaPara?: string | null;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarCampanhaDTO {
  nome: string;
  descricao?: string;
  mensagem: string;
  conexaoId: string;
  contatoIds: string[];
  agendadaPara?: string;
}

export interface AtualizarCampanhaDTO {
  nome?: string;
  descricao?: string;
  mensagem?: string;
}
