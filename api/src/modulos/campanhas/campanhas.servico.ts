import { eq, and, ilike, count, sql, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { campanhas, campanhasLog, contatos, contatosEtiquetas } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarCampanhaDTO,
  AtualizarCampanhaDTO,
  ListarCampanhasQuery,
  AgendarCampanhaDTO,
} from './campanhas.schema.js';

// =============================================================================
// Servico de Campanhas
// =============================================================================

export const campanhasServico = {
  // ---------------------------------------------------------------------------
  // Listar Campanhas
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, query: ListarCampanhasQuery) {
    const { pagina, limite, busca, status } = query;
    const offset = (pagina - 1) * limite;

    const conditions = [eq(campanhas.clienteId, clienteId)];

    if (busca) {
      conditions.push(ilike(campanhas.nome, `%${busca}%`));
    }

    if (status) {
      conditions.push(eq(campanhas.status, status));
    }

    const whereClause = and(...conditions);

    const [dados, totalResult] = await Promise.all([
      db.select({
        id: campanhas.id,
        clienteId: campanhas.clienteId,
        nome: campanhas.nome,
        template: campanhas.template,
        midiaUrl: campanhas.midiaUrl,
        filtros: campanhas.filtros,
        status: campanhas.status,
        agendadoPara: campanhas.agendadoPara,
        intervaloMs: campanhas.intervaloMs,
        criadoEm: campanhas.criadoEm,
        atualizadoEm: campanhas.atualizadoEm,
        iniciadoEm: campanhas.iniciadoEm,
        finalizadoEm: campanhas.finalizadoEm,
        totalContatos: sql<number>`(SELECT count(*) FROM campanhas_log WHERE campanhas_log.campanha_id = ${campanhas.id})`.mapWith(Number),
      })
        .from(campanhas)
        .where(whereClause)
        .orderBy(desc(campanhas.criadoEm))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(campanhas)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Campanha por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, id: string) {
    const result = await db.select({
      id: campanhas.id,
      clienteId: campanhas.clienteId,
      nome: campanhas.nome,
      template: campanhas.template,
      midiaUrl: campanhas.midiaUrl,
      filtros: campanhas.filtros,
      status: campanhas.status,
      agendadoPara: campanhas.agendadoPara,
      intervaloMs: campanhas.intervaloMs,
      criadoEm: campanhas.criadoEm,
      atualizadoEm: campanhas.atualizadoEm,
      iniciadoEm: campanhas.iniciadoEm,
      finalizadoEm: campanhas.finalizadoEm,
      totalContatos: sql<number>`(SELECT count(*) FROM campanhas_log WHERE campanhas_log.campanha_id = ${campanhas.id})`.mapWith(Number),
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    return result[0];
  },

  // ---------------------------------------------------------------------------
  // Obter Estatisticas da Campanha
  // ---------------------------------------------------------------------------
  async obterEstatisticas(clienteId: string, id: string) {
    const campanhaResult = await db.select({ id: campanhas.id })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const estatisticas = await db.select({
      status: campanhasLog.status,
      total: count(),
    })
      .from(campanhasLog)
      .where(eq(campanhasLog.campanhaId, id))
      .groupBy(campanhasLog.status);

    const total = estatisticas.reduce((acc, e) => acc + e.total, 0);
    const porStatus = Object.fromEntries(
      estatisticas.map((e) => [e.status, e.total])
    );

    return {
      total,
      pendentes: porStatus.PENDENTE || 0,
      enviados: porStatus.ENVIADO || 0,
      entregues: porStatus.ENTREGUE || 0,
      lidos: porStatus.LIDO || 0,
      erros: porStatus.ERRO || 0,
      taxaEntrega: total > 0 ? ((porStatus.ENTREGUE || 0) / total) * 100 : 0,
      taxaLeitura: total > 0 ? ((porStatus.LIDO || 0) / total) * 100 : 0,
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Campanha
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, dados: CriarCampanhaDTO) {
    const [campanha] = await db.insert(campanhas).values({
      clienteId,
      nome: dados.nome,
      template: dados.template,
      midiaUrl: dados.midiaUrl,
      filtros: dados.filtros ?? null,
      agendadoPara: dados.agendadoPara ? new Date(dados.agendadoPara) : null,
      intervaloMs: dados.intervaloMs,
      status: 'RASCUNHO',
    }).returning({ id: campanhas.id });

    return this.obterPorId(clienteId, campanha.id);
  },

  // ---------------------------------------------------------------------------
  // Atualizar Campanha
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, id: string, dados: AtualizarCampanhaDTO) {
    const campanhaExistenteResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaExistenteResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const campanhaExistente = campanhaExistenteResult[0];

    if (!['RASCUNHO', 'AGENDADA'].includes(campanhaExistente.status)) {
      throw new ErroValidacao('Só é possível editar campanhas em rascunho ou agendadas');
    }

    await db.update(campanhas)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.template && { template: dados.template }),
        ...(dados.midiaUrl !== undefined && { midiaUrl: dados.midiaUrl }),
        ...(dados.filtros !== undefined && { filtros: dados.filtros ?? null }),
        ...(dados.agendadoPara !== undefined && {
          agendadoPara: dados.agendadoPara ? new Date(dados.agendadoPara) : null,
        }),
        ...(dados.intervaloMs && { intervaloMs: dados.intervaloMs }),
      })
      .where(eq(campanhas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Excluir Campanha
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, id: string) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    if (campanhaResult[0].status === 'EM_ANDAMENTO') {
      throw new ErroValidacao('Não é possível excluir campanha em andamento');
    }

    await db.delete(campanhas).where(eq(campanhas.id, id));
  },

  // ---------------------------------------------------------------------------
  // Preparar Campanha (Gerar Logs)
  // ---------------------------------------------------------------------------
  async preparar(clienteId: string, id: string) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
      filtros: campanhas.filtros,
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const campanha = campanhaResult[0];

    if (campanha.status !== 'RASCUNHO') {
      throw new ErroValidacao('Só é possível preparar campanhas em rascunho');
    }

    // Buscar contatos com base nos filtros
    const filtros = campanha.filtros as Record<string, unknown> | null;
    const conditions = [eq(contatos.clienteId, clienteId)];

    if (filtros?.etiquetas && Array.isArray(filtros.etiquetas) && filtros.etiquetas.length > 0) {
      conditions.push(
        sql`EXISTS (SELECT 1 FROM contatos_etiquetas WHERE contatos_etiquetas.contato_id = ${contatos.id} AND contatos_etiquetas.etiqueta_id IN (${sql.join(filtros.etiquetas.map((e: string) => sql`${e}::uuid`), sql`, `)}))`
      );
    }

    if (filtros?.excluirEtiquetas && Array.isArray(filtros.excluirEtiquetas) && filtros.excluirEtiquetas.length > 0) {
      conditions.push(
        sql`NOT EXISTS (SELECT 1 FROM contatos_etiquetas WHERE contatos_etiquetas.contato_id = ${contatos.id} AND contatos_etiquetas.etiqueta_id IN (${sql.join(filtros.excluirEtiquetas.map((e: string) => sql`${e}::uuid`), sql`, `)}))`
      );
    }

    const contatosResult = await db.select({ id: contatos.id })
      .from(contatos)
      .where(and(...conditions));

    if (contatosResult.length === 0) {
      throw new ErroValidacao('Nenhum contato encontrado com os filtros aplicados');
    }

    // Limpar logs anteriores e criar novos
    await db.delete(campanhasLog).where(eq(campanhasLog.campanhaId, id));

    await db.insert(campanhasLog).values(
      contatosResult.map((c) => ({
        campanhaId: id,
        contatoId: c.id,
        status: 'PENDENTE' as const,
      }))
    );

    return {
      totalContatos: contatosResult.length,
      mensagem: `Campanha preparada com ${contatosResult.length} contatos`,
    };
  },

  // ---------------------------------------------------------------------------
  // Agendar Campanha
  // ---------------------------------------------------------------------------
  async agendar(clienteId: string, id: string, dados: AgendarCampanhaDTO) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
      totalLogs: sql<number>`(SELECT count(*) FROM campanhas_log WHERE campanhas_log.campanha_id = ${campanhas.id})`.mapWith(Number),
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const campanha = campanhaResult[0];

    if (!['RASCUNHO', 'AGENDADA'].includes(campanha.status)) {
      throw new ErroValidacao('Só é possível agendar campanhas em rascunho ou já agendadas');
    }

    if (campanha.totalLogs === 0) {
      throw new ErroValidacao('Prepare a campanha antes de agendar');
    }

    await db.update(campanhas)
      .set({
        status: 'AGENDADA',
        agendadoPara: new Date(dados.agendadoPara),
      })
      .where(eq(campanhas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Iniciar Campanha
  // ---------------------------------------------------------------------------
  async iniciar(clienteId: string, id: string) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
      iniciadoEm: campanhas.iniciadoEm,
      totalLogs: sql<number>`(SELECT count(*) FROM campanhas_log WHERE campanhas_log.campanha_id = ${campanhas.id})`.mapWith(Number),
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const campanha = campanhaResult[0];

    if (!['RASCUNHO', 'AGENDADA', 'PAUSADA'].includes(campanha.status)) {
      throw new ErroValidacao('Só é possível iniciar campanhas em rascunho, agendadas ou pausadas');
    }

    if (campanha.totalLogs === 0) {
      throw new ErroValidacao('Prepare a campanha antes de iniciar');
    }

    await db.update(campanhas)
      .set({
        status: 'EM_ANDAMENTO',
        iniciadoEm: campanha.iniciadoEm || new Date(),
      })
      .where(eq(campanhas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Pausar Campanha
  // ---------------------------------------------------------------------------
  async pausar(clienteId: string, id: string) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    if (campanhaResult[0].status !== 'EM_ANDAMENTO') {
      throw new ErroValidacao('Só é possível pausar campanhas em andamento');
    }

    await db.update(campanhas)
      .set({ status: 'PAUSADA' })
      .where(eq(campanhas.id, id));

    return this.obterPorId(clienteId, id);
  },

  // ---------------------------------------------------------------------------
  // Cancelar Campanha
  // ---------------------------------------------------------------------------
  async cancelar(clienteId: string, id: string) {
    const campanhaResult = await db.select({
      id: campanhas.id,
      status: campanhas.status,
    })
      .from(campanhas)
      .where(and(eq(campanhas.id, id), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    if (['CONCLUIDA', 'CANCELADA'].includes(campanhaResult[0].status)) {
      throw new ErroValidacao('Campanha já foi concluída ou cancelada');
    }

    await db.update(campanhas)
      .set({ status: 'CANCELADA' })
      .where(eq(campanhas.id, id));

    return this.obterPorId(clienteId, id);
  },
};
