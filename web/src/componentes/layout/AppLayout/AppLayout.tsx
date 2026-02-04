import { memo, createContext, useContext, useState } from 'react';
import { cn } from '@/utilitarios/cn';
import type { SidebarWidth } from '@/tipos/layout.tipos';
import type { AppLayoutRootProps, AppLayoutContextValue } from './types';

// =============================================================================
// APP LAYOUT ROOT - CONTEXT PROVIDER
// =============================================================================
//
// Componente raiz do sistema AppLayout.
// Fornece Context para todos os subcomponentes (Sidebar, Content, etc).
//
// Uso:
// <AppLayout>
//   <AppLayout.Sidebar />
//   <AppLayout.SecondarySidebar>...</AppLayout.SecondarySidebar>
//   <AppLayout.Content>
//     <AppLayout.Header />
//     <AppLayout.Body>...</AppLayout.Body>
//   </AppLayout.Content>
// </AppLayout>
//
// =============================================================================

const AppLayoutContext = createContext<AppLayoutContextValue | null>(null);

/**
 * Hook para acessar o contexto do AppLayout.
 * @throws Erro se usado fora do AppLayout.
 */
export const useAppLayoutContext = () => {
  const context = useContext(AppLayoutContext);
  if (!context) {
    throw new Error('useAppLayoutContext deve ser usado dentro de <AppLayout>');
  }
  return context;
};

/**
 * Componente raiz do AppLayout.
 * Fornece contexto compartilhado para todos os subcomponentes.
 */
export const AppLayoutRoot = memo(({
  children,
  className,
  showSidebar = true,
}: AppLayoutRootProps) => {
  // Estado compartilhado
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(false);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState<SidebarWidth>('md');

  const contextValue: AppLayoutContextValue = {
    showSidebar,
    showSecondarySidebar,
    secondarySidebarWidth,
    setSecondarySidebarOpen: setShowSecondarySidebar,
    setSecondarySidebarWidth,
  };

  return (
    <AppLayoutContext.Provider value={contextValue}>
      <div className={cn('flex h-screen overflow-hidden bg-background', className)}>
        {children}
      </div>
    </AppLayoutContext.Provider>
  );
});

AppLayoutRoot.displayName = 'AppLayoutRoot';
