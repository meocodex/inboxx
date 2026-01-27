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

const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
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
// Re-export do schema para conveniencia
// =============================================================================

export { schema };
