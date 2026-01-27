import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { dashboardServico } from './dashboard.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';

// =============================================================================
// Rotas de Dashboard
// =============================================================================

export async function dashboardRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/dashboard - Dashboard Geral
  // ---------------------------------------------------------------------------
  app.get(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dashboard = await dashboardServico.geral(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: dashboard,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/dashboard/atividades - Atividades Recentes
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: { limite?: string } }>(
    '/atividades',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: { limite?: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const limite = request.query.limite ? parseInt(request.query.limite, 10) : 10;
      const atividades = await dashboardServico.atividadesRecentes(clienteId, limite);

      return reply.status(200).send({
        sucesso: true,
        dados: atividades,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/dashboard/grafico-conversas - Gráfico de Conversas (7 dias)
  // ---------------------------------------------------------------------------
  app.get(
    '/grafico-conversas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const grafico = await dashboardServico.graficoConversas(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: grafico,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/dashboard/kanban - Resumo do Kanban
  // ---------------------------------------------------------------------------
  app.get(
    '/kanban',
    {
      preHandler: [app.autenticar, app.verificarPermissao('relatorios:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const resumo = await dashboardServico.resumoKanban(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: resumo,
      });
    }
  );
}
