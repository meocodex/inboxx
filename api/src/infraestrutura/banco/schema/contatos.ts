// =============================================================================
// Tabelas: contatos, contatos_conexoes, etiquetas, contatos_etiquetas
// =============================================================================

import { pgTable, uuid, text, jsonb, boolean, timestamp, unique, index, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { conexoes } from './conexoes.js';
import { conversas } from './conversas.js';
import { cartoesKanban } from './kanban.js';
import { compromissos } from './agendamento.js';
import { canalConexaoEnum } from './enums.js';

// ---- Contatos ----

export const contatos = pgTable('contatos', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome'),
  telefone: text('telefone').notNull(),
  email: text('email'),
  fotoUrl: text('foto_url'),
  camposPersonalizados: jsonb('campos_personalizados'),
  ativo: boolean('ativo').default(true).notNull(),
  bloqueado: boolean('bloqueado').default(false).notNull(),
  observacoes: text('observacoes'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('contatos_cliente_id_telefone_key').on(t.clienteId, t.telefone),
  index('contatos_cliente_id_idx').on(t.clienteId),
]);

export const contatosRelations = relations(contatos, ({ one, many }) => ({
  cliente: one(clientes, { fields: [contatos.clienteId], references: [clientes.id] }),
  etiquetas: many(contatosEtiquetas),
  conexoes: many(contatosConexoes),
  conversas: many(conversas),
  cartoesKanban: many(cartoesKanban),
  compromissos: many(compromissos),
}));

// ---- Contatos Conexoes (pivot para preservar histórico) ----

export const contatosConexoes = pgTable('contatos_conexoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }).notNull(),
  conexaoId: uuid('conexao_id').references(() => conexoes.id, { onDelete: 'set null' }),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  identificador: text('identificador').notNull(), // telefone/instagram_id/etc
  canal: canalConexaoEnum('canal').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('contatos_conexoes_cliente_idx').on(t.clienteId),
  index('contatos_conexoes_conexao_idx').on(t.conexaoId),
  index('contatos_conexoes_identificador_idx').on(t.clienteId, t.identificador),
  unique('contatos_conexoes_unique').on(t.clienteId, t.conexaoId, t.identificador),
]);

export const contatosConexoesRelations = relations(contatosConexoes, ({ one, many }) => ({
  contato: one(contatos, { fields: [contatosConexoes.contatoId], references: [contatos.id] }),
  conexao: one(conexoes, { fields: [contatosConexoes.conexaoId], references: [conexoes.id] }),
  cliente: one(clientes, { fields: [contatosConexoes.clienteId], references: [clientes.id] }),
  conversas: many(conversas),
}));

// ---- Etiquetas ----

export const etiquetas = pgTable('etiquetas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  cor: text('cor').default('#3B82F6').notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  unique('etiquetas_cliente_id_nome_key').on(t.clienteId, t.nome),
]);

export const etiquetasRelations = relations(etiquetas, ({ one, many }) => ({
  cliente: one(clientes, { fields: [etiquetas.clienteId], references: [clientes.id] }),
  contatos: many(contatosEtiquetas),
}));

// ---- ContatoEtiqueta (many-to-many) ----

export const contatosEtiquetas = pgTable('contatos_etiquetas', {
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }).notNull(),
  etiquetaId: uuid('etiqueta_id').references(() => etiquetas.id, { onDelete: 'cascade' }).notNull(),
  clienteId: uuid('cliente_id').notNull(),
  adicionadoEm: timestamp('adicionado_em', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  primaryKey({ columns: [t.contatoId, t.etiquetaId] }),
  index('contatos_etiquetas_cliente_id_idx').on(t.clienteId),
]);

export const contatosEtiquetasRelations = relations(contatosEtiquetas, ({ one }) => ({
  contato: one(contatos, { fields: [contatosEtiquetas.contatoId], references: [contatos.id] }),
  etiqueta: one(etiquetas, { fields: [contatosEtiquetas.etiquetaId], references: [etiquetas.id] }),
}));
