import { eq, and, count, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  conversas,
  usuarios,
  notasInternas,
} from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import type { CriarNotaInternaDTO, ListarNotasInternasQuery } from './notas-internas.schema.js';

// =============================================================================
// Servico de Notas Internas
// =============================================================================

export const notasInternasServico = {
  async listar(clienteId: string, conversaId: string, query: ListarNotasInternasQuery) {
    const { pagina, limite } = query;
    const skip = (pagina - 1) * limite;

    // Verificar se conversa existe
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: notasInternas.id,
          texto: notasInternas.texto,
          criadoEm: notasInternas.criadoEm,
          usuarioId: usuarios.id,
          usuarioNome: usuarios.nome,
          usuarioAvatarUrl: usuarios.avatarUrl,
        })
        .from(notasInternas)
        .leftJoin(usuarios, eq(notasInternas.usuarioId, usuarios.id))
        .where(eq(notasInternas.conversaId, conversaId))
        .orderBy(desc(notasInternas.criadoEm))
        .limit(limite)
        .offset(skip),
      db.select({ total: count() }).from(notasInternas).where(eq(notasInternas.conversaId, conversaId)),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const notas = rows.map((row) => ({
      id: row.id,
      texto: row.texto,
      criadoEm: row.criadoEm,
      usuario: row.usuarioId
        ? {
            id: row.usuarioId,
            nome: row.usuarioNome,
            avatarUrl: row.usuarioAvatarUrl,
          }
        : null,
    }));

    return {
      dados: notas,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async criar(clienteId: string, conversaId: string, usuarioId: string, dados: CriarNotaInternaDTO) {
    // Verificar se conversa existe
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const [notaCriada] = await db
      .insert(notasInternas)
      .values({
        conversaId,
        usuarioId,
        texto: dados.texto,
      })
      .returning({
        id: notasInternas.id,
        texto: notasInternas.texto,
        criadoEm: notasInternas.criadoEm,
        usuarioId: notasInternas.usuarioId,
      });

    // Fetch usuario info for the response
    const [usuarioInfo] = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        avatarUrl: usuarios.avatarUrl,
      })
      .from(usuarios)
      .where(eq(usuarios.id, notaCriada.usuarioId))
      .limit(1);

    return {
      id: notaCriada.id,
      texto: notaCriada.texto,
      criadoEm: notaCriada.criadoEm,
      usuario: usuarioInfo ?? null,
    };
  },

  async excluir(clienteId: string, conversaId: string, notaId: string, usuarioId: string) {
    // Verificar se conversa existe
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    // Verificar se nota existe e pertence ao usuario
    const notaResult = await db
      .select({
        id: notasInternas.id,
        usuarioId: notasInternas.usuarioId,
      })
      .from(notasInternas)
      .where(and(eq(notasInternas.id, notaId), eq(notasInternas.conversaId, conversaId)))
      .limit(1);

    if (notaResult.length === 0) {
      throw new ErroNaoEncontrado('Nota nao encontrada');
    }

    // Apenas o autor pode excluir a nota
    if (notaResult[0].usuarioId !== usuarioId) {
      throw new ErroNaoEncontrado('Voce nao tem permissao para excluir esta nota');
    }

    await db.delete(notasInternas).where(eq(notasInternas.id, notaId));
  },
};
