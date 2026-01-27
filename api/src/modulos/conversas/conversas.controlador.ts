import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { conversasServico } from './conversas.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarConversaBodySchema,
  atualizarConversaBodySchema,
  listarConversasQuerySchema,
  transferirConversaBodySchema,
  alterarStatusBodySchema,
  type CriarConversaDTO,
  type AtualizarConversaDTO,
  type ListarConversasQuery,
  type TransferirConversaDTO,
  type AlterarStatusDTO,
} from './conversas.schema.js';

// =============================================================================
// Rotas de Conversas
// =============================================================================

export async function conversasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/conversas - Listar Conversas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarConversasQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarConversasQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarConversasQuerySchema.parse(request.query);
      const resultado = await conversasServico.listar(clienteId, request.usuario.id, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/conversas/:id - Obter Conversa por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const conversa = await conversasServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas - Criar Conversa
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarConversaDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarConversaDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarConversaBodySchema.parse(request.body);
      const conversa = await conversasServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/conversas/:id - Atualizar Conversa
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarConversaDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarConversaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarConversaBodySchema.parse(request.body);
      const conversa = await conversasServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:id/transferir - Transferir Conversa
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: TransferirConversaDTO }>(
    '/:id/transferir',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: TransferirConversaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = transferirConversaBodySchema.parse(request.body);
      const conversa = await conversasServico.transferir(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa transferida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/conversas/:id/status - Alterar Status
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: AlterarStatusDTO }>(
    '/:id/status',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AlterarStatusDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const { status } = alterarStatusBodySchema.parse(request.body);
      const conversa = await conversasServico.alterarStatus(clienteId, request.params.id, status);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Status alterado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:id/resolver - Resolver Conversa
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/resolver',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const conversa = await conversasServico.resolver(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa resolvida com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:id/arquivar - Arquivar Conversa
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/arquivar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const conversa = await conversasServico.arquivar(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa arquivada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/conversas/:id/reabrir - Reabrir Conversa
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string } }>(
    '/:id/reabrir',
    {
      preHandler: [app.autenticar, app.verificarPermissao('conversas:editar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const conversa = await conversasServico.reabrir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: conversa,
        mensagem: 'Conversa reaberta com sucesso',
      });
    }
  );
}
