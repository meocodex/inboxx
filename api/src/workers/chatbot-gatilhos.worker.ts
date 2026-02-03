// =============================================================================
// Worker: Gatilhos Agendados do Chatbot
// =============================================================================

import { db } from '../infraestrutura/banco/db.js';
import { fluxosChatbot, conversas } from '../infraestrutura/banco/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../compartilhado/utilitarios/logger.js';
import { chatbotGateway } from '../modulos/chatbot/chatbot.gateway.js';
import { enviarJob } from '../infraestrutura/filas/index.js';

/**
 * Verifica e dispara fluxos com gatilho HORARIO
 * Executado a cada minuto via cron job
 */
export async function verificarGatilhosHorario(): Promise<void> {
  const agora = new Date();
  const horaAtual = agora.getHours();
  const minutoAtual = agora.getMinutes();

  logger.debug({ hora: horaAtual, minuto: minutoAtual }, 'Verificando gatilhos de horário');

  try {
    // Buscar fluxos com gatilho HORARIO configurado para este horário
    const fluxos = await db.query.fluxosChatbot.findMany({
      where: and(
        eq(fluxosChatbot.ativo, true),
        sql`${fluxosChatbot.gatilho}->>'tipo' = 'HORARIO'`,
        sql`(${fluxosChatbot.gatilho}->>'hora')::int = ${horaAtual}`,
        sql`(${fluxosChatbot.gatilho}->>'minuto')::int = ${minutoAtual}`
      ),
    });

    if (fluxos.length === 0) {
      return; // Nenhum fluxo para este horário
    }

    logger.info({ totalFluxos: fluxos.length, hora: horaAtual, minuto: minutoAtual }, 'Fluxos encontrados para horário');

    // Para cada fluxo, buscar conversas abertas do cliente
    for (const fluxo of fluxos) {
      const conversasAbertas = await db.query.conversas.findMany({
        where: and(
          eq(conversas.clienteId, fluxo.clienteId),
          eq(conversas.status, 'ABERTA')
        ),
        limit: 100, // Limitar para evitar sobrecarga
      });

      logger.info({
        fluxoId: fluxo.id,
        nome: fluxo.nome,
        totalConversas: conversasAbertas.length,
      }, 'Iniciando fluxo em conversas abertas');

      // Iniciar fluxo em cada conversa
      for (const conversa of conversasAbertas) {
        try {
          await chatbotGateway.iniciarFluxoPorGatilho(
            conversa.id,
            conversa.contatoId,
            conversa.clienteId,
            'HORARIO'
          );
        } catch (erro) {
          logger.error({
            erro,
            conversaId: conversa.id,
            fluxoId: fluxo.id,
          }, 'Erro ao iniciar fluxo por horário');
        }
      }
    }
  } catch (erro) {
    logger.error({ erro, hora: horaAtual, minuto: minutoAtual }, 'Erro ao verificar gatilhos de horário');
  }
}

/**
 * Agenda job recorrente para verificar gatilhos de horário
 * Executado a cada minuto
 */
export async function agendarVerificacaoGatilhosHorario(): Promise<void> {
  // Agendar job recorrente (a cada minuto)
  await enviarJob(
    'chatbot.esperar',
    { execucaoId: 'gatilho-horario-cron', evento: 'VERIFICAR_HORARIO' },
    {
      startAfter: Date.now() + 60000, // Próxima execução em 1 minuto
    }
  );

  logger.info('Job de verificação de gatilhos de horário agendado');
}
