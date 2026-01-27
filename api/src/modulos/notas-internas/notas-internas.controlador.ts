import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { notasInternasServico } from './notas-internas.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarNotaInternaBodySchema,
  listarNotasInternasQuerySchema,
  type CriarNotaInternaDTO,
  type ListarNotasInternasQuery,
} from './notas-internas.schema.js';

// =============================================================================
// Rotas de Notas Internas
// =============================================================================

export async function notasInternasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/conversas/:conversaId/notas - Listar Notas da Conversa
  // ---------------------------------------------------------------------------
  app.get<{ Params: { conversaId: string }; Querystring: ListarNotasInternasQuery }>(
    '/:conversaId/notas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:visualizar')],
    },
    async (
      request: FastifyRequest<{
        Params: { conversaId: string };
        Querystring: ListarNotasInternasQuery;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarNotasInternasQuerySchema.parse(request.query);
      const resultado = await notasInternasServico.listar(
        clienteId,
        request.params.conversaId,
        query
      );

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:conversaId/notas - Criar Nota Interna
  // ---------------------------------------------------------------------------
  app.post<{ Params: { conversaId: string }; Body: CriarNotaInternaDTO }>(
    '/:conversaId/notas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { conversaId: string }; Body: CriarNotaInternaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarNotaInternaBodySchema.parse(request.body);
      const nota = await notasInternasServico.criar(
        clienteId,
        request.params.conversaId,
        request.usuario.id,
        dados
      );

      return reply.status(201).send({
        sucesso: true,
        dados: nota,
        mensagem: 'Nota criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/conversas/:conversaId/notas/:id - Excluir Nota Interna
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { conversaId: string; id: string } }>(
    '/:conversaId/notas/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { conversaId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await notasInternasServico.excluir(
        clienteId,
        request.params.conversaId,
        request.params.id,
        request.usuario.id
      );

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Nota excluida com sucesso',
      });
    }
  );
}
