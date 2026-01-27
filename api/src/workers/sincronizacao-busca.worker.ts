import { eq, and } from 'drizzle-orm';
import { registrarWorker } from '../infraestrutura/filas/index.js';
import { db } from '../infraestrutura/banco/drizzle.servico.js';
import {
  contatos,
  contatosEtiquetas,
  etiquetas,
  conversas,
  conexoes,
} from '../infraestrutura/banco/schema/index.js';
import {
  indexarDocumentos,
  atualizarDocumento,
  removerDocumento,
  meilisearchDisponivel,
  INDICES,
} from '../infraestrutura/busca/index.js';
import type { ContatoDocumento, ConversaDocumento } from '../infraestrutura/busca/index.js';
import type { JobBuscaSincronizar } from '../infraestrutura/filas/tipos.js';
import { logger } from '../compartilhado/utilitarios/logger.js';

// =============================================================================
// Worker de Sincronizacao de Busca
// =============================================================================

async function processarSincronizacao(job: { id: string; name: string; data: JobBuscaSincronizar }) {
  const { operacao, indice, clienteId, documentoId } = job.data;

  if (!meilisearchDisponivel()) {
    logger.debug('Meilisearch nao disponivel, ignorando sincronizacao');
    return;
  }

  logger.debug({ operacao, indice, clienteId, documentoId }, 'Sincronizando busca');

  switch (indice) {
    case 'contatos':
      await sincronizarContatos(operacao, clienteId, documentoId);
      break;
    case 'conversas':
      await sincronizarConversas(operacao, clienteId, documentoId);
      break;
    default:
      logger.warn({ indice }, 'Indice nao suportado para sincronizacao');
  }
}

// =============================================================================
// Sincronizar Contatos
// =============================================================================

async function sincronizarContatos(operacao: string, clienteId: string, documentoId?: string) {
  if (operacao === 'remover' && documentoId) {
    await removerDocumento(INDICES.CONTATOS, documentoId);
    return;
  }

  if ((operacao === 'indexar' || operacao === 'atualizar') && documentoId) {
    const contato = await db.select().from(contatos).where(
      and(eq(contatos.id, documentoId), eq(contatos.clienteId, clienteId))
    ).limit(1);

    if (contato.length === 0) return;

    // Buscar etiquetas do contato
    const etiquetasContato = await db
      .select({ nome: etiquetas.nome })
      .from(contatosEtiquetas)
      .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
      .where(eq(contatosEtiquetas.contatoId, documentoId));

    const doc: ContatoDocumento = {
      id: contato[0].id,
      clienteId: contato[0].clienteId,
      nome: contato[0].nome ?? '',
      telefone: contato[0].telefone,
      email: contato[0].email,
      observacoes: contato[0].observacoes,
      etiquetas: etiquetasContato.map((e) => e.nome),
      criadoEm: contato[0].criadoEm.toISOString(),
    };

    await atualizarDocumento(INDICES.CONTATOS, doc);
    return;
  }

  if (operacao === 'reindexar-tudo') {
    const todosContatos = await db.select().from(contatos).where(eq(contatos.clienteId, clienteId));

    const documentos: ContatoDocumento[] = [];

    for (const c of todosContatos) {
      const etiquetasContato = await db
        .select({ nome: etiquetas.nome })
        .from(contatosEtiquetas)
        .innerJoin(etiquetas, eq(contatosEtiquetas.etiquetaId, etiquetas.id))
        .where(eq(contatosEtiquetas.contatoId, c.id));

      documentos.push({
        id: c.id,
        clienteId: c.clienteId,
        nome: c.nome ?? '',
        telefone: c.telefone,
        email: c.email,
        observacoes: c.observacoes,
        etiquetas: etiquetasContato.map((e) => e.nome),
        criadoEm: c.criadoEm.toISOString(),
      });
    }

    // Indexar em batches de 500
    for (let i = 0; i < documentos.length; i += 500) {
      await indexarDocumentos(INDICES.CONTATOS, documentos.slice(i, i + 500));
    }

    logger.info({ clienteId, total: documentos.length }, 'Contatos reindexados');
  }
}

// =============================================================================
// Sincronizar Conversas
// =============================================================================

async function sincronizarConversas(operacao: string, clienteId: string, documentoId?: string) {
  if (operacao === 'remover' && documentoId) {
    await removerDocumento(INDICES.CONVERSAS, documentoId);
    return;
  }

  if ((operacao === 'indexar' || operacao === 'atualizar') && documentoId) {
    const rows = await db
      .select({
        id: conversas.id,
        clienteId: conversas.clienteId,
        status: conversas.status,
        conexaoId: conversas.conexaoId,
        usuarioId: conversas.usuarioId,
        equipeId: conversas.equipeId,
        ultimaMensagemEm: conversas.ultimaMensagemEm,
        criadoEm: conversas.criadoEm,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(conversas)
      .innerJoin(contatos, eq(conversas.contatoId, contatos.id))
      .where(and(eq(conversas.id, documentoId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (rows.length === 0) return;

    const r = rows[0];
    const doc: ConversaDocumento = {
      id: r.id,
      clienteId: r.clienteId,
      contatoNome: r.contatoNome ?? '',
      contatoTelefone: r.contatoTelefone,
      ultimaMensagem: null,
      status: r.status,
      conexaoId: r.conexaoId,
      usuarioId: r.usuarioId,
      equipeId: r.equipeId,
      ultimaMensagemEm: r.ultimaMensagemEm?.toISOString() ?? null,
      criadoEm: r.criadoEm.toISOString(),
    };

    await atualizarDocumento(INDICES.CONVERSAS, doc);
    return;
  }

  if (operacao === 'reindexar-tudo') {
    const rows = await db
      .select({
        id: conversas.id,
        clienteId: conversas.clienteId,
        status: conversas.status,
        conexaoId: conversas.conexaoId,
        usuarioId: conversas.usuarioId,
        equipeId: conversas.equipeId,
        ultimaMensagemEm: conversas.ultimaMensagemEm,
        criadoEm: conversas.criadoEm,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(conversas)
      .innerJoin(contatos, eq(conversas.contatoId, contatos.id))
      .where(eq(conversas.clienteId, clienteId));

    const documentos: ConversaDocumento[] = rows.map((r) => ({
      id: r.id,
      clienteId: r.clienteId,
      contatoNome: r.contatoNome ?? '',
      contatoTelefone: r.contatoTelefone,
      ultimaMensagem: null,
      status: r.status,
      conexaoId: r.conexaoId,
      usuarioId: r.usuarioId,
      equipeId: r.equipeId,
      ultimaMensagemEm: r.ultimaMensagemEm?.toISOString() ?? null,
      criadoEm: r.criadoEm.toISOString(),
    }));

    for (let i = 0; i < documentos.length; i += 500) {
      await indexarDocumentos(INDICES.CONVERSAS, documentos.slice(i, i + 500));
    }

    logger.info({ clienteId, total: documentos.length }, 'Conversas reindexadas');
  }
}

// =============================================================================
// Registrar Worker
// =============================================================================

export async function registrarWorkerBuscaSincronizacao(): Promise<void> {
  if (!meilisearchDisponivel()) {
    logger.info('Meilisearch nao configurado, worker de busca nao registrado');
    return;
  }

  await registrarWorker('busca.sincronizar', processarSincronizacao, { batchSize: 5 });
  logger.info('Worker de sincronizacao de busca registrado');
}
