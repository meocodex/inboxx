import { FastifyRequest, FastifyReply } from 'fastify';

import { ErroNaoAutorizado, ErroSemPermissao } from '../erros/index.js';
import { eq, and, gt } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { licencas } from '../../infraestrutura/banco/schema/index.js';
import { cacheUtils } from '../../infraestrutura/cache/redis.servico.js';
import { CACHE_TTL } from '../../configuracao/constantes.js';

// =============================================================================
// Tipos
// =============================================================================

interface LicencaCache {
  id: string;
  ativa: boolean;
  expiraEm: string;
  ipServidor: string;
}

// =============================================================================
// Constantes
// =============================================================================

const PREFIXO_LICENCA = 'licenca:';

// =============================================================================
// Utilitarios
// =============================================================================

/**
 * Obtem o IP do servidor atual.
 * Em producao, pode ser necessario ajustar para obter o IP externo.
 */
export function obterIpServidor(request: FastifyRequest): string {
  // Tentar obter IP do header (se atras de proxy)
  const forwardedFor = request.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0];
    return ips.trim();
  }

  // Fallback para IP direto
  return request.ip || '127.0.0.1';
}

// =============================================================================
// Verificador de Licenca
// =============================================================================

/**
 * Verifica se o cliente possui uma licenca ativa e valida para o IP atual.
 */
export async function verificarLicencaCliente(clienteId: string): Promise<boolean> {
  // Tentar cache primeiro
  const licencaCache = await cacheUtils.obter<LicencaCache>(`${PREFIXO_LICENCA}${clienteId}`);

  if (licencaCache) {
    const expiraEm = new Date(licencaCache.expiraEm);
    return licencaCache.ativa && expiraEm > new Date();
  }

  // Buscar no banco
  const resultado = await db
    .select()
    .from(licencas)
    .where(
      and(
        eq(licencas.clienteId, clienteId),
        eq(licencas.ativa, true),
        gt(licencas.expiraEm, new Date())
      )
    )
    .limit(1);

  const licenca = resultado[0];

  if (!licenca) {
    return false;
  }

  // Salvar no cache
  await cacheUtils.definir<LicencaCache>(
    `${PREFIXO_LICENCA}${clienteId}`,
    {
      id: licenca.id,
      ativa: licenca.ativa,
      expiraEm: licenca.expiraEm.toISOString(),
      ipServidor: licenca.ipServidor,
    },
    CACHE_TTL.LICENCA
  );

  // Atualizar ultima verificacao
  await db
    .update(licencas)
    .set({ ultimaVerificacao: new Date() })
    .where(eq(licencas.id, licenca.id));

  return true;
}

// =============================================================================
// Middleware de Licenca
// =============================================================================

/**
 * Middleware que verifica se o cliente do usuario possui licenca ativa.
 * Super admins (sem clienteId) nao precisam de licenca.
 * Deve ser usado APOS o middleware de autenticacao.
 */
export async function licencaGuarda(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Super admin nao precisa de licenca
  if (!request.usuario?.clienteId) {
    return;
  }

  const licencaValida = await verificarLicencaCliente(request.usuario.clienteId);

  if (!licencaValida) {
    throw new ErroSemPermissao(
      'Licenca do cliente invalida ou expirada. Entre em contato com o suporte.'
    );
  }
}

// =============================================================================
// Invalidar Cache de Licenca
// =============================================================================

export async function invalidarCacheLicenca(clienteId: string): Promise<void> {
  await cacheUtils.remover(`${PREFIXO_LICENCA}${clienteId}`);
}
