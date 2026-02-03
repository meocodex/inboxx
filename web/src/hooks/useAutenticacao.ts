import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutenticacaoStore } from '@/stores';
import { estaAutenticado } from '@/servicos/api';

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
    carregarUsuario,
    limparErro,
  } = useAutenticacaoStore();

  // ---------------------------------------------------------------------------
  // Carregar usuário ao montar
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (estaAutenticado() && !usuario) {
      carregarUsuario();
    }
  }, [usuario, carregarUsuario]);

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
