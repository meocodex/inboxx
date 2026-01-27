import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { relatoriosServico } from './relatorios.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  periodoQuerySchema,
  relatorioConversasQuerySchema,
  relatorioCampanhasQuerySchema,
  relatorioKanbanQuerySchema,
  type PeriodoQuery,
  type RelatorioConversasQuery,
  type RelatorioCampanhasQuery,
  type RelatorioKanbanQuery,
} from './relatorios.schema.js';

// =============================================================================
// Rotas de Relatórios
// =============================================================================

export async function relatoriosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/relatorios/conversas - Relatório de Conversas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: RelatorioConversasQuery }>(
    '/conversas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: RelatorioConversasQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = relatorioConversasQuerySchema.parse(request.query);
      const relatorio = await relatoriosServico.conversas(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        dados: relatorio,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/relatorios/campanhas - Relatório de Campanhas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: RelatorioCampanhasQuery }>(
    '/campanhas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: RelatorioCampanhasQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = relatorioCampanhasQuerySchema.parse(request.query);
      const relatorio = await relatoriosServico.campanhas(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        dados: relatorio,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/relatorios/kanban - Relatório de Kanban
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: RelatorioKanbanQuery }>(
    '/kanban',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: RelatorioKanbanQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = relatorioKanbanQuerySchema.parse(request.query);
      const relatorio = await relatoriosServico.kanban(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        dados: relatorio,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/relatorios/contatos - Relatório de Contatos
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: PeriodoQuery }>(
    '/contatos',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (request: FastifyRequest<{ Querystring: PeriodoQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = periodoQuerySchema.parse(request.query);
      const relatorio = await relatoriosServico.contatos(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        dados: relatorio,
      });
    }
  );
}
