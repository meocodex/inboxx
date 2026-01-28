import type { FastifyRequest } from 'fastify';
import { ErroSemPermissao } from '../erros/index.js';

/**
 * Extrai e valida o clienteId do request autenticado.
 * Lanca ErroSemPermissao se o contexto de cliente nao estiver disponivel.
 */
export function extrairClienteId(request: FastifyRequest): string {
  const clienteId = request.usuario.clienteId;

  if (!clienteId) {
    throw new ErroSemPermissao('Acesso negado: contexto de cliente necessario');
  }

  return clienteId;
}
