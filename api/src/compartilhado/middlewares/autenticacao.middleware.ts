import { FastifyRequest, FastifyReply } from 'fastify';

import { verificarToken, type JwtPayload } from '../utilitarios/criptografia.js';
import { ErroNaoAutorizado } from '../erros/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { perfis } from '../../infraestrutura/banco/schema/index.js';

// =============================================================================
// Tipos
// =============================================================================

export interface UsuarioRequest {
  id: string;
  clienteId: string | null;
  perfilId: string;
  permissoes: string[];
}

// Extender tipos do Fastify
declare module 'fastify' {
  interface FastifyRequest {
    usuario: UsuarioRequest;
  }

  interface FastifyInstance {
    autenticar: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// =============================================================================
// Middleware de Autenticacao
// =============================================================================

export async function autenticacaoMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new ErroNaoAutorizado('Token de autorizacao nao fornecido');
  }

  if (!authHeader.startsWith('Bearer ')) {
    throw new ErroNaoAutorizado('Formato de token invalido');
  }

  const token = authHeader.substring(7);

  if (!token) {
    throw new ErroNaoAutorizado('Token vazio');
  }

  try {
    const payload = await verificarToken(token);

    // Buscar permissoes do perfil
    const resultado = await db
      .select({ permissoes: perfis.permissoes })
      .from(perfis)
      .where(eq(perfis.id, payload.perfilId))
      .limit(1);

    const perfil = resultado[0];

    if (!perfil) {
      throw new ErroNaoAutorizado('Perfil nao encontrado');
    }

    // Injetar usuario no request
    request.usuario = {
      id: payload.sub,
      clienteId: payload.clienteId,
      perfilId: payload.perfilId,
      permissoes: perfil.permissoes,
    };
  } catch (erro) {
    if (erro instanceof ErroNaoAutorizado) {
      throw erro;
    }
    throw new ErroNaoAutorizado('Token invalido ou expirado');
  }
}
