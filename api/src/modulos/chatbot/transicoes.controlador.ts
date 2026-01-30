import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { transicoesServico } from './transicoes.servico.js';
import { motorFluxoServico } from './motor-fluxo.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarTransicaoSchema,
  atualizarTransicaoSchema,
  listarTransicoesQuerySchema,
  conectarNosLoteSchema,
  type CriarTransicaoDTO,
  type AtualizarTransicaoDTO,
  type ListarTransicoesQuery,
  type ConectarNosLoteDTO,
} from './transicoes.schema.js';

// =============================================================================
// Rotas de Transicoes do Chatbot
// =============================================================================

export async function registrarRotasTransicoes(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/transicoes - Listar Transicoes
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string }; Querystring: ListarTransicoesQuery }>(
    '/chatbot/fluxos/:fluxoId/transicoes',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Querystring: ListarTransicoesQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;
      const query = listarTransicoesQuerySchema.parse(request.query);

      const resultado = await transicoesServico.listar(clienteId, fluxoId, query);
      return reply.send(resultado);
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/transicoes/:id - Obter Transicao
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string; id: string } }>(
    '/chatbot/fluxos/:fluxoId/transicoes/:id',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId, id } = request.params;

      const transicao = await transicoesServico.obterPorId(clienteId, fluxoId, id);
      return reply.send(transicao);
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:fluxoId/transicoes - Criar Transicao
  // ---------------------------------------------------------------------------
  app.post<{ Params: { fluxoId: string }; Body: CriarTransicaoDTO }>(
    '/chatbot/fluxos/:fluxoId/transicoes',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Body: CriarTransicaoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;
      const dados = criarTransicaoSchema.parse(request.body);

      const transicao = await transicoesServico.criar(clienteId, fluxoId, dados);
      return reply.status(201).send(transicao);
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/chatbot/fluxos/:fluxoId/transicoes/:id - Atualizar Transicao
  // ---------------------------------------------------------------------------
  app.put<{ Params: { fluxoId: string; id: string }; Body: AtualizarTransicaoDTO }>(
    '/chatbot/fluxos/:fluxoId/transicoes/:id',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string }; Body: AtualizarTransicaoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId, id } = request.params;
      const dados = atualizarTransicaoSchema.parse(request.body);

      const transicao = await transicoesServico.atualizar(clienteId, fluxoId, id, dados);
      return reply.send(transicao);
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/chatbot/fluxos/:fluxoId/transicoes/:id - Excluir Transicao
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { fluxoId: string; id: string } }>(
    '/chatbot/fluxos/:fluxoId/transicoes/:id',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId, id } = request.params;

      await transicoesServico.excluir(clienteId, fluxoId, id);
      return reply.status(204).send();
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:fluxoId/transicoes/sincronizar - Sincronizar Lote
  // ---------------------------------------------------------------------------
  app.post<{ Params: { fluxoId: string }; Body: ConectarNosLoteDTO }>(
    '/chatbot/fluxos/:fluxoId/transicoes/sincronizar',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string }; Body: ConectarNosLoteDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;
      const dados = conectarNosLoteSchema.parse(request.body);

      const transicoes = await transicoesServico.sincronizarLote(clienteId, fluxoId, dados);
      return reply.send({ transicoes });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/chatbot/fluxos/:fluxoId/compilar - Compilar Fluxo para XState
  // ---------------------------------------------------------------------------
  app.post<{ Params: { fluxoId: string } }>(
    '/chatbot/fluxos/:fluxoId/compilar',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;

      const machine = await motorFluxoServico.compilar(clienteId, fluxoId);
      return reply.send({ machine });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/machine - Obter Machine Definition
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string } }>(
    '/chatbot/fluxos/:fluxoId/machine',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;

      const machine = await motorFluxoServico.obterMachine(clienteId, fluxoId);
      return reply.send({ machine });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/chatbot/fluxos/:fluxoId/validar - Validar Fluxo
  // ---------------------------------------------------------------------------
  app.get<{ Params: { fluxoId: string } }>(
    '/chatbot/fluxos/:fluxoId/validar',
    {
      preHandler: [app.autenticar],
    },
    async (
      request: FastifyRequest<{ Params: { fluxoId: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);
      const { fluxoId } = request.params;

      const resultado = await motorFluxoServico.validar(clienteId, fluxoId);
      return reply.send(resultado);
    }
  );
}
