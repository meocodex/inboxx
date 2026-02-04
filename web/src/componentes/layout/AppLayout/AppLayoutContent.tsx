import { memo } from 'react';
import { cn } from '@/utilitarios/cn';
import type { AppLayoutContentProps } from './types';

// =============================================================================
// APP LAYOUT CONTENT - ÁREA DE CONTEÚDO PRINCIPAL
// =============================================================================
//
// Container principal para o conteúdo da página.
// Ocupa o espaço restante após sidebars (flex-1).
//
// =============================================================================

export const AppLayoutContent = memo(({
  children,
  className,
}: AppLayoutContentProps) => {
  return (
    <main className={cn('flex-1 flex flex-col overflow-hidden', className)}>
      {children}
    </main>
  );
});

AppLayoutContent.displayName = 'AppLayoutContent';
