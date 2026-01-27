import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { mensagensServico } from './mensagens.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  enviarMensagemBodySchema,
  listarMensagensQuerySchema,
  atualizarStatusMensagemBodySchema,
  receberMensagemWebhookSchema,
  type EnviarMensagemDTO,
  type ListarMensagensQuery,
  type AtualizarStatusMensagemDTO,
  type ReceberMensagemWebhookDTO,
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
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

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
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

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
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

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

// =============================================================================
// Rotas de Webhook (separadas para registro em prefixo diferente)
// =============================================================================

export async function webhookMensagensRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // POST /api/webhooks/mensagens - Receber Mensagem (Webhook externo)
  // ---------------------------------------------------------------------------
  app.post<{ Body: ReceberMensagemWebhookDTO }>(
    '/mensagens',
    async (request: FastifyRequest<{ Body: ReceberMensagemWebhookDTO }>, reply: FastifyReply) => {
      // Webhook nao requer autenticacao normal, mas deve validar secret/signature
      // Por simplicidade, assumimos clienteId do header ou do corpo
      const clienteId = request.headers['x-cliente-id'] as string;

      if (!clienteId) {
        return reply.status(400).send({
          sucesso: false,
          erro: 'Header x-cliente-id obrigatorio',
        });
      }

      try {
        const dados = receberMensagemWebhookSchema.parse(request.body);
        const resultado = await mensagensServico.receberWebhook(clienteId, dados);

        return reply.status(200).send({
          sucesso: true,
          dados: resultado,
        });
      } catch (erro) {
        return reply.status(400).send({
          sucesso: false,
          erro: (erro as Error).message,
        });
      }
    }
  );
}
