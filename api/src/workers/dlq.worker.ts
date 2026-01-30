// =============================================================================
// Dead Letter Queue Worker
// =============================================================================
// Processa jobs que falharam após múltiplas tentativas
// - Registra no banco para análise posterior
// - Pode enviar alertas (Slack, Email, Sentry)
// - Permite reprocessamento manual via admin panel
// =============================================================================

import { db } from '../infraestrutura/banco/drizzle.servico.js';
import { registrarWorker } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import type { JobDlqProcessar } from '../infraestrutura/filas/tipos.js';

// =============================================================================
// Tipos
// =============================================================================

interface JobCompat<T> {
  id: string;
  name: string;
  data: T;
}

// =============================================================================
// Worker: Processar DLQ
// =============================================================================

async function processarDLQ(job: JobCompat<JobDlqProcessar>): Promise<void> {
  const { origem, jobOriginal, erro, timestampFalha } = job.data;

  logger.warn(
    {
      origem,
      erro,
      timestampFalha,
      payload: jobOriginal,
    },
    'DLQ: Job falhado recebido para análise'
  );

  try {
    // TODO: Criar tabela `jobs_dlq` para persistir jobs falhados
    // await db.insert(jobsDlq).values({
    //   origem,
    //   jobIdOriginal: jobId,
    //   payload: jobOriginal,
    //   erro,
    //   criadoEm: timestamp,
    //   status: 'PENDENTE',
    // });

    // TODO: Enviar alerta para administradores
    // - Slack webhook
    // - Email
    // - Sentry issue
    // - PagerDuty (casos críticos)

    // TODO: Integração futura com Bull Board para reprocessamento manual

    logger.info({ origem, jobId: job.id }, 'DLQ: Job registrado com sucesso');
  } catch (erroProcessamento) {
    logger.error(
      { erro: erroProcessamento, origem, jobId: job.id },
      'DLQ: Erro ao processar job na DLQ'
    );
    throw erroProcessamento; // Retry do próprio DLQ worker
  }
}

// =============================================================================
// Registrar Worker
// =============================================================================

export async function registrarWorkerDLQ(): Promise<void> {
  await registrarWorker('dlq.processar', processarDLQ, {
    batchSize: 1,
    lockDuration: 120000, // 2 minutos
    stalledInterval: 30000, // 30s entre verificações
    maxStalledCount: 5, // DLQ tem mais tentativas
  });

  logger.info('Worker DLQ registrado');
}

// =============================================================================
// Estatísticas DLQ
// =============================================================================

export interface EstatisticasDLQ {
  total: number;
  porOrigem: Record<string, number>;
  ultimos24h: number;
}

export async function obterEstatisticasDLQ(): Promise<EstatisticasDLQ> {
  // TODO: Implementar quando tabela jobs_dlq existir
  // const total = await db.select({ count: count() }).from(jobsDlq);
  // const porOrigem = await db.select({ origem, count: count() })
  //   .from(jobsDlq)
  //   .groupBy(jobsDlq.origem);

  return {
    total: 0,
    porOrigem: {},
    ultimos24h: 0,
  };
}
