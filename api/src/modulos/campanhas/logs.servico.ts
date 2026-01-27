import { eq, and, count, desc, inArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { campanhas, campanhasLog, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import type { ListarLogsQuery, AtualizarStatusLogDTO } from './logs.schema.js';

// =============================================================================
// Servico de Logs de Campanha
// =============================================================================

export const logsServico = {
  // ---------------------------------------------------------------------------
  // Listar Logs de uma Campanha
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, campanhaId: string, query: ListarLogsQuery) {
    const { pagina, limite, status } = query;
    const offset = (pagina - 1) * limite;

    // Verificar se a campanha pertence ao cliente
    const campanhaResult = await db.select({ id: campanhas.id })
      .from(campanhas)
      .where(and(eq(campanhas.id, campanhaId), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const conditions = [eq(campanhasLog.campanhaId, campanhaId)];
    if (status) {
      conditions.push(eq(campanhasLog.status, status));
    }

    const whereClause = and(...conditions);

    const [logs, totalResult] = await Promise.all([
      db.select({
        id: campanhasLog.id,
        campanhaId: campanhasLog.campanhaId,
        contatoId: campanhasLog.contatoId,
        status: campanhasLog.status,
        erro: campanhasLog.erro,
        enviadoEm: campanhasLog.enviadoEm,
        campanha: {
          id: campanhas.id,
          nome: campanhas.nome,
        },
      })
        .from(campanhasLog)
        .leftJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
        .where(whereClause)
        .orderBy(desc(campanhasLog.enviadoEm))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() })
        .from(campanhasLog)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    // Buscar dados dos contatos separadamente
    const contatoIds = logs.map((l) => l.contatoId);
    const contatosResult = contatoIds.length > 0
      ? await db.select({
          id: contatos.id,
          nome: contatos.nome,
          telefone: contatos.telefone,
        })
          .from(contatos)
          .where(inArray(contatos.id, contatoIds))
      : [];

    const contatosMap = new Map(contatosResult.map((c) => [c.id, c]));

    return {
      dados: logs.map((log) => ({
        ...log,
        contato: contatosMap.get(log.contatoId) || null,
      })),
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Log por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, campanhaId: string, id: string) {
    const campanhaResult = await db.select({ id: campanhas.id })
      .from(campanhas)
      .where(and(eq(campanhas.id, campanhaId), eq(campanhas.clienteId, clienteId)))
      .limit(1);

    if (campanhaResult.length === 0) {
      throw new ErroNaoEncontrado('Campanha não encontrada');
    }

    const logResult = await db.select({
      id: campanhasLog.id,
      campanhaId: campanhasLog.campanhaId,
      contatoId: campanhasLog.contatoId,
      status: campanhasLog.status,
      erro: campanhasLog.erro,
      enviadoEm: campanhasLog.enviadoEm,
    })
      .from(campanhasLog)
      .where(and(eq(campanhasLog.id, id), eq(campanhasLog.campanhaId, campanhaId)))
      .limit(1);

    if (logResult.length === 0) {
      throw new ErroNaoEncontrado('Log não encontrado');
    }

    const log = logResult[0];

    const contatoResult = await db.select({
      id: contatos.id,
      nome: contatos.nome,
      telefone: contatos.telefone,
      email: contatos.email,
    })
      .from(contatos)
      .where(eq(contatos.id, log.contatoId))
      .limit(1);

    return {
      ...log,
      contato: contatoResult[0] ?? null,
    };
  },

  // ---------------------------------------------------------------------------
  // Atualizar Status do Log
  // ---------------------------------------------------------------------------
  async atualizarStatus(
    campanhaId: string,
    id: string,
    dados: AtualizarStatusLogDTO
  ) {
    const logResult = await db.select({
      id: campanhasLog.id,
      campanhaId: campanhasLog.campanhaId,
      enviadoEm: campanhasLog.enviadoEm,
    })
      .from(campanhasLog)
      .where(and(eq(campanhasLog.id, id), eq(campanhasLog.campanhaId, campanhaId)))
      .limit(1);

    if (logResult.length === 0) {
      throw new ErroNaoEncontrado('Log não encontrado');
    }

    const log = logResult[0];

    const [logAtualizado] = await db.update(campanhasLog)
      .set({
        status: dados.status,
        erro: dados.erro,
        ...(dados.status !== 'PENDENTE' && !log.enviadoEm && { enviadoEm: new Date() }),
      })
      .where(eq(campanhasLog.id, id))
      .returning({
        id: campanhasLog.id,
        campanhaId: campanhasLog.campanhaId,
        contatoId: campanhasLog.contatoId,
        status: campanhasLog.status,
        erro: campanhasLog.erro,
        enviadoEm: campanhasLog.enviadoEm,
      });

    // Verificar se todos os logs foram processados
    const pendentesResult = await db.select({ total: count() })
      .from(campanhasLog)
      .where(and(eq(campanhasLog.campanhaId, campanhaId), eq(campanhasLog.status, 'PENDENTE')));

    const pendentes = pendentesResult[0]?.total ?? 0;

    if (pendentes === 0) {
      await db.update(campanhas)
        .set({
          status: 'CONCLUIDA',
          finalizadoEm: new Date(),
        })
        .where(eq(campanhas.id, campanhaId));
    }

    return logAtualizado;
  },

  // ---------------------------------------------------------------------------
  // Obter Proximo Pendente (para processamento)
  // ---------------------------------------------------------------------------
  async obterProximoPendente(campanhaId: string) {
    const logResult = await db.select({
      id: campanhasLog.id,
      campanhaId: campanhasLog.campanhaId,
      contatoId: campanhasLog.contatoId,
      status: campanhasLog.status,
      erro: campanhasLog.erro,
      enviadoEm: campanhasLog.enviadoEm,
      campanha: {
        template: campanhas.template,
        midiaUrl: campanhas.midiaUrl,
        intervaloMs: campanhas.intervaloMs,
      },
    })
      .from(campanhasLog)
      .leftJoin(campanhas, eq(campanhasLog.campanhaId, campanhas.id))
      .where(and(eq(campanhasLog.campanhaId, campanhaId), eq(campanhasLog.status, 'PENDENTE')))
      .limit(1);

    if (logResult.length === 0) {
      return null;
    }

    const log = logResult[0];

    const contatoResult = await db.select({
      id: contatos.id,
      nome: contatos.nome,
      telefone: contatos.telefone,
    })
      .from(contatos)
      .where(eq(contatos.id, log.contatoId))
      .limit(1);

    return {
      ...log,
      contato: contatoResult[0] ?? null,
    };
  },

  // ---------------------------------------------------------------------------
  // Marcar como Enviado
  // ---------------------------------------------------------------------------
  async marcarEnviado(id: string, idExterno?: string) {
    const [result] = await db.update(campanhasLog)
      .set({
        status: 'ENVIADO',
        enviadoEm: new Date(),
      })
      .where(eq(campanhasLog.id, id))
      .returning({
        id: campanhasLog.id,
        campanhaId: campanhasLog.campanhaId,
        contatoId: campanhasLog.contatoId,
        status: campanhasLog.status,
        erro: campanhasLog.erro,
        enviadoEm: campanhasLog.enviadoEm,
      });

    return result;
  },

  // ---------------------------------------------------------------------------
  // Marcar como Erro
  // ---------------------------------------------------------------------------
  async marcarErro(id: string, erro: string) {
    const [result] = await db.update(campanhasLog)
      .set({
        status: 'ERRO',
        erro,
        enviadoEm: new Date(),
      })
      .where(eq(campanhasLog.id, id))
      .returning({
        id: campanhasLog.id,
        campanhaId: campanhasLog.campanhaId,
        contatoId: campanhasLog.contatoId,
        status: campanhasLog.status,
        erro: campanhasLog.erro,
        enviadoEm: campanhasLog.enviadoEm,
      });

    return result;
  },
};
