import { memo, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore } from '@/stores';
import { estaAutenticado } from '@/servicos/api';
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

  // ---------------------------------------------------------------------------
  // Verificar autenticação apenas uma vez ao montar
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Sem token = redireciona para login
    if (!estaAutenticado()) {
      navigate('/entrar', { replace: true });
      return;
    }

    // Tem token mas não tem usuário = carrega do backend
    // (Zustand pode já ter carregado do localStorage via persist)
    if (!usuario && !carregando) {
      carregarUsuario();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executa apenas uma vez ao montar

  // ---------------------------------------------------------------------------
  // Redireciona se perder autenticação
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!estaAutenticado() && !carregando) {
      navigate('/entrar', { replace: true });
    }
  }, [usuario, carregando, navigate]);

  // ---------------------------------------------------------------------------
  // Loading enquanto carrega
  // ---------------------------------------------------------------------------
  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Carregando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sem usuário após carregar = aguarda (Zustand vai popular)
  // ---------------------------------------------------------------------------
  if (!usuario) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Verificando sessão..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Autenticado com usuário = renderiza layout
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
