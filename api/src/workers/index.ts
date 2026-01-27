import { logger } from '../compartilhado/utilitarios/logger.js';
import { registrarWorkersCampanhas } from './campanhas.worker.js';
import { registrarWorkerMensagensAgendadas } from './mensagens-agendadas.worker.js';
import { registrarWorkerLembretes } from './lembretes.worker.js';
import { registrarWorkerWebhooksRetry } from './webhooks-retry.worker.js';
import { registrarWorkerBuscaSincronizacao } from './sincronizacao-busca.worker.js';

// =============================================================================
// Registrar Todos os Workers
// =============================================================================

export async function registrarTodosWorkers(): Promise<void> {
  logger.info('Iniciando registro de workers...');

  await registrarWorkersCampanhas();
  await registrarWorkerMensagensAgendadas();
  await registrarWorkerLembretes();
  await registrarWorkerWebhooksRetry();
  await registrarWorkerBuscaSincronizacao();

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
