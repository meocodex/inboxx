import { pgTable, uuid, varchar, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { clientes } from './clientes.js';
import { fluxosChatbot } from './chatbot.js';
import { conversas } from './conversas.js';

export const execucoesFluxo = pgTable('execucoes_fluxo', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id')
    .notNull()
    .references(() => clientes.id, { onDelete: 'cascade' }),
  fluxoId: uuid('fluxo_id')
    .notNull()
    .references(() => fluxosChatbot.id, { onDelete: 'cascade' }),
  conversaId: uuid('conversa_id')
    .notNull()
    .references(() => conversas.id, { onDelete: 'cascade' }),
  estadoAtual: varchar('estado_atual', { length: 100 }).notNull(),
  contexto: jsonb('contexto').default({}).notNull().$type<{
    conversaId: string;
    contatoId: string;
    variaveis?: Record<string, unknown>;
    aguardandoResposta?: boolean;
    variavel?: string;
    webhookResposta?: unknown;
    execucaoId?: string;
  }>(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
});

export type ExecucaoFluxo = typeof execucoesFluxo.$inferSelect;
export type NovaExecucaoFluxo = typeof execucoesFluxo.$inferInsert;
