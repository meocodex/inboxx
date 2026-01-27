import { memo } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Tipos
// =============================================================================

interface CarregandoProps {
  tamanho?: 'sm' | 'md' | 'lg';
  texto?: string;
  className?: string;
}

// =============================================================================
// Componente Carregando
// =============================================================================

const tamanhos = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export const Carregando = memo(({ tamanho = 'md', texto, className }: CarregandoProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)}>
      <Loader2 className={cn('animate-spin text-primary', tamanhos[tamanho])} />
      {texto && <p className="text-sm text-muted-foreground">{texto}</p>}
    </div>
  );
});
Carregando.displayName = 'Carregando';

// =============================================================================
// Componente Carregando Página
// =============================================================================

export const CarregandoPagina = memo(() => {
  return (
    <div className="flex h-full items-center justify-center">
      <Carregando tamanho="lg" texto="Carregando..." />
    </div>
  );
});
CarregandoPagina.displayName = 'CarregandoPagina';

// =============================================================================
// Componente Carregando Inline
// =============================================================================

export const CarregandoInline = memo(({ className }: { className?: string }) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm text-muted-foreground">Carregando...</span>
    </div>
  );
});
CarregandoInline.displayName = 'CarregandoInline';
