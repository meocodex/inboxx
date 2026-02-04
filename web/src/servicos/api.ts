import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import type { RespostaErro } from '@/tipos';
import { API_URL } from '@/configuracao/env';

// =============================================================================
// Configuração do Cliente HTTP
// =============================================================================

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag para evitar múltiplos redirects simultâneos
let redirecionando = false;

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
    if (status === 401 && !redirecionando) {
      const refreshToken = obterRefreshToken();

      if (refreshToken) {
        try {
          // IMPORTANTE: O backend requer o token expirado no header Authorization
          // para extrair o usuarioId durante a renovação
          const tokenExpirado = obterToken();
          const response = await axios.post(
            `${API_URL}/autenticacao/renovar`,
            { refreshToken },
            {
              headers: {
                Authorization: tokenExpirado ? `Bearer ${tokenExpirado}` : undefined,
              },
            }
          );

          const { accessToken, refreshToken: novoRefresh } = response.data.dados;
          salvarTokens(accessToken, novoRefresh);

          // Retry da requisição original
          const config = error.config;
          if (config && config.headers) {
            config.headers.Authorization = `Bearer ${accessToken}`;
            return api(config);
          }
        } catch (refreshError) {
          // Refresh falhou - logar erro e redirecionar
          if (import.meta.env.DEV) {
            console.error('[AUTH] Falha ao renovar token:', refreshError);
          }

          redirecionando = true;
          limparTokens();

          // Usar setTimeout para dar tempo ao React processar
          setTimeout(() => {
            redirecionando = false;
            // Soft redirect - usa replace para não adicionar ao histórico
            if (typeof window !== 'undefined' && window.location.pathname !== '/entrar') {
              window.location.replace('/entrar');
            }
          }, 100);
        }
      } else {
        // Sem refresh token - limpar e redirecionar
        redirecionando = true;
        limparTokens();

        setTimeout(() => {
          redirecionando = false;
          if (typeof window !== 'undefined' && window.location.pathname !== '/entrar') {
            window.location.replace('/entrar');
          }
        }, 100);
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

// Usar localStorage para persistência entre sessões
// sessionStorage é perdido ao fechar a aba
export function obterToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function obterRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function salvarTokens(accessToken: string, refreshToken: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_KEY, refreshToken);

    // Verificar se foi salvo corretamente
    const verificar = localStorage.getItem(TOKEN_KEY);
    if (!verificar) {
      console.error('[AUTH] Falha ao salvar token no localStorage');
      throw new Error('LocalStorage bloqueado ou indisponível');
    }

    if (import.meta.env.DEV) {
      console.log('[AUTH] Tokens salvos com sucesso');
    }
  } catch (erro) {
    console.error('[AUTH] Erro ao salvar tokens:', erro);
    throw erro;
  }
}

export function limparTokens(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  // Também limpar o persist do Zustand para evitar inconsistência
  localStorage.removeItem('crm-auth-storage');

  if (import.meta.env.DEV) {
    console.log('[AUTH] Tokens e sessão limpos');
  }
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
