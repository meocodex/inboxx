import { EVENTOS, emitirNovaMensagem, emitirParaConversa, emitirConversaAtualizada } from '../socket.gateway.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Tipos
// =============================================================================

export interface MensagemEvento {
  id: string;
  tipo: string;
  conteudo?: string;
  midiaUrl?: string;
  origem: string;
  conversaId: string;
  remetenteId?: string;
  remetente?: {
    id: string;
    nome: string;
  };
  enviadoEm: string;
}

export interface ConversaEvento {
  id: string;
  status: string;
  contatoId: string;
  contato: {
    id: string;
    nome: string;
    telefone?: string;
    avatarUrl?: string;
  };
  atendenteId?: string;
  atendente?: {
    id: string;
    nome: string;
  };
  ultimaMensagem?: MensagemEvento;
  naoLidas: number;
  atualizadoEm: string;
}

// =============================================================================
// Handlers de Eventos de Mensagem
// =============================================================================

/**
 * Emitir evento de nova mensagem recebida
 */
export function emitirMensagemRecebida(
  clienteId: string,
  conversaId: string,
  mensagem: MensagemEvento
): void {
  logger.debug({ clienteId, conversaId, mensagemId: mensagem.id }, 'Emitindo nova mensagem');
  emitirNovaMensagem(clienteId, conversaId, mensagem);
}

/**
 * Emitir evento de mensagem enviada com sucesso
 */
export function emitirMensagemEnviada(
  conversaId: string,
  mensagem: MensagemEvento
): void {
  logger.debug({ conversaId, mensagemId: mensagem.id }, 'Emitindo mensagem enviada');
  emitirParaConversa(conversaId, EVENTOS.MENSAGEM_ENVIADA, { mensagem });
}

/**
 * Emitir evento de erro ao enviar mensagem
 */
export function emitirErroMensagem(
  conversaId: string,
  erro: { codigo: string; mensagem: string; mensagemId?: string }
): void {
  logger.error({ conversaId, erro }, 'Emitindo erro de mensagem');
  emitirParaConversa(conversaId, EVENTOS.MENSAGEM_ERRO, erro);
}

/**
 * Emitir evento de mensagens lidas
 */
export function emitirMensagensLidas(
  conversaId: string,
  dados: { mensagemIds: string[]; leitoPor: string; lidoEm: string }
): void {
  logger.debug({ conversaId, quantidade: dados.mensagemIds.length }, 'Emitindo mensagens lidas');
  emitirParaConversa(conversaId, EVENTOS.MENSAGEM_LIDA, dados);
}

// =============================================================================
// Handlers de Eventos de Conversa
// =============================================================================

/**
 * Emitir atualizacao de conversa (nova mensagem, status, etc)
 */
export function emitirAtualizacaoConversa(
  clienteId: string,
  conversa: ConversaEvento
): void {
  logger.debug({ clienteId, conversaId: conversa.id }, 'Emitindo atualizacao de conversa');
  emitirConversaAtualizada(clienteId, conversa);
}

/**
 * Emitir evento de conversa atribuida a atendente
 */
export function emitirConversaAtribuida(
  clienteId: string,
  conversa: ConversaEvento
): void {
  logger.debug(
    { clienteId, conversaId: conversa.id, atendenteId: conversa.atendenteId },
    'Emitindo conversa atribuida'
  );
  emitirConversaAtualizada(clienteId, conversa);
}

/**
 * Emitir evento de conversa finalizada
 */
export function emitirConversaFinalizada(
  clienteId: string,
  conversaId: string
): void {
  logger.debug({ clienteId, conversaId }, 'Emitindo conversa finalizada');
  emitirConversaAtualizada(clienteId, {
    id: conversaId,
    status: 'FINALIZADA',
  } as ConversaEvento);
}
