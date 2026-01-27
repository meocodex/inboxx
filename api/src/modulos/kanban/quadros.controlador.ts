import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { quadrosServico } from './quadros.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarQuadroBodySchema,
  atualizarQuadroBodySchema,
  listarQuadrosQuerySchema,
  type CriarQuadroDTO,
  type AtualizarQuadroDTO,
  type ListarQuadrosQuery,
} from './quadros.schema.js';

// =============================================================================
// Rotas de Quadros Kanban
// =============================================================================

export async function quadrosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros - Listar Quadros
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarQuadrosQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarQuadrosQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarQuadrosQuerySchema.parse(request.query);
      const resultado = await quadrosServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:id - Obter Quadro (com colunas e cartões)
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const quadro = await quadrosServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: quadro,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:id/estatisticas - Estatísticas do Quadro
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id/estatisticas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const estatisticas = await quadrosServico.obterEstatisticas(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: estatisticas,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/kanban/quadros - Criar Quadro
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarQuadroDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarQuadroDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarQuadroBodySchema.parse(request.body);
      const quadro = await quadrosServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: quadro,
        mensagem: 'Quadro criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/kanban/quadros/:id - Atualizar Quadro
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarQuadroDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarQuadroDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarQuadroBodySchema.parse(request.body);
      const quadro = await quadrosServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: quadro,
        mensagem: 'Quadro atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/kanban/quadros/:id - Excluir Quadro
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await quadrosServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Quadro excluido com sucesso',
      });
    }
  );
}
