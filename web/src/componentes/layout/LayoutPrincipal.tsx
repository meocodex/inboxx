import { memo, useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore, useHidratado } from '@/stores';
import { estaAutenticado } from '@/servicos/api';
import { TooltipProvider } from '@/componentes/ui/tooltip';
import { MenuLateral } from './MenuLateral';
import { Carregando } from '@/componentes/comum/Carregando';

// =============================================================================
// Componente Layout Principal
// =============================================================================

export const LayoutPrincipal = memo(() => {
  const usuario = useUsuario();
  const carregando = useCarregandoAuth();
  const hidratado = useHidratado();
  const carregarUsuario = useAutenticacaoStore((s) => s.carregarUsuario);

  // Fallback: se hidratado não mudar em 2s, força como true
  const [forcarHidratado, setForcarHidratado] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hidratado) {
        setForcarHidratado(true);
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [hidratado]);

  const estaHidratado = hidratado || forcarHidratado;

  // ---------------------------------------------------------------------------
  // Verificar autenticação APÓS hidratação do Zustand
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!estaHidratado) return;

    // Tem token mas não tem usuário = carrega do backend
    if (estaAutenticado() && !usuario && !carregando) {
      carregarUsuario();
    }
  }, [estaHidratado, usuario, carregando, carregarUsuario]);

  // ---------------------------------------------------------------------------
  // Aguardar hidratação do Zustand
  // ---------------------------------------------------------------------------
  if (!estaHidratado) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Carregando tamanho="lg" texto="Inicializando..." />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Sem token após hidratação = redirect imediato via Navigate
  // ---------------------------------------------------------------------------
  if (!estaAutenticado()) {
    return <Navigate to="/entrar" replace />;
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
