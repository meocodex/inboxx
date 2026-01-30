// =============================================================================
// Cliente Drizzle ORM (postgres.js driver)
// =============================================================================

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import * as schema from './schema/index.js';

// =============================================================================
// Conexao PostgreSQL via postgres.js
// =============================================================================

// =============================================================================
// Pool de Conexões Otimizado
// - max: 100 conexões (20 → 100 para suportar maior carga)
// - idle_timeout: 30s (20 → 30s para reduzir overhead de reconexão)
// - max_lifetime: 3600s (1h) para rotação de conexões
// - connect_timeout: 10s (mantido)
//
// PRODUÇÃO: Use PgBouncer para pooling adicional (variável PGBOUNCER_URL)
// =============================================================================

const queryClient = postgres(env.PGBOUNCER_URL || env.DATABASE_URL, {
  max: 100,
  idle_timeout: 30,
  connect_timeout: 10,
  max_lifetime: 3600,
});

// =============================================================================
// Instancia Drizzle com schema (para relational queries)
// =============================================================================

export const db = drizzle(queryClient, {
  schema,
  logger: env.NODE_ENV === 'development',
});

// =============================================================================
// Tipo do cliente (para uso em testes e tipagem)
// =============================================================================

export type DrizzleDB = typeof db;

// =============================================================================
// Verificar conexao com banco
// =============================================================================

export async function verificarConexaoBancoDrizzle(): Promise<boolean> {
  try {
    await queryClient`SELECT 1`;
    return true;
  } catch (erro) {
    logger.error({ erro }, 'Erro ao verificar conexao com banco (Drizzle)');
    return false;
  }
}

// =============================================================================
// Fechar conexao (graceful shutdown)
// =============================================================================

export async function fecharConexaoBanco(): Promise<void> {
  await queryClient.end();
  logger.info('Drizzle: Conexao com banco encerrada');
}

// =============================================================================
// Definir contexto do cliente para Row-Level Security (RLS)
// =============================================================================

export async function setClienteContext(clienteId: string | null): Promise<void> {
  try {
    if (clienteId) {
      // SET LOCAL não aceita parâmetros bindados - usar string SQL direta com escape
      const clienteIdEscapado = clienteId.replace(/'/g, "''");
      await queryClient.unsafe(`SET LOCAL app.cliente_id = '${clienteIdEscapado}'`);
    } else {
      await queryClient.unsafe('RESET app.cliente_id');
    }
  } catch (erro) {
    logger.error({ erro, clienteId }, 'Erro ao definir contexto do cliente para RLS');
    throw erro;
  }
}

// =============================================================================
// Re-export do schema para conveniencia
// =============================================================================

export { schema };
