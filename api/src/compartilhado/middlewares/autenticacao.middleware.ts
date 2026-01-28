import { FastifyRequest, FastifyReply } from 'fastify';

import { verificarToken, type JwtPayload } from '../utilitarios/criptografia.js';
import { ErroNaoAutorizado } from '../erros/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { perfis, clientes } from '../../infraestrutura/banco/schema/index.js';

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

    // Resolver clienteId para SUPER_ADMIN (clienteId nulo no token)
    let clienteId = payload.clienteId;

    if (!clienteId && perfil.permissoes.includes('*')) {
      // SUPER_ADMIN: aceitar header X-Cliente-Id ou auto-selecionar primeiro cliente ativo
      const headerClienteId = request.headers['x-cliente-id'] as string | undefined;
      if (headerClienteId) {
        clienteId = headerClienteId;
      } else {
        const [primeiroCliente] = await db
          .select({ id: clientes.id })
          .from(clientes)
          .where(eq(clientes.ativo, true))
          .limit(1);
        if (primeiroCliente) {
          clienteId = primeiroCliente.id;
        }
      }
    }

    // Injetar usuario no request
    request.usuario = {
      id: payload.sub,
      clienteId,
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
