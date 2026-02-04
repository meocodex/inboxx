import type { FastifyRequest, FastifyReply } from 'fastify';
import { eq } from 'drizzle-orm';

import { db } from '../../../infraestrutura/banco/drizzle.servico.js';
import { conexoes } from '../../../infraestrutura/banco/schema/index.js';
import { logger } from '../../../compartilhado/utilitarios/logger.js';
import { env } from '../../../configuracao/ambiente.js';
import { validarAssinaturaMeta, validarAssinaturaUaiZap } from './validador-hmac.js';
import {
  processarMensagemMeta,
  processarMensagemUaiZap,
  processarStatusMeta,
  processarStatusUaiZap,
} from './processadores/index.js';
import type {
  MetaWebhookPayload,
  UaiZapWebhookPayload,
  UaiZapMensagemRecebida,
  UaiZapStatusMensagem,
} from '../whatsapp.tipos.js';

// =============================================================================
// Verificacao do Webhook Meta (GET)
// =============================================================================

export async function verificarWebhookMeta(
  request: FastifyRequest<{
    Querystring: {
      'hub.mode'?: string;
      'hub.verify_token'?: string;
      'hub.challenge'?: string;
    };
  }>,
  reply: FastifyReply
): Promise<void> {
  const mode = request.query['hub.mode'];
  const token = request.query['hub.verify_token'];
  const challenge = request.query['hub.challenge'];

  logger.debug({ mode, token }, 'Webhook Meta: Verificacao recebida');

  if (mode === 'subscribe' && token === env.META_WEBHOOK_VERIFY_TOKEN) {
    logger.info('Webhook Meta: Verificacao bem sucedida');
    return reply.status(200).send(challenge);
  }

  logger.warn({ token }, 'Webhook Meta: Token de verificacao invalido');
  return reply.status(403).send('Forbidden');
}

// =============================================================================
// Receber Webhook Meta (POST)
// =============================================================================

export async function receberWebhookMeta(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Validar assinatura HMAC
  const assinatura = request.headers['x-hub-signature-256'] as string;
  const rawBody = JSON.stringify(request.body);

  if (!validarAssinaturaMeta(rawBody, assinatura, env.META_APP_SECRET)) {
    logger.warn('Webhook Meta: Assinatura invalida');
    return reply.status(401).send({ erro: 'Assinatura invalida' });
  }

  const payload = request.body as MetaWebhookPayload;

  // Responder imediatamente (Meta espera 200 rapido)
  reply.status(200).send('EVENT_RECEIVED');

  // Processar em background
  setImmediate(async () => {
    try {
      await processarPayloadMeta(payload);
    } catch (erro) {
      logger.error({ erro }, 'Webhook Meta: Erro ao processar payload');
    }
  });
}

// =============================================================================
// Processar Payload Meta
// =============================================================================

async function processarPayloadMeta(payload: MetaWebhookPayload): Promise<void> {
  if (payload.object !== 'whatsapp_business_account') {
    logger.debug({ object: payload.object }, 'Webhook Meta: Objeto ignorado');
    return;
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field !== 'messages') {
        continue;
      }

      const value = change.value;
      const phoneNumberId = value.metadata.phone_number_id;

      // Buscar todas conexoes Meta e filtrar pelo phoneNumberId nas configuracoes
      const conexoesResult = await db
        .select()
        .from(conexoes)
        .where(eq(conexoes.provedor, 'META_API'));

      const conexao = conexoesResult.find((c) => {
        const config = c.configuracoes as { phoneNumberId?: string } | null;
        return config?.phoneNumberId === phoneNumberId;
      });

      if (!conexao) {
        logger.warn({ phoneNumberId }, 'Webhook Meta: Conexao nao encontrada');
        continue;
      }

      // Processar mensagens
      if (value.messages && value.messages.length > 0) {
        await processarMensagemMeta(value, conexao.clienteId, conexao.id);
      }

      // Processar status
      if (value.statuses && value.statuses.length > 0) {
        await processarStatusMeta(value, conexao.clienteId);
      }

      // Processar erros
      if (value.errors && value.errors.length > 0) {
        logger.error({ erros: value.errors }, 'Webhook Meta: Erros reportados');
      }
    }
  }
}

// =============================================================================
// Receber Webhook UaiZap (POST)
// =============================================================================

