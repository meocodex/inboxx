import { Registry, Counter, Histogram, Gauge, collectDefaultMetrics } from 'prom-client';
import Fastify, { type FastifyRequest, type FastifyReply } from 'fastify';
import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Prometheus Metrics
// =============================================================================

export const registro = new Registry();

registro.setDefaultLabels({ app: 'crm-api', env: env.NODE_ENV });

// Metricas padrao do Node.js (event loop, heap, GC, etc.)
collectDefaultMetrics({ register: registro });

// =============================================================================
// Metricas Customizadas
// =============================================================================

export const httpRequestsTotal = new Counter({
  name: 'crm_http_requests_total',
  help: 'Total de requisicoes HTTP',
  labelNames: ['method', 'route', 'status_code'] as const,
  registers: [registro],
});

export const httpRequestDuration = new Histogram({
  name: 'crm_http_request_duration_seconds',
  help: 'Duracao das requisicoes HTTP em segundos',
  labelNames: ['method', 'route', 'status_code'] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registro],
});

export const websocketConnectionsActive = new Gauge({
  name: 'crm_websocket_connections_active',
  help: 'Conexoes WebSocket ativas',
  registers: [registro],
});

export const jobsProcessedTotal = new Counter({
  name: 'crm_jobs_processed_total',
  help: 'Total de jobs processados',
  labelNames: ['queue', 'status'] as const,
  registers: [registro],
});

export const meilisearchQueriesTotal = new Counter({
  name: 'crm_meilisearch_queries_total',
  help: 'Total de consultas ao Meilisearch',
  labelNames: ['index', 'status'] as const,
  registers: [registro],
});

export const conversasAbertas = new Gauge({
  name: 'crm_conversas_abertas',
  help: 'Numero de conversas abertas',
  registers: [registro],
});

// =============================================================================
// Servidor de Metricas (porta separada para Prometheus scraping)
// =============================================================================

let servidorMetricas: ReturnType<typeof Fastify> | null = null;

export async function iniciarServidorMetricas(): Promise<void> {
  const porta = env.OTEL_METRICS_PORT;

  servidorMetricas = Fastify({ logger: false });

  servidorMetricas.get('/api/metricas', async (_req: FastifyRequest, reply: FastifyReply) => {
    const metricas = await registro.metrics();
    reply.header('Content-Type', registro.contentType).send(metricas);
  });

  try {
    await servidorMetricas.listen({ port: porta, host: '0.0.0.0' });
    logger.info({ porta }, 'Servidor de metricas Prometheus iniciado');
  } catch (erro) {
    logger.warn({ erro, porta }, 'Falha ao iniciar servidor de metricas');
    servidorMetricas = null;
  }
}

export async function pararServidorMetricas(): Promise<void> {
  if (servidorMetricas) {
    await servidorMetricas.close();
    logger.debug('Servidor de metricas encerrado');
  }
}
