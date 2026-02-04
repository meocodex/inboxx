import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import type { LoadingStateProps } from '@/tipos/layout.tipos';

// =============================================================================
// LOADING STATE - COMPONENTE UNIFICADO DE LOADING
// =============================================================================
//
// Consolida múltiplos componentes de loading:
// - Carregando + CarregandoPagina + CarregandoInline (Carregando.tsx)
// - EstadoCarregando (EstadoVazio.tsx)
//
// Reduz de 10 componentes para 1 com 5 variantes.
//
// Variantes:
// - fullscreen: Tela cheia (auth loading)
// - page: Dentro de página (Dashboard loading)
// - inline: Em linha com texto (botão loading)
// - spinner: Apenas spinner (dentro de card)
// - skeleton: Skeleton screens (futuro)
//
// =============================================================================

const tamanhosPorSize = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const tamanhosBordaPorSize = {
  sm: 'h-8 w-8 border-2',
  md: 'h-12 w-12 border-4',
  lg: 'h-16 w-16 border-4',
};

export const LoadingState = memo(({
  variant = 'page',
  text,
  size = 'md',
  className,
}: LoadingStateProps) => {
  // ---------------------------------------------------------------------------
  // Variante: fullscreen (autenticação, tela inicial)
  // ---------------------------------------------------------------------------
  if (variant === 'fullscreen') {
    return (
      <div className={cn('flex h-screen items-center justify-center', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className={cn('rounded-full border-muted', tamanhosBordaPorSize[size])} />
            <div
              className={cn(
                'absolute top-0 left-0 rounded-full border-primary border-t-transparent animate-spin',
                tamanhosBordaPorSize[size]
              )}
            />
          </div>
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variante: page (loading dentro de página)
  // ---------------------------------------------------------------------------
  if (variant === 'page') {
    return (
      <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className={cn('rounded-full border-muted', tamanhosBordaPorSize[size])} />
            <div
              className={cn(
                'absolute top-0 left-0 rounded-full border-primary border-t-transparent animate-spin',
                tamanhosBordaPorSize[size]
              )}
            />
          </div>
          {text && <p className="text-sm text-muted-foreground">{text}</p>}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variante: inline (loading em linha, ex: dentro de botão)
  // ---------------------------------------------------------------------------
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className={cn('animate-spin', tamanhosPorSize[size])} />
        {text && <span className="text-sm text-muted-foreground">{text}</span>}
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variante: spinner (apenas spinner, sem texto)
  // ---------------------------------------------------------------------------
  if (variant === 'spinner') {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Loader2 className={cn('animate-spin text-primary', tamanhosPorSize[size])} />
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Variante: skeleton (futuro - skeleton screens)
  // ---------------------------------------------------------------------------
  if (variant === 'skeleton') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
        <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
      </div>
    );
  }

  // Fallback: page
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4', className)}>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <div className={cn('rounded-full border-muted', tamanhosBordaPorSize[size])} />
          <div
            className={cn(
              'absolute top-0 left-0 rounded-full border-primary border-t-transparent animate-spin',
              tamanhosBordaPorSize[size]
            )}
          />
        </div>
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
});

LoadingState.displayName = 'LoadingState';

// =============================================================================
// EXPORTS DE COMPATIBILIDADE (DEPRECATED)
// =============================================================================
//
// Mantidos para compatibilidade retroativa.
// Serão removidos na FASE 5.
//
// =============================================================================

/**
 * @deprecated Use LoadingState com variant="fullscreen"
 */
export const CarregandoPagina = memo(() => (
  <LoadingState variant="fullscreen" text="Carregando..." size="lg" />
));
CarregandoPagina.displayName = 'CarregandoPagina';

/**
 * @deprecated Use LoadingState com variant="inline"
 */
export const CarregandoInline = memo(({ className }: { className?: string }) => (
  <LoadingState variant="inline" text="Carregando..." size="sm" className={className} />
));
CarregandoInline.displayName = 'CarregandoInline';

/**
 * @deprecated Use LoadingState com variant="page"
 */
export const EstadoCarregando = memo(({ texto = 'Carregando...', className }: { texto?: string; className?: string }) => (
  <LoadingState variant="page" text={texto} size="md" className={className} />
));
EstadoCarregando.displayName = 'EstadoCarregando';
