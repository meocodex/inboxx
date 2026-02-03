import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Usuario } from '@/tipos';
import { autenticacaoServico } from '@/servicos';
import { limparTokens, estaAutenticado } from '@/servicos/api';

// =============================================================================
// Interface do Estado
// =============================================================================

interface EstadoAutenticacao {
  usuario: Usuario | null;
  carregando: boolean;
  erro: string | null;
  hidratado: boolean; // Indica se rehydrate do Zustand terminou

  // Ações
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  carregarUsuario: () => Promise<void>;
  limparErro: () => void;
  limparSessao: () => void; // Para o interceptor chamar sem hard redirect
}

// =============================================================================
// Store de Autenticação
// =============================================================================

export const useAutenticacaoStore = create<EstadoAutenticacao>()(
  persist(
    (set, get) => ({
      usuario: null,
      carregando: false,
      erro: null,
      hidratado: false,

      // -------------------------------------------------------------------------
      // Entrar
      // -------------------------------------------------------------------------
      entrar: async (email: string, senha: string) => {
        set({ carregando: true, erro: null });

        try {
          const resposta = await autenticacaoServico.entrar({ email, senha });

          if (import.meta.env.DEV) {
            console.log('[AUTH] Login bem-sucedido:', resposta.usuario.nome);
          }

          // Setar usuario - persist vai salvar automaticamente
          set({ usuario: resposta.usuario, carregando: false });
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('[AUTH] Erro no login:', error);
          }

          const mensagem =
            error instanceof Error ? error.message : 'Credenciais inválidas';
          set({ erro: mensagem, carregando: false });
          throw error;
        }
      },

      // -------------------------------------------------------------------------
      // Sair
      // -------------------------------------------------------------------------
      sair: async () => {
        set({ carregando: true });

        try {
          await autenticacaoServico.sair();
        } finally {
          limparTokens();
          set({ usuario: null, carregando: false, erro: null });
        }
      },

      // -------------------------------------------------------------------------
      // Carregar Usuário (verificar sessão)
      // -------------------------------------------------------------------------
      carregarUsuario: async () => {
        // Se já tem usuario, não precisa carregar
        if (get().usuario) {
          if (import.meta.env.DEV) {
            console.log('[AUTH] carregarUsuario: já tem usuário, ignorando');
          }
          return;
        }

        if (!estaAutenticado()) {
          if (import.meta.env.DEV) {
            console.log('[AUTH] carregarUsuario: sem token, ignorando');
          }
          set({ usuario: null, carregando: false });
          return;
        }

        if (import.meta.env.DEV) {
          console.log('[AUTH] carregarUsuario: buscando usuário...');
        }

        set({ carregando: true });

        try {
          const usuario = await autenticacaoServico.obterUsuarioAtual();

          if (import.meta.env.DEV) {
            console.log('[AUTH] carregarUsuario: sucesso:', usuario.nome);
          }

          set({ usuario, carregando: false });
        } catch (erro) {
          // Só limpar tokens se for erro 401 (não autorizado)
          // Outros erros (rede, timeout) não devem deslogar o usuário
          const isErro401 =
            erro instanceof Error &&
            'response' in erro &&
            (erro as { response?: { status?: number } }).response?.status === 401;

          if (import.meta.env.DEV) {
            console.error('[AUTH] carregarUsuario: erro', { erro, isErro401 });
          }

          if (isErro401) {
            limparTokens();
            set({ usuario: null, carregando: false });
          } else {
            // Mantém o estado de carregando falso mas não limpa tokens
            // Permite retry na próxima renderização
            set({ carregando: false });
          }
        }
      },

      // -------------------------------------------------------------------------
      // Limpar Sessão (para interceptor usar sem hard redirect)
      // -------------------------------------------------------------------------
      limparSessao: () => {
        limparTokens();
        set({ usuario: null, carregando: false, erro: null });
      },

      // -------------------------------------------------------------------------
      // Limpar Erro
      // -------------------------------------------------------------------------
      limparErro: () => set({ erro: null }),
    }),
    {
      name: 'crm-auth-storage',
      partialize: (state) => ({ usuario: state.usuario }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[AUTH] Erro no rehydrate:', error);
        }
        if (import.meta.env.DEV) {
          console.log(
            '[AUTH] Rehydrate:',
            state?.usuario ? `usuário: ${state.usuario.nome}` : 'sem usuário'
          );
        }
        // Marcar como hidratado após o rehydrate
        useAutenticacaoStore.setState({ hidratado: true });
      },
    }
  )
);

// =============================================================================
// Seletores
// =============================================================================

export const useUsuario = () => useAutenticacaoStore((state) => state.usuario);
export const useEstaAutenticado = () => useAutenticacaoStore((state) => !!state.usuario);
export const useCarregandoAuth = () => useAutenticacaoStore((state) => state.carregando);
export const useErroAuth = () => useAutenticacaoStore((state) => state.erro);
export const useHidratado = () => useAutenticacaoStore((state) => state.hidratado);
