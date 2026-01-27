import { eq, and, ilike, ne, count, sql } from 'drizzle-orm';

import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { etiquetas, contatosEtiquetas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarEtiquetaDTO,
  AtualizarEtiquetaDTO,
  ListarEtiquetasQuery,
} from './etiquetas.schema.js';

// =============================================================================
// Servico de Etiquetas
// =============================================================================

export const etiquetasServico = {
  async listar(clienteId: string, query: ListarEtiquetasQuery) {
    const { pagina, limite, busca } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(etiquetas.clienteId, clienteId)];
    if (busca) {
      conditions.push(ilike(etiquetas.nome, `%${busca}%`));
    }
    const where = and(...conditions);

    const [dados, totalResult] = await Promise.all([
      db
        .select({
          id: etiquetas.id,
          nome: etiquetas.nome,
          cor: etiquetas.cor,
          criadoEm: etiquetas.criadoEm,
          totalContatos: sql<number>`(SELECT count(*) FROM contatos_etiquetas WHERE contatos_etiquetas.etiqueta_id = ${etiquetas.id})`.mapWith(Number),
        })
        .from(etiquetas)
        .where(where)
        .orderBy(etiquetas.nome)
        .limit(limite)
        .offset(offset),
      db.select({ total: count() }).from(etiquetas).where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async obterPorId(clienteId: string, id: string) {
    const result = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
        criadoEm: etiquetas.criadoEm,
        totalContatos: sql<number>`(SELECT count(*) FROM contatos_etiquetas WHERE contatos_etiquetas.etiqueta_id = ${etiquetas.id})`.mapWith(Number),
      })
      .from(etiquetas)
      .where(and(eq(etiquetas.id, id), eq(etiquetas.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Etiqueta nao encontrada');
    }

    return result[0];
  },

  async criar(clienteId: string, dados: CriarEtiquetaDTO) {
    // Verificar se nome ja existe
    const nomeExiste = await db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(and(eq(etiquetas.clienteId, clienteId), eq(etiquetas.nome, dados.nome)))
      .limit(1);

    if (nomeExiste.length > 0) {
      throw new ErroValidacao('Ja existe uma etiqueta com este nome');
    }

    const [etiqueta] = await db
      .insert(etiquetas)
      .values({
        clienteId,
        nome: dados.nome,
        cor: dados.cor,
      })
      .returning({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
        criadoEm: etiquetas.criadoEm,
      });

    return {
      ...etiqueta,
      totalContatos: 0,
    };
  },

  async atualizar(clienteId: string, id: string, dados: AtualizarEtiquetaDTO) {
    const etiquetaExiste = await db
      .select({ id: etiquetas.id, nome: etiquetas.nome })
      .from(etiquetas)
      .where(and(eq(etiquetas.id, id), eq(etiquetas.clienteId, clienteId)))
      .limit(1);

    if (etiquetaExiste.length === 0) {
      throw new ErroNaoEncontrado('Etiqueta nao encontrada');
    }

    // Se atualizando nome, verificar duplicidade
    if (dados.nome && dados.nome !== etiquetaExiste[0].nome) {
      const nomeExiste = await db
        .select({ id: etiquetas.id })
        .from(etiquetas)
        .where(and(eq(etiquetas.clienteId, clienteId), eq(etiquetas.nome, dados.nome), ne(etiquetas.id, id)))
        .limit(1);

      if (nomeExiste.length > 0) {
        throw new ErroValidacao('Ja existe uma etiqueta com este nome');
      }
    }

    const updateData: Record<string, unknown> = {};
    if (dados.nome) updateData.nome = dados.nome;
    if (dados.cor) updateData.cor = dados.cor;

    const [etiqueta] = await db
      .update(etiquetas)
      .set(updateData)
      .where(eq(etiquetas.id, id))
      .returning({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
      });

    // Buscar contagem
    const [countResult] = await db
      .select({ total: count() })
      .from(contatosEtiquetas)
      .where(eq(contatosEtiquetas.etiquetaId, id));

    return {
      id: etiqueta.id,
      nome: etiqueta.nome,
      cor: etiqueta.cor,
      totalContatos: countResult?.total ?? 0,
    };
  },

  async excluir(clienteId: string, id: string) {
    const etiquetaExiste = await db
      .select({ id: etiquetas.id })
      .from(etiquetas)
      .where(and(eq(etiquetas.id, id), eq(etiquetas.clienteId, clienteId)))
      .limit(1);

    if (etiquetaExiste.length === 0) {
      throw new ErroNaoEncontrado('Etiqueta nao encontrada');
    }

    await db.delete(etiquetas).where(eq(etiquetas.id, id));
  },
};
