import { api, salvarTokens, limparTokens } from './api';
import type {
  LoginDTO,
  RespostaLogin,
  RefreshTokenDTO,
  Usuario,
  RespostaApi,
} from '@/tipos';

// =============================================================================
// Serviço de Autenticação
// =============================================================================

export const autenticacaoServico = {
  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async entrar(dados: LoginDTO): Promise<RespostaLogin> {
    const response = await api.post<RespostaApi<RespostaLogin>>(
      '/autenticacao/entrar',
      dados
    );

    const { accessToken, refreshToken } = response.data.dados;
    salvarTokens(accessToken, refreshToken);

    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Renovar Token
  // ---------------------------------------------------------------------------
  async renovar(dados: RefreshTokenDTO): Promise<RespostaLogin> {
    const response = await api.post<RespostaApi<RespostaLogin>>(
      '/autenticacao/renovar',
      dados
    );

    const { accessToken, refreshToken } = response.data.dados;
    salvarTokens(accessToken, refreshToken);

    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  async sair(): Promise<void> {
    try {
      await api.post('/autenticacao/sair');
    } finally {
      limparTokens();
    }
  },

  // ---------------------------------------------------------------------------
  // Obter Usuário Logado
  // ---------------------------------------------------------------------------
  async obterUsuarioAtual(): Promise<Usuario> {
    const response = await api.get<RespostaApi<Usuario>>('/autenticacao/eu');
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Perfil
  // ---------------------------------------------------------------------------
  async atualizarPerfil(dados: { nome: string; email: string }): Promise<Usuario> {
    const response = await api.put<RespostaApi<Usuario>>('/autenticacao/perfil', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Alterar Senha
  // ---------------------------------------------------------------------------
  async alterarSenha(senhaAtual: string, novaSenha: string): Promise<void> {
    await api.put('/autenticacao/senha', { senhaAtual, novaSenha });
  },
};
