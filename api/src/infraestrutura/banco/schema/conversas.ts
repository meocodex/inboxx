// =============================================================================
// Tabela: conversas
// =============================================================================

import { pgTable, uuid, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { contatos } from './contatos.js';
import { conexoes } from './conexoes.js';
import { usuarios } from './usuarios.js';
import { equipes } from './equipes.js';
import { statusConversaEnum } from './enums.js';
import { mensagens, notasInternas } from './conversas-mensagens.js';

export const conversas = pgTable('conversas', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
  contatoId: uuid('contato_id').references(() => contatos.id, { onDelete: 'cascade' }).notNull(),
  conexaoId: uuid('conexao_id').references(() => conexoes.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id, { onDelete: 'set null' }),
  equipeId: uuid('equipe_id').references(() => equipes.id, { onDelete: 'set null' }),
  status: statusConversaEnum('status').default('ABERTA').notNull(),
  ultimaMensagemEm: timestamp('ultima_mensagem_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  index('conversas_cliente_id_status_idx').on(t.clienteId, t.status),
  index('conversas_cliente_id_ultima_mensagem_em_idx').on(t.clienteId, t.ultimaMensagemEm),
]);

export const conversasRelations = relations(conversas, ({ one, many }) => ({
  cliente: one(clientes, { fields: [conversas.clienteId], references: [clientes.id] }),
  contato: one(contatos, { fields: [conversas.contatoId], references: [contatos.id] }),
  conexao: one(conexoes, { fields: [conversas.conexaoId], references: [conexoes.id] }),
  usuario: one(usuarios, { fields: [conversas.usuarioId], references: [usuarios.id] }),
  equipe: one(equipes, { fields: [conversas.equipeId], references: [equipes.id] }),
  mensagens: many(mensagens),
  notasInternas: many(notasInternas),
}));
