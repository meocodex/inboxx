import { emitirNotificacao, emitirParaCliente } from '../socket.gateway.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Tipos
// =============================================================================

export type TipoNotificacao = 'info' | 'sucesso' | 'aviso' | 'erro';

export interface Notificacao {
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  acao?: {
    label: string;
    url?: string;
    evento?: string;
  };
}

// =============================================================================
// Handlers de Notificacao
// =============================================================================

/**
 * Enviar notificacao para um usuario especifico
 */
export function notificarUsuario(usuarioId: string, notificacao: Notificacao): void {
  logger.debug({ usuarioId, tipo: notificacao.tipo }, 'Enviando notificacao para usuario');
  emitirNotificacao(usuarioId, notificacao);
}

/**
 * Enviar notificacao para todos usuarios de um cliente
 */
export function notificarCliente(clienteId: string, notificacao: Notificacao): void {
  logger.debug({ clienteId, tipo: notificacao.tipo }, 'Enviando notificacao para cliente');
  emitirParaCliente(clienteId, 'notificacao', notificacao);
}

/**
 * Notificar sobre nova conversa
 */
export function notificarNovaConversa(
  clienteId: string,
  dados: { conversaId: string; contatoNome: string; preview?: string }
): void {
  notificarCliente(clienteId, {
    tipo: 'info',
    titulo: 'Nova Conversa',
    mensagem: `${dados.contatoNome}: ${dados.preview || 'Nova mensagem'}`,
    dados: { conversaId: dados.conversaId },
    acao: {
      label: 'Ver conversa',
      url: `/conversas?id=${dados.conversaId}`,
    },
  });
}

/**
 * Notificar atendente sobre conversa atribuida
 */
export function notificarConversaAtribuida(
  usuarioId: string,
  dados: { conversaId: string; contatoNome: string }
): void {
  notificarUsuario(usuarioId, {
    tipo: 'info',
    titulo: 'Conversa Atribuida',
    mensagem: `Voce foi atribuido a conversa com ${dados.contatoNome}`,
    dados: { conversaId: dados.conversaId },
    acao: {
      label: 'Atender',
      url: `/conversas?id=${dados.conversaId}`,
    },
  });
}

/**
 * Notificar sobre lembrete de compromisso
 */
export function notificarLembrete(
  usuarioId: string,
  dados: { compromissoId: string; titulo: string; horario: string }
): void {
  notificarUsuario(usuarioId, {
    tipo: 'aviso',
    titulo: 'Lembrete',
    mensagem: `${dados.titulo} - ${dados.horario}`,
    dados: { compromissoId: dados.compromissoId },
    acao: {
      label: 'Ver agenda',
      url: '/agenda',
    },
  });
}

/**
 * Notificar sobre status de campanha
 */
export function notificarStatusCampanha(
  clienteId: string,
  dados: { campanhaId: string; nome: string; status: string; detalhes?: string }
): void {
  const tipoMap: Record<string, TipoNotificacao> = {
    CONCLUIDA: 'sucesso',
    ERRO: 'erro',
    PAUSADA: 'aviso',
    INICIADA: 'info',
  };

  notificarCliente(clienteId, {
    tipo: tipoMap[dados.status] || 'info',
    titulo: `Campanha ${dados.status.toLowerCase()}`,
    mensagem: dados.detalhes || `Campanha "${dados.nome}" foi ${dados.status.toLowerCase()}`,
    dados: { campanhaId: dados.campanhaId },
    acao: {
      label: 'Ver campanha',
      url: `/campanhas?id=${dados.campanhaId}`,
    },
  });
}

/**
 * Notificar sobre status de conexao WhatsApp
 */
export function notificarStatusConexao(
  clienteId: string,
  dados: { conexaoId: string; nome: string; status: string }
): void {
  const tipoMap: Record<string, TipoNotificacao> = {
    CONECTADO: 'sucesso',
    DESCONECTADO: 'aviso',
    ERRO: 'erro',
    AGUARDANDO_QR: 'info',
  };

  notificarCliente(clienteId, {
    tipo: tipoMap[dados.status] || 'info',
    titulo: `Conexao ${dados.status.toLowerCase()}`,
    mensagem: `${dados.nome}: ${dados.status}`,
    dados: { conexaoId: dados.conexaoId },
    acao: {
      label: 'Ver conexoes',
      url: '/conexoes',
    },
  });
}
