// =============================================================================
// Tabela: respostas_rapidas
// =============================================================================

import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';

export const respostasRapidas = pgTable('respostas_rapidas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  titulo: text('titulo').notNull(),
  atalho: text('atalho').notNull(),
  conteudo: text('conteudo').notNull(),
  categoria: text('categoria'),
  anexoUrl: text('anexo_url'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('respostas_rapidas_cliente_id_atalho_key').on(t.clienteId, t.atalho),
]);

export const respostasRapidasRelations = relations(respostasRapidas, ({ one }) => ({
  cliente: one(clientes, { fields: [respostasRapidas.clienteId], references: [clientes.id] }),
}));
