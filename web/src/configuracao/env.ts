interface RuntimeEnv {
  VITE_API_URL?: string;
  VITE_WS_URL?: string;
}

declare global {
  interface Window {
    __ENV__?: RuntimeEnv;
  }
}

function obterEnv(chave: keyof RuntimeEnv): string {
  // Prioridade: runtime (env-config.js) > build-time (import.meta.env)
  const runtime = window.__ENV__?.[chave];
  if (runtime) return runtime;

  const buildTime = import.meta.env[chave] as string | undefined;
  if (buildTime) return buildTime;

  return '';
}

/**
 * URL base da API.
 * - Em producao: definida via VITE_API_URL no EasyPanel (ex: https://2026-crmapi.crylab.easypanel.host/api)
 * - Em desenvolvimento: fallback para /api (relativo, funciona na porta 5000)
 */
export const API_URL = obterEnv('VITE_API_URL') || '/api';

/**
 * URL do WebSocket.
 * - Em producao: definida via VITE_WS_URL ou derivada da VITE_API_URL
 * - Em desenvolvimento: fallback para window.location.origin
 */
export const WS_URL = obterEnv('VITE_WS_URL')
  || obterEnv('VITE_API_URL')?.replace(/\/api\/?$/, '')
  || window.location.origin;
