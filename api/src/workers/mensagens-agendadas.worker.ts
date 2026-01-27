import { eq, and } from 'drizzle-orm';

import { db } from '../infraestrutura/banco/drizzle.servico.js';
import { mensagensAgendadas, conversas, contatos, mensagens, conexoes } from '../infraestrutura/banco/schema/index.js';
import { registrarWorker } from '../infraestrutura/filas/index.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import { emitirParaConversa } from '../websocket/socket.gateway.js';
import type { JobMensagemAgendada } from '../infraestrutura/filas/tipos.js';

// =============================================================================
// Tipos de Job
// =============================================================================

interface Job<T> {
  id: string;
  name: string;
  data: T;
}

// =============================================================================
// Worker: Enviar Mensagem Agendada
// =============================================================================

async function enviarMensagemAgendada(job: Job<JobMensagemAgendada>): Promise<void> {
  const { mensagemId, conversaId, conteudo, tipo, midiaUrl } = job.data;

  logger.info({ mensagemId, conversaId }, 'Worker: Processando mensagem agendada');

  try {
    // Verificar se a mensagem ainda existe e esta pendente
    const [mensagemAgendadaResult] = await db
      .select({
        mensagemAgendada: mensagensAgendadas,
        conexao: conexoes,
      })
      .from(mensagensAgendadas)
      .leftJoin(conexoes, eq(mensagensAgendadas.conexaoId, conexoes.id))
      .where(and(eq(mensagensAgendadas.id, mensagemId), eq(mensagensAgendadas.status, 'PENDENTE')))
      .limit(1);

    if (!mensagemAgendadaResult) {
      logger.warn({ mensagemId }, 'Worker: Mensagem agendada nao encontrada ou ja processada');
      return;
    }

    const mensagemAgendada = mensagemAgendadaResult.mensagemAgendada;

    // Buscar conversa do contato
    const [conversaResult] = await db
      .select({
        conversa: conversas,
        contato: contatos,
      })
      .from(conversas)
      .leftJoin(contatos, eq(conversas.contatoId, contatos.id))
      .where(
        and(
          eq(conversas.contatoId, mensagemAgendada.contatoId),
          eq(conversas.conexaoId, mensagemAgendada.conexaoId)
        )
      )
      .limit(1);

    if (!conversaResult) {
      await db
        .update(mensagensAgendadas)
        .set({
          status: 'CANCELADA',
        })
        .where(eq(mensagensAgendadas.id, mensagemId));

      logger.warn({ mensagemId }, 'Worker: Conversa nao encontrada, mensagem cancelada');
      return;
    }

    const conversa = conversaResult.conversa;

    // TODO: Integrar com provedor WhatsApp real
    // Por enquanto, cria a mensagem no banco e emite via WebSocket

    // Criar mensagem real
    const [mensagem] = await db
      .insert(mensagens)
      .values({
        conversaId: conversa.id,
        direcao: 'SAIDA',
        tipo: (tipo ?? 'TEXTO') as 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'LOCALIZACAO' | 'CONTATO' | 'STICKER',
        conteudo,
        midiaUrl,
        status: 'ENVIADA',
      })
      .returning();

    // Atualizar conversa
    await db
      .update(conversas)
      .set({
        ultimaMensagemEm: new Date(),
      })
      .where(eq(conversas.id, conversa.id));

    // Atualizar mensagem agendada
    await db
      .update(mensagensAgendadas)
      .set({
        status: 'ENVIADA',
        enviadaEm: new Date(),
      })
      .where(eq(mensagensAgendadas.id, mensagemId));

    // Emitir via WebSocket
    emitirParaConversa(conversa.id, 'nova_mensagem', {
      mensagem: {
        id: mensagem.id,
        tipo: mensagem.tipo,
        conteudo: mensagem.conteudo,
        midiaUrl: mensagem.midiaUrl,
        direcao: mensagem.direcao,
        status: mensagem.status,
        enviadoEm: mensagem.enviadoEm,
      },
      conversaId: conversa.id,
    });

    logger.info({ mensagemId, conversaId: conversa.id, mensagemCriadaId: mensagem.id }, 'Worker: Mensagem agendada enviada');
  } catch (erro) {
    logger.error({ erro, mensagemId }, 'Worker: Erro ao enviar mensagem agendada');

    // Marcar como erro
    await db
      .update(mensagensAgendadas)
      .set({
        status: 'ERRO',
      })
      .where(eq(mensagensAgendadas.id, mensagemId));

    throw erro;
  }
}

// =============================================================================
// Registrar Worker
// =============================================================================

export async function registrarWorkerMensagensAgendadas(): Promise<void> {
  await registrarWorker('mensagem-agendada.enviar', enviarMensagemAgendada, {
    batchSize: 3,
  });

  logger.info('Worker de mensagens agendadas registrado');
}
