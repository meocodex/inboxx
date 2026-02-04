import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { mensagensServico } from './mensagens.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  enviarMensagemBodySchema,
  listarMensagensQuerySchema,
  atualizarStatusMensagemBodySchema,
  type EnviarMensagemDTO,
  type ListarMensagensQuery,
  type AtualizarStatusMensagemDTO,
} from './mensagens.schema.js';

// =============================================================================
// Rotas de Mensagens
// =============================================================================

export async function mensagensRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/conversas/:conversaId/mensagens - Listar Mensagens da Conversa
  // ---------------------------------------------------------------------------
  app.get<{ Params: { conversaId: string }; Querystring: ListarMensagensQuery }>(
    '/:conversaId/mensagens',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { conversaId: string }; Querystring: ListarMensagensQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const query = listarMensagensQuerySchema.parse(request.query);
      const resultado = await mensagensServico.listarPorConversa(
        clienteId,
        request.params.conversaId,
        query
      );

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:conversaId/mensagens - Enviar Mensagem
  // ---------------------------------------------------------------------------
  app.post<{ Params: { conversaId: string }; Body: Omit<EnviarMensagemDTO, 'conversaId'> }>(
    '/:conversaId/mensagens',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { conversaId: string };
        Body: Omit<EnviarMensagemDTO, 'conversaId'>;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = enviarMensagemBodySchema.parse({
        ...request.body,
        conversaId: request.params.conversaId,
      });

      const mensagem = await mensagensServico.enviar(clienteId, request.usuario.id, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: mensagem,
        mensagem: 'Mensagem enviada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/conversas/:conversaId/mensagens/:id - Obter Mensagem
  // ---------------------------------------------------------------------------
  app.get<{ Params: { conversaId: string; id: string } }>(
    '/:conversaId/mensagens/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { conversaId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const mensagem = await mensagensServico.obterPorId(
        clienteId,
        request.params.conversaId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: mensagem,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/conversas/:conversaId/mensagens/:id/status - Atualizar Status
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { conversaId: string; id: string }; Body: AtualizarStatusMensagemDTO }>(
    '/:conversaId/mensagens/:id/status',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{
        Params: { conversaId: string; id: string };
        Body: AtualizarStatusMensagemDTO;
      }>,
      reply: FastifyReply
    ) => {
      const dados = atualizarStatusMensagemBodySchema.parse(request.body);
      const mensagem = await mensagensServico.atualizarStatus(request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: mensagem,
      });
    }
  );
}
