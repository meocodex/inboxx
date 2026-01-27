// =============================================================================
// Tabela: conexoes
// =============================================================================

import { pgTable, uuid, text, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { canalConexaoEnum, provedorConexaoEnum, statusConexaoEnum } from './enums.js';
import { conversas } from './conversas.js';
import { mensagensAgendadas } from './campanhas.js';

export const conexoes = pgTable('conexoes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  nome: text('nome').notNull(),
  canal: canalConexaoEnum('canal').notNull(),
  provedor: provedorConexaoEnum('provedor').notNull(),
  credenciais: jsonb('credenciais').notNull(),
  configuracoes: jsonb('configuracoes'),
  status: statusConexaoEnum('status').default('DESCONECTADO').notNull(),
  ultimoStatus: timestamp('ultimo_status', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const conexoesRelations = relations(conexoes, ({ one, many }) => ({
  cliente: one(clientes, { fields: [conexoes.clienteId], references: [clientes.id] }),
  conversas: many(conversas),
  mensagensAgendadas: many(mensagensAgendadas),
}));
