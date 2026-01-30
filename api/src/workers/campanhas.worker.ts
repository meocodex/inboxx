import { eq, and, notInArray, inArray, count, exists } from 'drizzle-orm';

import { db } from '../infraestrutura/banco/drizzle.servico.js';
import { campanhas, campanhasLog, contatos, contatosEtiquetas } from '../infraestrutura/banco/schema/index.js';
import { registrarWorker, enviarJob } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import type { JobCampanhaProcessar, JobCampanhaEnviarMensagem } from '../infraestrutura/filas/tipos.js';

// =============================================================================
// Constantes
// =============================================================================

const BATCH_SIZE = 50; // Processar 50 contatos por vez

// =============================================================================
// Tipos de Job
// =============================================================================

interface Job<T> {
  id: string;
  name: string;
  data: T;
}

// =============================================================================
// Worker: Processar Campanha
// =============================================================================

async function processarCampanha(job: Job<JobCampanhaProcessar>): Promise<void> {
  const { campanhaId, clienteId } = job.data;

  logger.info({ campanhaId, clienteId }, 'Worker: Iniciando processamento da campanha');

  try {
    // Buscar campanha
    const [campanha] = await db
      .select()
      .from(campanhas)
      .where(and(eq(campanhas.id, campanhaId), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (!campanha) {
      logger.warn({ campanhaId }, 'Worker: Campanha nao encontrada');
      return;
    }

    if (campanha.status !== 'EM_ANDAMENTO') {
      logger.warn({ campanhaId, status: campanha.status }, 'Worker: Campanha nao esta em andamento');
      return;
    }

    // Buscar contatos que ainda não receberam a campanha
    const logsExistentes = await db
      .select({ contatoId: campanhasLog.contatoId })
      .from(campanhasLog)
      .where(eq(campanhasLog.campanhaId, campanhaId));

    const contatosJaEnviados = logsExistentes.map((l) => l.contatoId);

    // Buscar contatos do cliente baseado nos filtros da campanha
    const filtros = campanha.filtros as { etiquetas?: string[] } | null;
    const etiquetaIds = filtros?.etiquetas ?? [];

    // Construir condicoes de filtro
    const condicoesContatos = [
      eq(contatos.clienteId, clienteId),
      ...(contatosJaEnviados.length > 0 ? [notInArray(contatos.id, contatosJaEnviados)] : []),
      ...(etiquetaIds.length > 0
        ? [
            exists(
              db
                .select({ _: contatosEtiquetas.contatoId })
                .from(contatosEtiquetas)
                .where(
                  and(
                    eq(contatosEtiquetas.contatoId, contatos.id),
                    inArray(contatosEtiquetas.etiquetaId, etiquetaIds)
                  )
                )
            ),
          ]
        : []),
    ];

    const contatosResult = await db
      .select({
        id: contatos.id,
        telefone: contatos.telefone,
        nome: contatos.nome,
      })
      .from(contatos)
      .where(and(...condicoesContatos))
      .limit(BATCH_SIZE);

    if (contatosResult.length === 0) {
      // Finalizar campanha
      await db
        .update(campanhas)
        .set({
          status: 'CONCLUIDA',
          finalizadoEm: new Date(),
        })
        .where(eq(campanhas.id, campanhaId));

      logger.info({ campanhaId }, 'Worker: Campanha concluida - sem mais contatos');
      return;
    }

    // Criar logs de campanha como PENDENTE
    await db.insert(campanhasLog).values(
      contatosResult.map((contato) => ({
        campanhaId,
        contatoId: contato.id,
        status: 'PENDENTE' as const,
      }))
    );

    // Criar jobs para cada contato
    let delay = 0;
    for (const contato of contatosResult) {
      await enviarJob(
        'campanha.enviar-mensagem',
        {
          campanhaId,
          clienteId,
          contatoId: contato.id,
          telefone: contato.telefone,
          conteudo: campanha.template,
          midiaUrl: campanha.midiaUrl ?? undefined,
          tentativa: 1,
        },
        {
          startAfter: new Date(Date.now() + delay),
          singletonKey: `campanha:${campanhaId}:contato:${contato.id}`,
        }
      );

      delay += campanha.intervaloMs;
    }

    // Se ainda houver mais contatos, agendar proxima execucao
    const [totalResult] = await db
      .select({ total: count() })
      .from(contatos)
      .where(and(...condicoesContatos));
    const totalRestante = totalResult?.total ?? 0;

    if (totalRestante > contatosResult.length) {
      await enviarJob(
        'campanha.processar',
        { campanhaId, clienteId },
        {
          startAfter: new Date(Date.now() + delay + 5000),
        }
      );
    }

    logger.info(
      { campanhaId, contatosProcessados: contatosResult.length },
      'Worker: Lote de campanha processado'
    );
  } catch (erro) {
    logger.error({ erro, campanhaId }, 'Worker: Erro ao processar campanha');

    // Marcar campanha com erro
    await db
      .update(campanhas)
      .set({ status: 'CANCELADA' })
      .where(eq(campanhas.id, campanhaId));

    throw erro;
  }
}

// =============================================================================
// Worker: Enviar Mensagem da Campanha
// =============================================================================

async function enviarMensagemCampanha(job: Job<JobCampanhaEnviarMensagem>): Promise<void> {
  const { campanhaId, contatoId, tentativa } = job.data;

  logger.debug({ campanhaId, contatoId }, 'Worker: Enviando mensagem da campanha');

  try {
    // ==========================================================================
    // IDEMPOTÊNCIA: Verificar se mensagem já foi enviada
    // ==========================================================================
    const [logExistente] = await db
      .select()
      .from(campanhasLog)
      .where(
        and(
          eq(campanhasLog.campanhaId, campanhaId),
          eq(campanhasLog.contatoId, contatoId),
          eq(campanhasLog.status, 'ENVIADO')
        )
      )
      .limit(1);

    if (logExistente && logExistente.enviadoEm) {
      logger.info(
        { campanhaId, contatoId, enviadoEm: logExistente.enviadoEm },
        'Worker: Mensagem já foi enviada - pulando (idempotência)'
      );
      return; // Pular envio duplicado
    }

    // TODO: Integrar com provedor WhatsApp real
    // Por enquanto, apenas simula o envio
    const enviado = Math.random() > 0.1; // 90% de sucesso simulado

    if (enviado) {
      // Atualizar log da campanha
      await db
        .update(campanhasLog)
        .set({
          status: 'ENVIADO',
          enviadoEm: new Date(),
        })
        .where(and(eq(campanhasLog.campanhaId, campanhaId), eq(campanhasLog.contatoId, contatoId)));

      logger.debug({ campanhaId, contatoId }, 'Worker: Mensagem da campanha enviada');
    } else {
      throw new Error('Falha simulada no envio');
    }
  } catch (erro) {
    logger.error({ erro, campanhaId, contatoId, tentativa }, 'Worker: Erro ao enviar mensagem');

    // Registrar falha no log
    await db
      .update(campanhasLog)
      .set({
        status: 'ERRO',
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
      })
      .where(and(eq(campanhasLog.campanhaId, campanhaId), eq(campanhasLog.contatoId, contatoId)));

    // Retry se ainda nao atingiu limite
    if (tentativa < 3) {
      await enviarJob(
        'campanha.enviar-mensagem',
        { ...job.data, tentativa: tentativa + 1 },
        {
          startAfter: new Date(Date.now() + 60000 * tentativa), // Backoff exponencial
        }
      );
    } else {
      // =======================================================================
      // DEAD LETTER QUEUE: Enviar job para DLQ após 3 tentativas
      // =======================================================================
      logger.warn(
        { campanhaId, contatoId, tentativa },
        'Worker: Job falhou após 3 tentativas - enviando para DLQ'
      );

      await enviarJob('dlq.processar', {
        origem: 'campanha.enviar-mensagem',
        jobOriginal: { ...job.data, jobId: job.id },
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
        tentativasOriginais: 3,
        timestampFalha: new Date().toISOString(),
      });
    }
  }
}

// =============================================================================
// Registrar Workers
// =============================================================================

export async function registrarWorkersCampanhas(): Promise<void> {
  await registrarWorker('campanha.processar', processarCampanha, {
    batchSize: 1,
    lockDuration: 300000, // 5 minutos (processa lote de contatos)
    stalledInterval: 30000, // Verificar a cada 30s
    maxStalledCount: 2, // Máx 2 tentativas
  });

  await registrarWorker('campanha.enviar-mensagem', enviarMensagemCampanha, {
    batchSize: 5,
    lockDuration: 120000, // 2 minutos (envio simples)
    stalledInterval: 30000,
    maxStalledCount: 2,
  });

  logger.info('Workers de campanhas registrados com timeouts configurados');
}
