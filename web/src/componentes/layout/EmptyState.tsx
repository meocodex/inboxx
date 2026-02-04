import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';
import { PackageOpen, Search, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import type { EmptyStatePropsNew } from '@/tipos/layout.tipos';

// =============================================================================
// EMPTY STATE - COMPONENTE UNIFICADO DE ESTADOS VAZIOS
// =============================================================================
//
// Consolida múltiplos componentes de estado vazio:
// - EstadoVazio (EstadoVazio.tsx)
// - EstadoErro (EstadoVazio.tsx)
// - EstadoBuscaVazia (EstadoVazio.tsx)
//
// Reduz de 4 componentes para 1 com 4 variantes.
//
// Variantes:
// - default: Estado vazio padrão (lista vazia)
// - search: Busca sem resultados
// - error: Erro ao carregar dados
// - inbox: Inbox vazio (conversas)
//
// =============================================================================

const iconesPorVariante: Record<string, ReactNode> = {
  default: <PackageOpen className="h-16 w-16" />,
  search: <Search className="h-16 w-16" />,
  error: <AlertCircle className="h-16 w-16" />,
  inbox: <Inbox className="h-16 w-16" />,
};

const coresPorVariante: Record<string, string> = {
  default: 'text-muted-foreground/50',
  search: 'text-muted-foreground/50',
  error: 'text-destructive/50',
  inbox: 'text-primary/50',
};

export const EmptyState = memo(({
  variant = 'default',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  className,
}: EmptyStatePropsNew) => {
  const IconeRenderizado = icon || iconesPorVariante[variant];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Ícone */}
      <div className={cn('mb-4', coresPorVariante[variant])}>
        {IconeRenderizado}
      </div>

      {/* Título */}
      <h3 className="text-lg font-medium text-foreground mb-1">
        {title}
      </h3>

      {/* Descrição */}
      {description && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Ações */}
      {(primaryAction || secondaryAction) && (
        <div className="flex items-center gap-3">
          {primaryAction && (
            <Button
              onClick={primaryAction.onClick}
              variant={primaryAction.variant || 'default'}
            >
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant={secondaryAction.variant || 'outline'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});

EmptyState.displayName = 'EmptyState';

// =============================================================================
// EXPORTS DE COMPATIBILIDADE (DEPRECATED)
// =============================================================================
//
// Mantidos para compatibilidade retroativa.
// Serão removidos na FASE 5.
//
// =============================================================================

/**
 * @deprecated Use EmptyState com variant="error"
 */
export const EstadoErro = memo(({
  titulo = 'Erro ao carregar',
  mensagem = 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  onTentarNovamente,
  className,
}: {
  titulo?: string;
  mensagem?: string;
  onTentarNovamente?: () => void;
  className?: string;
}) => (
  <EmptyState
    variant="error"
    title={titulo}
    description={mensagem}
    primaryAction={
      onTentarNovamente
        ? { label: 'Tentar novamente', onClick: onTentarNovamente }
        : undefined
    }
    className={className}
  />
));
EstadoErro.displayName = 'EstadoErro';

/**
 * @deprecated Use EmptyState com variant="search"
 */
export const EstadoBuscaVazia = memo(({
  termoBusca,
  onLimpar,
  className,
}: {
  termoBusca?: string;
  onLimpar?: () => void;
  className?: string;
}) => (
  <EmptyState
    variant="search"
    title="Nenhum resultado encontrado"
    description={
      termoBusca
        ? `Não encontramos resultados para "${termoBusca}". Tente usar outros termos.`
        : 'Tente ajustar seus filtros ou termos de busca.'
    }
    primaryAction={
      onLimpar
        ? { label: 'Limpar busca', onClick: onLimpar }
        : undefined
    }
    className={className}
  />
));
EstadoBuscaVazia.displayName = 'EstadoBuscaVazia';

/**
 * @deprecated Use EmptyState com variant="default"
 */
export const EstadoVazio = memo(({
  titulo,
  descricao,
  icone,
  variante = 'padrao',
  acao,
  acaoSecundaria,
  className,
}: {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  variante?: 'padrao' | 'busca' | 'erro' | 'inbox';
  acao?: { label: string; onClick: () => void };
  acaoSecundaria?: { label: string; onClick: () => void };
  className?: string;
}) => {
  // Mapear variantes antigas para novas
  const variantMap: Record<string, 'default' | 'search' | 'error' | 'inbox'> = {
    padrao: 'default',
    busca: 'search',
    erro: 'error',
    inbox: 'inbox',
  };

  return (
    <EmptyState
      variant={variantMap[variante] || 'default'}
      title={titulo}
      description={descricao}
      icon={icone}
      primaryAction={acao}
      secondaryAction={acaoSecundaria}
      className={className}
    />
  );
});
EstadoVazio.displayName = 'EstadoVazio';
