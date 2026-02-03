// =============================================================================
// Tipos de Jobs para BullMQ
// =============================================================================

export type NomeJob =
  | 'campanha.processar'
  | 'campanha.enviar-mensagem'
  | 'mensagem-agendada.enviar'
  | 'lembrete.enviar'
  | 'webhook.retry'
  | 'busca.sincronizar'
  | 'chatbot.esperar'
  | 'dlq.processar';

// =============================================================================
// Payloads dos Jobs
// =============================================================================

export interface JobCampanhaProcessar {
  campanhaId: string;
  clienteId: string;
}

export interface JobCampanhaEnviarMensagem {
  campanhaId: string;
  clienteId: string;
  contatoId: string;
  telefone: string;
  conteudo: string;
  midiaUrl?: string;
  tentativa: number;
}

export interface JobMensagemAgendada {
  mensagemId: string;
  clienteId: string;
  conversaId: string;
  conteudo: string;
  tipo: string;
  midiaUrl?: string;
}

export interface JobLembrete {
  lembreteId: string;
  compromissoId: string;
  clienteId: string;
  usuarioId: string;
  titulo: string;
  descricao?: string;
  contatoTelefone?: string;
  enviarWhatsApp: boolean;
}

export interface JobWebhookRetry {
  webhookLogId: string;
  payload: Record<string, unknown>;
  url: string;
  tentativa: number;
  maxTentativas: number;
}

export interface JobBuscaSincronizar {
  operacao: 'indexar' | 'atualizar' | 'remover' | 'reindexar-tudo';
  indice: 'contatos' | 'conversas' | 'mensagens';
  clienteId: string;
  documentoId?: string;
}

export interface JobChatbotEsperar {
  execucaoId: string;
  evento: string;
}

export interface JobDlqProcessar {
  origem: string;
  jobOriginal: Record<string, unknown>;
  erro?: string;
  tentativasOriginais?: number;
  timestampFalha: string;
}

// =============================================================================
// Mapeamento de Jobs para Payloads
// =============================================================================

export interface JobPayloads {
  'campanha.processar': JobCampanhaProcessar;
  'campanha.enviar-mensagem': JobCampanhaEnviarMensagem;
  'mensagem-agendada.enviar': JobMensagemAgendada;
  'lembrete.enviar': JobLembrete;
  'webhook.retry': JobWebhookRetry;
  'busca.sincronizar': JobBuscaSincronizar;
  'chatbot.esperar': JobChatbotEsperar;
  'dlq.processar': JobDlqProcessar;
}

// =============================================================================
// Opcoes de Job
// =============================================================================

export interface OpcoesJob {
  retryLimit?: number;
  retryDelay?: number;
  retryBackoff?: boolean;
  startAfter?: Date | string | number;
  expireInSeconds?: number;
  singletonKey?: string;
  priority?: number;
}

// =============================================================================
// Resultado do Job
// =============================================================================

export interface ResultadoJob {
  sucesso: boolean;
  erro?: string;
  dados?: Record<string, unknown>;
}
