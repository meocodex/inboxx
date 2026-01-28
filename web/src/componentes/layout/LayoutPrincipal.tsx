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
  // Verificar autenticação ao montar
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!estaAutenticado()) {
      navigate('/entrar');
      return;
    }

    if (!usuario && !carregando) {
      carregarUsuario();
    }
  }, [usuario, carregando, carregarUsuario, navigate]);

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
