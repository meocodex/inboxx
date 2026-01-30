// =============================================================================
// Tabelas: campanhas, campanhas_log, mensagens_agendadas
// =============================================================================

import { pgTable, uuid, text, jsonb, integer, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { conexoes } from './conexoes.js';
import { statusCampanhaEnum, statusEnvioCampanhaEnum, statusMensagemAgendadaEnum } from './enums.js';

// ---- Campanhas ----

export const campanhas = pgTable('campanhas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  template: text('template').notNull(),
  midiaUrl: text('midia_url'),
  filtros: jsonb('filtros'),
  status: statusCampanhaEnum('status').default('RASCUNHO').notNull(),
  agendadoPara: timestamp('agendado_para', { withTimezone: true }),
  intervaloMs: integer('intervalo_ms').default(3000).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
  iniciadoEm: timestamp('iniciado_em', { withTimezone: true }),
  finalizadoEm: timestamp('finalizado_em', { withTimezone: true }),
});

export const campanhasRelations = relations(campanhas, ({ one, many }) => ({
  cliente: one(clientes, { fields: [campanhas.clienteId], references: [clientes.id] }),
  logs: many(campanhasLog),
}));

// ---- Campanhas Log ----

export const campanhasLog = pgTable('campanhas_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  campanhaId: uuid('campanha_id').references(() => campanhas.id, { onDelete: 'cascade' }).notNull(),
  contatoId: uuid('contato_id').notNull(),
  status: statusEnvioCampanhaEnum('status').default('PENDENTE').notNull(),
  erro: text('erro'),
  enviadoEm: timestamp('enviado_em', { withTimezone: true }),
}, (t) => [
  index('campanhas_log_campanha_id_status_idx').on(t.campanhaId, t.status),
  // IDEMPOTÊNCIA: Previne duplicatas de envio para mesmo contato em uma campanha
  unique('campanhas_log_campanha_contato_unique').on(t.campanhaId, t.contatoId),
]);

export const campanhasLogRelations = relations(campanhasLog, ({ one }) => ({
  campanha: one(campanhas, { fields: [campanhasLog.campanhaId], references: [campanhas.id] }),
}));

// ---- Mensagens Agendadas ----

export const mensagensAgendadas = pgTable('mensagens_agendadas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').notNull(),
  contatoId: uuid('contato_id').notNull(),
  conexaoId: uuid('conexao_id').references(() => conexoes.id, { onDelete: 'cascade' }).notNull(),
  conteudo: text('conteudo').notNull(),
  midiaUrl: text('midia_url'),
  agendarPara: timestamp('agendar_para', { withTimezone: true }).notNull(),
  status: statusMensagemAgendadaEnum('status').default('PENDENTE').notNull(),
  enviadaEm: timestamp('enviada_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index('mensagens_agendadas_agendar_para_status_idx').on(t.agendarPara, t.status),
]);

export const mensagensAgendadasRelations = relations(mensagensAgendadas, ({ one }) => ({
  conexao: one(conexoes, { fields: [mensagensAgendadas.conexaoId], references: [conexoes.id] }),
}));
