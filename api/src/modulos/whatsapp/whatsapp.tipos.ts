// =============================================================================
// Tipos de Provedor
// =============================================================================

export type TipoProvedor = 'META_API' | 'UAIZAP' | 'GRAPH_API';

// =============================================================================
// Mensagem WhatsApp
// =============================================================================

export type TipoMensagemWhatsApp = 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'contacts' | 'template' | 'interactive' | 'sticker';

export interface MensagemTexto {
  tipo: 'text';
  texto: string;
}

export interface MensagemMidia {
  tipo: 'image' | 'audio' | 'video' | 'document' | 'sticker';
  url?: string;
  mediaId?: string;
  caption?: string;
  filename?: string;
  mimeType?: string;
}

export interface MensagemLocalizacao {
  tipo: 'location';
  latitude: number;
  longitude: number;
  nome?: string;
  endereco?: string;
}

export interface MensagemContato {
  tipo: 'contacts';
  contatos: Array<{
    nome: string;
    telefones: Array<{ numero: string; tipo?: string }>;
  }>;
}

export interface MensagemTemplate {
  tipo: 'template';
  nome: string;
  idioma: string;
  componentes?: Array<{
    tipo: 'header' | 'body' | 'button';
    parametros?: Array<{
      tipo: 'text' | 'currency' | 'date_time' | 'image' | 'document' | 'video';
      texto?: string;
      moeda?: { codigo: string; valor: number };
      dataHora?: string;
      url?: string;
    }>;
    subTipo?: string;
    indice?: number;
  }>;
}

export type ConteudoMensagem =
  | MensagemTexto
  | MensagemMidia
  | MensagemLocalizacao
  | MensagemContato
  | MensagemTemplate;

// =============================================================================
// Resultado do Envio
// =============================================================================

export interface ResultadoEnvio {
  sucesso: boolean;
  mensagemId?: string;
  erro?: string;
  provedor: TipoProvedor;
  timestamp: Date;
}

// =============================================================================
// Status de Mensagem
// =============================================================================

export type StatusMensagemWhatsApp = 'sent' | 'delivered' | 'read' | 'failed';

export interface AtualizacaoStatus {
  mensagemId: string;
  status: StatusMensagemWhatsApp;
  timestamp: Date;
  erro?: string;
}

// =============================================================================
// Webhook Payload - Meta
// =============================================================================

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: MetaWebhookValue;
      field: 'messages';
    }>;
  }>;
}

export interface MetaWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: Array<MetaMensagemRecebida>;
  statuses?: Array<MetaStatusMensagem>;
  errors?: Array<MetaErro>;
}

export interface MetaMensagemRecebida {
  from: string;
  id: string;
  timestamp: string;
  type: TipoMensagemWhatsApp;
  text?: { body: string };
  image?: MetaMidia;
  audio?: MetaMidia;
  video?: MetaMidia;
  document?: MetaMidia & { filename?: string };
  sticker?: MetaMidia;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: { formatted_name: string };
    phones: Array<{ phone: string; type?: string }>;
  }>;
  context?: {
    from: string;
    id: string;
  };
  referral?: {
    source_url: string;
    source_type: string;
    headline: string;
    body: string;
  };
}

export interface MetaMidia {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
}

export interface MetaStatusMensagem {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  conversation?: {
    id: string;
    origin: { type: string };
    expiration_timestamp?: string;
  };
  pricing?: {
    billable: boolean;
    pricing_model: string;
    category: string;
  };
  errors?: Array<MetaErro>;
}

export interface MetaErro {
  code: number;
  title: string;
  message: string;
  error_data?: { details: string };
}

// =============================================================================
// Webhook Payload - UaiZap
// =============================================================================

export interface UaiZapWebhookPayload {
  // Eventos podem vir em diferentes formatos dependendo da versão/config do UazAPI
  evento: 'mensagem_recebida' | 'status_atualizado' | 'conexao_atualizada' |
          'connection' | 'connection.update' | 'messages' | 'messages_update';
  instanciaId: string;
  dados: UaiZapMensagemRecebida | UaiZapStatusMensagem | UaiZapStatusConexao | unknown;
}

export interface UaiZapMensagemRecebida {
  id: string;
  de: string;
  para: string;
  tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'sticker';
  conteudo: string;
  midiaUrl?: string;
  mimeType?: string;
  nomeArquivo?: string;
  caption?: string;
  latitude?: number;
  longitude?: number;
  nomeContato?: string;
  telefoneContato?: string;
  timestamp: string;
  nomeRemetente?: string;
  fotoRemetente?: string;
  isGrupo: boolean;
  grupoId?: string;
  grupoNome?: string;
  citacao?: {
    id: string;
    conteudo: string;
  };
}

export interface UaiZapStatusMensagem {
  mensagemId: string;
  status: 'enviada' | 'entregue' | 'lida' | 'erro';
  timestamp: string;
  erro?: string;
}

export interface UaiZapStatusConexao {
  status: 'conectado' | 'desconectado' | 'qrcode';
  qrcode?: string;
}

// =============================================================================
// Configuracao do Provedor
// =============================================================================

export interface ConfiguracaoMeta {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId?: string;
  webhookVerifyToken: string;
  appSecret: string;
}

export interface ConfiguracaoUaiZap {
  apiUrl: string;
  apiKey: string;
  instanciaId: string;
  webhookUrl?: string;
}

export type ConfiguracaoProvedor = ConfiguracaoMeta | ConfiguracaoUaiZap;

// =============================================================================
// Template
// =============================================================================

export interface TemplateWhatsApp {
  id: string;
  nome: string;
  idioma: string;
  categoria: 'AUTHENTICATION' | 'MARKETING' | 'UTILITY';
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  componentes: Array<{
    tipo: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
    formato?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
    texto?: string;
    exemplo?: { header_text?: string[]; body_text?: string[][] };
    botoes?: Array<{
      tipo: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
      texto: string;
      url?: string;
      telefone?: string;
    }>;
  }>;
}

// =============================================================================
// Midia
// =============================================================================

export interface MidiaWhatsApp {
  id: string;
  url?: string;
  mimeType: string;
  sha256?: string;
  tamanho?: number;
  expiraEm?: Date;
}
