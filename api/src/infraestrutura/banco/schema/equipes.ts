// =============================================================================
// Tabela: equipes
// =============================================================================

import { pgTable, uuid, text, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { usuarios } from './usuarios.js';
import { conversas } from './conversas.js';

export const equipes = pgTable('equipes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('equipes_cliente_id_nome_key').on(t.clienteId, t.nome),
]);

export const equipesRelations = relations(equipes, ({ one, many }) => ({
  cliente: one(clientes, { fields: [equipes.clienteId], references: [clientes.id] }),
  membros: many(usuarios),
  conversas: many(conversas),
}));
