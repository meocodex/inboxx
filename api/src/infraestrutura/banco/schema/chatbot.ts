// =============================================================================
// Tabelas: fluxos_chatbot, nos_chatbot, respostas_rapidas
// =============================================================================

import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { tipoNoChatbotEnum } from './enums.js';

// ---- Fluxos Chatbot ----

export const fluxosChatbot = pgTable('fluxos_chatbot', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  gatilho: jsonb('gatilho').notNull(),
  ativo: boolean('ativo').default(false).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const fluxosChatbotRelations = relations(fluxosChatbot, ({ one, many }) => ({
  cliente: one(clientes, { fields: [fluxosChatbot.clienteId], references: [clientes.id] }),
  nos: many(nosChatbot),
}));

// ---- Nos Chatbot ----

export const nosChatbot = pgTable('nos_chatbot', {
  id: uuid('id').primaryKey().defaultRandom(),
  fluxoId: uuid('fluxo_id').references(() => fluxosChatbot.id, { onDelete: 'cascade' }).notNull(),
  tipo: tipoNoChatbotEnum('tipo').notNull(),
  nome: text('nome'),
  configuracao: jsonb('configuracao').notNull(),
  posicaoX: integer('posicao_x').default(0).notNull(),
  posicaoY: integer('posicao_y').default(0).notNull(),
  proximoNoId: uuid('proximo_no_id'),
});

export const nosChatbotRelations = relations(nosChatbot, ({ one }) => ({
  fluxo: one(fluxosChatbot, { fields: [nosChatbot.fluxoId], references: [fluxosChatbot.id] }),
}));
