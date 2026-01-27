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

  // Ações
  entrar: (email: string, senha: string) => Promise<void>;
  sair: () => Promise<void>;
  carregarUsuario: () => Promise<void>;
  limparErro: () => void;
}

// =============================================================================
// Store de Autenticação
// =============================================================================

export const useAutenticacaoStore = create<EstadoAutenticacao>()(
  persist(
    (set) => ({
      usuario: null,
      carregando: false,
      erro: null,

      // -------------------------------------------------------------------------
      // Entrar
      // -------------------------------------------------------------------------
      entrar: async (email: string, senha: string) => {
        set({ carregando: true, erro: null });

        try {
          const resposta = await autenticacaoServico.entrar({ email, senha });
          set({ usuario: resposta.usuario, carregando: false });
        } catch (error) {
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
        if (!estaAutenticado()) {
          set({ usuario: null, carregando: false });
          return;
        }

        set({ carregando: true });

        try {
          const usuario = await autenticacaoServico.obterUsuarioAtual();
          set({ usuario, carregando: false });
        } catch {
          limparTokens();
          set({ usuario: null, carregando: false });
        }
      },

      // -------------------------------------------------------------------------
      // Limpar Erro
      // -------------------------------------------------------------------------
      limparErro: () => set({ erro: null }),
    }),
    {
      name: 'crm-auth-storage',
      partialize: (state) => ({ usuario: state.usuario }),
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
