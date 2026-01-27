// =============================================================================
// Tabelas: compromissos, lembretes
// =============================================================================

import { pgTable, uuid, text, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { contatos } from './contatos.js';

// ---- Compromissos ----

export const compromissos = pgTable('compromissos', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').notNull(),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'set null' }),
  titulo: text('titulo').notNull(),
  descricao: text('descricao'),
  dataHora: timestamp('data_hora', { withTimezone: true }).notNull(),
  duracaoMin: integer('duracao_min').default(30).notNull(),
  lembreteMin: integer('lembrete_min'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  index('compromissos_cliente_id_data_hora_idx').on(t.clienteId, t.dataHora),
]);

export const compromissosRelations = relations(compromissos, ({ one, many }) => ({
  contato: one(contatos, { fields: [compromissos.contatoId], references: [contatos.id] }),
  lembretes: many(lembretes),
}));

// ---- Lembretes ----

export const lembretes = pgTable('lembretes', {
  id: uuid('id').primaryKey().defaultRandom(),
  compromissoId: uuid('compromisso_id').references(() => compromissos.id, { onDelete: 'cascade' }).notNull(),
  enviarEm: timestamp('enviar_em', { withTimezone: true }).notNull(),
  enviado: boolean('enviado').default(false).notNull(),
  enviadoEm: timestamp('enviado_em', { withTimezone: true }),
}, (t) => [
  index('lembretes_enviar_em_enviado_idx').on(t.enviarEm, t.enviado),
]);

export const lembretesRelations = relations(lembretes, ({ one }) => ({
  compromisso: one(compromissos, { fields: [lembretes.compromissoId], references: [compromissos.id] }),
}));
