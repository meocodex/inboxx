import { memo } from 'react';
import { MenuLateral } from '../MenuLateral';
import { useAppLayoutContext } from './AppLayout';

// =============================================================================
// APP LAYOUT SIDEBAR - SIDEBAR PRINCIPAL
// =============================================================================
//
// Renderiza o MenuLateral (sidebar principal de 70px) se showSidebar=true.
//
// =============================================================================

export const AppLayoutSidebar = memo(() => {
  const { showSidebar } = useAppLayoutContext();

  if (!showSidebar) {
    return null;
  }

  return <MenuLateral />;
});

AppLayoutSidebar.displayName = 'AppLayoutSidebar';
