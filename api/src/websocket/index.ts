// Socket Gateway
export {
  criarSocketGateway,
  getIO,
  obterUsuariosOnline,
  emitirParaCliente,
  emitirParaUsuario,
  emitirParaConversa,
  emitirNovaMensagem,
  emitirConversaAtualizada,
  emitirNotificacao,
  EVENTOS,
} from './socket.gateway.js';

// Eventos de Mensagem
export {
  emitirMensagemRecebida,
  emitirMensagemEnviada,
  emitirErroMensagem,
  emitirMensagensLidas,
  emitirAtualizacaoConversa,
  emitirConversaAtribuida,
  emitirConversaFinalizada,
  type MensagemEvento,
  type ConversaEvento,
} from './eventos/mensagem.eventos.js';

// Eventos de Notificacao
export {
  notificarUsuario,
  notificarCliente,
  notificarNovaConversa,
  notificarConversaAtribuida,
  notificarLembrete,
  notificarStatusCampanha,
  notificarStatusConexao,
  type TipoNotificacao,
  type Notificacao,
} from './eventos/notificacao.eventos.js';
