import { memo } from 'react';
import { cn } from '@/utilitarios/cn';
import { Button } from '@/componentes/ui/button';
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import type { RespostaRapida } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface RespostasRapidasProps {
  respostas: RespostaRapida[];
  onSelecionar: (resposta: RespostaRapida) => void;
  className?: string;
}

// =============================================================================
// Respostas Padrao
// =============================================================================

export const respostasPadrao: RespostaRapida[] = [
  { id: '1', texto: 'Ola! Como posso ajudar?', atalho: '1', icone: '👋' },
  { id: '2', texto: 'Nosso horario de atendimento e de segunda a sexta, das 8h as 18h.', atalho: '2', icone: '⏰' },
  { id: '3', texto: 'Qual e o seu endereco completo?', atalho: '3', icone: '📍' },
  { id: '4', texto: 'Aceitamos Pix, cartao de credito e boleto.', atalho: '4', icone: '💳' },
  { id: '5', texto: 'Vou verificar e ja retorno.', atalho: '5', icone: '🔍' },
  { id: '6', texto: 'Um momento, por favor.', atalho: '6', icone: '⏳' },
];

// =============================================================================
// Componente
// =============================================================================

export const RespostasRapidas = memo(({
  respostas,
  onSelecionar,
  className,
}: RespostasRapidasProps) => {
  if (respostas.length === 0) return null;

  return (
    <div className={cn('border-t border-border bg-muted', className)}>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 p-3">
          {respostas.map((resposta) => (
            <Button
              key={resposta.id}
              variant="outline"
              size="sm"
              onClick={() => onSelecionar(resposta)}
              className={cn(
                'shrink-0 h-8 px-3 text-xs font-medium',
                'bg-secondary border-border',
                'hover:bg-accent hover:border-border',
                'text-muted-foreground hover:text-foreground',
                'rounded-full transition-colors'
              )}
            >
              {resposta.icone && <span className="mr-1.5">{resposta.icone}</span>}
              {resposta.texto.length > 20
                ? `${resposta.texto.substring(0, 20)}...`
                : resposta.texto}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="h-1.5" />
      </ScrollArea>
    </div>
  );
});

RespostasRapidas.displayName = 'RespostasRapidas';
