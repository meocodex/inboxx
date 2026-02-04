import 'dotenv/config';

import { criarServidor } from './servidor.js';
import { env } from './configuracao/ambiente.js';
import { verificarConexaoBancoDrizzle, fecharConexaoBanco } from './infraestrutura/banco/drizzle.servico.js';
import { redis } from './infraestrutura/cache/redis.servico.js';
import { criarSocketGateway } from './websocket/index.js';
import { iniciarFilas, pararFilas, registrarDashboardFilas } from './infraestrutura/filas/index.js';
import { registrarTodosWorkers } from './workers/index.js';
import { verificarConexaoMeilisearch, configurarIndices } from './infraestrutura/busca/index.js';
import {
  iniciarTracing,
  pararTracing,
  iniciarServidorMetricas,
  pararServidorMetricas,
  iniciarSentry,
  fecharSentry,
} from './infraestrutura/observabilidade/index.js';
import { logger } from './compartilhado/utilitarios/logger.js';

async function iniciar() {
  logger.info('═'.repeat(50));
  logger.info('CRM WhatsApp Omnichannel API');
  logger.info('═'.repeat(50));
  logger.info({ ambiente: env.NODE_ENV, porta: env.PORT }, 'Configuracao do servidor');
  logger.info('═'.repeat(50));

  try {
    // Inicializar Sentry (antes de tudo para capturar erros de boot)
    iniciarSentry();

    // Inicializar OpenTelemetry tracing
    logger.info('Inicializando observabilidade...');
    await iniciarTracing();
    logger.info('OpenTelemetry tracing inicializado');

    // Verificar conexao com banco de dados
    logger.info('Verificando conexao com PostgreSQL...');
    const bancoOk = await verificarConexaoBancoDrizzle();
    if (!bancoOk) {
      throw new Error('Falha ao conectar com PostgreSQL');
    }
    logger.info('PostgreSQL conectado');

    // Verificar conexao com Redis
    logger.info('Verificando conexao com Redis...');
    try {
      await redis.connect();
      await redis.ping();
      logger.info('Redis conectado');
    } catch (redisError) {
      logger.warn('Redis nao disponivel (cache desabilitado)');
    }

    // Verificar conexao com Meilisearch
    logger.info('Verificando conexao com Meilisearch...');
    try {
      const meiliOk = await verificarConexaoMeilisearch();
      if (meiliOk) {
        await configurarIndices();
        logger.info('Meilisearch conectado e indices configurados');
      } else {
        logger.warn('Meilisearch nao disponivel (busca usa PostgreSQL ILIKE)');
      }
    } catch (meiliError) {
      logger.warn('Meilisearch falhou (busca usa PostgreSQL ILIKE)');
    }

    // Criar servidor Fastify
    const app = await criarServidor();

    // Aguardar Fastify estar pronto para obter o servidor HTTP
    await app.ready();

    // Inicializar WebSocket Gateway usando o servidor HTTP do Fastify
    logger.info('Inicializando WebSocket...');
    criarSocketGateway(app.server);
    logger.info('WebSocket inicializado');

    // Inicializar BullMQ (filas de jobs)
    logger.info('Inicializando BullMQ (filas)...');
    try {
      await iniciarFilas();
      await registrarTodosWorkers();
      logger.info('BullMQ inicializado');
    } catch (bullmqError) {
      logger.warn('BullMQ falhou (filas desabilitadas)');
    }

    // Registrar Bull Board (dashboard de filas)
    logger.info('Registrando Bull Board...');
    try {
      await registrarDashboardFilas(app);
      logger.info('Bull Board disponivel em /api/filas/dashboard');
    } catch (dashboardError) {
      logger.warn('Bull Board falhou (dashboard indisponivel)');
    }

    // Iniciar servidor de metricas Prometheus
    logger.info('Inicializando servidor de metricas...');
    try {
      await iniciarServidorMetricas();
    } catch (metricasError) {
      logger.warn('Servidor de metricas falhou');
    }

    // Iniciar servidor Fastify (que já inclui WebSocket)
    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    logger.info('═'.repeat(50));
    logger.info({ url: `http://localhost:${env.PORT}` }, 'Servidor rodando');
    logger.info({ healthCheck: `http://localhost:${env.PORT}/api/saude` }, 'Health check');
    logger.info({ websocket: `ws://localhost:${env.PORT}` }, 'WebSocket');
    logger.info({ metricas: `http://localhost:${env.OTEL_METRICS_PORT}/api/metricas` }, 'Metricas');
    logger.info('═'.repeat(50));
  } catch (erro) {
    logger.fatal({ erro }, 'Erro ao iniciar servidor');
    process.exit(1);
  }
}

// Graceful shutdown
const sinaisParada = ['SIGINT', 'SIGTERM'];

sinaisParada.forEach((sinal) => {
  process.on(sinal, async () => {
    logger.info({ sinal }, 'Recebido sinal, encerrando...');

    try {
      await pararFilas();
      logger.info('BullMQ parado');

      await pararServidorMetricas();
      logger.info('Servidor de metricas parado');

      await pararTracing();
      logger.info('OpenTelemetry parado');

      await fecharSentry();
      logger.info('Sentry encerrado');

      await fecharConexaoBanco();
      logger.info('PostgreSQL desconectado');

      await redis.quit();
      logger.info('Redis desconectado');

      logger.info('Servidor encerrado com sucesso');
      process.exit(0);
    } catch (erro) {
      logger.fatal({ erro }, 'Erro ao encerrar');
      process.exit(1);
    }
  });
});

// Iniciar aplicacao
iniciar();
