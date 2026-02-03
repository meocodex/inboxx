import { memo, useEffect, useState, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore } from '@/stores';
import { estaAutenticado, limparTokens } from '@/servicos/api';
import { TooltipProvider } from '@/componentes/ui/tooltip';
import { MenuLateral } from './MenuLateral';
import { Carregando } from '@/componentes/comum/Carregando';

// =============================================================================
// Componente Layout Principal
// =============================================================================

export const LayoutPrincipal = memo(() => {
  const navigate = useNavigate();
  const usuario = useUsuario();
  const carregando = useCarregandoAuth();
  const carregarUsuario = useAutenticacaoStore((s) => s.carregarUsuario);
  const [tentativas, setTentativas] = useState(0);
  const tentativaRef = useRef(0);

  // ---------------------------------------------------------------------------
  // Verificar autenticação ao montar
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Se não tem token, redireciona para login
    if (!estaAutenticado()) {
      navigate('/entrar', { replace: true });
      return;
    }

    // Se já tem usuário, não precisa carregar
    if (usuario) {
      return;
    }

    // Se está carregando, aguarda
    if (carregando) {
      return;
    }

    // Tenta carregar usuário (máximo 3 tentativas)
    if (tentativaRef.current < 3) {
      tentativaRef.current += 1;
      setTentativas(tentativaRef.current);
      carregarUsuario();
    } else {
      // Após 3 tentativas sem sucesso, limpa e redireciona
      limparTokens();
      navigate('/entrar', { replace: true });
    }
  }, [usuario, carregando, carregarUsuario, navigate, tentativas]);

  // ---------------------------------------------------------------------------
  // Timeout de segurança (10 segundos)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (usuario) return; // Já tem usuário, não precisa timeout

    const timeout = setTimeout(() => {
      if (!usuario && estaAutenticado()) {
        // Timeout mas ainda tem token - força logout
        limparTokens();
        navigate('/entrar', { replace: true });
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [usuario, navigate]);

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (carregando || !usuario) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Carregando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Layout Unificado
  // ---------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        <MenuLateral />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  );
});
LayoutPrincipal.displayName = 'LayoutPrincipal';
