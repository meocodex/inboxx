// =============================================================================
// Tabela: perfis
// =============================================================================

import { pgTable, uuid, text, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { usuarios } from './usuarios.js';

export const perfis = pgTable('perfis', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  permissoes: text('permissoes').array().notNull(),
  editavel: boolean('editavel').default(true).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('perfis_cliente_id_nome_key').on(t.clienteId, t.nome),
]);

export const perfisRelations = relations(perfis, ({ one, many }) => ({
  cliente: one(clientes, { fields: [perfis.clienteId], references: [clientes.id] }),
  usuarios: many(usuarios),
}));
