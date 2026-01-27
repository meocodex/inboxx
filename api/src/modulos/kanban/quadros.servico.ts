import { eq, and, or, ilike, count, sql, desc, asc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { quadrosKanban, colunasKanban, cartoesKanban, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import type { CriarQuadroDTO, AtualizarQuadroDTO, ListarQuadrosQuery } from './quadros.schema.js';

// =============================================================================
// Servico de Quadros Kanban
// =============================================================================

export const quadrosServico = {
  // ---------------------------------------------------------------------------
  // Listar Quadros
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarQuadrosQuery) {
    const { pagina, limite, busca } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(quadrosKanban.clienteId, clienteId)];

    if (busca) {
      conditions.push(
        or(
          ilike(quadrosKanban.nome, `%${busca}%`),
          ilike(quadrosKanban.descricao, `%${busca}%`)
        )!
      );
    }

    const whereClause = and(...conditions);

    const colunasCountSub = db
      .select({ total: count() })
      .from(colunasKanban)
      .where(eq(colunasKanban.quadroId, quadrosKanban.id));

    const [quadros, totalResult] = await Promise.all([
      db
        .select({
          id: quadrosKanban.id,
          clienteId: quadrosKanban.clienteId,
          nome: quadrosKanban.nome,
          descricao: quadrosKanban.descricao,
          criadoEm: quadrosKanban.criadoEm,
          atualizadoEm: quadrosKanban.atualizadoEm,
          totalColunas: sql<number>`(${colunasCountSub})`.as('total_colunas'),
        })
        .from(quadrosKanban)
        .where(whereClause)
        .orderBy(desc(quadrosKanban.criadoEm))
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(quadrosKanban)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: quadros,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Quadro por ID (com colunas e cartoes)
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, id), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    const quadro = quadroResult[0];

    // Buscar colunas do quadro
    const colunas = await db
      .select()
      .from(colunasKanban)
      .where(eq(colunasKanban.quadroId, id))
      .orderBy(asc(colunasKanban.ordem));

    // Buscar cartoes de todas as colunas com contato
    const colunasIds = colunas.map((c) => c.id);

    let cartoesPorColuna: Record<string, Array<{
      id: string;
      colunaId: string;
      contatoId: string | null;
      titulo: string;
      descricao: string | null;
      valor: string | null;
      ordem: number;
      dataLimite: Date | null;
      criadoEm: Date;
      atualizadoEm: Date;
      contato: { id: string; nome: string | null; telefone: string } | null;
    }>> = {};

    if (colunasIds.length > 0) {
      const cartoesResult = await db
        .select({
          id: cartoesKanban.id,
          colunaId: cartoesKanban.colunaId,
          contatoId: cartoesKanban.contatoId,
          titulo: cartoesKanban.titulo,
          descricao: cartoesKanban.descricao,
          valor: cartoesKanban.valor,
          ordem: cartoesKanban.ordem,
          dataLimite: cartoesKanban.dataLimite,
          criadoEm: cartoesKanban.criadoEm,
          atualizadoEm: cartoesKanban.atualizadoEm,
          contatoId2: contatos.id,
          contatoNome: contatos.nome,
          contatoTelefone: contatos.telefone,
        })
        .from(cartoesKanban)
        .leftJoin(contatos, eq(cartoesKanban.contatoId, contatos.id))
        .where(
          sql`${cartoesKanban.colunaId} IN (${sql.join(colunasIds.map((cid) => sql`${cid}`), sql`, `)})`
        )
        .orderBy(asc(cartoesKanban.ordem));

      for (const c of cartoesResult) {
        if (!cartoesPorColuna[c.colunaId]) {
          cartoesPorColuna[c.colunaId] = [];
        }
        cartoesPorColuna[c.colunaId].push({
          id: c.id,
          colunaId: c.colunaId,
          contatoId: c.contatoId,
          titulo: c.titulo,
          descricao: c.descricao,
          valor: c.valor,
          ordem: c.ordem,
          dataLimite: c.dataLimite,
          criadoEm: c.criadoEm,
          atualizadoEm: c.atualizadoEm,
          contato: c.contatoId2
            ? { id: c.contatoId2, nome: c.contatoNome, telefone: c.contatoTelefone! }
            : null,
        });
      }
    }

    return {
      ...quadro,
      colunas: colunas.map((col) => ({
        ...col,
        cartoes: cartoesPorColuna[col.id] ?? [],
      })),
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Quadro
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarQuadroDTO) {
    const [quadro] = await db
      .insert(quadrosKanban)
      .values({
        clienteId,
        nome: dados.nome,
        descricao: dados.descricao,
      })
      .returning();

    // Criar colunas padrao
    await db.insert(colunasKanban).values([
      { quadroId: quadro.id, nome: 'A Fazer', cor: '#6B7280', ordem: 0 },
      { quadroId: quadro.id, nome: 'Em Progresso', cor: '#3B82F6', ordem: 1 },
      { quadroId: quadro.id, nome: 'Concluído', cor: '#10B981', ordem: 2 },
    ]);

    return this.obterPorId(clienteId, quadro.id);
  },

  // ---------------------------------------------------------------------------
  // Atualizar Quadro
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarQuadroDTO) {
    const quadroExistente = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, id), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroExistente.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    await db
      .update(quadrosKanban)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
      })
      .where(eq(quadrosKanban.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Excluir Quadro
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, id), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    await db.delete(quadrosKanban).where(eq(quadrosKanban.id, id));
  },

  // ---------------------------------------------------------------------------
  // Obter Estatisticas do Quadro
  // ---------------------------------------------------------------------------
  async obterEstatisticas(clienteId: string, id: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, id), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    // Buscar colunas
    const colunas = await db
      .select()
      .from(colunasKanban)
      .where(eq(colunasKanban.quadroId, id));

    // Buscar estatisticas de cartoes por coluna
    const colunasIds = colunas.map((c) => c.id);

    let estatisticasPorColuna: Array<{
      colunaId: string;
      totalCartoes: number;
      valorTotal: number;
    }> = [];

    if (colunasIds.length > 0) {
      const stats = await db
        .select({
          colunaId: cartoesKanban.colunaId,
          totalCartoes: count(),
          valorTotal: sql<number>`coalesce(sum(${cartoesKanban.valor}::numeric), 0)`,
        })
        .from(cartoesKanban)
        .where(
          sql`${cartoesKanban.colunaId} IN (${sql.join(colunasIds.map((cid) => sql`${cid}`), sql`, `)})`
        )
        .groupBy(cartoesKanban.colunaId);

      estatisticasPorColuna = stats.map((s) => ({
        colunaId: s.colunaId,
        totalCartoes: Number(s.totalCartoes),
        valorTotal: Number(s.valorTotal),
      }));
    }

    const estatisticas = colunas.map((coluna) => {
      const stat = estatisticasPorColuna.find((s) => s.colunaId === coluna.id);
      return {
        colunaId: coluna.id,
        colunaNome: coluna.nome,
        totalCartoes: stat?.totalCartoes ?? 0,
        valorTotal: stat?.valorTotal ?? 0,
      };
    });

    const totalCartoes = estatisticas.reduce((acc, e) => acc + e.totalCartoes, 0);
    const valorTotal = estatisticas.reduce((acc, e) => acc + e.valorTotal, 0);

    return {
      totalColunas: colunas.length,
      totalCartoes,
      valorTotal,
      porColuna: estatisticas,
    };
  },
};
