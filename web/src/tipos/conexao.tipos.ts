// =============================================================================
// Tipos de Conexão/Canal (WhatsApp, Instagram, Facebook)
// =============================================================================

export type TipoCanalConexao = 'WHATSAPP' | 'INSTAGRAM' | 'FACEBOOK';
export type ProvedorConexao = 'META_API' | 'UAIZAP' | 'GRAPH_API';
export type StatusCanalConexao = 'CONECTADO' | 'DESCONECTADO' | 'AGUARDANDO_QR' | 'ERRO';

// =============================================================================
// Entidades
// =============================================================================

export interface CanalConexao {
  id: string;
  nome: string;
  canal: TipoCanalConexao;
  provedor: ProvedorConexao;
  status: StatusCanalConexao;
  telefone?: string;
  identificadorExterno?: string;
  qrCode?: string;
  webhook?: string;
  ativa: boolean;
  ultimaSincronizacao?: string;
  clienteId: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CanalConexaoResumo {
  id: string;
  nome: string;
  canal: TipoCanalConexao;
  provedor: ProvedorConexao;
  status: StatusCanalConexao;
  telefone?: string;
  ativa: boolean;
  ultimaSincronizacao?: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarCanalConexaoDTO {
  nome: string;
  canal: TipoCanalConexao;
  provedor: ProvedorConexao;
  telefone?: string;
  webhook?: string;
}

export interface AtualizarCanalConexaoDTO {
  nome?: string;
  telefone?: string;
  webhook?: string;
  ativa?: boolean;
}

export interface FiltrosCanalConexao {
  canal?: TipoCanalConexao;
  status?: StatusCanalConexao;
  ativa?: boolean;
}

// =============================================================================
// Tipos Estendidos - Detalhes Completos
// =============================================================================

export interface CanalConexaoDetalhada extends CanalConexao {
  totalConversas?: number;
  totalMensagensAgendadas?: number;
  configuracoes?: ConfiguracoesConexao;
  credenciais?: CredenciaisConexao;
}

export interface ConfiguracoesConexao {
  webhookUrl?: string;
  mensagemBoasVindas?: string;
  horarioAtendimento?: {
    inicio: string;
    fim: string;
    diasSemana: number[];
  };
}

export interface CredenciaisConexao {
  token?: string;
  phoneNumberId?: string;
  apiKey?: string;
  // Credenciais sempre vêm mascaradas do backend
}

export interface MetricasConexoes {
  total: number;
  conectadas: number;
  desconectadas: number;
  comErro: number;
  aguardandoQR: number;
  totalConversasAtivas: number;
}
