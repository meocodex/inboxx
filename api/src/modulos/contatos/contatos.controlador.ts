import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import { contatosServico } from './contatos.servico.js';
import { ErroSemPermissao } from '../../compartilhado/erros/index.js';
import {
  criarContatoBodySchema,
  atualizarContatoBodySchema,
  listarContatosQuerySchema,
  adicionarEtiquetaBodySchema,
  importarContatosBodySchema,
  type CriarContatoDTO,
  type AtualizarContatoDTO,
  type ListarContatosQuery,
  type AdicionarEtiquetaDTO,
  type ImportarContatosDTO,
} from './contatos.schema.js';

// =============================================================================
// Rotas de Contatos
// =============================================================================

export async function contatosRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/contatos - Listar Contatos
  // ---------------------------------------------------------------------------
  app.get<{ Querystring: ListarContatosQuery }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:listar')],
    },
    async (request: FastifyRequest<{ Querystring: ListarContatosQuery }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const query = listarContatosQuerySchema.parse(request.query);
      const resultado = await contatosServico.listar(clienteId, query);

      return reply.status(200).send({
        sucesso: true,
        ...resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/contatos/:id - Obter Contato por ID
  // ---------------------------------------------------------------------------
  app.get<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:visualizar')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const contato = await contatosServico.obterPorId(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        dados: contato,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/contatos - Criar Contato
  // ---------------------------------------------------------------------------
  app.post<{ Body: CriarContatoDTO }>(
    '/',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:criar')],
    },
    async (request: FastifyRequest<{ Body: CriarContatoDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = criarContatoBodySchema.parse(request.body);
      const contato = await contatosServico.criar(clienteId, dados);

      return reply.status(201).send({
        sucesso: true,
        dados: contato,
        mensagem: 'Contato criado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // PUT /api/contatos/:id - Atualizar Contato
  // ---------------------------------------------------------------------------
  app.put<{ Params: { id: string }; Body: AtualizarContatoDTO }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AtualizarContatoDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = atualizarContatoBodySchema.parse(request.body);
      const contato = await contatosServico.atualizar(clienteId, request.params.id, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: contato,
        mensagem: 'Contato atualizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/contatos/:id - Excluir Contato
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string } }>(
    '/:id',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:excluir')],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await contatosServico.excluir(clienteId, request.params.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Contato excluido com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/contatos/:id/etiquetas - Adicionar Etiqueta ao Contato
  // ---------------------------------------------------------------------------
  app.post<{ Params: { id: string }; Body: AdicionarEtiquetaDTO }>(
    '/:id/etiquetas',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AdicionarEtiquetaDTO }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const { etiquetaId } = adicionarEtiquetaBodySchema.parse(request.body);
      await contatosServico.adicionarEtiqueta(clienteId, request.params.id, etiquetaId);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Etiqueta adicionada ao contato com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // DELETE /api/contatos/:id/etiquetas/:etiquetaId - Remover Etiqueta
  // ---------------------------------------------------------------------------
  app.delete<{ Params: { id: string; etiquetaId: string } }>(
    '/:id/etiquetas/:etiquetaId',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:editar')],
    },
    async (
      request: FastifyRequest<{ Params: { id: string; etiquetaId: string } }>,
      reply: FastifyReply
    ) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      await contatosServico.removerEtiqueta(
        clienteId,
        request.params.id,
        request.params.etiquetaId
      );

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Etiqueta removida do contato com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/contatos/importar - Importar Contatos em Lote
  // ---------------------------------------------------------------------------
  app.post<{ Body: ImportarContatosDTO }>(
    '/importar',
    {
      preHandler: [app.autenticar, app.verificarPermissao('contatos:criar')],
    },
    async (request: FastifyRequest<{ Body: ImportarContatosDTO }>, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
      }

      const dados = importarContatosBodySchema.parse(request.body);
      const resultado = await contatosServico.importar(clienteId, dados);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
        mensagem: `Importacao concluida: ${resultado.criados} criados, ${resultado.duplicados} duplicados`,
      });
    }
  );
}
