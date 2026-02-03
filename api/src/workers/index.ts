import { logger } from '../compartilhado/utilitarios/logger.js';
import { registrarWorkersCampanhas } from './campanhas.worker.js';
import { registrarWorkerMensagensAgendadas } from './mensagens-agendadas.worker.js';
import { registrarWorkerLembretes } from './lembretes.worker.js';
import { registrarWorkerWebhooksRetry } from './webhooks-retry.worker.js';
import { registrarWorkerBuscaSincronizacao } from './sincronizacao-busca.worker.js';
import { registrarWorkerChatbotEsperar } from './chatbot-esperar.worker.js';
import { registrarWorkerDLQ } from './dlq.worker.js';

// =============================================================================
// Registrar Todos os Workers
// =============================================================================

export async function registrarTodosWorkers(): Promise<void> {
  logger.info('Iniciando registro de workers...');

  await registrarWorkerDLQ(); // DLQ primeiro (processa falhas de outros workers)
  await registrarWorkersCampanhas();
  await registrarWorkerMensagensAgendadas();
  await registrarWorkerLembretes();
  await registrarWorkerWebhooksRetry();
  await registrarWorkerBuscaSincronizacao();
  await registrarWorkerChatbotEsperar();

  logger.info('Todos os workers registrados com sucesso');
}

// =============================================================================
// Re-exportar Workers Individuais
// =============================================================================

export { registrarWorkersCampanhas } from './campanhas.worker.js';
export { registrarWorkerMensagensAgendadas } from './mensagens-agendadas.worker.js';
export { registrarWorkerLembretes } from './lembretes.worker.js';
export { registrarWorkerWebhooksRetry } from './webhooks-retry.worker.js';
export { registrarWorkerBuscaSincronizacao } from './sincronizacao-busca.worker.js';
export { registrarWorkerChatbotEsperar } from './chatbot-esperar.worker.js';
export { registrarWorkerDLQ } from './dlq.worker.js';
