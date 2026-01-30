// =============================================================================
// Tabelas: mensagens, notas_internas
// =============================================================================

import { pgTable, uuid, text, timestamp, index, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

import { conversas } from './conversas.js';
import { usuarios } from './usuarios.js';
import { clientes } from './clientes.js';
import { direcaoMensagemEnum, tipoMensagemEnum, statusMensagemEnum } from './enums.js';

// ---- Mensagens ----

export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').references(() => clientes.id, { onDelete: 'cascade' }).notNull(),
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
}, (t) => ({
  mensagensConversaIdEnviadoEmIdx: index('mensagens_conversa_id_enviado_em_idx').on(t.conversaId, t.enviadoEm),
  // UNIQUE constraint por cliente + idExterno (prevenir duplicatas de webhooks)
  uniqueIdExterno: unique('unique_mensagem_id_externo').on(t.clienteId, t.idExterno),
}));

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
