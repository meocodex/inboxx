import { memo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore } from '@/stores';
import { estaAutenticado } from '@/servicos/api';
import { TooltipProvider } from '@/componentes/ui/tooltip';
import { MenuLateral } from './MenuLateral';
import { Cabecalho } from './Cabecalho';
import { Carregando } from '@/componentes/comum/Carregando';

// =============================================================================
// Componente Layout Principal
// =============================================================================

export const LayoutPrincipal = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = useUsuario();
  const carregando = useCarregandoAuth();
  const carregarUsuario = useAutenticacaoStore((s) => s.carregarUsuario);

  // Verificar se estamos na pagina de conversas (layout especial)
  const isRotaConversas = location.pathname === '/conversas';

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
  // Layout especial para Conversas (sem header e menu lateral padrao)
  // ---------------------------------------------------------------------------
  if (isRotaConversas) {
    return (
      <TooltipProvider>
        <Outlet />
      </TooltipProvider>
    );
  }

  // ---------------------------------------------------------------------------
  // Render Layout Padrao
  // ---------------------------------------------------------------------------
  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Menu Lateral */}
        <MenuLateral />

        {/* Conteúdo Principal */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Cabeçalho */}
          <Cabecalho />

          {/* Área de Conteúdo */}
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
});
LayoutPrincipal.displayName = 'LayoutPrincipal';
