import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { redis } from '../../infraestrutura/cache/redis.servico.js';
import { sql } from 'drizzle-orm';

interface StatusServico {
  status: 'ok' | 'erro';
  latencia?: number;
  erro?: string;
}

interface RespostaSaude {
  status: 'saudavel' | 'degradado' | 'indisponivel';
  timestamp: string;
  versao: string;
  servicos: {
    api: StatusServico;
    banco: StatusServico;
    cache: StatusServico;
  };
  uptime: number;
}

async function verificarBanco(): Promise<StatusServico> {
  const inicio = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'ok',
      latencia: Date.now() - inicio,
    };
  } catch (erro) {
    return {
      status: 'erro',
      latencia: Date.now() - inicio,
      erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
    };
  }
}

async function verificarCache(): Promise<StatusServico> {
  const inicio = Date.now();
  try {
    await redis.ping();
    return {
      status: 'ok',
      latencia: Date.now() - inicio,
    };
  } catch (erro) {
    return {
      status: 'erro',
      latencia: Date.now() - inicio,
      erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
    };
  }
}

function calcularStatusGeral(
  banco: StatusServico,
  cache: StatusServico
): 'saudavel' | 'degradado' | 'indisponivel' {
  if (banco.status === 'erro') {
    return 'indisponivel';
  }
  if (cache.status === 'erro') {
    return 'degradado';
  }
  return 'saudavel';
}

export async function saudeRotas(app: FastifyInstance) {
  // GET /api/saude - Health check completo
  app.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const [banco, cache] = await Promise.all([verificarBanco(), verificarCache()]);

    const statusGeral = calcularStatusGeral(banco, cache);

    const resposta: RespostaSaude = {
      status: statusGeral,
      timestamp: new Date().toISOString(),
      versao: '1.0.0',
      servicos: {
        api: { status: 'ok' },
        banco,
        cache,
      },
      uptime: process.uptime(),
    };

    const httpStatus = statusGeral === 'indisponivel' ? 503 : 200;

    return reply.status(httpStatus).send(resposta);
  });

  // GET /api/saude/ping - Health check simples
  app.get('/ping', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ pong: true, timestamp: Date.now() });
  });

  // GET /api/saude/pronto - Readiness check (para Kubernetes)
  app.get('/pronto', async (_request: FastifyRequest, reply: FastifyReply) => {
    const banco = await verificarBanco();

    if (banco.status === 'erro') {
      return reply.status(503).send({
        pronto: false,
        motivo: 'Banco de dados indisponivel',
      });
    }

    return reply.send({ pronto: true });
  });

  // GET /api/saude/vivo - Liveness check (para Kubernetes)
  app.get('/vivo', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ vivo: true });
  });
}
