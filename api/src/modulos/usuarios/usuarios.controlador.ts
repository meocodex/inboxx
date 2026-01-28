import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { usuariosServico } from './usuarios.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarUsuarioBodySchema,
  atualizarUsuarioBodySchema,
  listarUsuariosQuerySchema,
  type CriarUsuarioDTO,
  type AtualizarUsuarioDTO,
  type ListarUsuariosQuery,
} from './usuarios.schema.js';

// =============================================================================
// Rotas de Usuarios
// =============================================================================

export async function usuariosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/usuarios - Listar Usuarios
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarUsuariosQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarUsuariosQuery }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const query = listarUsuariosQuerySchema.parse(request.query);
      const resultado = await usuariosServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/usuarios/:id - Obter Usuario por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const usuario = await usuariosServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: usuario,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/usuarios - Criar Usuario
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarUsuarioDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarUsuarioDTO }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const dados = criarUsuarioBodySchema.parse(request.body);
      const usuario = await usuariosServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: usuario,
        mensagem: 'Usuario criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/usuarios/:id - Atualizar Usuario
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarUsuarioDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarUsuarioDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarUsuarioBodySchema.parse(request.body);
      const usuario = await usuariosServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: usuario,
        mensagem: 'Usuario atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/usuarios/:id - Excluir Usuario
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      await usuariosServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Usuario excluido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PATCH /api/usuarios/:id/status - Alterar Status do Usuario
  // ---------------------------------------------------------------------------
  app.patch<{ Params: { id: string }; Body: { ativo: boolean } }>(
    '/:id/status',
    {
      preHandler: [app.autenticar, app.verificarPermissao('usuarios:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: { ativo: boolean } }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const { ativo } = request.body;
      const usuario = await usuariosServico.alterarStatus(clienteId, request.params.id, ativo);

      return reply.status(200).send({
        sucesso: true,
        dados: usuario,
        mensagem: `Usuario ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      });
    }
  );
}
