import { cacheUtils } from './redis.servico.js';

// =============================================================================
// Prefixos de Cache (centralizados)
// =============================================================================

export const CACHE_PREFIXOS = {
  // Autenticacao
  refresh: 'refresh:',
  bloqueio: 'bloqueio:',
  tentativas: 'tentativas:',

  // Licenca
  licenca: 'licenca:',
  licencaValida: 'licenca:valida:',

  // Presenca (usa hash, nao string)
  presenca: 'presenca:',

  // Sessao
  sessao: 'sess:',
} as const;

// =============================================================================
// TTLs padrão (em segundos)
// =============================================================================

export const CACHE_TTL = {
  refreshToken: 30 * 24 * 60 * 60, // 30 dias
  licenca: 3600,                     // 1 hora
  licencaValida: 300,                // 5 minutos
  bloqueio: 15 * 60,                 // 15 minutos
  tentativas: 15 * 60,              // 15 minutos
  sessao: 24 * 60 * 60,             // 1 dia
} as const;

// =============================================================================
// Helpers de chave tipados
// =============================================================================

export function chaveRefresh(usuarioId: string): string {
  return `${CACHE_PREFIXOS.refresh}${usuarioId}`;
}

export function chaveBloqueio(email: string): string {
  return `${CACHE_PREFIXOS.bloqueio}${email}`;
}

export function chaveTentativas(email: string): string {
  return `${CACHE_PREFIXOS.tentativas}${email}`;
}

export function chaveLicenca(clienteId: string): string {
  return `${CACHE_PREFIXOS.licenca}${clienteId}`;
}

export function chaveLicencaValida(clienteId: string): string {
  return `${CACHE_PREFIXOS.licencaValida}${clienteId}`;
}

export function chavePresenca(clienteId: string): string {
  return `${CACHE_PREFIXOS.presenca}${clienteId}`;
}

export function chaveSessao(clienteId: string, sessaoId: string): string {
  return `${CACHE_PREFIXOS.sessao}${clienteId}:${sessaoId}`;
}

// =============================================================================
// Cache tipado (reutiliza cacheUtils existente)
// =============================================================================

export const cacheServico = {
  obter: cacheUtils.obter,
  definir: cacheUtils.definir,
  remover: cacheUtils.remover,
  removerPorPadrao: cacheUtils.removerPorPadrao,
  disponivel: cacheUtils.disponivel,
} as const;
