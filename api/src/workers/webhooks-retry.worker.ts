import { registrarWorker, enviarJob } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import type { JobWebhookRetry } from '../infraestrutura/filas/tipos.js';

// =============================================================================
// Tipos de Job
// =============================================================================

interface Job<T> {
  id: string;
  name: string;
  data: T;
}

// =============================================================================
// Constantes
// =============================================================================

const BACKOFF_BASE_MS = 30000; // 30 segundos base
const MAX_BACKOFF_MS = 3600000; // 1 hora maximo

// =============================================================================
// Worker: Retry de Webhook
// =============================================================================

async function retryWebhook(job: Job<JobWebhookRetry>): Promise<void> {
  const { webhookLogId, payload, url, tentativa, maxTentativas } = job.data;

  logger.info({ webhookLogId, url, tentativa }, 'Worker: Tentando reenviar webhook');

  try {
    // Fazer requisicao HTTP
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 segundos timeout
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    logger.info({ webhookLogId, url, tentativa }, 'Worker: Webhook reenviado com sucesso');

    // TODO: Atualizar log no banco quando tabela webhookLog for criada
  } catch (erro) {
    const mensagemErro = erro instanceof Error ? erro.message : 'Erro desconhecido';
    logger.error({ erro: mensagemErro, webhookLogId, url, tentativa }, 'Worker: Erro ao reenviar webhook');

    // Verificar se deve tentar novamente
    if (tentativa < maxTentativas) {
      // Calcular delay com backoff exponencial
      const delay = Math.min(BACKOFF_BASE_MS * Math.pow(2, tentativa - 1), MAX_BACKOFF_MS);

      await enviarJob(
        'webhook.retry',
        {
          webhookLogId,
          payload,
          url,
          tentativa: tentativa + 1,
          maxTentativas,
        },
        {
          startAfter: new Date(Date.now() + delay),
        }
      );

      logger.info(
        { webhookLogId, proximaTentativa: tentativa + 1, delayMs: delay },
        'Worker: Webhook agendado para nova tentativa'
      );
    } else {
      logger.error(
        { webhookLogId, url, tentativas: tentativa },
        'Worker: Webhook falhou apos todas tentativas'
      );

      // TODO: Atualizar log no banco como falha definitiva quando tabela webhookLog for criada
    }
  }
}

// =============================================================================
// Registrar Worker
// =============================================================================

export async function registrarWorkerWebhooksRetry(): Promise<void> {
  await registrarWorker('webhook.retry', retryWebhook, {
    batchSize: 3,
  });

  logger.info('Worker de retry de webhooks registrado');
}
