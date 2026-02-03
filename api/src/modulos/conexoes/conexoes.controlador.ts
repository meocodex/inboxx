import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { conexoesServico } from './conexoes.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarConexaoBodySchema,
  atualizarConexaoBodySchema,
  listarConexoesQuerySchema,
  atualizarStatusBodySchema,
  type CriarConexaoDTO,
  type AtualizarConexaoDTO,
  type ListarConexoesQuery,
  type AtualizarStatusDTO,
} from './conexoes.schema.js';

// =============================================================================
// Rotas de Conexoes
// =============================================================================

export async function conexoesRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/conexoes - Listar Conexoes
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarConexoesQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarConexoesQuery }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const query = listarConexoesQuerySchema.parse(request.query);
      const resultado = await conexoesServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/conexoes/:id - Obter Conexao por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const conexao = await conexoesServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: conexao,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conexoes - Criar Conexao
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarConexaoDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarConexaoDTO }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const dados = criarConexaoBodySchema.parse(request.body);
      const conexao = await conexoesServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: conexao,
        mensagem: 'Conexao criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/conexoes/:id - Atualizar Conexao
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarConexaoDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarConexaoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarConexaoBodySchema.parse(request.body);
      const conexao = await conexoesServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: conexao,
        mensagem: 'Conexao atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/conexoes/:id - Excluir Conexao
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      await conexoesServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Conexao excluida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/conexoes/:id/status - Atualizar Status da Conexao
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: AtualizarStatusDTO }>(
    '/:id/status',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarStatusDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const { status } = atualizarStatusBodySchema.parse(request.body);
      const conexao = await conexoesServico.atualizarStatus(clienteId, request.params.id, status);

      return reply.status(200).send({
        sucesso: true,
        dados: conexao,
        mensagem: 'Status atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conexoes/:id/testar - Testar Conexao
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/testar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const resultado = await conexoesServico.testarConexao(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/conexoes/:id/qrcode - Obter QR Code (UaiZap)
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id/qrcode',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const resultado = await conexoesServico.obterQRCode(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conexoes/:id/reconectar - Reconectar (UaiZap)
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/reconectar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const resultado = await conexoesServico.reconectar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conexoes/:id/desconectar - Desconectar (UaiZap)
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/desconectar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conexoes:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const resultado = await conexoesServico.desconectar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: resultado.sucesso,
        mensagem: resultado.mensagem,
      });
    }
  );
}
