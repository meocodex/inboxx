import { eq, and, or, ne, ilike, count, asc, isNotNull } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { respostasRapidas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarRespostaRapidaDTO,
  AtualizarRespostaRapidaDTO,
  ListarRespostasRapidasQuery,
} from './respostas-rapidas.schema.js';

// =============================================================================
// Servico de Respostas Rapidas
// =============================================================================

export const respostasRapidasServico = {
  // ---------------------------------------------------------------------------
  // Listar Respostas Rapidas
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarRespostasRapidasQuery) {
    const { pagina, limite, busca, categoria } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(respostasRapidas.clienteId, clienteId)];

    if (busca) {
      conditions.push(
        or(
          ilike(respostasRapidas.titulo, `%${busca}%`),
          ilike(respostasRapidas.atalho, `%${busca}%`),
          ilike(respostasRapidas.conteudo, `%${busca}%`),
        )!
      );
    }

    if (categoria) {
      conditions.push(eq(respostasRapidas.categoria, categoria));
    }

    const whereClause = and(...conditions);

    const [respostas, totalResult] = await Promise.all([
      db.select({
        id: respostasRapidas.id,
        clienteId: respostasRapidas.clienteId,
        titulo: respostasRapidas.titulo,
        atalho: respostasRapidas.atalho,
        conteudo: respostasRapidas.conteudo,
        categoria: respostasRapidas.categoria,
        anexoUrl: respostasRapidas.anexoUrl,
        criadoEm: respostasRapidas.criadoEm,
        atualizadoEm: respostasRapidas.atualizadoEm,
      })
        .from(respostasRapidas)
        .where(whereClause)
        .orderBy(asc(respostasRapidas.atalho))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(respostasRapidas)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: respostas,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Resposta por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const result = await db.select({
      id: respostasRapidas.id,
      clienteId: respostasRapidas.clienteId,
      titulo: respostasRapidas.titulo,
      atalho: respostasRapidas.atalho,
      conteudo: respostasRapidas.conteudo,
      categoria: respostasRapidas.categoria,
      anexoUrl: respostasRapidas.anexoUrl,
      criadoEm: respostasRapidas.criadoEm,
      atualizadoEm: respostasRapidas.atualizadoEm,
    })
      .from(respostasRapidas)
      .where(and(eq(respostasRapidas.id, id), eq(respostasRapidas.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Resposta rápida não encontrada');
    }

    return result[0];
  },

  // ---------------------------------------------------------------------------
  // Buscar por Atalho
  // ---------------------------------------------------------------------------
  async buscarPorAtalho(clienteId: string, atalho: string) {
    const result = await db.select({
      id: respostasRapidas.id,
      clienteId: respostasRapidas.clienteId,
      titulo: respostasRapidas.titulo,
      atalho: respostasRapidas.atalho,
      conteudo: respostasRapidas.conteudo,
      categoria: respostasRapidas.categoria,
      anexoUrl: respostasRapidas.anexoUrl,
      criadoEm: respostasRapidas.criadoEm,
      atualizadoEm: respostasRapidas.atualizadoEm,
    })
      .from(respostasRapidas)
      .where(and(
        eq(respostasRapidas.clienteId, clienteId),
        ilike(respostasRapidas.atalho, atalho),
      ))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Resposta rápida não encontrada');
    }

    return result[0];
  },

  // ---------------------------------------------------------------------------
  // Criar Resposta Rapida
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarRespostaRapidaDTO) {
    // Verificar se atalho ja existe
    const atalhoExistente = await db.select({ id: respostasRapidas.id })
      .from(respostasRapidas)
      .where(and(
        eq(respostasRapidas.clienteId, clienteId),
        ilike(respostasRapidas.atalho, dados.atalho),
      ))
      .limit(1);

    if (atalhoExistente.length > 0) {
      throw new ErroValidacao('Atalho já existe');
    }

    const [resposta] = await db.insert(respostasRapidas).values({
      clienteId,
      titulo: dados.titulo,
      atalho: dados.atalho.toLowerCase(),
      conteudo: dados.conteudo,
      categoria: dados.categoria,
      anexoUrl: dados.anexoUrl,
    }).returning({
      id: respostasRapidas.id,
      clienteId: respostasRapidas.clienteId,
      titulo: respostasRapidas.titulo,
      atalho: respostasRapidas.atalho,
      conteudo: respostasRapidas.conteudo,
      categoria: respostasRapidas.categoria,
      anexoUrl: respostasRapidas.anexoUrl,
      criadoEm: respostasRapidas.criadoEm,
      atualizadoEm: respostasRapidas.atualizadoEm,
    });

    return resposta;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Resposta Rapida
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarRespostaRapidaDTO) {
    const respostaExistente = await this.obterPorId(clienteId, id);

    // Verificar se novo atalho ja existe
    if (dados.atalho && dados.atalho !== respostaExistente.atalho) {
      const atalhoExistente = await db.select({ id: respostasRapidas.id })
        .from(respostasRapidas)
        .where(and(
          eq(respostasRapidas.clienteId, clienteId),
          ilike(respostasRapidas.atalho, dados.atalho),
          ne(respostasRapidas.id, id),
        ))
        .limit(1);

      if (atalhoExistente.length > 0) {
        throw new ErroValidacao('Atalho já existe');
      }
    }

    const [resposta] = await db.update(respostasRapidas)
      .set({
        ...(dados.titulo && { titulo: dados.titulo }),
        ...(dados.atalho && { atalho: dados.atalho.toLowerCase() }),
        ...(dados.conteudo && { conteudo: dados.conteudo }),
        ...(dados.categoria !== undefined && { categoria: dados.categoria }),
        ...(dados.anexoUrl !== undefined && { anexoUrl: dados.anexoUrl }),
      })
      .where(eq(respostasRapidas.id, id))
      .returning({
        id: respostasRapidas.id,
        clienteId: respostasRapidas.clienteId,
        titulo: respostasRapidas.titulo,
        atalho: respostasRapidas.atalho,
        conteudo: respostasRapidas.conteudo,
        categoria: respostasRapidas.categoria,
        anexoUrl: respostasRapidas.anexoUrl,
        criadoEm: respostasRapidas.criadoEm,
        atualizadoEm: respostasRapidas.atualizadoEm,
      });

    return resposta;
  },

  // ---------------------------------------------------------------------------
  // Excluir Resposta Rapida
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    const resposta = await this.obterPorId(clienteId, id);

    await db.delete(respostasRapidas).where(eq(respostasRapidas.id, resposta.id));
  },

  // ---------------------------------------------------------------------------
  // Listar Categorias
  // ---------------------------------------------------------------------------
  async listarCategorias(clienteId: string) {
    const categorias = await db.selectDistinct({
      categoria: respostasRapidas.categoria,
    })
      .from(respostasRapidas)
      .where(and(
        eq(respostasRapidas.clienteId, clienteId),
        isNotNull(respostasRapidas.categoria),
      ))
      .orderBy(asc(respostasRapidas.categoria));

    return categorias.map((c) => c.categoria).filter(Boolean);
  },
};
