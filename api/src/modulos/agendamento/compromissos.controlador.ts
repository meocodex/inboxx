import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { compromissosServico } from './compromissos.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarCompromissoBodySchema,
  atualizarCompromissoBodySchema,
  listarCompromissosQuerySchema,
  type CriarCompromissoDTO,
  type AtualizarCompromissoDTO,
  type ListarCompromissosQuery,
} from './compromissos.schema.js';

// =============================================================================
// Rotas de Compromissos
// =============================================================================

export async function compromissosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos - Listar Compromissos
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarCompromissosQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: ListarCompromissosQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarCompromissosQuerySchema.parse(request.query);
      const resultado = await compromissosServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/hoje - Compromissos de Hoje
  // ---------------------------------------------------------------------------
  app.get(
    '/hoje',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const compromissos = await compromissosServico.listarHoje(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: compromissos,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/proximos - Próximos Compromissos
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: { limite?: string } }>(
    '/proximos',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: { limite?: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const limite = request.query.limite ? parseInt(request.query.limite, 10) : 5;
      const compromissos = await compromissosServico.listarProximos(clienteId, limite);

      return reply.status(200).send({
        sucesso: true,
        dados: compromissos,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/estatisticas - Estatísticas
  // ---------------------------------------------------------------------------
  app.get(
    '/estatisticas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const estatisticas = await compromissosServico.obterEstatisticas(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: estatisticas,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/:id - Obter Compromisso
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const compromisso = await compromissosServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: compromisso,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/agendamento/compromissos - Criar Compromisso
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarCompromissoDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarCompromissoDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarCompromissoBodySchema.parse(request.body);
      const compromisso = await compromissosServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: compromisso,
        mensagem: 'Compromisso criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/agendamento/compromissos/:id - Atualizar Compromisso
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarCompromissoDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarCompromissoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarCompromissoBodySchema.parse(request.body);
      const compromisso = await compromissosServico.atualizar(
        clienteId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: compromisso,
        mensagem: 'Compromisso atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/agendamento/compromissos/:id - Excluir Compromisso
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await compromissosServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Compromisso excluido com sucesso',
      });
    }
  );
}
