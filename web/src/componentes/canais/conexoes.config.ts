import {
  Smartphone,
  Instagram,
  Facebook,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type {
  TipoCanalConexao,
  StatusCanalConexao,
  ProvedorConexao,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Configuração de Canais
// =============================================================================

export interface CanalConfigItem {
  label: string;
  cor: string;
  icone: typeof Smartphone;
  descricao: string;
}

export const CANAL_CONFIG: Record<TipoCanalConexao, CanalConfigItem> = {
  WHATSAPP: {
    label: 'WhatsApp',
    cor: '#25D366',
    icone: Smartphone,
    descricao: 'Mensagens via WhatsApp Business API',
  },
  INSTAGRAM: {
    label: 'Instagram',
    cor: '#E4405F',
    icone: Instagram,
    descricao: 'Direct do Instagram Business',
  },
  FACEBOOK: {
    label: 'Facebook',
    cor: '#1877F2',
    icone: Facebook,
    descricao: 'Messenger do Facebook',
  },
};

// =============================================================================
// Configuração de Status
// =============================================================================

export interface StatusConfigItem {
  label: string;
  variant: 'default' | 'success' | 'warning' | 'destructive';
  icone: typeof CheckCircle;
  cor: string;
}

export const STATUS_CONFIG: Record<StatusCanalConexao, StatusConfigItem> = {
  CONECTADO: {
    label: 'Conectado',
    variant: 'success',
    icone: CheckCircle,
    cor: '#22c55e',
  },
  DESCONECTADO: {
    label: 'Desconectado',
    variant: 'default',
    icone: XCircle,
    cor: '#6b7280',
  },
  AGUARDANDO_QR: {
    label: 'Aguardando QR',
    variant: 'warning',
    icone: Clock,
    cor: '#f59e0b',
  },
  ERRO: {
    label: 'Erro',
    variant: 'destructive',
    icone: AlertCircle,
    cor: '#ef4444',
  },
};

// =============================================================================
// Configuração de Provedores
// =============================================================================

export interface ProvedorConfigItem {
  label: string;
  descricao: string;
  oficial?: boolean;
  suportaQRCode?: boolean;
}

export const PROVEDOR_CONFIG: Record<ProvedorConexao, ProvedorConfigItem> = {
  META_API: {
    label: 'Meta Cloud API',
    descricao: 'API oficial do WhatsApp Business',
    oficial: true,
    suportaQRCode: false,
  },
  UAIZAP: {
    label: 'UaiZap',
    descricao: 'Instância criada automaticamente pelo administrador',
    suportaQRCode: true,
  },
  GRAPH_API: {
    label: 'Graph API',
    descricao: 'Para Instagram e Facebook',
    suportaQRCode: false,
  },
};

// =============================================================================
// Helpers
// =============================================================================

/**
 * Retorna configuração do canal
 */
export const getCanalConfig = (canal: TipoCanalConexao): CanalConfigItem => {
  return CANAL_CONFIG[canal];
};

/**
 * Retorna configuração do status
 */
export const getStatusConfig = (status: StatusCanalConexao): StatusConfigItem => {
  return STATUS_CONFIG[status];
};

/**
 * Retorna configuração do provedor
 */
export const getProvedorConfig = (provedor: ProvedorConexao): ProvedorConfigItem => {
  return PROVEDOR_CONFIG[provedor];
};

/**
 * Verifica se o provedor suporta QR Code
 */
export const suportaQRCode = (provedor: ProvedorConexao): boolean => {
  return PROVEDOR_CONFIG[provedor]?.suportaQRCode === true;
};

/**
 * Verifica se a conexão precisa de QR Code (status AGUARDANDO_QR ou DESCONECTADO com UaiZap)
 */
export const precisaQRCode = (
  status: StatusCanalConexao,
  provedor: ProvedorConexao
): boolean => {
  if (!suportaQRCode(provedor)) return false;
  return status === 'AGUARDANDO_QR' || status === 'DESCONECTADO';
};

/**
 * Lista de canais disponíveis
 */
export const CANAIS_DISPONIVEIS = Object.keys(CANAL_CONFIG) as TipoCanalConexao[];

/**
 * Lista de provedores disponíveis
 */
export const PROVEDORES_DISPONIVEIS = Object.keys(PROVEDOR_CONFIG) as ProvedorConexao[];

/**
 * Lista de status possíveis
 */
export const STATUS_DISPONIVEIS = Object.keys(STATUS_CONFIG) as StatusCanalConexao[];
