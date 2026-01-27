import { eq, and, count, sql, gte, lt, lte, desc, asc, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  contatos,
  conversas,
  campanhas,
  quadrosKanban,
  colunasKanban,
  cartoesKanban,
  compromissos,
  mensagens,
} from '../../infraestrutura/banco/schema/index.js';

// =============================================================================
// Servico de Dashboard
// =============================================================================

export const dashboardServico = {
  // ---------------------------------------------------------------------------
  // Dashboard Geral
  // ---------------------------------------------------------------------------
  async geral(clienteId: string) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(amanha.getDate() + 1);

    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Contadores principais
    const [
      totalContatosResult,
      totalConversasResult,
      conversasAbertasResult,
      conversasHojeResult,
      totalCampanhasResult,
      campanhasAtivasResult,
      totalQuadrosResult,
      totalCartoesResult,
      compromissosHojeResult,
    ] = await Promise.all([
      db.select({ total: count() }).from(contatos).where(eq(contatos.clienteId, clienteId)),
      db.select({ total: count() }).from(conversas).where(eq(conversas.clienteId, clienteId)),
      db
        .select({ total: count() })
        .from(conversas)
        .where(
          and(
            eq(conversas.clienteId, clienteId),
            inArray(conversas.status, ['ABERTA', 'EM_ATENDIMENTO', 'AGUARDANDO']),
          ),
        ),
      db
        .select({ total: count() })
        .from(conversas)
        .where(
          and(
            eq(conversas.clienteId, clienteId),
            gte(conversas.criadoEm, hoje),
            lt(conversas.criadoEm, amanha),
          ),
        ),
      db.select({ total: count() }).from(campanhas).where(eq(campanhas.clienteId, clienteId)),
      db
        .select({ total: count() })
        .from(campanhas)
        .where(
          and(
            eq(campanhas.clienteId, clienteId),
            inArray(campanhas.status, ['EM_ANDAMENTO', 'AGENDADA']),
          ),
        ),
      db
        .select({ total: count() })
        .from(quadrosKanban)
        .where(eq(quadrosKanban.clienteId, clienteId)),
      db
        .select({ total: count() })
        .from(cartoesKanban)
        .innerJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
        .innerJoin(quadrosKanban, eq(colunasKanban.quadroId, quadrosKanban.id))
        .where(eq(quadrosKanban.clienteId, clienteId)),
      db
        .select({ total: count() })
        .from(compromissos)
        .where(
          and(
            eq(compromissos.clienteId, clienteId),
            gte(compromissos.dataHora, hoje),
            lt(compromissos.dataHora, amanha),
          ),
        ),
    ]);

    const totalContatos = totalContatosResult[0].total;
    const totalConversas = totalConversasResult[0].total;
    const conversasAbertas = conversasAbertasResult[0].total;
    const conversasHoje = conversasHojeResult[0].total;
    const totalCampanhas = totalCampanhasResult[0].total;
    const campanhasAtivas = campanhasAtivasResult[0].total;
    const totalQuadros = totalQuadrosResult[0].total;
    const totalCartoes = totalCartoesResult[0].total;
    const compromissosHoje = compromissosHojeResult[0].total;

    // Valor total no Kanban
    const valorKanbanResult = await db
      .select({
        total: sql<string>`COALESCE(sum(${cartoesKanban.valor}), 0)`,
      })
      .from(cartoesKanban)
      .innerJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .innerJoin(quadrosKanban, eq(colunasKanban.quadroId, quadrosKanban.id))
      .where(eq(quadrosKanban.clienteId, clienteId));

    // Mensagens hoje
    const mensagensHojeResult = await db
      .select({ total: count() })
      .from(mensagens)
      .innerJoin(conversas, eq(mensagens.conversaId, conversas.id))
      .where(
        and(
          eq(conversas.clienteId, clienteId),
          gte(mensagens.enviadoEm, hoje),
          lt(mensagens.enviadoEm, amanha),
        ),
      );

    const mensagensHoje = mensagensHojeResult[0].total;

    return {
      contatos: {
        total: totalContatos,
      },
      conversas: {
        total: totalConversas,
        abertas: conversasAbertas,
        hoje: conversasHoje,
        mensagensHoje,
      },
      campanhas: {
        total: totalCampanhas,
        ativas: campanhasAtivas,
      },
      kanban: {
        quadros: totalQuadros,
        cartoes: totalCartoes,
        valorTotal: Number(valorKanbanResult[0].total) || 0,
      },
      agenda: {
        compromissosHoje,
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Atividades Recentes
  // ---------------------------------------------------------------------------
  async atividadesRecentes(clienteId: string, limite: number = 10) {
    // Ultimas conversas
    const ultimasConversas = await db
      .select({
        id: conversas.id,
        status: conversas.status,
        atualizadoEm: conversas.atualizadoEm,
        contato: {
          id: contatos.id,
          nome: contatos.nome,
        },
      })
      .from(conversas)
      .leftJoin(contatos, eq(conversas.contatoId, contatos.id))
      .where(eq(conversas.clienteId, clienteId))
      .orderBy(desc(conversas.atualizadoEm))
      .limit(limite);

    // Ultimas mensagens
    const ultimasMensagensRaw = await db
      .select({
        id: mensagens.id,
        conteudo: mensagens.conteudo,
        tipo: mensagens.tipo,
        enviadoEm: mensagens.enviadoEm,
        conversaId: conversas.id,
        contatoNome: contatos.nome,
      })
      .from(mensagens)
      .innerJoin(conversas, eq(mensagens.conversaId, conversas.id))
      .leftJoin(contatos, eq(conversas.contatoId, contatos.id))
      .where(eq(conversas.clienteId, clienteId))
      .orderBy(desc(mensagens.enviadoEm))
      .limit(limite);

    // Proximos compromissos
    const proximosCompromissos = await db
      .select({
        id: compromissos.id,
        titulo: compromissos.titulo,
        dataHora: compromissos.dataHora,
        contato: {
          nome: contatos.nome,
        },
      })
      .from(compromissos)
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(
        and(
          eq(compromissos.clienteId, clienteId),
          gte(compromissos.dataHora, new Date()),
        ),
      )
      .orderBy(asc(compromissos.dataHora))
      .limit(5);

    return {
      conversas: ultimasConversas,
      mensagens: ultimasMensagensRaw.map((m) => ({
        id: m.id,
        conteudo: m.conteudo?.substring(0, 100),
        tipo: m.tipo,
        enviadoEm: m.enviadoEm,
        conversaId: m.conversaId,
        contatoNome: m.contatoNome,
      })),
      compromissos: proximosCompromissos,
    };
  },

  // ---------------------------------------------------------------------------
  // Grafico de Conversas (ultimos 7 dias)
  // ---------------------------------------------------------------------------
  async graficoConversas(clienteId: string) {
    const hoje = new Date();
    hoje.setHours(23, 59, 59, 999);

    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 6);
    seteDiasAtras.setHours(0, 0, 0, 0);

    const conversasResult = await db
      .select({ criadoEm: conversas.criadoEm })
      .from(conversas)
      .where(
        and(
          eq(conversas.clienteId, clienteId),
          gte(conversas.criadoEm, seteDiasAtras),
          lte(conversas.criadoEm, hoje),
        ),
      );

    // Agrupar por dia
    const porDia: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const data = new Date(seteDiasAtras);
      data.setDate(seteDiasAtras.getDate() + i);
      const chave = data.toISOString().split('T')[0];
      porDia[chave] = 0;
    }

    conversasResult.forEach((c) => {
      const chave = c.criadoEm.toISOString().split('T')[0];
      if (porDia[chave] !== undefined) {
        porDia[chave]++;
      }
    });

    return Object.entries(porDia).map(([data, total]) => ({ data, total }));
  },

  // ---------------------------------------------------------------------------
  // Resumo do Kanban
  // ---------------------------------------------------------------------------
  async resumoKanban(clienteId: string) {
    // Buscar quadros
    const quadrosData = await db
      .select({
        id: quadrosKanban.id,
        nome: quadrosKanban.nome,
      })
      .from(quadrosKanban)
      .where(eq(quadrosKanban.clienteId, clienteId))
      .orderBy(desc(quadrosKanban.atualizadoEm))
      .limit(5);

    // Para cada quadro, buscar colunas com count e valores dos cartoes
    const quadros = await Promise.all(
      quadrosData.map(async (q) => {
        const colunasData = await db
          .select({
            id: colunasKanban.id,
            nome: colunasKanban.nome,
            cor: colunasKanban.cor,
            totalCartoes: sql<number>`(SELECT count(*) FROM cartoes_kanban WHERE cartoes_kanban.coluna_id = ${colunasKanban.id})`.mapWith(Number),
            valorTotal: sql<number>`COALESCE((SELECT sum(valor) FROM cartoes_kanban WHERE cartoes_kanban.coluna_id = ${colunasKanban.id}), 0)`.mapWith(Number),
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
            cor: c.cor,
            totalCartoes: c.totalCartoes,
            valorTotal: c.valorTotal,
          })),
        };
      }),
    );

    return quadros;
  },
};
