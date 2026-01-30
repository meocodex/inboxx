import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';
import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';

// =============================================================================
// Tipos
// =============================================================================

interface AcaoCard {
  label: string;
  icone?: ReactNode;
  onClick: () => void;
  variante?: 'default' | 'destructive';
}

interface CardItemProps {
  children: ReactNode;
  acoes?: AcaoCard[];
  onClick?: () => void;
  selecionado?: boolean;
  className?: string;
}

interface CardItemConteudoProps {
  icone?: ReactNode;
  titulo: string;
  subtitulo?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  className?: string;
}

// =============================================================================
// Componente Card Item
// =============================================================================

export const CardItem = memo(({
  children,
  acoes,
  onClick,
  selecionado = false,
  className,
}: CardItemProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative rounded-lg border border-border bg-card p-4 transition-all',
        'hover:shadow-md hover:border-border/80',
        onClick && 'cursor-pointer',
        selecionado && 'ring-2 ring-primary border-primary',
        className
      )}
    >
      {children}
      {acoes && acoes.length > 0 && (
        <div className="absolute right-3 top-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {acoes.map((acao, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    acao.onClick();
                  }}
                  className={cn(acao.variante === 'destructive' && 'text-destructive')}
                >
                  {acao.icone && <span className="mr-2">{acao.icone}</span>}
                  {acao.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
});
CardItem.displayName = 'CardItem';

// =============================================================================
// Componente Card Item Conteudo (Layout padrao)
// =============================================================================

export const CardItemConteudo = memo(({
  icone,
  titulo,
  subtitulo,
  badge,
  meta,
  className,
}: CardItemConteudoProps) => {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      {icone && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icone}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{titulo}</h3>
          {badge}
        </div>
        {subtitulo && (
          <p className="text-sm text-muted-foreground truncate">{subtitulo}</p>
        )}
        {meta && (
          <div className="mt-2 text-xs text-muted-foreground">{meta}</div>
        )}
      </div>
    </div>
  );
});
CardItemConteudo.displayName = 'CardItemConteudo';

// =============================================================================
// Componente Card Item Avatar
// =============================================================================

interface CardItemAvatarProps {
  nome: string;
  avatar?: string;
  subtitulo?: string;
  badge?: ReactNode;
  meta?: ReactNode;
  tamanho?: 'sm' | 'md' | 'lg';
  className?: string;
}

const tamanhoAvatar = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export const CardItemAvatar = memo(({
  nome,
  avatar,
  subtitulo,
  badge,
  meta,
  tamanho = 'md',
  className,
}: CardItemAvatarProps) => {
  const iniciais = nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  // Cor deterministica baseada no nome
  const corIndex = nome.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 6;
  const cores = [
    'from-blue-500 to-blue-600',
    'from-green-500 to-green-600',
    'from-purple-500 to-purple-600',
    'from-orange-500 to-orange-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ];

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-white font-medium',
          tamanhoAvatar[tamanho],
          cores[corIndex]
        )}
      >
        {avatar ? (
          <img
            src={avatar}
            alt={nome}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          iniciais
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-medium truncate">{nome}</h3>
          {badge}
        </div>
        {subtitulo && (
          <p className="text-sm text-muted-foreground truncate">{subtitulo}</p>
        )}
        {meta && (
          <div className="mt-2 text-xs text-muted-foreground">{meta}</div>
        )}
      </div>
    </div>
  );
});
CardItemAvatar.displayName = 'CardItemAvatar';

// =============================================================================
// Componente Grid de Cards
// =============================================================================

interface GridCardsProps {
  children: ReactNode;
  colunas?: 1 | 2 | 3 | 4;
  className?: string;
}

const colunasGrid = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};

export const GridCards = memo(({
  children,
  colunas = 3,
  className,
}: GridCardsProps) => {
  return (
    <div className={cn('grid gap-4', colunasGrid[colunas], className)}>
      {children}
    </div>
  );
});
GridCards.displayName = 'GridCards';

// =============================================================================
// Componente Lista de Cards
// =============================================================================

interface ListaCardsProps {
  children: ReactNode;
  className?: string;
}

export const ListaCards = memo(({
  children,
  className,
}: ListaCardsProps) => {
  return (
    <div className={cn('space-y-3', className)}>
      {children}
    </div>
  );
});
ListaCards.displayName = 'ListaCards';
