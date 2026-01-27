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

// =============================================================================
// Hook de Proteção de Rota
// =============================================================================

export function useProtecaoRota() {
  const navigate = useNavigate();
  const { usuario, carregando, carregarUsuario } = useAutenticacaoStore();

  useEffect(() => {
    const verificar = async () => {
      if (!estaAutenticado()) {
        navigate('/entrar');
        return;
      }

      if (!usuario && !carregando) {
        try {
          await carregarUsuario();
        } catch {
          navigate('/entrar');
        }
      }
    };

    verificar();
  }, [usuario, carregando, carregarUsuario, navigate]);

  return { usuario, carregando };
}
