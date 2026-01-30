// =============================================================================
// Rate Limiter para WhatsApp API
// =============================================================================
// CRÍTICO: WhatsApp tem limite de 80 mensagens/segundo por número
// Ultrapassar esse limite resulta em ban temporário ou permanente
//
// Implementação usando Bottleneck para controlar taxa de envio
// =============================================================================

import Bottleneck from 'bottleneck';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Configuração do Rate Limiter
// =============================================================================

export const whatsappLimiter = new Bottleneck({
  // Limite do WhatsApp: 80 mensagens por segundo
  reservoir: 80,
  reservoirRefreshAmount: 80,
  reservoirRefreshInterval: 1000, // 1 segundo

  // Máximo de requisições concorrentes
  maxConcurrent: 10,

  // Estratégia: FIFO (First In First Out)
  strategy: Bottleneck.strategy.LEAK,

  // Timeout para jobs pendentes: 5 minutos
  timeout: 5 * 60 * 1000,
});

// =============================================================================
// Eventos de Monitoramento
// =============================================================================

whatsappLimiter.on('error', (erro) => {
  logger.error({ erro }, 'WhatsApp Rate Limiter: Erro');
});

whatsappLimiter.on('depleted', () => {
  logger.warn('WhatsApp Rate Limiter: Reservoir esgotado - mensagens sendo enfileiradas');
});

whatsappLimiter.on('queued', (info) => {
  if (info && info.options && info.options.id) {
    logger.debug({ jobId: info.options.id }, 'WhatsApp Rate Limiter: Job enfileirado');
  }
});

// =============================================================================
// Métricas do Rate Limiter
// =============================================================================

export interface WhatsAppRateLimiterMetrics {
  running: number;
  queued: number;
  reservoir: number;
  maxReservoir: number;
  percentUtilizado: number;
}

export async function obterMetricasRateLimiter(): Promise<WhatsAppRateLimiterMetrics> {
  const counts = whatsappLimiter.counts();
  const reservoir = await whatsappLimiter.currentReservoir();
  const maxReservoir = 80;

  return {
    running: counts.EXECUTING,
    queued: counts.QUEUED,
    reservoir: reservoir ?? 0,
    maxReservoir,
    percentUtilizado: ((maxReservoir - (reservoir ?? 0)) / maxReservoir) * 100,
  };
}

// =============================================================================
// Helper para agendar envio de mensagem
// =============================================================================

export async function agendarEnvioWhatsApp<T>(
  fn: () => Promise<T>,
  jobId?: string
): Promise<T> {
  return whatsappLimiter.schedule(
    {
      id: jobId,
      priority: 5, // Prioridade padrão (1-10, onde 10 é mais alta)
    },
    fn
  );
}

// =============================================================================
// Helper para agendar com prioridade alta (mensagens transacionais)
// =============================================================================

export async function agendarEnvioWhatsAppPrioritario<T>(
  fn: () => Promise<T>,
  jobId?: string
): Promise<T> {
  return whatsappLimiter.schedule(
    {
      id: jobId,
      priority: 9, // Alta prioridade
    },
    fn
  );
}

// =============================================================================
// Shutdown graceful
// =============================================================================

export async function fecharWhatsAppLimiter(): Promise<void> {
  await whatsappLimiter.stop({ dropWaitingJobs: false });
  logger.info('WhatsApp Rate Limiter: Encerrado (jobs pendentes foram processados)');
}
