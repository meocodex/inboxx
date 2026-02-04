import { memo } from 'react';
import { Outlet } from 'react-router-dom';
import { AuthGuard } from './AuthGuard';
import { MenuLateral } from './MenuLateral';

// =============================================================================
// Componente Layout Principal
// =============================================================================

/**
 * Layout principal da aplicação protegido por autenticação.
 *
 * Utiliza AuthGuard para garantir que apenas usuários autenticados
 * acessem o conteúdo. Renderiza MenuLateral + área de conteúdo (Outlet).
 */
export const LayoutPrincipal = memo(() => {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-background">
        <MenuLateral />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
});

LayoutPrincipal.displayName = 'LayoutPrincipal';
