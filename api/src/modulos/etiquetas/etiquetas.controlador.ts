import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { etiquetasServico } from './etiquetas.servico.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';
import {
  criarEtiquetaBodySchema,
  atualizarEtiquetaBodySchema,
  listarEtiquetasQuerySchema,
  type CriarEtiquetaDTO,
  type AtualizarEtiquetaDTO,
  type ListarEtiquetasQuery,
} from './etiquetas.schema.js';

// =============================================================================
// Rotas de Etiquetas
// =============================================================================

export async function etiquetasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/etiquetas - Listar Etiquetas
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarEtiquetasQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarEtiquetasQuery }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const query = listarEtiquetasQuerySchema.parse(request.query);
      const resultado = await etiquetasServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/etiquetas/:id - Obter Etiqueta por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:listar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const etiqueta = await etiquetasServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: etiqueta,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/etiquetas - Criar Etiqueta
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarEtiquetaDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarEtiquetaDTO }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const dados = criarEtiquetaBodySchema.parse(request.body);
      const etiqueta = await etiquetasServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: etiqueta,
        mensagem: 'Etiqueta criada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/etiquetas/:id - Atualizar Etiqueta
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarEtiquetaDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarEtiquetaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = extrairClienteId(request);

      const dados = atualizarEtiquetaBodySchema.parse(request.body);
      const etiqueta = await etiquetasServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: etiqueta,
        mensagem: 'Etiqueta atualizada com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/etiquetas/:id - Excluir Etiqueta
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      await etiquetasServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Etiqueta excluida com sucesso',
      });
    }
  );
}
