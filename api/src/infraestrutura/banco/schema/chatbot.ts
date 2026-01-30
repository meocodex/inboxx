// =============================================================================
// Tabelas: fluxos_chatbot, nos_chatbot, respostas_rapidas
// =============================================================================

import { pgTable, uuid, text, jsonb, boolean, integer, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { tipoNoChatbotEnum, statusExecucaoChatbotEnum } from './enums.js';

// ---- Fluxos Chatbot ----

export const fluxosChatbot = pgTable('fluxos_chatbot', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  gatilho: jsonb('gatilho').notNull(),
  ativo: boolean('ativo').default(false).notNull(),
  machineDefinition: jsonb('machine_definition'), // Definicao XState compilada
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const fluxosChatbotRelations = relations(fluxosChatbot, ({ one, many }) => ({
  cliente: one(clientes, { fields: [fluxosChatbot.clienteId], references: [clientes.id] }),
  nos: many(nosChatbot),
  transicoes: many(transicoesChatbot),
}));

// ---- Nos Chatbot ----

export const nosChatbot = pgTable('nos_chatbot', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id')
    .references(() => clientes.id, { onDelete: 'cascade' })
    .notNull(),
  fluxoId: uuid('fluxo_id').references(() => fluxosChatbot.id, { onDelete: 'cascade' }).notNull(),
  tipo: tipoNoChatbotEnum('tipo').notNull(),
  nome: text('nome'),
  configuracao: jsonb('configuracao').notNull(),
  posicaoX: integer('posicao_x').default(0).notNull(),
  posicaoY: integer('posicao_y').default(0).notNull(),
  proximoNoId: uuid('proximo_no_id'),
});

export const nosChatbotRelations = relations(nosChatbot, ({ one, many }) => ({
  fluxo: one(fluxosChatbot, { fields: [nosChatbot.fluxoId], references: [fluxosChatbot.id] }),
  transicoesOrigem: many(transicoesChatbot, { relationName: 'noOrigem' }),
  transicoesDestino: many(transicoesChatbot, { relationName: 'noDestino' }),
}));

// ---- Transicoes Chatbot ----

export const transicoesChatbot = pgTable('transicoes_chatbot', {
  id: uuid('id').primaryKey().defaultRandom(),
  fluxoId: uuid('fluxo_id').references(() => fluxosChatbot.id, { onDelete: 'cascade' }).notNull(),
  noOrigemId: uuid('no_origem_id').references(() => nosChatbot.id, { onDelete: 'cascade' }).notNull(),
  noDestinoId: uuid('no_destino_id').references(() => nosChatbot.id, { onDelete: 'cascade' }).notNull(),
  evento: text('evento').notNull(), // ex: 'RESPOSTA_1', 'TIMEOUT', 'QUALQUER', 'SIM', 'NAO'
  condicao: jsonb('condicao'), // guard condition para XState
  ordem: integer('ordem').default(0).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Índices para performance
  idxFluxoCliente: index('idx_transicoes_fluxo')
    .on(table.fluxoId),
  idxNoOrigem: index('idx_transicoes_no_origem')
    .on(table.noOrigemId),
  idxNoDestino: index('idx_transicoes_no_destino')
    .on(table.noDestinoId),
  idxOrdem: index('idx_transicoes_ordem')
    .on(table.fluxoId, table.ordem),
}));

export const transicoesChatbotRelations = relations(transicoesChatbot, ({ one }) => ({
  fluxo: one(fluxosChatbot, { fields: [transicoesChatbot.fluxoId], references: [fluxosChatbot.id] }),
  noOrigem: one(nosChatbot, {
    fields: [transicoesChatbot.noOrigemId],
    references: [nosChatbot.id],
    relationName: 'noOrigem',
  }),
  noDestino: one(nosChatbot, {
    fields: [transicoesChatbot.noDestinoId],
    references: [nosChatbot.id],
    relationName: 'noDestino',
  }),
}));
