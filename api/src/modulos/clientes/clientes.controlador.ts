import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { clientesServico } from './clientes.servico.js';
import {
  criarClienteBodySchema,
  atualizarClienteBodySchema,
  listarClientesQuerySchema,
  type CriarClienteDTO,
  type AtualizarClienteDTO,
  type ListarClientesQuery,
} from './clientes.schema.js';

// =============================================================================
// Rotas de Clientes
// =============================================================================

export async function clientesRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/clientes - Listar Clientes
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarClientesQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('clientes:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarClientesQuery }>, reply: FastifyReply) => {
      const query = listarClientesQuerySchema.parse(request.query);
      const resultado = await clientesServico.listar(query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/clientes/:id - Obter Cliente por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('clientes:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const cliente = await clientesServico.obterPorId(request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: cliente,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/clientes - Criar Cliente
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarClienteDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('clientes:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarClienteDTO }>, reply: FastifyReply) => {
      const dados = criarClienteBodySchema.parse(request.body);
      const cliente = await clientesServico.criar(dados);

      return reply.status(201).send({
        sucesso: true,
        dados: cliente,
        mensagem: 'Cliente criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/clientes/:id - Atualizar Cliente
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarClienteDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('clientes:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarClienteDTO }>,
      reply: FastifyReply
    ) => {
      const dados = atualizarClienteBodySchema.parse(request.body);
      const cliente = await clientesServico.atualizar(request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: cliente,
        mensagem: 'Cliente atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/clientes/:id - Excluir Cliente
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('clientes:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      await clientesServico.excluir(request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Cliente excluido com sucesso',
      });
    }
  );
}
