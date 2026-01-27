import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { mensagensAgendadasServico } from './mensagens-agendadas.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarMensagemAgendadaBodySchema,
  atualizarMensagemAgendadaBodySchema,
  listarMensagensAgendadasQuerySchema,
  type CriarMensagemAgendadaDTO,
  type AtualizarMensagemAgendadaDTO,
  type ListarMensagensAgendadasQuery,
} from './mensagens-agendadas.schema.js';

// =============================================================================
// Rotas de Mensagens Agendadas
// =============================================================================

export async function mensagensAgendadasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/mensagens-agendadas - Listar Mensagens Agendadas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarMensagensAgendadasQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (
      request: FastifyRequest<{ Querystring: ListarMensagensAgendadasQuery }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarMensagensAgendadasQuerySchema.parse(request.query);
      const resultado = await mensagensAgendadasServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/mensagens-agendadas/:id - Obter Mensagem Agendada
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const mensagem = await mensagensAgendadasServico.obterPorId(
        clienteId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: mensagem,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/mensagens-agendadas - Criar Mensagem Agendada
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarMensagemAgendadaDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:criar')],
    },
    async (
      request: FastifyRequest<{ Body: CriarMensagemAgendadaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarMensagemAgendadaBodySchema.parse(request.body);
      const mensagem = await mensagensAgendadasServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: mensagem,
        mensagem: 'Mensagem agendada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/mensagens-agendadas/:id - Atualizar Mensagem Agendada
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarMensagemAgendadaDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: AtualizarMensagemAgendadaDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarMensagemAgendadaBodySchema.parse(request.body);
      const mensagem = await mensagensAgendadasServico.atualizar(
        clienteId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: mensagem,
        mensagem: 'Mensagem agendada atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/mensagens-agendadas/:id/cancelar - Cancelar Mensagem
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/cancelar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const mensagem = await mensagensAgendadasServico.cancelar(
        clienteId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: mensagem,
        mensagem: 'Mensagem cancelada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/mensagens-agendadas/:id - Excluir Mensagem Agendada
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('campanhas:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await mensagensAgendadasServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Mensagem excluida com sucesso',
      });
    }
  );
}
