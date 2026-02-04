import { memo } from 'react';
import { cn } from '@/utilitarios/cn';
import type { AppLayoutBodyProps } from './types';

// =============================================================================
// APP LAYOUT BODY - CORPO DA PÁGINA
// =============================================================================
//
// Área scrollable do conteúdo principal com padding padrão.
// O padding (p-6 = 24px) pode ser removido via prop noPadding.
//
// =============================================================================

export const AppLayoutBody = memo(({
  children,
  className,
  noPadding = false,
}: AppLayoutBodyProps) => {
  return (
    <div
      className={cn(
        'flex-1 overflow-auto',
        !noPadding && 'p-6',
        className
      )}
    >
      {children}
    </div>
  );
});

AppLayoutBody.displayName = 'AppLayoutBody';
