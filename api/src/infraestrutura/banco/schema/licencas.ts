// =============================================================================
// Tabela: licencas
// =============================================================================

import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';

export const licencas = pgTable('licencas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  chave: text('chave').unique().notNull(),
  ipServidor: text('ip_servidor').notNull(),
  hostname: text('hostname'),
  ativa: boolean('ativa').default(true).notNull(),
  expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
  ultimaVerificacao: timestamp('ultima_verificacao', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const licencasRelations = relations(licencas, ({ one }) => ({
  cliente: one(clientes, { fields: [licencas.clienteId], references: [clientes.id] }),
}));
