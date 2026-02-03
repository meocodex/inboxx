import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacaoStore } from '@/stores';

// =============================================================================
// Hook de Autenticação
// =============================================================================

export function useAutenticacao() {
  const navigate = useNavigate();
  const {
    usuario,
    carregando,
    erro,
    entrar: entrarStore,
    sair: sairStore,
    limparErro,
  } = useAutenticacaoStore();

  // REMOVIDO: useEffect que carregava usuário automaticamente
  // O carregamento agora é responsabilidade exclusiva do LayoutPrincipal
  // Isso evita race conditions entre a página de login e o layout

  // ---------------------------------------------------------------------------
  // Entrar
  // ---------------------------------------------------------------------------
  const entrar = useCallback(
    async (email: string, senha: string) => {
      await entrarStore(email, senha);
      navigate('/');
    },
    [entrarStore, navigate]
  );

  // ---------------------------------------------------------------------------
  // Sair
  // ---------------------------------------------------------------------------
  const sair = useCallback(async () => {
    await sairStore();
    navigate('/entrar');
  }, [sairStore, navigate]);

  return {
    usuario,
    carregando,
    erro,
    estaAutenticado: !!usuario,
    entrar,
    sair,
    limparErro,
  };
}
