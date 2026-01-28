import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { nosServico } from './nos.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarNoBodySchema,
  atualizarNoBodySchema,
  listarNosQuerySchema,
  atualizarPosicoesBodySchema,
  conectarNosBodySchema,
  type CriarNoDTO,
  type AtualizarNoDTO,
  type ListarNosQuery,
  type AtualizarPosicoesDTO,
  type ConectarNosDTO,
} from './nos.schema.js';

// =============================================================================
// Rotas de Nós do Chatbot
// =============================================================================

export async function nosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/nos - Listar Nós
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string }; Querystring: ListarNosQuery }>(
    '/:fluxoId/nos',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Querystring: ListarNosQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const query = listarNosQuerySchema.parse(request.query);
      const resultado = await nosServico.listar(clienteId, request.params.fluxoId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/nos/:id - Obter Nó
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string; id: string } }>(
    '/:fluxoId/nos/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const no = await nosServico.obterPorId(
        clienteId,
        request.params.fluxoId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: no,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:fluxoId/nos - Criar Nó
  // ---------------------------------------------------------------------------
  app.post<{ Params: { fluxoId: string }; Body: CriarNoDTO }>(
    '/:fluxoId/nos',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Body: CriarNoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = criarNoBodySchema.parse(request.body);
      const no = await nosServico.criar(clienteId, request.params.fluxoId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: no,
        mensagem: 'No criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/chatbot/fluxos/:fluxoId/nos/:id - Atualizar Nó
  // ---------------------------------------------------------------------------
  app.put<{ Params: { fluxoId: string; id: string }; Body: AtualizarNoDTO }>(
    '/:fluxoId/nos/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string }; Body: AtualizarNoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarNoBodySchema.parse(request.body);
      const no = await nosServico.atualizar(
        clienteId,
        request.params.fluxoId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: no,
        mensagem: 'No atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/chatbot/fluxos/:fluxoId/nos/:id - Excluir Nó
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { fluxoId: string; id: string } }>(
    '/:fluxoId/nos/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      await nosServico.excluir(clienteId, request.params.fluxoId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'No excluido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/chatbot/fluxos/:fluxoId/nos/posicoes - Atualizar Posições
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { fluxoId: string }; Body: AtualizarPosicoesDTO }>(
    '/:fluxoId/nos/posicoes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Body: AtualizarPosicoesDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarPosicoesBodySchema.parse(request.body);
      await nosServico.atualizarPosicoes(clienteId, request.params.fluxoId, dados);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Posicoes atualizadas com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:fluxoId/nos/conectar - Conectar Nós
  // ---------------------------------------------------------------------------
  app.post<{ Params: { fluxoId: string }; Body: ConectarNosDTO }>(
    '/:fluxoId/nos/conectar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Body: ConectarNosDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = conectarNosBodySchema.parse(request.body);
      await nosServico.conectar(clienteId, request.params.fluxoId, dados);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Nos conectados com sucesso',
      });
    }
  );
}
