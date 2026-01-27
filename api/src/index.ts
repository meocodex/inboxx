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

async function iniciar() {
  console.log('\n');
  console.log('═'.repeat(50));
  console.log('🚀 CRM WhatsApp Omnichannel API');
  console.log('═'.repeat(50));
  console.log(`   Ambiente: ${env.NODE_ENV}`);
  console.log(`   Porta: ${env.PORT}`);
  console.log('═'.repeat(50));
  console.log('\n');

  try {
    // Inicializar Sentry (antes de tudo para capturar erros de boot)
    iniciarSentry();

    // Inicializar OpenTelemetry tracing
    console.log('📊 Inicializando observabilidade...');
    await iniciarTracing();
    console.log('   ✅ OpenTelemetry tracing inicializado\n');

    // Verificar conexao com banco de dados
    console.log('📦 Verificando conexao com PostgreSQL...');
    const bancoOk = await verificarConexaoBancoDrizzle();
    if (!bancoOk) {
      throw new Error('Falha ao conectar com PostgreSQL');
    }
    console.log('   ✅ PostgreSQL conectado\n');

    // Verificar conexao com Redis
    console.log('📦 Verificando conexao com Redis...');
    try {
      await redis.connect();
      await redis.ping();
      console.log('   ✅ Redis conectado\n');
    } catch (redisError) {
      console.warn('   ⚠️  Redis nao disponivel (cache desabilitado)\n');
    }

    // Verificar conexao com Meilisearch
    console.log('🔍 Verificando conexao com Meilisearch...');
    try {
      const meiliOk = await verificarConexaoMeilisearch();
      if (meiliOk) {
        await configurarIndices();
        console.log('   ✅ Meilisearch conectado e indices configurados\n');
      } else {
        console.warn('   ⚠️  Meilisearch nao disponivel (busca usa PostgreSQL ILIKE)\n');
      }
    } catch (meiliError) {
      console.warn('   ⚠️  Meilisearch falhou (busca usa PostgreSQL ILIKE)\n');
    }

    // Criar servidor Fastify
    const app = await criarServidor();

    // Aguardar Fastify estar pronto para obter o servidor HTTP
    await app.ready();

    // Inicializar WebSocket Gateway usando o servidor HTTP do Fastify
    console.log('🔌 Inicializando WebSocket...');
    criarSocketGateway(app.server);
    console.log('   ✅ WebSocket inicializado\n');

    // Inicializar BullMQ (filas de jobs)
    console.log('📋 Inicializando BullMQ (filas)...');
    try {
      await iniciarFilas();
      await registrarTodosWorkers();
      console.log('   ✅ BullMQ inicializado\n');
    } catch (bullmqError) {
      console.warn('   ⚠️  BullMQ falhou (filas desabilitadas)\n');
    }

    // Registrar Bull Board (dashboard de filas)
    console.log('📊 Registrando Bull Board...');
    try {
      await registrarDashboardFilas(app);
      console.log('   ✅ Bull Board disponivel em /api/filas/dashboard\n');
    } catch (dashboardError) {
      console.warn('   ⚠️  Bull Board falhou (dashboard indisponivel)\n');
    }

    // Iniciar servidor de metricas Prometheus
    console.log('📈 Inicializando servidor de metricas...');
    try {
      await iniciarServidorMetricas();
    } catch (metricasError) {
      console.warn('   ⚠️  Servidor de metricas falhou\n');
    }

    // Iniciar servidor Fastify (que já inclui WebSocket)
    await app.listen({ port: env.PORT, host: '0.0.0.0' });

    console.log('═'.repeat(50));
    console.log(`✅ Servidor rodando em http://localhost:${env.PORT}`);
    console.log(`📋 Health check: http://localhost:${env.PORT}/api/saude`);
    console.log(`🔌 WebSocket: ws://localhost:${env.PORT}`);
    console.log(`📈 Metricas: http://localhost:${env.OTEL_METRICS_PORT}/api/metricas`);
    console.log('═'.repeat(50));
    console.log('\n');
  } catch (erro) {
    console.error('❌ Erro ao iniciar servidor:', erro);
    process.exit(1);
  }
}

// Graceful shutdown
const sinaisParada = ['SIGINT', 'SIGTERM'];

sinaisParada.forEach((sinal) => {
  process.on(sinal, async () => {
    console.log(`\n📴 Recebido ${sinal}, encerrando...`);

    try {
      await pararFilas();
      console.log('   ✅ BullMQ parado');

      await pararServidorMetricas();
      console.log('   ✅ Servidor de metricas parado');

      await pararTracing();
      console.log('   ✅ OpenTelemetry parado');

      await fecharSentry();
      console.log('   ✅ Sentry encerrado');

      await fecharConexaoBanco();
      console.log('   ✅ PostgreSQL desconectado');

      await redis.quit();
      console.log('   ✅ Redis desconectado');

      console.log('👋 Servidor encerrado com sucesso\n');
      process.exit(0);
    } catch (erro) {
      console.error('❌ Erro ao encerrar:', erro);
      process.exit(1);
    }
  });
});

// Iniciar aplicacao
iniciar();
