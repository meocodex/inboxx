// =============================================================================
// Tabela: planos
// =============================================================================

import { pgTable, uuid, text, decimal, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const planos = pgTable('planos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').unique().notNull(),
  descricao: text('descricao'),
  precoMensal: decimal('preco_mensal', { precision: 10, scale: 2 }).notNull(),
  limites: jsonb('limites').notNull(),
  recursos: jsonb('recursos').notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});
