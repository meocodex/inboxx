// =============================================================================
// Worker BullMQ: Chatbot Esperar (Delay)
// =============================================================================

import { registrarWorker } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import { executorFluxo } from '../modulos/chatbot/executor-fluxo.servico.js';
import type { JobChatbotEsperar } from '../infraestrutura/filas/tipos.js';

interface Job<T> {
  id: string;
  name: string;
  data: T;
}

/**
 * Processa jobs de espera do chatbot
 * Dispara evento de timeout após o delay configurado
 */
async function processarEspera(job: Job<JobChatbotEsperar>): Promise<void> {
  const { execucaoId, evento } = job.data;

  logger.info({ execucaoId, evento, jobId: job.id }, 'Worker: Processando espera do chatbot');

  try {
    // Processar evento no executor (ex: TIMEOUT)
    await executorFluxo.processar({ execucaoId, evento });

    logger.info({ execucaoId, evento }, 'Worker: Evento de espera processado com sucesso');
  } catch (erro) {
    logger.error({ erro, execucaoId, evento }, 'Worker: Erro ao processar espera do chatbot');
    throw erro;
  }
}

/**
 * Registra o worker de espera do chatbot
 */
export async function registrarWorkerChatbotEsperar(): Promise<void> {
  await registrarWorker('chatbot.esperar', processarEspera, {
    batchSize: 5,
    lockDuration: 30000, // 30 segundos
    stalledInterval: 15000, // Verificar a cada 15s
    maxStalledCount: 3,
  });

  logger.info('Worker de espera do chatbot registrado');
}
