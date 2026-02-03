import { memo, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore, useHidratado } from '@/stores';
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
  const hidratado = useHidratado();
  const carregarUsuario = useAutenticacaoStore((s) => s.carregarUsuario);

  // ---------------------------------------------------------------------------
  // Verificar autenticação APÓS hidratação do Zustand
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // Esperar Zustand terminar rehydrate antes de tomar qualquer decisão
    if (!hidratado) {
      return;
    }

    // Sem token = redireciona para login
    if (!estaAutenticado()) {
      navigate('/entrar', { replace: true });
      return;
    }

    // Tem token mas não tem usuário = carrega do backend
    if (!usuario && !carregando) {
      carregarUsuario();
    }
  }, [hidratado, usuario, carregando, carregarUsuario, navigate]);

  // ---------------------------------------------------------------------------
  // Aguardar hidratação do Zustand
  // ---------------------------------------------------------------------------
  if (!hidratado) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Inicializando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading enquanto carrega usuário
  // ---------------------------------------------------------------------------
  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Carregando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sem token após hidratação = redirect (tratado no useEffect)
  // ---------------------------------------------------------------------------
  if (!estaAutenticado()) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Redirecionando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Tem token mas sem usuário = aguarda carregamento
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
