import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { colunasServico } from './colunas.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarColunaBodySchema,
  atualizarColunaBodySchema,
  reordenarColunasBodySchema,
  type CriarColunaDTO,
  type AtualizarColunaDTO,
  type ReordenarColunasDTO,
} from './colunas.schema.js';

// =============================================================================
// Rotas de Colunas Kanban
// =============================================================================

export async function colunasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:quadroId/colunas - Listar Colunas
  // ---------------------------------------------------------------------------
  app.get<{ Params: { quadroId: string } }>(
    '/:quadroId/colunas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { quadroId: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const colunas = await colunasServico.listar(clienteId, request.params.quadroId);

      return reply.status(200).send({
        sucesso: true,
        dados: colunas,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:quadroId/colunas/:id - Obter Coluna
  // ---------------------------------------------------------------------------
  app.get<{ Params: { quadroId: string; id: string } }>(
    '/:quadroId/colunas/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const coluna = await colunasServico.obterPorId(
        clienteId,
        request.params.quadroId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: coluna,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/kanban/quadros/:quadroId/colunas - Criar Coluna
  // ---------------------------------------------------------------------------
  app.post<{ Params: { quadroId: string }; Body: CriarColunaDTO }>(
    '/:quadroId/colunas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string }; Body: CriarColunaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarColunaBodySchema.parse(request.body);
      const coluna = await colunasServico.criar(clienteId, request.params.quadroId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: coluna,
        mensagem: 'Coluna criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/kanban/quadros/:quadroId/colunas/:id - Atualizar Coluna
  // ---------------------------------------------------------------------------
  app.put<{ Params: { quadroId: string; id: string }; Body: AtualizarColunaDTO }>(
    '/:quadroId/colunas/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { quadroId: string; id: string };
        Body: AtualizarColunaDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarColunaBodySchema.parse(request.body);
      const coluna = await colunasServico.atualizar(
        clienteId,
        request.params.quadroId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: coluna,
        mensagem: 'Coluna atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/kanban/quadros/:quadroId/colunas/:id - Excluir Coluna
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { quadroId: string; id: string } }>(
    '/:quadroId/colunas/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await colunasServico.excluir(clienteId, request.params.quadroId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Coluna excluida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/kanban/quadros/:quadroId/colunas/reordenar - Reordenar Colunas
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { quadroId: string }; Body: ReordenarColunasDTO }>(
    '/:quadroId/colunas/reordenar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string }; Body: ReordenarColunasDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = reordenarColunasBodySchema.parse(request.body);
      await colunasServico.reordenar(clienteId, request.params.quadroId, dados);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Colunas reordenadas com sucesso',
      });
    }
  );
}
