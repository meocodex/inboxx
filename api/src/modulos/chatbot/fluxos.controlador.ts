import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { fluxosServico } from './fluxos.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarFluxoBodySchema,
  atualizarFluxoBodySchema,
  listarFluxosQuerySchema,
  duplicarFluxoBodySchema,
  type CriarFluxoDTO,
  type AtualizarFluxoDTO,
  type ListarFluxosQuery,
  type DuplicarFluxoDTO,
} from './fluxos.schema.js';

// =============================================================================
// Rotas de Fluxos de Chatbot
// =============================================================================

export async function fluxosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos - Listar Fluxos
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarFluxosQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:visualizar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarFluxosQuery }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const query = listarFluxosQuerySchema.parse(request.query);
      const resultado = await fluxosServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:id - Obter Fluxo
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const fluxo = await fluxosServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: fluxo,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos - Criar Fluxo
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarFluxoDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarFluxoDTO }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const dados = criarFluxoBodySchema.parse(request.body);
      const fluxo = await fluxosServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: fluxo,
        mensagem: 'Fluxo criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/chatbot/fluxos/:id - Atualizar Fluxo
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarFluxoDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarFluxoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarFluxoBodySchema.parse(request.body);
      const fluxo = await fluxosServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: fluxo,
        mensagem: 'Fluxo atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/chatbot/fluxos/:id - Excluir Fluxo
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      await fluxosServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Fluxo excluido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:id/duplicar - Duplicar Fluxo
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: DuplicarFluxoDTO }>(
    '/:id/duplicar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:criar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: DuplicarFluxoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = duplicarFluxoBodySchema.parse(request.body);
      const fluxo = await fluxosServico.duplicar(clienteId, request.params.id, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: fluxo,
        mensagem: 'Fluxo duplicado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/chatbot/fluxos/:id/ativar - Ativar Fluxo
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string } }>(
    '/:id/ativar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const fluxo = await fluxosServico.alterarStatus(clienteId, request.params.id, true);

      return reply.status(200).send({
        sucesso: true,
        dados: fluxo,
        mensagem: 'Fluxo ativado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/chatbot/fluxos/:id/desativar - Desativar Fluxo
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string } }>(
    '/:id/desativar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('chatbot:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const fluxo = await fluxosServico.alterarStatus(clienteId, request.params.id, false);

      return reply.status(200).send({
        sucesso: true,
        dados: fluxo,
        mensagem: 'Fluxo desativado com sucesso',
      });
    }
  );
}
