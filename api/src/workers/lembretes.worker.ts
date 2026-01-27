import { eq, and } from 'drizzle-orm';

import { db } from '../infraestrutura/banco/drizzle.servico.js';
import { lembretes, compromissos, contatos } from '../infraestrutura/banco/schema/index.js';
import { registrarWorker } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import { notificarUsuario } from '../websocket/eventos/notificacao.eventos.js';
import type { JobLembrete } from '../infraestrutura/filas/tipos.js';

// =============================================================================
// Tipos de Job
// =============================================================================

interface Job<T> {
  id: string;
  name: string;
  data: T;
}

// =============================================================================
// Worker: Enviar Lembrete
// =============================================================================

async function enviarLembrete(job: Job<JobLembrete>): Promise<void> {
  const { lembreteId, compromissoId, usuarioId, titulo, descricao, contatoTelefone, enviarWhatsApp } =
    job.data;

  logger.info({ lembreteId, compromissoId, usuarioId }, 'Worker: Processando lembrete');

  try {
    // Verificar se o lembrete ainda existe e nao foi enviado
    // leftJoin compromisso -> leftJoin contato
    const [resultado] = await db
      .select({
        lembrete: lembretes,
        compromisso: compromissos,
        contato: contatos,
      })
      .from(lembretes)
      .leftJoin(compromissos, eq(lembretes.compromissoId, compromissos.id))
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(and(eq(lembretes.id, lembreteId), eq(lembretes.enviado, false)))
      .limit(1);

    if (!resultado) {
      logger.warn({ lembreteId }, 'Worker: Lembrete nao encontrado ou ja enviado');
      return;
    }

    const lembrete = resultado.lembrete;
    const compromisso = resultado.compromisso;
    const contato = resultado.contato;

    // Enviar notificacao via WebSocket para o usuario
    notificarUsuario(usuarioId, {
      tipo: 'aviso',
      titulo: 'Lembrete de Compromisso',
      mensagem: `${titulo}${descricao ? ` - ${descricao}` : ''}`,
      dados: {
        compromissoId,
        lembreteId,
        dataHora: compromisso!.dataHora.toISOString(),
      },
      acao: {
        label: 'Ver agenda',
        url: '/agenda',
      },
    });

    logger.info({ lembreteId, usuarioId }, 'Worker: Notificacao de lembrete enviada');

    // Se configurado para enviar WhatsApp ao contato
    if (enviarWhatsApp && contatoTelefone && contato) {
      // TODO: Integrar com provedor WhatsApp real
      // Por enquanto, apenas loga a intencao
      logger.info(
        { lembreteId, contatoTelefone, contatoNome: contato.nome },
        'Worker: Lembrete WhatsApp seria enviado ao contato'
      );
    }

    // Marcar lembrete como enviado
    await db
      .update(lembretes)
      .set({
        enviado: true,
        enviadoEm: new Date(),
      })
      .where(eq(lembretes.id, lembreteId));

    logger.info({ lembreteId }, 'Worker: Lembrete marcado como enviado');
  } catch (erro) {
    logger.error({ erro, lembreteId }, 'Worker: Erro ao enviar lembrete');
    throw erro;
  }
}

// =============================================================================
// Registrar Worker
// =============================================================================

export async function registrarWorkerLembretes(): Promise<void> {
  await registrarWorker('lembrete.enviar', enviarLembrete, {
    batchSize: 2,
  });

  logger.info('Worker de lembretes registrado');
}
