import { memo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { Button } from '@/componentes/ui/button';

// =============================================================================
// Tipos
// =============================================================================

interface ErroMensagemProps {
  titulo?: string;
  mensagem: string;
  onTentarNovamente?: () => void;
  className?: string;
}

// =============================================================================
// Componente Erro Mensagem
// =============================================================================

export const ErroMensagem = memo(
  ({ titulo = 'Erro', mensagem, onTentarNovamente, className }: ErroMensagemProps) => {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6',
          className
        )}
      >
        <AlertCircle className="h-10 w-10 text-destructive" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">{titulo}</h3>
          <p className="text-sm text-muted-foreground">{mensagem}</p>
        </div>
        {onTentarNovamente && (
          <Button variant="outline" size="sm" onClick={onTentarNovamente}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }
);
ErroMensagem.displayName = 'ErroMensagem';

// =============================================================================
// Componente Erro Página
// =============================================================================

interface ErroPaginaProps {
  titulo?: string;
  mensagem?: string;
  onVoltar?: () => void;
  onTentarNovamente?: () => void;
}

export const ErroPagina = memo(
  ({
    titulo = 'Algo deu errado',
    mensagem = 'Ocorreu um erro inesperado. Por favor, tente novamente.',
    onVoltar,
    onTentarNovamente,
  }: ErroPaginaProps) => {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-6">
        <AlertCircle className="h-16 w-16 text-destructive" />
        <div className="text-center">
          <h2 className="text-2xl font-bold">{titulo}</h2>
          <p className="mt-2 text-muted-foreground">{mensagem}</p>
        </div>
        <div className="flex gap-2">
          {onVoltar && (
            <Button variant="outline" onClick={onVoltar}>
              Voltar
            </Button>
          )}
          {onTentarNovamente && (
            <Button onClick={onTentarNovamente}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar Novamente
            </Button>
          )}
        </div>
      </div>
    );
  }
);
ErroPagina.displayName = 'ErroPagina';

// =============================================================================
// Componente Vazio
// =============================================================================

interface VazioProps {
  icone?: React.ReactNode;
  titulo: string;
  descricao?: string;
  acao?: React.ReactNode;
  className?: string;
}

export const Vazio = memo(({ icone, titulo, descricao, acao, className }: VazioProps) => {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12', className)}>
      {icone && <div className="text-muted-foreground">{icone}</div>}
      <div className="text-center">
        <h3 className="text-lg font-semibold">{titulo}</h3>
        {descricao && <p className="mt-1 text-sm text-muted-foreground">{descricao}</p>}
      </div>
      {acao}
    </div>
  );
});
Vazio.displayName = 'Vazio';
