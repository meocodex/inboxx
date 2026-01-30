import { memo, type ReactNode } from 'react';
import { cn } from '@/utilitarios/cn';
import { PackageOpen, Search, AlertCircle, Inbox } from 'lucide-react';
import { Button } from '@/componentes/ui/button';

// =============================================================================
// Tipos
// =============================================================================

type VarianteEstadoVazio = 'padrao' | 'busca' | 'erro' | 'inbox';

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  variante?: VarianteEstadoVazio;
  acao?: {
    label: string;
    onClick: () => void;
  };
  acaoSecundaria?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

// =============================================================================
// Icones por Variante
// =============================================================================

const iconesPorVariante: Record<VarianteEstadoVazio, ReactNode> = {
  padrao: <PackageOpen className="h-16 w-16" />,
  busca: <Search className="h-16 w-16" />,
  erro: <AlertCircle className="h-16 w-16" />,
  inbox: <Inbox className="h-16 w-16" />,
};

const coresPorVariante: Record<VarianteEstadoVazio, string> = {
  padrao: 'text-muted-foreground/50',
  busca: 'text-muted-foreground/50',
  erro: 'text-destructive/50',
  inbox: 'text-primary/50',
};

// =============================================================================
// Componente Estado Vazio
// =============================================================================

export const EstadoVazio = memo(({
  titulo,
  descricao,
  icone,
  variante = 'padrao',
  acao,
  acaoSecundaria,
  className,
}: EstadoVazioProps) => {
  const IconeRenderizado = icone || iconesPorVariante[variante];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className={cn('mb-4', coresPorVariante[variante])}>
        {IconeRenderizado}
      </div>
      <h3 className="text-lg font-medium text-foreground mb-1">{titulo}</h3>
      {descricao && (
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          {descricao}
        </p>
      )}
      {(acao || acaoSecundaria) && (
        <div className="flex items-center gap-3">
          {acao && (
            <Button onClick={acao.onClick}>
              {acao.label}
            </Button>
          )}
          {acaoSecundaria && (
            <Button variant="outline" onClick={acaoSecundaria.onClick}>
              {acaoSecundaria.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
});
EstadoVazio.displayName = 'EstadoVazio';

// =============================================================================
// Componente Estado Carregando
// =============================================================================

interface EstadoCarregandoProps {
  texto?: string;
  className?: string;
}

export const EstadoCarregando = memo(({
  texto = 'Carregando...',
  className,
}: EstadoCarregandoProps) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4',
        className
      )}
    >
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-muted" />
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">{texto}</p>
    </div>
  );
});
EstadoCarregando.displayName = 'EstadoCarregando';

// =============================================================================
// Componente Estado Erro
// =============================================================================

interface EstadoErroProps {
  titulo?: string;
  mensagem?: string;
  onTentarNovamente?: () => void;
  className?: string;
}

export const EstadoErro = memo(({
  titulo = 'Erro ao carregar',
  mensagem = 'Ocorreu um erro ao carregar os dados. Tente novamente.',
  onTentarNovamente,
  className,
}: EstadoErroProps) => {
  return (
    <EstadoVazio
      titulo={titulo}
      descricao={mensagem}
      variante="erro"
      acao={
        onTentarNovamente
          ? { label: 'Tentar novamente', onClick: onTentarNovamente }
          : undefined
      }
      className={className}
    />
  );
});
EstadoErro.displayName = 'EstadoErro';

// =============================================================================
// Componente Estado Busca Vazia
// =============================================================================

interface EstadoBuscaVaziaProps {
  termoBusca?: string;
  onLimpar?: () => void;
  className?: string;
}

export const EstadoBuscaVazia = memo(({
  termoBusca,
  onLimpar,
  className,
}: EstadoBuscaVaziaProps) => {
  return (
    <EstadoVazio
      titulo="Nenhum resultado encontrado"
      descricao={
        termoBusca
          ? `Nao encontramos resultados para "${termoBusca}". Tente usar outros termos.`
          : 'Tente ajustar seus filtros ou termos de busca.'
      }
      variante="busca"
      acao={
        onLimpar
          ? { label: 'Limpar busca', onClick: onLimpar }
          : undefined
      }
      className={className}
    />
  );
});
EstadoBuscaVazia.displayName = 'EstadoBuscaVazia';
