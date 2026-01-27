import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const IORedis = require('ioredis');

import { env } from '../../configuracao/ambiente.js';

const criarClienteRedis = () => {
  const cliente = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) {
        console.error('Redis: Maximo de tentativas de reconexao atingido');
        return null;
      }
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    lazyConnect: true,
  });

  cliente.on('connect', () => {
    console.log('Redis: Conectado com sucesso');
  });

  cliente.on('error', (erro: Error) => {
    console.error('Redis: Erro de conexao', erro.message);
  });

  cliente.on('reconnecting', () => {
    console.log('Redis: Reconectando...');
  });

  return cliente;
};

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof criarClienteRedis> | undefined;
};

export const redis = globalForRedis.redis ?? criarClienteRedis();

if (env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}

// Verificar se Redis está disponível
function redisDisponivel(): boolean {
  return redis.status === 'ready' || redis.status === 'connect';
}

export const cacheUtils = {
  async obter<T>(chave: string): Promise<T | null> {
    if (!redisDisponivel()) return null;
    try {
      const valor = await redis.get(chave);
      if (!valor) return null;
      return JSON.parse(valor) as T;
    } catch {
      return null;
    }
  },

  async definir<T>(chave: string, valor: T, ttlSegundos: number): Promise<void> {
    if (!redisDisponivel()) return;
    try {
      await redis.setex(chave, ttlSegundos, JSON.stringify(valor));
    } catch {
      // Ignora erro se Redis indisponivel
    }
  },

  async remover(chave: string): Promise<void> {
    if (!redisDisponivel()) return;
    try {
      await redis.del(chave);
    } catch {
      // Ignora erro se Redis indisponivel
    }
  },

  async removerPorPadrao(padrao: string): Promise<number> {
    if (!redisDisponivel()) return 0;
    try {
      let cursor = '0';
      let totalRemovidos = 0;

      do {
        const [novoCursor, chaves] = await redis.scan(cursor, 'MATCH', padrao, 'COUNT', 100);
        cursor = novoCursor;

        if (chaves.length > 0) {
          await redis.del(...chaves);
          totalRemovidos += chaves.length;
        }
      } while (cursor !== '0');

      return totalRemovidos;
    } catch {
      return 0;
    }
  },

  disponivel(): boolean {
    return redisDisponivel();
  },
};

// Criar par de clientes pub/sub para Socket.io Redis adapter
export function criarClientesPubSub(): { pubClient: ReturnType<typeof criarClienteRedis>; subClient: ReturnType<typeof criarClienteRedis> } {
  const pubClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  const subClient = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 3) return null;
      return Math.min(times * 200, 2000);
    },
  });

  return { pubClient, subClient };
}

// Servico de Redis para WebSocket (operacoes hash)
export const redisServico = {
  async hset(chave: string, campo: string, valor: string): Promise<void> {
    if (!redisDisponivel()) return;
    try {
      await redis.hset(chave, campo, valor);
    } catch {
      // Ignora erro se Redis indisponivel
    }
  },

  async hdel(chave: string, campo: string): Promise<void> {
    if (!redisDisponivel()) return;
    try {
      await redis.hdel(chave, campo);
    } catch {
      // Ignora erro se Redis indisponivel
    }
  },

  async hgetall(chave: string): Promise<Record<string, string> | null> {
    if (!redisDisponivel()) return null;
    try {
      return await redis.hgetall(chave);
    } catch {
      return null;
    }
  },
};
