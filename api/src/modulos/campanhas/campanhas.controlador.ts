import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { campanhasServico } from './campanhas.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarCampanhaBodySchema,
  atualizarCampanhaBodySchema,
  listarCampanhasQuerySchema,
  agendarCampanhaBodySchema,
  type CriarCampanhaDTO,
  type AtualizarCampanhaDTO,
  type ListarCampanhasQuery,
  type AgendarCampanhaDTO,
} from './campanhas.schema.js';

// =============================================================================
// Rotas de Campanhas
// =============================================================================

export async function campanhasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/campanhas - Listar Campanhas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarCampanhasQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarCampanhasQuery }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const query = listarCampanhasQuerySchema.parse(request.query);
      const resultado = await campanhasServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/campanhas/:id - Obter Campanha
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const campanha = await campanhasServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/campanhas/:id/estatisticas - Estatísticas da Campanha
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id/estatisticas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const estatisticas = await campanhasServico.obterEstatisticas(
        clienteId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: estatisticas,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas - Criar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarCampanhaDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarCampanhaDTO }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const dados = criarCampanhaBodySchema.parse(request.body);
      const campanha = await campanhasServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/campanhas/:id - Atualizar Campanha
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarCampanhaDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarCampanhaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarCampanhaBodySchema.parse(request.body);
      const campanha = await campanhasServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/campanhas/:id - Excluir Campanha
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      await campanhasServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Campanha excluida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas/:id/preparar - Preparar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/preparar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const resultado = await campanhasServico.preparar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas/:id/agendar - Agendar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: AgendarCampanhaDTO }>(
    '/:id/agendar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AgendarCampanhaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = agendarCampanhaBodySchema.parse(request.body);
      const campanha = await campanhasServico.agendar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha agendada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas/:id/iniciar - Iniciar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/iniciar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const campanha = await campanhasServico.iniciar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha iniciada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas/:id/pausar - Pausar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/pausar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const campanha = await campanhasServico.pausar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha pausada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/campanhas/:id/cancelar - Cancelar Campanha
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/cancelar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const campanha = await campanhasServico.cancelar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: campanha,
        mensagem: 'Campanha cancelada com sucesso',
      });
    }
  );
}
