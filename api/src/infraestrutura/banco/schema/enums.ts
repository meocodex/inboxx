// =============================================================================
// Enums do banco de dados (Drizzle pgEnum)
// =============================================================================

import { pgEnum } from 'drizzle-orm/pg-core';

// Conexoes
export const canalConexaoEnum = pgEnum('CanalConexao', [
  'WHATSAPP',
  'INSTAGRAM',
  'FACEBOOK',
]);

export const provedorConexaoEnum = pgEnum('ProvedorConexao', [
  'META_API',
  'UAIZAP',
  'GRAPH_API',
]);

export const statusConexaoEnum = pgEnum('StatusConexao', [
  'CONECTADO',
  'DESCONECTADO',
  'RECONECTANDO',
  'ERRO',
]);

// Conversas
export const statusConversaEnum = pgEnum('StatusConversa', [
  'ABERTA',
  'EM_ATENDIMENTO',
  'AGUARDANDO',
  'RESOLVIDA',
  'ARQUIVADA',
]);

// Mensagens
export const direcaoMensagemEnum = pgEnum('DirecaoMensagem', [
  'ENTRADA',
  'SAIDA',
]);

export const tipoMensagemEnum = pgEnum('TipoMensagem', [
  'TEXTO',
  'IMAGEM',
  'AUDIO',
  'VIDEO',
  'DOCUMENTO',
  'LOCALIZACAO',
  'CONTATO',
  'STICKER',
  'REACAO',
]);

export const statusMensagemEnum = pgEnum('StatusMensagem', [
  'PENDENTE',
  'ENVIADA',
  'ENTREGUE',
  'LIDA',
  'ERRO',
]);

// Chatbot
export const tipoNoChatbotEnum = pgEnum('TipoNoChatbot', [
  'INICIO',
  'MENSAGEM',
  'PERGUNTA',
  'CONDICAO',
  'DELAY',
  'WEBHOOK',
  'ATRIBUIR_TAG',
  'TRANSFERIR_HUMANO',
  'FIM',
]);

// Campanhas
export const statusCampanhaEnum = pgEnum('StatusCampanha', [
  'RASCUNHO',
  'AGENDADA',
  'EM_ANDAMENTO',
  'PAUSADA',
  'CONCLUIDA',
  'CANCELADA',
]);

export const statusEnvioCampanhaEnum = pgEnum('StatusEnvioCampanha', [
  'PENDENTE',
  'ENVIADO',
  'ENTREGUE',
  'LIDO',
  'ERRO',
]);

// Mensagens Agendadas
export const statusMensagemAgendadaEnum = pgEnum('StatusMensagemAgendada', [
  'PENDENTE',
  'ENVIADA',
  'CANCELADA',
  'ERRO',
]);

// Execucoes Chatbot
export const statusExecucaoChatbotEnum = pgEnum('StatusExecucaoChatbot', [
  'ATIVA',
  'AGUARDANDO',
  'PAUSADA',
  'FINALIZADA',
  'TRANSFERIDA',
  'TIMEOUT',
  'ERRO',
]);
