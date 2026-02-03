import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { autenticacaoServico } from './autenticacao.servico.js';
import {
  entrarBodySchema,
  renovarBodySchema,
  type EntrarDTO,
  type RenovarDTO,
} from './autenticacao.schema.js';
import { ErroValidacao } from '../../compartilhado/erros/index.js';

const desbloquearBodySchema = z.object({
  email: z.string().email(),
  chave: z.string(),
});

// =============================================================================
// Rotas de Autenticacao
// =============================================================================

export async function autenticacaoRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // POST /api/autenticacao/entrar - Login
  // ---------------------------------------------------------------------------
  app.post<{ Body: EntrarDTO }>(
    '/entrar',
    {
      schema: {
        body: entrarBodySchema,
      },
    },
    async (request: FastifyRequest<{ Body: EntrarDTO }>, reply: FastifyReply) => {
      const dados = entrarBodySchema.parse(request.body);
      const resultado = await autenticacaoServico.entrar(dados);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/autenticacao/renovar - Refresh Token
  // ---------------------------------------------------------------------------
  app.post<{ Body: RenovarDTO }>(
    '/renovar',
    {
      schema: {
        body: renovarBodySchema,
      },
    },
    async (request: FastifyRequest<{ Body: RenovarDTO }>, reply: FastifyReply) => {
      const { refreshToken } = renovarBodySchema.parse(request.body);

      // Extrair usuarioId do token atual (mesmo expirado)
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        throw new ErroValidacao('Token de autorizacao necessario');
      }

      const token = authHeader.substring(7);
      const { decodificarToken } = await import(
        '../../compartilhado/utilitarios/criptografia.js'
      );
      const payload = decodificarToken(token);

      if (!payload?.sub) {
        throw new ErroValidacao('Token invalido');
      }

      const resultado = await autenticacaoServico.renovarToken(refreshToken, payload.sub);

      return reply.status(200).send({
        sucesso: true,
        dados: resultado,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/autenticacao/sair - Logout
  // ---------------------------------------------------------------------------
  app.post(
    '/sair',
    {
      preHandler: [app.autenticar],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      await autenticacaoServico.sair(request.usuario.id);

      return reply.status(200).send({
        sucesso: true,
        mensagem: 'Logout realizado com sucesso',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/autenticacao/eu - Usuario Atual
  // ---------------------------------------------------------------------------
  app.get(
    '/eu',
    {
      preHandler: [app.autenticar],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const usuario = await autenticacaoServico.obterUsuarioAtual(request.usuario.id);

      return reply.status(200).send({
        sucesso: true,
        dados: usuario,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/autenticacao/desbloquear - Desbloquear conta (emergência)
  // ---------------------------------------------------------------------------
  app.post<{ Body: { email: string; chave: string } }>(
    '/desbloquear',
    async (request: FastifyRequest<{ Body: { email: string; chave: string } }>, reply: FastifyReply) => {
      const { email, chave } = desbloquearBodySchema.parse(request.body);

      // Chave secreta para desbloquear (usar JWT_SECRET como chave)
      const chaveSecreta = process.env.JWT_SECRET || 'desbloquear-crm-2026';

      if (chave !== chaveSecreta) {
        throw new ErroValidacao('Chave de desbloqueio inválida');
      }

      await autenticacaoServico.desbloquearConta(email);

      return reply.status(200).send({
        sucesso: true,
        mensagem: `Conta ${email} desbloqueada com sucesso`,
      });
    }
  );
}
