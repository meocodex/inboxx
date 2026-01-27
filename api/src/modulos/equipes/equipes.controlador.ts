import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { equipesServico } from './equipes.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarEquipeBodySchema,
  atualizarEquipeBodySchema,
  listarEquipesQuerySchema,
  adicionarMembroBodySchema,
  type CriarEquipeDTO,
  type AtualizarEquipeDTO,
  type ListarEquipesQuery,
  type AdicionarMembroDTO,
} from './equipes.schema.js';

// =============================================================================
// Rotas de Equipes
// =============================================================================

export async function equipesRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/equipes - Listar Equipes
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarEquipesQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarEquipesQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarEquipesQuerySchema.parse(request.query);
      const resultado = await equipesServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/equipes/:id - Obter Equipe por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const equipe = await equipesServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: equipe,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/equipes - Criar Equipe
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarEquipeDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarEquipeDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarEquipeBodySchema.parse(request.body);
      const equipe = await equipesServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: equipe,
        mensagem: 'Equipe criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/equipes/:id - Atualizar Equipe
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarEquipeDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarEquipeDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarEquipeBodySchema.parse(request.body);
      const equipe = await equipesServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: equipe,
        mensagem: 'Equipe atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/equipes/:id - Excluir Equipe
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await equipesServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Equipe excluida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/equipes/:id/membros - Adicionar Membro
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: AdicionarMembroDTO }>(
    '/:id/membros',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AdicionarMembroDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const { usuarioId } = adicionarMembroBodySchema.parse(request.body);
      await equipesServico.adicionarMembro(clienteId, request.params.id, usuarioId);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Membro adicionado a equipe com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/equipes/:id/membros/:usuarioId - Remover Membro
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string; usuarioId: string } }>(
    '/:id/membros/:usuarioId',
    {
      preHandler: [app.autenticar, app.verificarPermissao('equipes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; usuarioId: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await equipesServico.removerMembro(clienteId, request.params.id, request.params.usuarioId);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Membro removido da equipe com sucesso',
      });
    }
  );
}
