import { FastifyRequest, FastifyReply } from 'fastify';

import { ErroSemPermissao } from '../erros/index.js';
import { verificarAbility } from './abilities.js';

// =============================================================================
// Tipos
// =============================================================================

declare module 'fastify' {
  interface FastifyInstance {
    verificarPermissao: (
      permissaoNecessaria: string
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// =============================================================================
// Funcao de Verificacao de Permissao
// =============================================================================

/**
 * Verifica se o usuario possui a permissao necessaria.
 *
 * Formato das permissoes:
 * - "*" = acesso total (super admin)
 * - "recurso:*" = todas as acoes no recurso
 * - "recurso:acao" = acao especifica
 *
 * Exemplos:
 * - "usuarios:criar" - pode criar usuarios
 * - "usuarios:*" - pode tudo em usuarios
 * - "*" - pode tudo no sistema
 *
 * Internamente usa CASL para avaliação de permissões.
 */
export function temPermissao(
  permissoesUsuario: string[],
  permissaoNecessaria: string
): boolean {
  return verificarAbility(permissoesUsuario, permissaoNecessaria);
}

// =============================================================================
// Factory de Guarda
// =============================================================================

/**
 * Cria um middleware que verifica se o usuario possui a permissao necessaria.
 * Deve ser usado APOS o middleware de autenticacao.
 *
 * Uso:
 * ```typescript
 * app.get('/usuarios', {
 *   preHandler: [app.autenticar, app.verificarPermissao('usuarios:listar')],
 * }, handler);
 * ```
 */
export function criarGuardaPermissao(permissaoNecessaria: string) {
  return async function guardaPermissao(
    request: FastifyRequest,
    reply: FastifyReply
  ): Promise<void> {
    if (!request.usuario) {
      throw new ErroSemPermissao('Usuario nao autenticado');
    }

    const autorizado = temPermissao(request.usuario.permissoes, permissaoNecessaria);

    if (!autorizado) {
      throw new ErroSemPermissao(
        `Permissao '${permissaoNecessaria}' necessaria para esta acao`
      );
    }
  };
}

// =============================================================================
// Verificador de Multiplas Permissoes
// =============================================================================

/**
 * Verifica se o usuario possui TODAS as permissoes listadas.
 */
export function temTodasPermissoes(
  permissoesUsuario: string[],
  permissoesNecessarias: string[]
): boolean {
  return permissoesNecessarias.every((perm) => temPermissao(permissoesUsuario, perm));
}

/**
 * Verifica se o usuario possui ALGUMA das permissoes listadas.
 */
export function temAlgumaPermissao(
  permissoesUsuario: string[],
  permissoesNecessarias: string[]
): boolean {
  return permissoesNecessarias.some((perm) => temPermissao(permissoesUsuario, perm));
}
