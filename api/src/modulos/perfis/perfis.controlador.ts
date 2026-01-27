import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { perfisServico } from './perfis.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarPerfilBodySchema,
  atualizarPerfilBodySchema,
  listarPerfisQuerySchema,
  gerarTodasPermissoes,
  type CriarPerfilDTO,
  type AtualizarPerfilDTO,
  type ListarPerfisQuery,
} from './perfis.schema.js';

// =============================================================================
// Rotas de Perfis
// =============================================================================

export async function perfisRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/perfis - Listar Perfis
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarPerfisQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarPerfisQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      const query = listarPerfisQuerySchema.parse(request.query);
      const resultado = await perfisServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/perfis/permissoes - Listar Permissoes Disponiveis
  // ---------------------------------------------------------------------------
  app.get(
    '/permissoes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:visualizar')],
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const permissoes = gerarTodasPermissoes();

      return reply.status(200).send({
        sucesso: true,
        dados: permissoes,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/perfis/:id - Obter Perfil por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      const perfil = await perfisServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: perfil,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/perfis - Criar Perfil
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarPerfilDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarPerfilDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarPerfilBodySchema.parse(request.body);
      const perfil = await perfisServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: perfil,
        mensagem: 'Perfil criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/perfis/:id - Atualizar Perfil
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarPerfilDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarPerfilDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarPerfilBodySchema.parse(request.body);
      const perfil = await perfisServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: perfil,
        mensagem: 'Perfil atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/perfis/:id - Excluir Perfil
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await perfisServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Perfil excluido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/perfis/:id/duplicar - Duplicar Perfil
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: { nome: string } }>(
    '/:id/duplicar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('perfis:criar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { nome: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const { nome } = z.object({ nome: z.string().min(2).max(100) }).parse(request.body);
      const perfil = await perfisServico.duplicar(clienteId, request.params.id, nome);

      return reply.status(201).send({
        sucesso: true,
        dados: perfil,
        mensagem: 'Perfil duplicado com sucesso',
      });
    }
  );
}
