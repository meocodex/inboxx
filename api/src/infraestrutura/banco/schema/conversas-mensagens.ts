// =============================================================================
// Tabelas: mensagens, notas_internas
// =============================================================================

import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { conversas } from './conversas.js';
import { usuarios } from './usuarios.js';
import { direcaoMensagemEnum, tipoMensagemEnum, statusMensagemEnum } from './enums.js';

// ---- Mensagens ----

export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id, { onDelete: 'cascade' }).notNull(),
  direcao: direcaoMensagemEnum('direcao').notNull(),
  tipo: tipoMensagemEnum('tipo').notNull(),
  conteudo: text('conteudo'),
  midiaUrl: text('midia_url'),
  midiaTipo: text('midia_tipo'),
  midiaNome: text('midia_nome'),
  idExterno: text('id_externo'),
  status: statusMensagemEnum('status').default('ENVIADA').notNull(),
  enviadoPor: uuid('enviado_por').references(() => usuarios.id, { onDelete: 'set null' }),
  enviadoEm: timestamp('enviado_em', { withTimezone: true }).defaultNow().notNull(),
  entregueEm: timestamp('entregue_em', { withTimezone: true }),
  lidoEm: timestamp('lido_em', { withTimezone: true }),
}, (t) => [
  index('mensagens_conversa_id_enviado_em_idx').on(t.conversaId, t.enviadoEm),
]);

export const mensagensRelations = relations(mensagens, ({ one }) => ({
  conversa: one(conversas, { fields: [mensagens.conversaId], references: [conversas.id] }),
  usuario: one(usuarios, { fields: [mensagens.enviadoPor], references: [usuarios.id] }),
}));

// ---- Notas Internas ----

export const notasInternas = pgTable('notas_internas', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id, { onDelete: 'cascade' }).notNull(),
  usuarioId: uuid('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull(),
  texto: text('texto').notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
});

export const notasInternasRelations = relations(notasInternas, ({ one }) => ({
  conversa: one(conversas, { fields: [notasInternas.conversaId], references: [conversas.id] }),
  usuario: one(usuarios, { fields: [notasInternas.usuarioId], references: [usuarios.id] }),
}));
