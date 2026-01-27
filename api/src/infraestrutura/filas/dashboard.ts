import { FastifyInstance } from 'fastify';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';

import { obterTodasFilas } from './bullmq.servico.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Registrar Bull Board no Fastify
// =============================================================================

export async function registrarDashboardFilas(app: FastifyInstance): Promise<void> {
  const filas = obterTodasFilas();

  if (filas.length === 0) {
    logger.warn('Bull Board: Nenhuma fila encontrada para monitorar');
    return;
  }

  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/api/filas/dashboard');

  createBullBoard({
    queues: filas.map((fila) => new BullMQAdapter(fila)),
    serverAdapter,
  });

  await app.register(serverAdapter.registerPlugin(), {
    prefix: '/api/filas/dashboard',
  });

  logger.info(`Bull Board: Dashboard disponivel em /api/filas/dashboard`);
}
