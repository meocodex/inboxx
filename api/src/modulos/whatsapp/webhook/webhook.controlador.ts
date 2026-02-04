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
  UaiZapMessageData,
  UaiZapConnectionData,
} from '../whatsapp.tipos.js';

// =============================================================================
// Utilitário: Parse de Credenciais
// =============================================================================

/**
 * Parse credenciais que podem vir como string JSON ou objeto
 */
function parseCredenciais<T>(credenciais: unknown): T | null {
  if (typeof credenciais === 'string') {
    try {
      return JSON.parse(credenciais) as T;
    } catch {
      return null;
    }
  }
  return (credenciais as T) || null;
}

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
  const payload = request.body as UaiZapWebhookPayload;

  // Log do payload recebido (sem dados sensíveis)
  logger.info({
    instanciaId,
    evento: payload.event || payload.evento,
    hasData: !!(payload.data || payload.dados),
    hasSignature: !!request.headers['x-signature'],
  }, 'Webhook UaiZap: Payload recebido');

  // Buscar todas conexoes UaiZap e filtrar pela instanciaId nas credenciais
  const conexoesResult = await db
    .select()
    .from(conexoes)
    .where(eq(conexoes.provedor, 'UAIZAP'));

  const conexao = conexoesResult.find((c) => {
    const creds = parseCredenciais<{ instanciaId?: string }>(c.credenciais);
    const config = c.configuracoes as { instanciaId?: string } | null;
    return creds?.instanciaId === instanciaId || config?.instanciaId === instanciaId;
  });

  if (!conexao) {
    logger.warn({ instanciaId }, 'Webhook UaiZap: Conexao nao encontrada');
    return reply.status(404).send({ erro: 'Conexao nao encontrada' });
  }

  // Validar assinatura HMAC (opcional - UaiZap pode não enviar)
  const assinatura = request.headers['x-signature'] as string;
  const creds = parseCredenciais<{ apiKey?: string }>(conexao.credenciais);
  const config = conexao.configuracoes as { apiKey?: string } | null;
  const apiKey = creds?.apiKey || config?.apiKey;

  // Se assinatura presente, validar
  if (assinatura && apiKey) {
    const rawBody = JSON.stringify(request.body);
    if (!validarAssinaturaUaiZap(rawBody, assinatura, apiKey)) {
      logger.warn({
        instanciaId,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        assinaturaFornecida: assinatura?.substring(0, 8) + '...',
      }, 'Webhook UaiZap: Assinatura invalida');
      return reply.status(401).send({ erro: 'Assinatura invalida' });
    }
  } else if (!assinatura) {
    // UaiZap não envia assinatura por padrão - aceitar mas logar
    logger.debug({ instanciaId, ip: request.ip }, 'Webhook UaiZap: Sem assinatura HMAC');
  }

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
  // Detectar formato: novo (event/data) ou antigo (evento/dados)
  const evento = payload.event || payload.evento;
  const dados = payload.data || payload.dados;

  logger.debug({ evento, hasData: !!dados }, 'Webhook UaiZap: Processando payload');

  switch (evento) {
    // Formato novo - mensagens
    case 'messages':
      await processarMensagemFormatoNovo(
        dados as UaiZapMessageData,
        clienteId,
        conexaoId
      );
      break;

    // Formato antigo - mensagem recebida
    case 'mensagem_recebida':
      await processarMensagemUaiZap(
        dados as UaiZapMensagemRecebida,
        clienteId,
        conexaoId
      );
      break;

    // Atualização de status de mensagem
    case 'messages_update':
    case 'status_atualizado':
      await processarStatusUaiZap(
        dados as UaiZapStatusMensagem,
        clienteId
      );
      break;

    // Eventos de conexão
    case 'connection':
    case 'connection.update':
    case 'conexao_atualizada':
      await processarConexaoUaiZap(dados, conexaoId);
      break;

    default:
      logger.debug({ evento }, 'Webhook UaiZap: Evento ignorado');
  }
}

