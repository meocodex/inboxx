import { FastifyRequest, FastifyReply } from 'fastify';

import { ErroSemPermissao } from '../erros/index.js';

// =============================================================================
// Tipos
// =============================================================================

declare module 'fastify' {
  interface FastifyRequest {
    clienteId: string | null;
  }
}

// =============================================================================
// Middleware de Contexto do Cliente
// =============================================================================

/**
 * Middleware que injeta o clienteId no request para facilitar queries multi-tenant.
 * Deve ser usado APOS o middleware de autenticacao.
 */
export async function clienteContextoMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // O usuario deve estar autenticado para ter contexto de cliente
  if (!request.usuario) {
    return;
  }

  request.clienteId = request.usuario.clienteId;
}

// =============================================================================
// Middleware para Exigir Cliente
// =============================================================================

/**
 * Middleware que exige que o usuario esteja associado a um cliente.
 * Super admins podem nao ter clienteId, mas algumas rotas exigem.
 */
export async function exigirClienteMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.usuario?.clienteId) {
    throw new ErroSemPermissao('Esta acao requer associacao a um cliente');
  }
}
