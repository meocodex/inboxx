import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { RespostaErro } from '@/tipos';

// =============================================================================
// Configuração do Cliente HTTP
// =============================================================================

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// =============================================================================
// Interceptor de Request - Adiciona Token
// =============================================================================

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = obterToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =============================================================================
// Interceptor de Response - Trata Erros
// =============================================================================

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<RespostaErro>) => {
    const status = error.response?.status;

    // Token expirado - tentar refresh
    if (status === 401) {
      const refreshToken = obterRefreshToken();

      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/autenticacao/renovar`, {
            refreshToken,
          });

          const { accessToken, refreshToken: novoRefresh } = response.data.dados;
          salvarTokens(accessToken, novoRefresh);

          // Retry da requisição original
          const config = error.config;
          if (config && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            return api(config);
          }
        } catch {
          // Refresh falhou - fazer logout
          limparTokens();
          window.location.href = '/entrar';
        }
      } else {
        limparTokens();
        window.location.href = '/entrar';
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// Funções de Gerenciamento de Token
// =============================================================================

const TOKEN_KEY = 'crm_access_token';
const REFRESH_KEY = 'crm_refresh_token';

export function obterToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function obterRefreshToken(): string | null {
  return sessionStorage.getItem(REFRESH_KEY);
}

export function salvarTokens(accessToken: string, refreshToken: string): void {
  sessionStorage.setItem(TOKEN_KEY, accessToken);
  sessionStorage.setItem(REFRESH_KEY, refreshToken);
}

export function limparTokens(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
}

export function estaAutenticado(): boolean {
  return !!obterToken();
}

// =============================================================================
// Helper de Erro
// =============================================================================

export function extrairMensagemErro(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const resposta = error.response?.data as RespostaErro | undefined;
    return resposta?.erro || error.message || 'Erro desconhecido';
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Erro desconhecido';
}
