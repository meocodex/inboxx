import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';
import { Search, X } from 'lucide-react';
import { Button } from '@/componentes/ui/button';

// =============================================================================
// Tipos
// =============================================================================

interface OpcaoFiltro {
  id: string;
  label: string;
  icone?: ReactNode;
  badge?: number;
}

interface FiltrosRapidosProps {
  opcoes: OpcaoFiltro[];
  selecionado: string;
  onSelecionar: (id: string) => void;
  className?: string;
}

interface CampoBuscaProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
}

interface ChipFiltroProps {
  label: string;
  ativo?: boolean;
  icone?: ReactNode;
  badge?: number;
  onClick?: () => void;
  onRemover?: () => void;
  className?: string;
}

// =============================================================================
// Componente Filtros Rapidos
// =============================================================================

export const FiltrosRapidos = memo(({
  opcoes,
  selecionado,
  onSelecionar,
  className,
}: FiltrosRapidosProps) => {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {opcoes.map((opcao) => (
        <ChipFiltro
          key={opcao.id}
          label={opcao.label}
          icone={opcao.icone}
          badge={opcao.badge}
          ativo={selecionado === opcao.id}
          onClick={() => onSelecionar(opcao.id)}
        />
      ))}
    </div>
  );
});
FiltrosRapidos.displayName = 'FiltrosRapidos';

// =============================================================================
// Componente Chip Filtro
// =============================================================================

export const ChipFiltro = memo(({
  label,
  ativo = false,
  icone,
  badge,
  onClick,
  onRemover,
  className,
}: ChipFiltroProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-9 rounded-md text-xs font-medium transition-colors',
        'border border-border bg-secondary hover:bg-accent',
        ativo && 'bg-primary/15 border-primary text-primary hover:bg-primary/20',
        className
      )}
    >
      {icone && <span className="shrink-0">{icone}</span>}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className={cn(
            'ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold',
            ativo
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted-foreground/20 text-muted-foreground'
          )}
        >
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      {onRemover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemover();
          }}
          className="ml-1 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </button>
  );
});
ChipFiltro.displayName = 'ChipFiltro';

// =============================================================================
// Componente Campo Busca
// =============================================================================

export const CampoBusca = memo(({
  valor,
  onChange,
  placeholder = 'Buscar...',
  className,
}: CampoBuscaProps) => {
  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full h-9 rounded-md border border-border bg-secondary pl-9 pr-3 text-sm',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
          'transition-colors'
        )}
      />
      {valor && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent"
        >
          <X className="h-3 w-3 text-muted-foreground" />
        </button>
      )}
    </div>
  );
});
CampoBusca.displayName = 'CampoBusca';

// =============================================================================
// Componente Barra Filtros (Container)
// =============================================================================

interface BarraFiltrosProps {
  children: ReactNode;
  className?: string;
}

export const BarraFiltros = memo(({
  children,
  className,
}: BarraFiltrosProps) => {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30',
        className
      )}
    >
      {children}
    </div>
  );
});
BarraFiltros.displayName = 'BarraFiltros';

// =============================================================================
// Componente Filtro Select
// =============================================================================

interface FiltroSelectProps {
  valor: string;
  onChange: (valor: string) => void;
  opcoes: { valor: string; label: string }[];
  placeholder?: string;
  className?: string;
}

export const FiltroSelect = memo(({
  valor,
  onChange,
  opcoes,
  placeholder = 'Selecione...',
  className,
}: FiltroSelectProps) => {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'h-9 rounded-md border border-border bg-secondary px-3 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary',
        'transition-colors cursor-pointer',
        className
      )}
    >
      <option value="">{placeholder}</option>
      {opcoes.map((opcao) => (
        <option key={opcao.valor} value={opcao.valor}>
          {opcao.label}
        </option>
      ))}
    </select>
  );
});
FiltroSelect.displayName = 'FiltroSelect';

// =============================================================================
// Componente Botao Limpar Filtros
// =============================================================================

interface BotaoLimparFiltrosProps {
  onClick: () => void;
  className?: string;
}

export const BotaoLimparFiltros = memo(({
  onClick,
  className,
}: BotaoLimparFiltrosProps) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn('h-9 text-xs text-muted-foreground hover:text-foreground', className)}
    >
      <X className="mr-1 h-3 w-3" />
      Limpar filtros
    </Button>
  );
});
BotaoLimparFiltros.displayName = 'BotaoLimparFiltros';
