import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Tipos
// =============================================================================

interface CabecalhoPaginaProps {
  titulo: string;
  subtitulo?: string;
  icone?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  comBorda?: boolean;
}

// =============================================================================
// Componente Cabecalho Pagina
// =============================================================================

export const CabecalhoPagina = memo(({
  titulo,
  subtitulo,
  icone,
  acoes,
  className,
  comBorda = true,
}: CabecalhoPaginaProps) => {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-6 py-4 bg-background',
        comBorda && 'border-b border-border',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {icone && (
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icone}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{titulo}</h1>
          {subtitulo && (
            <p className="text-sm text-muted-foreground">{subtitulo}</p>
          )}
        </div>
      </div>
      {acoes && <div className="flex items-center gap-2">{acoes}</div>}
    </header>
  );
});
CabecalhoPagina.displayName = 'CabecalhoPagina';

// =============================================================================
// Componente Barra de Acoes
// =============================================================================

interface BarraAcoesProps {
  children: ReactNode;
  className?: string;
}

export const BarraAcoes = memo(({
  children,
  className,
}: BarraAcoesProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-6 py-3 border-b border-border bg-muted/30',
        className
      )}
    >
      {children}
    </div>
  );
});
BarraAcoes.displayName = 'BarraAcoes';
