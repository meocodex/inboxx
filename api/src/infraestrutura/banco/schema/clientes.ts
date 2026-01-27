// =============================================================================
// Tabela: clientes
// =============================================================================

import { pgTable, uuid, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { planos } from './planos.js';
import { licencas } from './licencas.js';
import { perfis } from './perfis.js';
import { usuarios } from './usuarios.js';
import { equipes } from './equipes.js';
import { conexoes } from './conexoes.js';
import { contatos, etiquetas } from './contatos.js';
import { conversas } from './conversas.js';
import { fluxosChatbot } from './chatbot.js';
import { campanhas } from './campanhas.js';
import { quadrosKanban } from './kanban.js';
import { respostasRapidas } from './respostas-rapidas.js';

export const clientes = pgTable('clientes', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  email: text('email').unique().notNull(),
  telefone: text('telefone'),
  documento: text('documento'),
  planoId: uuid('plano_id').references(() => planos.id).notNull(),
  ativo: boolean('ativo').default(true).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
});

export const clientesRelations = relations(clientes, ({ one, many }) => ({
  plano: one(planos, { fields: [clientes.planoId], references: [planos.id] }),
  licencas: many(licencas),
  perfis: many(perfis),
  usuarios: many(usuarios),
  equipes: many(equipes),
  conexoes: many(conexoes),
  contatos: many(contatos),
  conversas: many(conversas),
  etiquetas: many(etiquetas),
  fluxosChatbot: many(fluxosChatbot),
  campanhas: many(campanhas),
  quadrosKanban: many(quadrosKanban),
  respostasRapidas: many(respostasRapidas),
}));
