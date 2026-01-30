import { Queue, Worker, type Job as BullJob } from 'bullmq';

import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import type { NomeJob, JobPayloads, OpcoesJob } from './tipos.js';

// =============================================================================
// Conexao Redis para BullMQ
// =============================================================================

const redisConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  password: new URL(env.REDIS_URL).password || undefined,
};

// =============================================================================
// Filas e Workers
// =============================================================================

const filas = new Map<string, Queue>();
const workers = new Map<string, Worker>();

// =============================================================================
// Nomes das filas
// =============================================================================

const NOMES_FILAS: NomeJob[] = [
  'campanha.processar',
  'campanha.enviar-mensagem',
  'mensagem-agendada.enviar',
  'lembrete.enviar',
  'webhook.retry',
  'busca.sincronizar',
];

// =============================================================================
// Inicializar Filas
// =============================================================================

export async function iniciarFilas(): Promise<void> {
  for (const nome of NOMES_FILAS) {
    const queue = new Queue(nome, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    });
    filas.set(nome, queue);
  }

  logger.info('BullMQ: Filas inicializadas');
}

// =============================================================================
// Parar Filas e Workers
// =============================================================================

export async function pararFilas(): Promise<void> {
  // Parar workers primeiro (graceful)
  for (const [nome, worker] of workers) {
    await worker.close();
    logger.debug({ nome }, 'BullMQ: Worker parado');
  }
  workers.clear();

  // Fechar filas
  for (const [nome, queue] of filas) {
    await queue.close();
    logger.debug({ nome }, 'BullMQ: Fila fechada');
  }
  filas.clear();

  logger.info('BullMQ: Todas filas e workers parados');
}

// =============================================================================
// Obter Fila
// =============================================================================

function obterFila(nome: NomeJob): Queue {
  const queue = filas.get(nome);
  if (!queue) {
    throw new Error(`BullMQ: Fila '${nome}' nao inicializada. Chame iniciarFilas() primeiro.`);
  }
  return queue;
}

// =============================================================================
// Enviar Job para Fila
// =============================================================================

export async function enviarJob<T extends NomeJob>(
  nome: T,
  dados: JobPayloads[T],
  opcoes?: OpcoesJob,
): Promise<string | null> {
  const queue = obterFila(nome);

  const bullOpcoes: Parameters<Queue['add']>[2] = {
    attempts: opcoes?.retryLimit ?? 3,
    backoff: opcoes?.retryBackoff !== false
      ? { type: 'exponential', delay: (opcoes?.retryDelay ?? 30) * 1000 }
      : { type: 'fixed', delay: (opcoes?.retryDelay ?? 30) * 1000 },
    priority: opcoes?.priority,
  };

  // startAfter → delay em ms
  if (opcoes?.startAfter) {
    const startTime = opcoes.startAfter instanceof Date
      ? opcoes.startAfter.getTime()
      : typeof opcoes.startAfter === 'string'
        ? new Date(opcoes.startAfter).getTime()
        : opcoes.startAfter;
    const delay = Math.max(0, startTime - Date.now());
    bullOpcoes.delay = delay;
  }

  // singletonKey → jobId (BullMQ deduplication)
  if (opcoes?.singletonKey) {
    bullOpcoes.jobId = opcoes.singletonKey;
  }

  // expireInSeconds → removido após TTL (não processado)
  // BullMQ não tem equivalente direto, mas podemos usar removeOnFail com age
  // Para jobs com TTL, removemos após expirar

  const job = await queue.add(nome, dados, bullOpcoes);

  if (job.id) {
    logger.debug({ jobId: job.id, nome, dados }, 'BullMQ: Job enviado');
  }

  return job.id ?? null;
}

// =============================================================================
// Agendar Job para Horario Especifico
// =============================================================================

export async function agendarJob<T extends NomeJob>(
  nome: T,
  dados: JobPayloads[T],
  dataHora: Date,
  opcoes?: Omit<OpcoesJob, 'startAfter'>,
): Promise<string | null> {
  return enviarJob(nome, dados, {
    ...opcoes,
    startAfter: dataHora,
  });
}

// =============================================================================
// Registrar Worker
// =============================================================================

interface WorkerOpcoes {
  batchSize?: number;
  pollingIntervalSeconds?: number;
  lockDuration?: number; // Duração máxima do lock (ms) - timeout do job
  stalledInterval?: number; // Intervalo para verificar jobs travados (ms)
  maxStalledCount?: number; // Máximo de vezes que pode ficar travado
}

// Interface de job compatível com pg-boss (id, name, data)
interface JobCompat<T> {
  id: string;
  name: string;
  data: T;
}

type WorkerHandler<T> = (job: JobCompat<T>) => Promise<void>;