export async function receberWebhookUaiZap(
  request: FastifyRequest<{ Params: { instanciaId: string } }>,
  reply: FastifyReply
): Promise<void> {
  const { instanciaId } = request.params;

  // Buscar todas conexoes UaiZap e filtrar pela instanciaId nas credenciais
  const conexoesResult = await db
    .select()
    .from(conexoes)
    .where(eq(conexoes.provedor, 'UAIZAP'));

  const conexao = conexoesResult.find((c) => {
    // instanciaId pode estar em credenciais ou configuracoes
    const creds = c.credenciais as { instanciaId?: string } | null;
    const config = c.configuracoes as { instanciaId?: string } | null;
    return creds?.instanciaId === instanciaId || config?.instanciaId === instanciaId;
  });

  if (!conexao) {
    logger.warn({ instanciaId }, 'Webhook UaiZap: Conexao nao encontrada');
    return reply.status(404).send({ erro: 'Conexao nao encontrada' });
  }

  // Validar assinatura HMAC (OBRIGATÓRIO)
  const assinatura = request.headers['x-signature'] as string;
  // apiKey pode estar em credenciais ou configuracoes
  const creds = conexao.credenciais as { apiKey?: string; instanciaToken?: string } | null;
  const config = conexao.configuracoes as { apiKey?: string } | null;
  const apiKey = creds?.apiKey || creds?.instanciaToken || config?.apiKey;

  if (!assinatura) {
    logger.warn({ instanciaId, ip: request.ip }, 'Webhook UaiZap: Assinatura ausente');
    return reply.status(401).send({ erro: 'Assinatura HMAC obrigatoria' });
  }

  if (!apiKey) {
    logger.error({ instanciaId }, 'Webhook UaiZap: apiKey nao configurada');
    return reply.status(500).send({ erro: 'Conexao mal configurada' });
  }

  const rawBody = JSON.stringify(request.body);
  if (!validarAssinaturaUaiZap(rawBody, assinatura, apiKey)) {
    logger.warn({
      instanciaId,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
      assinaturaFornecida: assinatura?.substring(0, 8) + '...',
    }, 'Tentativa de webhook não autorizado detectada');
    return reply.status(401).send({ erro: 'Assinatura invalida' });
  }

  const payload = request.body as UaiZapWebhookPayload;

  // Responder imediatamente
  reply.status(200).send({ sucesso: true });

  // Processar em background
  setImmediate(async () => {
    try {
      await processarPayloadUaiZap(payload, conexao.clienteId, conexao.id);
    } catch (erro) {
      logger.error({ erro, instanciaId }, 'Webhook UaiZap: Erro ao processar payload');
    }
  });
}

// =============================================================================
// Processar Payload UaiZap
// =============================================================================

async function processarPayloadUaiZap(
  payload: UaiZapWebhookPayload,
  clienteId: string,
  conexaoId: string
): Promise<void> {
  switch (payload.evento) {
    case 'mensagem_recebida':
      await processarMensagemUaiZap(
        payload.dados as UaiZapMensagemRecebida,
        clienteId,
        conexaoId
      );
      break;

    case 'status_atualizado':
      await processarStatusUaiZap(
        payload.dados as UaiZapStatusMensagem,
        clienteId
      );
      break;

    case 'conexao_atualizada':
    case 'connection':
    case 'connection.update':
      await processarConexaoUaiZap(payload.dados, conexaoId);
      break;

    default:
      logger.debug({ evento: payload.evento }, 'Webhook UaiZap: Evento ignorado');
  }
}

// =============================================================================
// Processar Conexão UaiZap (Status Update)
// =============================================================================

async function processarConexaoUaiZap(
  dados: unknown,
  conexaoId: string
): Promise<void> {
  const dadosConexao = dados as {
    status?: string;
    state?: string;
    connected?: boolean;
    loggedIn?: boolean;
  };

  // Determinar o status baseado nos dados recebidos
  const statusUazapi = dadosConexao?.status || dadosConexao?.state;
  const conectado = dadosConexao?.connected || dadosConexao?.loggedIn;

  let novoStatus: 'CONECTADO' | 'DESCONECTADO' | 'AGUARDANDO_QR' | 'RECONECTANDO' | 'ERRO';

  if (conectado || statusUazapi === 'connected' || statusUazapi === 'open') {
    novoStatus = 'CONECTADO';
  } else if (statusUazapi === 'connecting') {
    novoStatus = 'AGUARDANDO_QR';
  } else if (statusUazapi === 'disconnected' || statusUazapi === 'close') {
    novoStatus = 'DESCONECTADO';
  } else {
    logger.debug({ dados }, 'Webhook UaiZap: Status de conexão desconhecido');
    return;
  }

  logger.info(
    { conexaoId, statusUazapi, novoStatus, conectado },
    'Webhook UaiZap: Atualizando status da conexão'
  );

  // Atualizar status no banco
  await db
    .update(conexoes)
    .set({
      status: novoStatus,
      ultimoStatus: new Date(),
    })
    .where(eq(conexoes.id, conexaoId));

  logger.info(
    { conexaoId, novoStatus },
    'Webhook UaiZap: Status atualizado com sucesso'
  );
}