// =============================================================================
// Processar Mensagem no Formato Novo (UaiZap Real)
// =============================================================================

async function processarMensagemFormatoNovo(
  data: UaiZapMessageData,
  clienteId: string,
  conexaoId: string
): Promise<void> {
  // Ignorar mensagens enviadas por nós
  if (data.key?.fromMe) {
    logger.debug({ messageId: data.key?.id }, 'Webhook UaiZap: Ignorando mensagem enviada por nós');
    return;
  }

  // Extrair dados da mensagem
  const telefone = data.key?.remoteJid?.replace('@s.whatsapp.net', '').replace('@g.us', '') || '';
  const isGrupo = data.key?.remoteJid?.includes('@g.us') || false;

  // Extrair conteúdo da mensagem
  const msg = data.message || {};
  let tipo: 'texto' | 'imagem' | 'audio' | 'video' | 'documento' | 'localizacao' | 'contato' | 'sticker' = 'texto';
  let conteudo = '';
  let midiaUrl = data.mediaUrl;
  let mimeType: string | undefined;

  if (msg.conversation) {
    tipo = 'texto';
    conteudo = msg.conversation;
  } else if (msg.extendedTextMessage?.text) {
    tipo = 'texto';
    conteudo = msg.extendedTextMessage.text;
  } else if (msg.imageMessage) {
    tipo = 'imagem';
    conteudo = msg.imageMessage.caption || '[Imagem]';
    midiaUrl = midiaUrl || msg.imageMessage.url;
    mimeType = msg.imageMessage.mimetype;
  } else if (msg.audioMessage) {
    tipo = 'audio';
    conteudo = '[Áudio]';
    midiaUrl = midiaUrl || msg.audioMessage.url;
    mimeType = msg.audioMessage.mimetype;
  } else if (msg.videoMessage) {
    tipo = 'video';
    conteudo = msg.videoMessage.caption || '[Vídeo]';
    midiaUrl = midiaUrl || msg.videoMessage.url;
    mimeType = msg.videoMessage.mimetype;
  } else if (msg.documentMessage) {
    tipo = 'documento';
    conteudo = msg.documentMessage.fileName || '[Documento]';
    midiaUrl = midiaUrl || msg.documentMessage.url;
    mimeType = msg.documentMessage.mimetype;
  } else if (msg.stickerMessage) {
    tipo = 'sticker';
    conteudo = '[Sticker]';
    midiaUrl = midiaUrl || msg.stickerMessage.url;
    mimeType = msg.stickerMessage.mimetype;
  } else if (msg.locationMessage) {
    tipo = 'localizacao';
    conteudo = msg.locationMessage.name || msg.locationMessage.address || '[Localização]';
  } else if (msg.contactMessage) {
    tipo = 'contato';
    conteudo = msg.contactMessage.displayName || '[Contato]';
  } else {
    logger.debug({ message: msg }, 'Webhook UaiZap: Tipo de mensagem não reconhecido');
    return;
  }

  // Converter para formato esperado pelo processador existente
  const mensagemConvertida: UaiZapMensagemRecebida = {
    id: data.key?.id || `msg_${Date.now()}`,
    de: telefone,
    para: '', // não relevante para mensagens recebidas
    tipo,
    conteudo,
    midiaUrl,
    mimeType,
    timestamp: data.messageTimestamp
      ? new Date(Number(data.messageTimestamp) * 1000).toISOString()
      : new Date().toISOString(),
    nomeRemetente: data.pushName,
    isGrupo,
    grupoId: isGrupo ? data.key?.remoteJid : undefined,
    latitude: msg.locationMessage?.degreesLatitude,
    longitude: msg.locationMessage?.degreesLongitude,
  };

  logger.info(
    { telefone, tipo, conteudo: conteudo.substring(0, 50), pushName: data.pushName },
    'Webhook UaiZap: Mensagem recebida (formato novo)'
  );

  // Usar processador existente
  await processarMensagemUaiZap(mensagemConvertida, clienteId, conexaoId);
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
