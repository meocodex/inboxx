import { eq, and, count, sql, gte, lte, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  conversas,
  mensagens,
  campanhas,
  campanhasLog,
  quadrosKanban,
  colunasKanban,
  cartoesKanban,
  contatos,
  etiquetas,
  contatosEtiquetas,
  usuarios,
} from '../../infraestrutura/banco/schema/index.js';
import type {
  PeriodoQuery,
  RelatorioConversasQuery,
  RelatorioCampanhasQuery,
  RelatorioKanbanQuery,
} from './relatorios.schema.js';

// =============================================================================
// Servico de Relatorios
// =============================================================================

export const relatoriosServico = {
  // ---------------------------------------------------------------------------
  // Relatorio de Conversas
  // ---------------------------------------------------------------------------
  async conversas(clienteId: string, query: RelatorioConversasQuery) {
    const { dataInicio, dataFim, conexaoId, usuarioId, equipeId } = query;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    // Condicoes base
    const condicoesBase = [
      eq(conversas.clienteId, clienteId),
      gte(conversas.criadoEm, inicio),
      lte(conversas.criadoEm, fim),
      ...(conexaoId ? [eq(conversas.conexaoId, conexaoId)] : []),
      ...(usuarioId ? [eq(conversas.usuarioId, usuarioId)] : []),
    ];

    // Estatisticas gerais
    const [totalResult, abertasResult, emAtendimentoResult, resolvidasResult, aguardandoResult] =
      await Promise.all([
        db.select({ total: count() }).from(conversas).where(and(...condicoesBase)),
        db
          .select({ total: count() })
          .from(conversas)
          .where(and(...condicoesBase, eq(conversas.status, 'ABERTA'))),
        db
          .select({ total: count() })
          .from(conversas)
          .where(and(...condicoesBase, eq(conversas.status, 'EM_ATENDIMENTO'))),
        db
          .select({ total: count() })
          .from(conversas)
          .where(and(...condicoesBase, eq(conversas.status, 'RESOLVIDA'))),
        db
          .select({ total: count() })
          .from(conversas)
          .where(and(...condicoesBase, eq(conversas.status, 'AGUARDANDO'))),
      ]);

    const total = totalResult[0].total;
    const abertas = abertasResult[0].total;
    const emAtendimento = emAtendimentoResult[0].total;
    const resolvidas = resolvidasResult[0].total;
    const aguardando = aguardandoResult[0].total;

    // Mensagens no periodo
    const totalMensagensResult = await db
      .select({ total: count() })
      .from(mensagens)
      .innerJoin(conversas, eq(mensagens.conversaId, conversas.id))
      .where(
        and(
          eq(conversas.clienteId, clienteId),
          gte(mensagens.enviadoEm, inicio),
          lte(mensagens.enviadoEm, fim),
        ),
      );

    const totalMensagens = totalMensagensResult[0].total;

    // Por conexao (canal)
    const porConexao = await db
      .select({
        conexaoId: conversas.conexaoId,
        _count: { id: count() },
      })
      .from(conversas)
      .where(and(...condicoesBase))
      .groupBy(conversas.conexaoId);

    // Por usuario (atendente) se tiver equipe filtrada
    let porUsuario: Array<{ usuarioId: string | null; total: number }> = [];
    if (equipeId) {
      // Primeiro buscar usuarios da equipe
      const usuariosDaEquipe = await db
        .select({ id: usuarios.id })
        .from(usuarios)
        .where(eq(usuarios.equipeId, equipeId));

      const usuarioIds = usuariosDaEquipe.map((u) => u.id);

      if (usuarioIds.length > 0) {
        const resultado = await db
          .select({
            usuarioId: conversas.usuarioId,
            total: count(),
          })
          .from(conversas)
          .where(
            and(
              ...condicoesBase,
              inArray(conversas.usuarioId, usuarioIds),
            ),
          )
          .groupBy(conversas.usuarioId);

        porUsuario = resultado.map((r) => ({
          usuarioId: r.usuarioId,
          total: r.total,
        }));
      }
    }

    return {
      periodo: { inicio, fim },
      resumo: {
        total,
        abertas,
        emAtendimento,
        resolvidas,
        aguardando,
        totalMensagens,
      },
      porConexao,
      porUsuario,
    };
  },

  // ---------------------------------------------------------------------------
  // Relatorio de Campanhas
  // ---------------------------------------------------------------------------
  async campanhas(clienteId: string, query: RelatorioCampanhasQuery) {
    const { dataInicio, dataFim, status } = query;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const condicoesBase = [
      eq(campanhas.clienteId, clienteId),
      gte(campanhas.criadoEm, inicio),
      lte(campanhas.criadoEm, fim),
      ...(status ? [eq(campanhas.status, status)] : []),
    ];

    // Estatisticas gerais
    const [totalResult, concluidasResult, emAndamentoResult, agendadasResult] = await Promise.all([
      db.select({ total: count() }).from(campanhas).where(and(...condicoesBase)),
      db
        .select({ total: count() })
        .from(campanhas)
        .where(and(...condicoesBase, eq(campanhas.status, 'CONCLUIDA'))),
      db
        .select({ total: count() })
        .from(campanhas)
        .where(and(...condicoesBase, eq(campanhas.status, 'EM_ANDAMENTO'))),
      db
        .select({ total: count() })
        .from(campanhas)
        .where(and(...condicoesBase, eq(campanhas.status, 'AGENDADA'))),
    ]);

    const total = totalResult[0].total;
    const concluidas = concluidasResult[0].total;
    const emAndamento = emAndamentoResult[0].total;
    const agendadas = agendadasResult[0].total;

    // Logs de envio
    const [enviadosResult, entreguesResult, lidosResult, errosResult] = await Promise.all([
      db
        .select({ total: count() })
        .from(campanhasLog)
        .innerJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
        .where(and(eq(campanhas.clienteId, clienteId), eq(campanhasLog.status, 'ENVIADO'))),
      db
        .select({ total: count() })
        .from(campanhasLog)
        .innerJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
        .where(and(eq(campanhas.clienteId, clienteId), eq(campanhasLog.status, 'ENTREGUE'))),
      db
        .select({ total: count() })
        .from(campanhasLog)
        .innerJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
        .where(and(eq(campanhas.clienteId, clienteId), eq(campanhasLog.status, 'LIDO'))),
      db
        .select({ total: count() })
        .from(campanhasLog)
        .innerJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
        .where(and(eq(campanhas.clienteId, clienteId), eq(campanhasLog.status, 'ERRO'))),
    ]);

    const enviados = enviadosResult[0].total;
    const entregues = entreguesResult[0].total;
    const lidos = lidosResult[0].total;
    const erros = errosResult[0].total;

    // Top 5 campanhas por envios (calculando via logs)
    const topCampanhas = await db
      .select({
        id: campanhas.id,
        nome: campanhas.nome,
        _count: {
          logs: sql<number>`(SELECT count(*) FROM campanhas_log WHERE campanhas_log.campanha_id = ${campanhas.id})`.mapWith(Number),
        },
      })
      .from(campanhas)
      .where(
        and(
          ...condicoesBase,
          eq(campanhas.status, 'CONCLUIDA'),
        ),
      )
      .orderBy(sql`${campanhas.criadoEm} DESC`)
      .limit(5);

    return {
      periodo: { inicio, fim },
      resumo: {
        total,
        concluidas,
        emAndamento,
        agendadas,
      },
      envios: {
        enviados,
        entregues,
        lidos,
        erros,
        taxaEntrega: enviados > 0 ? ((entregues / enviados) * 100).toFixed(2) : '0',
        taxaLeitura: entregues > 0 ? ((lidos / entregues) * 100).toFixed(2) : '0',
      },
      topCampanhas,
    };
  },

  // ---------------------------------------------------------------------------
  // Relatorio de Kanban
  // ---------------------------------------------------------------------------
  async kanban(clienteId: string, query: RelatorioKanbanQuery) {
    const { quadroId } = query;

    const condicoesQuadro = [
      eq(quadrosKanban.clienteId, clienteId),
      ...(quadroId ? [eq(quadrosKanban.id, quadroId)] : []),
    ];

    // Total de quadros
    const totalQuadrosResult = await db
      .select({ total: count() })
      .from(quadrosKanban)
      .where(and(...condicoesQuadro));
    const totalQuadros = totalQuadrosResult[0].total;

    // Total de cartoes
    const totalCartoesResult = await db
      .select({ total: count() })
      .from(cartoesKanban)
      .innerJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .innerJoin(quadrosKanban, eq(colunasKanban.quadroId, quadrosKanban.id))
      .where(and(...condicoesQuadro));
    const totalCartoes = totalCartoesResult[0].total;

    // Valor total
    const valorTotalResult = await db
      .select({
        total: sql<string>`COALESCE(sum(${cartoesKanban.valor}), 0)`,
      })
      .from(cartoesKanban)
      .innerJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .innerJoin(quadrosKanban, eq(colunasKanban.quadroId, quadrosKanban.id))
      .where(and(...condicoesQuadro));

    // Por quadro
    const quadrosData = await db
      .select({
        id: quadrosKanban.id,
        nome: quadrosKanban.nome,
      })
      .from(quadrosKanban)
      .where(and(...condicoesQuadro));

    // Para cada quadro, buscar colunas com count de cartoes
    const porQuadro = await Promise.all(
      quadrosData.map(async (q) => {
        const colunasData = await db
          .select({
            id: colunasKanban.id,
            nome: colunasKanban.nome,
            totalCartoes: sql<number>`(SELECT count(*) FROM cartoes_kanban WHERE cartoes_kanban.coluna_id = ${colunasKanban.id})`.mapWith(Number),
          })
          .from(colunasKanban)
          .where(eq(colunasKanban.quadroId, q.id))
          .orderBy(colunasKanban.ordem);

        return {
          id: q.id,
          nome: q.nome,
          colunas: colunasData.map((c) => ({
            id: c.id,
            nome: c.nome,
            totalCartoes: c.totalCartoes,
          })),
        };
      }),
    );

    // Cartoes com valor (para agrupar por coluna)
    const cartoesComValor = await db
      .select({
        valor: cartoesKanban.valor,
        colunaNome: colunasKanban.nome,
      })
      .from(cartoesKanban)
      .innerJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .innerJoin(quadrosKanban, eq(colunasKanban.quadroId, quadrosKanban.id))
      .where(and(...condicoesQuadro));

    const valorPorColuna = cartoesComValor.reduce(
      (acc, cartao) => {
        const coluna = cartao.colunaNome;
        if (!acc[coluna]) {
          acc[coluna] = { total: 0, valor: 0 };
        }
        acc[coluna].total++;
        acc[coluna].valor += Number(cartao.valor) || 0;
        return acc;
      },
      {} as Record<string, { total: number; valor: number }>,
    );

    return {
      resumo: {
        totalQuadros,
        totalCartoes,
        valorTotal: Number(valorTotalResult[0].total) || 0,
      },
      porQuadro,
      valorPorColuna,
    };
  },

  // ---------------------------------------------------------------------------
  // Relatorio de Contatos
  // ---------------------------------------------------------------------------
  async contatos(clienteId: string, query: PeriodoQuery) {
    const { dataInicio, dataFim } = query;
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    const condicoesBase = [
      eq(contatos.clienteId, clienteId),
      gte(contatos.criadoEm, inicio),
      lte(contatos.criadoEm, fim),
    ];

    // Estatisticas gerais
    const [totalResult, ativosResult, bloqueadosResult] = await Promise.all([
      db.select({ total: count() }).from(contatos).where(and(...condicoesBase)),
      db
        .select({ total: count() })
        .from(contatos)
        .where(and(...condicoesBase, eq(contatos.ativo, true))),
      db
        .select({ total: count() })
        .from(contatos)
        .where(and(...condicoesBase, eq(contatos.bloqueado, true))),
    ]);

    const total = totalResult[0].total;
    const ativos = ativosResult[0].total;
    const bloqueados = bloqueadosResult[0].total;

    // Contatos com conversas
    const comConversasResult = await db
      .select({ total: count(sql`DISTINCT ${contatos.id}`) })
      .from(contatos)
      .innerJoin(conversas, eq(contatos.id, conversas.contatoId))
      .where(and(...condicoesBase));
    const comConversas = comConversasResult[0].total;

    // Por etiqueta
    const porEtiquetaData = await db
      .select({
        id: etiquetas.id,
        nome: etiquetas.nome,
        cor: etiquetas.cor,
        total: sql<number>`(SELECT count(*) FROM contatos_etiquetas WHERE contatos_etiquetas.etiqueta_id = ${etiquetas.id})`.mapWith(Number),
      })
      .from(etiquetas)
      .where(eq(etiquetas.clienteId, clienteId));

    return {
      periodo: { inicio, fim },
      resumo: {
        total,
        ativos,
        bloqueados,
        comConversas,
        semConversas: total - comConversas,
      },
      porEtiqueta: porEtiquetaData.map((e) => ({
        id: e.id,
        nome: e.nome,
        cor: e.cor,
        total: e.total,
      })),
    };
  },
};
