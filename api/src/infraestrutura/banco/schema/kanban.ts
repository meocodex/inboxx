// =============================================================================
// Tabelas: quadros_kanban, colunas_kanban, cartoes_kanban
// =============================================================================

import { pgTable, uuid, text, decimal, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { contatos } from './contatos.js';

// ---- Quadros Kanban ----

export const quadrosKanban = pgTable('quadros_kanban', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const quadrosKanbanRelations = relations(quadrosKanban, ({ one, many }) => ({
  cliente: one(clientes, { fields: [quadrosKanban.clienteId], references: [clientes.id] }),
  colunas: many(colunasKanban),
}));

// ---- Colunas Kanban ----

export const colunasKanban = pgTable('colunas_kanban', {
  id: uuid('id').primaryKey().defaultRandom(),
  quadroId: uuid('quadro_id').references(() => quadrosKanban.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  cor: text('cor').default('#3B82F6').notNull(),
  ordem: integer('ordem').default(0).notNull(),
});

export const colunasKanbanRelations = relations(colunasKanban, ({ one, many }) => ({
  quadro: one(quadrosKanban, { fields: [colunasKanban.quadroId], references: [quadrosKanban.id] }),
  cartoes: many(cartoesKanban),
}));

// ---- Cartoes Kanban ----

export const cartoesKanban = pgTable('cartoes_kanban', {
  id: uuid('id').primaryKey().defaultRandom(),
  colunaId: uuid('coluna_id').references(() => colunasKanban.id, { onDelete: 'cascade' }).notNull(),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'set null' }),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  valor: decimal('valor', { precision: 10, scale: 2 }),
  ordem: integer('ordem').default(0).notNull(),
  dataLimite: timestamp('data_limite', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const cartoesKanbanRelations = relations(cartoesKanban, ({ one }) => ({
  coluna: one(colunasKanban, { fields: [cartoesKanban.colunaId], references: [colunasKanban.id] }),
  contato: one(contatos, { fields: [cartoesKanban.contatoId], references: [contatos.id] }),
}));
