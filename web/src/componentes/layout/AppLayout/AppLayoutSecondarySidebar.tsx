import { memo, useEffect } from 'react';
import { SidebarSecundaria } from '../SidebarSecundaria';
import { useAppLayoutContext } from './AppLayout';
import type { AppLayoutSecondarySidebarProps } from './types';

// =============================================================================
// APP LAYOUT SECONDARY SIDEBAR - SIDEBAR SECUNDÁRIA
// =============================================================================
//
// Renderiza a SidebarSecundaria (filtros/navegação) com largura configurável.
//
// =============================================================================

export const AppLayoutSecondarySidebar = memo(({
  children,
  className,
  width = 'md',
}: AppLayoutSecondarySidebarProps) => {
  const { setSecondarySidebarOpen, setSecondarySidebarWidth } = useAppLayoutContext();

  // Notificar contexto sobre existência da sidebar
  useEffect(() => {
    setSecondarySidebarOpen(true);
    setSecondarySidebarWidth(width);

    return () => {
      setSecondarySidebarOpen(false);
    };
  }, [width, setSecondarySidebarOpen, setSecondarySidebarWidth]);

  if (!children) {
    return null;
  }

  return (
    <SidebarSecundaria largura={width} className={className}>
      {children}
    </SidebarSecundaria>
  );
});

AppLayoutSecondarySidebar.displayName = 'AppLayoutSecondarySidebar';
