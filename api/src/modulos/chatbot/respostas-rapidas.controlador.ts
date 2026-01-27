import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { respostasRapidasServico } from './respostas-rapidas.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarRespostaRapidaBodySchema,
  atualizarRespostaRapidaBodySchema,
  listarRespostasRapidasQuerySchema,
  type CriarRespostaRapidaDTO,
  type AtualizarRespostaRapidaDTO,
  type ListarRespostasRapidasQuery,
} from './respostas-rapidas.schema.js';

// =============================================================================
// Rotas de Respostas Rápidas
// =============================================================================

export async function respostasRapidasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/respostas-rapidas - Listar Respostas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarRespostasRapidasQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: ListarRespostasRapidasQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarRespostasRapidasQuerySchema.parse(request.query);
      const resultado = await respostasRapidasServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/respostas-rapidas/categorias - Listar Categorias
  // ---------------------------------------------------------------------------
  app.get(
    '/categorias',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const categorias = await respostasRapidasServico.listarCategorias(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: categorias,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/respostas-rapidas/atalho/:atalho - Buscar por Atalho
  // ---------------------------------------------------------------------------
  app.get<{ Params: { atalho: string } }>(
    '/atalho/:atalho',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { atalho: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const resposta = await respostasRapidasServico.buscarPorAtalho(
        clienteId,
        request.params.atalho
      );

      return reply.status(200).send({
        sucesso: true,
        dados: resposta,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/respostas-rapidas/:id - Obter Resposta
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const resposta = await respostasRapidasServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: resposta,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/respostas-rapidas - Criar Resposta
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarRespostaRapidaDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarRespostaRapidaDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarRespostaRapidaBodySchema.parse(request.body);
      const resposta = await respostasRapidasServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: resposta,
        mensagem: 'Resposta rapida criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/respostas-rapidas/:id - Atualizar Resposta
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarRespostaRapidaDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarRespostaRapidaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarRespostaRapidaBodySchema.parse(request.body);
      const resposta = await respostasRapidasServico.atualizar(
        clienteId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: resposta,
        mensagem: 'Resposta rapida atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/respostas-rapidas/:id - Excluir Resposta
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('respostas-rapidas:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await respostasRapidasServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Resposta rapida excluida com sucesso',
      });
    }
  );
}
