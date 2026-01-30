import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Tipos
// =============================================================================

interface SidebarSecundariaProps {
  children: ReactNode;
  className?: string;
  largura?: 'sm' | 'md' | 'lg';
}

interface SecaoSidebarProps {
  titulo?: string;
  children: ReactNode;
  className?: string;
}

interface ItemSidebarProps {
  icone?: ReactNode;
  label: string;
  badge?: number | string;
  ativo?: boolean;
  onClick?: () => void;
  className?: string;
}

// =============================================================================
// Mapa de Larguras
// =============================================================================

const larguras = {
  sm: 'w-64',   // 256px
  md: 'w-80',   // 320px
  lg: 'w-96',   // 384px
};

// =============================================================================
// Componente Sidebar Secundaria
// =============================================================================

export const SidebarSecundaria = memo(({
  children,
  className,
  largura = 'md',
}: SidebarSecundariaProps) => {
  return (
    <aside
      className={cn(
        'flex flex-col h-full shrink-0 border-r border-border bg-background overflow-y-auto',
        larguras[largura],
        className
      )}
    >
      {children}
    </aside>
  );
});
SidebarSecundaria.displayName = 'SidebarSecundaria';

// =============================================================================
// Componente Secao da Sidebar
// =============================================================================

export const SecaoSidebar = memo(({
  titulo,
  children,
  className,
}: SecaoSidebarProps) => {
  return (
    <div className={cn('px-3 py-4', className)}>
      {titulo && (
        <h3 className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {titulo}
        </h3>
      )}
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
});
SecaoSidebar.displayName = 'SecaoSidebar';

// =============================================================================
// Componente Item da Sidebar
// =============================================================================

export const ItemSidebar = memo(({
  icone,
  label,
  badge,
  ativo = false,
  onClick,
  className,
}: ItemSidebarProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:text-foreground hover:bg-accent',
        ativo && 'bg-primary/15 text-primary font-medium',
        className
      )}
    >
      <div className="flex items-center gap-2 truncate">
        {icone && <span className="shrink-0">{icone}</span>}
        <span className="truncate">{label}</span>
      </div>
      {badge !== undefined && (
        <span
          className={cn(
            'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium',
            ativo
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {typeof badge === 'number' && badge > 99 ? '99+' : badge}
        </span>
      )}
    </button>
  );
});
ItemSidebar.displayName = 'ItemSidebar';

// =============================================================================
// Componente Cabecalho da Sidebar
// =============================================================================

interface CabecalhoSidebarProps {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  className?: string;
}

export const CabecalhoSidebar = memo(({
  titulo,
  subtitulo,
  acoes,
  className,
}: CabecalhoSidebarProps) => {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-4 border-b border-border',
        className
      )}
    >
      <div>
        <h2 className="text-lg font-semibold">{titulo}</h2>
        {subtitulo && (
          <p className="text-xs text-muted-foreground">{subtitulo}</p>
        )}
      </div>
      {acoes && <div className="flex items-center gap-1">{acoes}</div>}
    </div>
  );
});
CabecalhoSidebar.displayName = 'CabecalhoSidebar';

// =============================================================================
// Componente Separador
// =============================================================================

export const SeparadorSidebar = memo(() => (
  <div className="my-2 border-t border-border" />
));
SeparadorSidebar.displayName = 'SeparadorSidebar';

// =============================================================================
// Componente Busca na Sidebar
// =============================================================================

interface BuscaSidebarProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
}

export const BuscaSidebar = memo(({
  valor,
  onChange,
  placeholder = 'Buscar...',
  className,
}: BuscaSidebarProps) => {
  return (
    <div className={cn('px-3 py-2', className)}>
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-md border border-border bg-muted/50 px-3 py-2 text-sm',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'transition-colors'
        )}
      />
    </div>
  );
});
BuscaSidebar.displayName = 'BuscaSidebar';
