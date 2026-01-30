import { FastifyRequest, FastifyReply } from 'fastify';

import { verificarToken, type JwtPayload } from '../utilitarios/criptografia.js';
import { ErroNaoAutorizado } from '../erros/index.js';
import { eq } from 'drizzle-orm';
import { db, setClienteContext } from '../../infraestrutura/banco/drizzle.servico.js';
import { perfis, clientes } from '../../infraestrutura/banco/schema/index.js';
import { cachePerfis } from '../../infraestrutura/cache/redis.servico.js';
import { logger } from '../utilitarios/logger.js';

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

    // ==========================================================================
    // CACHE: Buscar permissões do cache Redis (TTL 3600s - 1h)
    // Executado em TODA requisição - cache crítico para performance
    // ==========================================================================
    const chaveCache = `permissoes:${payload.perfilId}`;
    let permissoes = await cachePerfis.get<string[]>(chaveCache);

    if (permissoes) {
      logger.debug({ perfilId: payload.perfilId }, 'Permissões: Cache HIT');
    } else {
      logger.debug({ perfilId: payload.perfilId }, 'Permissões: Cache MISS - consultando DB');

      // Buscar permissões do perfil no banco
      const resultado = await db
        .select({ permissoes: perfis.permissoes })
        .from(perfis)
        .where(eq(perfis.id, payload.perfilId))
        .limit(1);

      const perfil = resultado[0];

      if (!perfil || !perfil.permissoes) {
        throw new ErroNaoAutorizado('Perfil nao encontrado');
      }

      permissoes = perfil.permissoes;

      // Cachear permissões (TTL 1h - invalidado ao atualizar perfil)
      await cachePerfis.set(chaveCache, permissoes, 3600);
    }

    // Garantir que permissoes nunca seja null (TypeScript)
    if (!permissoes) {
      throw new ErroNaoAutorizado('Permissoes nao encontradas');
    }

    // Resolver clienteId para SUPER_ADMIN (clienteId nulo no token)
    let clienteId = payload.clienteId;

    if (!clienteId && permissoes.includes('*')) {
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

    // ==========================================================================
    // RLS: Definir contexto do cliente para Row-Level Security
    // ==========================================================================
    await setClienteContext(clienteId);

    // Injetar usuario no request
    request.usuario = {
      id: payload.sub,
      clienteId,
      perfilId: payload.perfilId,
      permissoes,
    };
  } catch (erro) {
    if (erro instanceof ErroNaoAutorizado) {
      throw erro;
    }
    throw new ErroNaoAutorizado('Token invalido ou expirado');
  }
}
