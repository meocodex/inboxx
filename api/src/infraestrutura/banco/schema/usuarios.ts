// =============================================================================
// Tabela: usuarios
// =============================================================================

import { pgTable, uuid, text, boolean, timestamp, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { clientes } from './clientes.js';
import { perfis } from './perfis.js';
import { equipes } from './equipes.js';
import { conversas } from './conversas.js';
import { notasInternas } from './conversas-mensagens.js';
import { mensagens } from './conversas-mensagens.js';

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }),
  perfilId: uuid('perfil_id').references(() => perfis.id).notNull(),
  equipeId: uuid('equipe_id').references(() => equipes.id, { onDelete: 'set null' }),
  nome: text('nome').notNull(),
  email: text('email').notNull(),
  senhaHash: text('senha_hash').notNull(),
  avatarUrl: text('avatar_url'),
  online: boolean('online').default(false).notNull(),
  ultimoAcesso: timestamp('ultimo_acesso', { withTimezone: true }),
  ativo: boolean('ativo').default(true).notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
}, (t) => [
  unique('usuarios_cliente_id_email_key').on(t.clienteId, t.email),
  index('usuarios_email_idx').on(t.email),
]);

export const usuariosRelations = relations(usuarios, ({ one, many }) => ({
  cliente: one(clientes, { fields: [usuarios.clienteId], references: [clientes.id] }),
  perfil: one(perfis, { fields: [usuarios.perfilId], references: [perfis.id] }),
  equipe: one(equipes, { fields: [usuarios.equipeId], references: [equipes.id] }),
  conversasAtribuidas: many(conversas),
  notasInternas: many(notasInternas),
  mensagensEnviadas: many(mensagens),
}));
