import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { cartoesServico } from './cartoes.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarCartaoBodySchema,
  atualizarCartaoBodySchema,
  moverCartaoBodySchema,
  listarCartoesQuerySchema,
  type CriarCartaoDTO,
  type AtualizarCartaoDTO,
  type MoverCartaoDTO,
  type ListarCartoesQuery,
} from './cartoes.schema.js';

// =============================================================================
// Rotas de Cartões Kanban
// =============================================================================

export async function cartoesRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes - Listar Cartões
  // ---------------------------------------------------------------------------
  app.get<{
    Params: { quadroId: string; colunaId: string };
    Querystring: ListarCartoesQuery;
  }>(
    '/:quadroId/colunas/:colunaId/cartoes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (
      request: FastifyRequest<{
        Params: { quadroId: string; colunaId: string };
        Querystring: ListarCartoesQuery;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const query = listarCartoesQuerySchema.parse(request.query);
      const resultado = await cartoesServico.listar(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        query
      );

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id - Obter Cartão
  // ---------------------------------------------------------------------------
  app.get<{ Params: { quadroId: string; colunaId: string; id: string } }>(
    '/:quadroId/colunas/:colunaId/cartoes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:visualizar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string; colunaId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const cartao = await cartoesServico.obterPorId(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        dados: cartao,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes - Criar Cartão
  // ---------------------------------------------------------------------------
  app.post<{ Params: { quadroId: string; colunaId: string }; Body: CriarCartaoDTO }>(
    '/:quadroId/colunas/:colunaId/cartoes',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { quadroId: string; colunaId: string };
        Body: CriarCartaoDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = criarCartaoBodySchema.parse(request.body);
      const cartao = await cartoesServico.criar(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        dados
      );

      return reply.status(201).send({
        sucesso: true,
        dados: cartao,
        mensagem: 'Cartao criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id - Atualizar Cartão
  // ---------------------------------------------------------------------------
  app.put<{
    Params: { quadroId: string; colunaId: string; id: string };
    Body: AtualizarCartaoDTO;
  }>(
    '/:quadroId/colunas/:colunaId/cartoes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { quadroId: string; colunaId: string; id: string };
        Body: AtualizarCartaoDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarCartaoBodySchema.parse(request.body);
      const cartao = await cartoesServico.atualizar(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: cartao,
        mensagem: 'Cartao atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id/mover - Mover Cartão
  // ---------------------------------------------------------------------------
  app.post<{
    Params: { quadroId: string; colunaId: string; id: string };
    Body: MoverCartaoDTO;
  }>(
    '/:quadroId/colunas/:colunaId/cartoes/:id/mover',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{
        Params: { quadroId: string; colunaId: string; id: string };
        Body: MoverCartaoDTO;
      }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = moverCartaoBodySchema.parse(request.body);
      const cartao = await cartoesServico.mover(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        request.params.id,
        dados
      );

      return reply.status(200).send({
        sucesso: true,
        dados: cartao,
        mensagem: 'Cartao movido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/kanban/quadros/:quadroId/colunas/:colunaId/cartoes/:id - Excluir Cartão
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { quadroId: string; colunaId: string; id: string } }>(
    '/:quadroId/colunas/:colunaId/cartoes/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('kanban:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { quadroId: string; colunaId: string; id: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      await cartoesServico.excluir(
        clienteId,
        request.params.quadroId,
        request.params.colunaId,
        request.params.id
      );

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Cartao excluido com sucesso',
      });
    }
  );
}
