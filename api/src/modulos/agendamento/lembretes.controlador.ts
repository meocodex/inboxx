import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { lembretesServico } from './lembretes.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarLembreteBodySchema,
  atualizarLembreteBodySchema,
  listarLembretesQuerySchema,
  type CriarLembreteDTO,
  type AtualizarLembreteDTO,
  type ListarLembretesQuery,
} from './lembretes.schema.js';

// =============================================================================
// Rotas de Lembretes
// =============================================================================

export async function lembretesRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/:compromissoId/lembretes - Listar Lembretes
  // ---------------------------------------------------------------------------
  app.get<{
    Params: { compromissoId: string };
    Querystring: ListarLembretesQuery;
  }>(
    '/:compromissoId/lembretes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (
      request: FastifyRequest<{
        Params: { compromissoId: string };
        Querystring: ListarLembretesQuery;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const query = listarLembretesQuerySchema.parse(request.query);
      const resultado = await lembretesServico.listar(
        clienteId,
        request.params.compromissoId,
        query
      );

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/agendamento/compromissos/:compromissoId/lembretes/:id - Obter Lembrete
  // ---------------------------------------------------------------------------
  app.get<{ Params: { compromissoId: string; id: string } }>(
    '/:compromissoId/lembretes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { compromissoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const lembrete = await lembretesServico.obterPorId(
        clienteId,
        request.params.compromissoId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: lembrete,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/agendamento/compromissos/:compromissoId/lembretes - Criar Lembrete
  // ---------------------------------------------------------------------------
  app.post<{ Params: { compromissoId: string }; Body: CriarLembreteDTO }>(
    '/:compromissoId/lembretes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { compromissoId: string }; Body: CriarLembreteDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = criarLembreteBodySchema.parse(request.body);
      const lembrete = await lembretesServico.criar(
        clienteId,
        request.params.compromissoId,
        dados
      );

      return reply.status(201).send({
        sucesso: true,
        dados: lembrete,
        mensagem: 'Lembrete criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/agendamento/compromissos/:compromissoId/lembretes/:id - Atualizar
  // ---------------------------------------------------------------------------
  app.put<{
    Params: { compromissoId: string; id: string };
    Body: AtualizarLembreteDTO;
  }>(
    '/:compromissoId/lembretes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { compromissoId: string; id: string };
        Body: AtualizarLembreteDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarLembreteBodySchema.parse(request.body);
      const lembrete = await lembretesServico.atualizar(
        clienteId,
        request.params.compromissoId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: lembrete,
        mensagem: 'Lembrete atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/agendamento/compromissos/:compromissoId/lembretes/:id - Excluir
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { compromissoId: string; id: string } }>(
    '/:compromissoId/lembretes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('agendamento:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { compromissoId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      await lembretesServico.excluir(
        clienteId,
        request.params.compromissoId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Lembrete excluido com sucesso',
      });
    }
  );
}
