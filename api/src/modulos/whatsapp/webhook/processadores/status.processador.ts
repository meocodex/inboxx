import { eq } from 'drizzle-orm';

import { db } from '../../../../infraestrutura/banco/drizzle.servico.js';
import { mensagens } from '../../../../infraestrutura/banco/schema/index.js';
import { logger } from '../../../../compartilhado/utilitarios/logger.js';
import { emitirParaConversa } from '../../../../websocket/socket.gateway.js';
import type {
  MetaStatusMensagem,
  MetaWebhookValue,
  UaiZapStatusMensagem,
} from '../../whatsapp.tipos.js';

// =============================================================================
// Mapear Status Meta para Interno
// =============================================================================

const STATUS_MAP_META: Record<string, 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO'> = {
  sent: 'ENVIADA',
  delivered: 'ENTREGUE',
  read: 'LIDA',
  failed: 'ERRO',
};

// =============================================================================
// Mapear Status UaiZap para Interno
// =============================================================================

const STATUS_MAP_UAIZAP: Record<string, 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO'> = {
  enviada: 'ENVIADA',
  entregue: 'ENTREGUE',
  lida: 'LIDA',
  erro: 'ERRO',
};

// =============================================================================
// Processar Status Meta
// =============================================================================

export async function processarStatusMeta(
  value: MetaWebhookValue,
  _clienteId: string
): Promise<void> {
  const { statuses } = value;

  if (!statuses || statuses.length === 0) {
    return;
  }

  for (const status of statuses) {
    try {
      await processarStatusMetaIndividual(status);
    } catch (erro) {
      logger.error(
        { erro, mensagemId: status.id },
        'Webhook: Erro ao processar status Meta'
      );
    }
  }
}

// =============================================================================
// Processar Status Meta Individual
// =============================================================================

async function processarStatusMetaIndividual(status: MetaStatusMensagem): Promise<void> {
  const novoStatus = STATUS_MAP_META[status.status];

  if (!novoStatus) {
    logger.warn({ status: status.status }, 'Webhook: Status Meta desconhecido');
    return;
  }

  // Buscar mensagem pelo ID externo (with conversa join)
  const [resultado] = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.idExterno, status.id))
    .limit(1);

  if (!resultado) {
    logger.debug({ idExterno: status.id }, 'Webhook: Mensagem nao encontrada para status');
    return;
  }

  const mensagem = resultado;

  // Atualizar status e timestamps da mensagem
  const updateData: {
    status: 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO';
    entregueEm?: Date;
    lidoEm?: Date;
  } = { status: novoStatus };

  if (novoStatus === 'ENTREGUE') {
    updateData.entregueEm = new Date(parseInt(status.timestamp) * 1000);
  } else if (novoStatus === 'LIDA') {
    updateData.lidoEm = new Date(parseInt(status.timestamp) * 1000);
  }

  await db
    .update(mensagens)
    .set(updateData)
    .where(eq(mensagens.id, mensagem.id));

  // Emitir evento WebSocket
  emitirParaConversa(mensagem.conversaId, 'status_mensagem', {
    mensagemId: mensagem.id,
    status: novoStatus,
    timestamp: new Date(parseInt(status.timestamp) * 1000),
  });

  logger.debug(
    { mensagemId: mensagem.id, status: novoStatus },
    'Webhook: Status da mensagem atualizado'
  );

  // Se houver erro, logar detalhes
  if (status.errors && status.errors.length > 0) {
    logger.warn(
      { mensagemId: mensagem.id, erros: status.errors },
      'Webhook: Mensagem com erro'
    );
  }
}

// =============================================================================
// Processar Status UaiZap
// =============================================================================

export async function processarStatusUaiZap(
  status: UaiZapStatusMensagem,
  _clienteId: string
): Promise<void> {
  const novoStatus = STATUS_MAP_UAIZAP[status.status];

  if (!novoStatus) {
    logger.warn({ status: status.status }, 'Webhook: Status UaiZap desconhecido');
    return;
  }

  // Buscar mensagem pelo ID externo
  const [resultado] = await db
    .select()
    .from(mensagens)
    .where(eq(mensagens.idExterno, status.mensagemId))
    .limit(1);

  if (!resultado) {
    logger.debug({ idExterno: status.mensagemId }, 'Webhook: Mensagem nao encontrada para status');
    return;
  }

  const mensagem = resultado;

  // Atualizar status e timestamps da mensagem
  const updateData: {
    status: 'ENVIADA' | 'ENTREGUE' | 'LIDA' | 'ERRO';
    entregueEm?: Date;
    lidoEm?: Date;
  } = { status: novoStatus };

  if (novoStatus === 'ENTREGUE') {
    updateData.entregueEm = new Date(status.timestamp);
  } else if (novoStatus === 'LIDA') {
    updateData.lidoEm = new Date(status.timestamp);
  }

  await db
    .update(mensagens)
    .set(updateData)
    .where(eq(mensagens.id, mensagem.id));

  // Emitir evento WebSocket
  emitirParaConversa(mensagem.conversaId, 'status_mensagem', {
    mensagemId: mensagem.id,
    status: novoStatus,
    timestamp: new Date(status.timestamp),
  });

  logger.debug(
    { mensagemId: mensagem.id, status: novoStatus },
    'Webhook: Status UaiZap atualizado'
  );

  // Se houver erro, logar detalhes
  if (status.erro) {
    logger.warn(
      { mensagemId: mensagem.id, erro: status.erro },
      'Webhook: Mensagem UaiZap com erro'
    );
  }
}
