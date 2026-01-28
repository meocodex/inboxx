import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { logsServico } from './logs.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  listarLogsQuerySchema,
  atualizarStatusLogBodySchema,
  type ListarLogsQuery,
  type AtualizarStatusLogDTO,
} from './logs.schema.js';

// =============================================================================
// Rotas de Logs de Campanha
// =============================================================================

export async function logsRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/campanhas/:campanhaId/logs - Listar Logs
  // ---------------------------------------------------------------------------
  app.get<{ Params: { campanhaId: string }; Querystring: ListarLogsQuery }>(
    '/:campanhaId/logs',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (
      request: FastifyRequest<{
        Params: { campanhaId: string };
        Querystring: ListarLogsQuery;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const query = listarLogsQuerySchema.parse(request.query);
      const resultado = await logsServico.listar(
        clienteId,
        request.params.campanhaId,
        query
      );

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/campanhas/:campanhaId/logs/:id - Obter Log
  // ---------------------------------------------------------------------------
  app.get<{ Params: { campanhaId: string; id: string } }>(
    '/:campanhaId/logs/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { campanhaId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const log = await logsServico.obterPorId(
        clienteId,
        request.params.campanhaId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: log,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/campanhas/:campanhaId/logs/:id/status - Atualizar Status
  // ---------------------------------------------------------------------------
  app.patch<{
    Params: { campanhaId: string; id: string };
    Body: AtualizarStatusLogDTO;
  }>(
    '/:campanhaId/logs/:id/status',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{
        Params: { campanhaId: string; id: string };
        Body: AtualizarStatusLogDTO;
      }>,
      reply: FastifyReply
    ) => {
      const dados = atualizarStatusLogBodySchema.parse(request.body);
      const log = await logsServico.atualizarStatus(
        request.params.campanhaId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: log,
      });
    }
  );
}