export async function registrarWorker<T extends NomeJob>(
  nome: T,
  handler: WorkerHandler<JobPayloads[T]>,
  opcoes?: WorkerOpcoes,
): Promise<string> {
  const concurrency = opcoes?.batchSize ?? 1;

  const worker = new Worker<JobPayloads[T]>(
    nome,
    async (job: BullJob<JobPayloads[T]>) => {
      // Adaptar BullJob para interface compatível com pg-boss
      const jobCompat: JobCompat<JobPayloads[T]> = {
        id: job.id ?? '',
        name: job.name,
        data: job.data,
      };

      // Timeout individual por job
      const lockDuration = opcoes?.lockDuration ?? 120000; // 2 min padrão
      const timeoutId = setTimeout(() => {
        logger.error(
          { jobId: job.id, nome, lockDuration },
          'BullMQ: Job excedeu timeout - será marcado como stalled'
        );
      }, lockDuration);

      try {
        await handler(jobCompat);
      } finally {
        clearTimeout(timeoutId);
      }
    },
    {
      connection: redisConnection,
      concurrency,
      lockDuration: opcoes?.lockDuration ?? 120000, // 2 minutos lock padrão
      ...(opcoes?.stalledInterval && { stalledInterval: opcoes.stalledInterval }),
      ...(opcoes?.maxStalledCount && { maxStalledCount: opcoes.maxStalledCount }),
    },
  );

  worker.on('failed', (job, err) => {
    logger.error(
      { jobId: job?.id, nome, erro: err.message },
      'BullMQ: Job falhou',
    );
  });

  worker.on('error', (err) => {
    logger.error({ nome, erro: err.message }, 'BullMQ: Erro no worker');
  });

  workers.set(nome, worker);

  const workerId = `worker:${nome}:${Date.now()}`;
  logger.info({ nome, workerId, concurrency }, 'BullMQ: Worker registrado');

  return workerId;
}

// =============================================================================
// Cancelar Job
// =============================================================================

export async function cancelarJob(nome: string, jobId: string): Promise<void> {
  const queue = filas.get(nome);
  if (!queue) return;

  const job = await queue.getJob(jobId);
  if (job) {
    await job.remove();
    logger.debug({ jobId }, 'BullMQ: Job cancelado');
  }
}

// =============================================================================
// Cancelar Jobs por Singleton Key
// =============================================================================

export async function cancelarJobsPorChave(nome: NomeJob, singletonKey: string): Promise<void> {
  // Em BullMQ, singletonKey é usado como jobId, então podemos cancelar diretamente
  await cancelarJob(nome, singletonKey);
  logger.debug({ nome, singletonKey }, 'BullMQ: Job cancelado por chave');
}

// =============================================================================
// Obter Status do Job
// =============================================================================

export async function obterStatusJob(nome: string, jobId: string): Promise<JobCompat<unknown> | null> {
  const queue = filas.get(nome);
  if (!queue) return null;

  const job = await queue.getJob(jobId);
  if (!job) return null;

  return {
    id: job.id ?? '',
    name: job.name,
    data: job.data,
  };
}

// =============================================================================
// Completar Job Manualmente
// =============================================================================

export async function completarJob(nome: string, jobId: string, dados?: object): Promise<void> {
  const queue = filas.get(nome);
  if (!queue) return;

  const job = await queue.getJob(jobId);
  if (job) {
    await job.moveToCompleted(dados ?? {}, '', false);
  }
}

// =============================================================================
// Falhar Job Manualmente
// =============================================================================

export async function falharJob(nome: string, jobId: string, erro: Error): Promise<void> {
  const queue = filas.get(nome);
  if (!queue) return;

  const job = await queue.getJob(jobId);
  if (job) {
    await job.moveToFailed(erro, '', false);
  }
}

// =============================================================================
// Obter Contagem de Jobs
// =============================================================================

export async function obterContagemJobs(nome: NomeJob): Promise<{
  deferred: number;
  queued: number;
  active: number;
  total: number;
}> {
  const queue = obterFila(nome);
  const counts = await queue.getJobCounts('delayed', 'waiting', 'active');

  return {
    deferred: counts.delayed ?? 0,
    queued: counts.waiting ?? 0,
    active: counts.active ?? 0,
    total: (counts.delayed ?? 0) + (counts.waiting ?? 0) + (counts.active ?? 0),
  };
}

// =============================================================================
// Limpar Jobs Antigos (BullMQ limpa automaticamente via removeOnComplete/Fail)
// =============================================================================

export async function limparJobsAntigos(): Promise<void> {
  logger.info('BullMQ: Limpeza automatica via removeOnComplete/removeOnFail');
}

// =============================================================================
// Obter todas as filas (para Bull Board)
// =============================================================================

export function obterTodasFilas(): Queue[] {
  return Array.from(filas.values());
}
