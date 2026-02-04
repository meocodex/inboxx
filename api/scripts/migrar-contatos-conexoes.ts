/**
 * Script de migração para popular a tabela contatos_conexoes
 *
 * Este script deve ser executado APÓS o drizzle:push criar a nova tabela.
 * Ele cria registros na tabela pivot para todas as conversas existentes.
 *
 * Uso: npx tsx scripts/migrar-contatos-conexoes.ts
 */

import { eq, and, sql } from 'drizzle-orm';
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { conversas, contatos, conexoes, contatosConexoes } from '../src/infraestrutura/banco/schema/index.js';
import { logger } from '../src/compartilhado/utilitarios/logger.js';

async function migrar() {
  logger.info('Iniciando migração para contatos_conexoes...');

  await db.transaction(async (tx) => {
    // 1. Buscar todas as conversas com contato e conexão
    const conversasExistentes = await tx
      .select({
        conversaId: conversas.id,
        clienteId: conversas.clienteId,
        contatoId: conversas.contatoId,
        conexaoId: conversas.conexaoId,
        telefone: contatos.telefone,
        canal: conexoes.canal,
      })
      .from(conversas)
      .innerJoin(contatos, eq(conversas.contatoId, contatos.id))
      .innerJoin(conexoes, eq(conversas.conexaoId, conexoes.id))
      .where(sql`${conversas.contatoConexaoId} IS NULL`);

    logger.info({ total: conversasExistentes.length }, 'Conversas encontradas para migrar');

    if (conversasExistentes.length === 0) {
      logger.info('Nenhuma conversa para migrar. Encerrando.');
      return;
    }

    // 2. Criar map único de contato+conexão
    const uniqueMap = new Map<string, typeof conversasExistentes[0]>();
    for (const conv of conversasExistentes) {
      if (!conv.conexaoId) continue;
      const key = `${conv.clienteId}:${conv.contatoId}:${conv.conexaoId}`;
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, conv);
      }
    }

    logger.info({ total: uniqueMap.size }, 'Registros únicos a criar em contatos_conexoes');

    // 3. Criar registros na tabela pivot em batch
    const contatosConexoesCriados = new Map<string, string>();

    // Preparar valores para inserção em batch
    const valoresParaInserir: Array<{
      clienteId: string;
      contatoId: string;
      conexaoId: string;
      identificador: string;
      canal: string;
    }> = [];

    for (const [key, conv] of uniqueMap) {
      if (!conv.conexaoId) continue;
      valoresParaInserir.push({
        clienteId: conv.clienteId,
        contatoId: conv.contatoId,
        conexaoId: conv.conexaoId,
        identificador: conv.telefone,
        canal: conv.canal,
      });
    }

    // Inserir em lotes de 100
    const BATCH_SIZE = 100;
    let inseridos = 0;

    for (let i = 0; i < valoresParaInserir.length; i += BATCH_SIZE) {
      const batch = valoresParaInserir.slice(i, i + BATCH_SIZE);

      const resultados = await tx
        .insert(contatosConexoes)
        .values(batch)
        .onConflictDoNothing({
          target: [contatosConexoes.clienteId, contatosConexoes.conexaoId, contatosConexoes.identificador],
        })
        .returning({ id: contatosConexoes.id, clienteId: contatosConexoes.clienteId, contatoId: contatosConexoes.contatoId, conexaoId: contatosConexoes.conexaoId });

      for (const r of resultados) {
        const key = `${r.clienteId}:${r.contatoId}:${r.conexaoId}`;
        contatosConexoesCriados.set(key, r.id);
      }

      inseridos += resultados.length;
      logger.debug({ batch: Math.floor(i / BATCH_SIZE) + 1, inseridos: resultados.length }, 'Batch processado');
    }

    // Buscar registros já existentes (os que tiveram conflito)
    for (const [key, conv] of uniqueMap) {
      if (contatosConexoesCriados.has(key)) continue;
      if (!conv.conexaoId) continue;

      const [existente] = await tx
        .select({ id: contatosConexoes.id })
        .from(contatosConexoes)
        .where(
          and(
            eq(contatosConexoes.clienteId, conv.clienteId),
            eq(contatosConexoes.contatoId, conv.contatoId),
            eq(contatosConexoes.conexaoId, conv.conexaoId)
          )
        )
        .limit(1);

      if (existente) {
        contatosConexoesCriados.set(key, existente.id);
      }
    }

    logger.info({ total: contatosConexoesCriados.size }, 'Registros criados/encontrados em contatos_conexoes');

    // 4. Atualizar conversas com contatoConexaoId em batch
    logger.info('Atualizando conversas com contatoConexaoId...');

    let atualizadas = 0;
    for (const conv of conversasExistentes) {
      if (!conv.conexaoId) continue;
      const key = `${conv.clienteId}:${conv.contatoId}:${conv.conexaoId}`;
      const contatoConexaoId = contatosConexoesCriados.get(key);

      if (contatoConexaoId) {
        await tx
          .update(conversas)
          .set({ contatoConexaoId })
          .where(eq(conversas.id, conv.conversaId));
        atualizadas++;
      }
    }

    logger.info({ atualizadas }, 'Conversas atualizadas com contatoConexaoId');
  });

  logger.info('Migração concluída com sucesso!');
  process.exit(0);
}

migrar().catch((erro) => {
  logger.error({ erro }, 'Erro na migração');
  process.exit(1);
});
