import { memo } from 'react';
import { MessageSquare } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { formatarTempoRelativo } from '@/utilitarios/formatadores';
import { Avatar, AvatarFallback, AvatarImage } from '@/componentes/ui/avatar';
import { IconeCanal } from './IconeCanal';
import type { ConversaResumo, TipoCanal } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface ItemConversaProps {
  conversa: ConversaResumo;
  selecionada: boolean;
  onClick: () => void;
  canal?: TipoCanal;
}

// =============================================================================
// Funcao para gerar cor de gradiente baseada no nome
// =============================================================================

const gerarCorGradiente = (nome: string): string => {
  const cores = [
    'linear-gradient(135deg, #00d67d, #00a86b)',
    'linear-gradient(135deg, #667eea, #764ba2)',
    'linear-gradient(135deg, #f093fb, #f5576c)',
    'linear-gradient(135deg, #4facfe, #00f2fe)',
    'linear-gradient(135deg, #43e97b, #38f9d7)',
    'linear-gradient(135deg, #fa709a, #fee140)',
  ];

  let hash = 0;
  for (let i = 0; i < nome.length; i++) {
    hash = nome.charCodeAt(i) + ((hash << 5) - hash);
  }

  return cores[Math.abs(hash) % cores.length];
};

// =============================================================================
// Componente
// =============================================================================

export const ItemConversa = memo(({ conversa, selecionada, onClick, canal }: ItemConversaProps) => {
  const { contato, ultimaMensagem, naoLidas, atualizadoEm } = conversa;

  const iniciais = contato.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const temNaoLidas = naoLidas > 0;
  const gradiente = gerarCorGradiente(contato.nome);

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 text-left transition-colors relative',
        'hover:bg-conv-bg-hover',
        selecionada && 'bg-conv-bg-tertiary',
        temNaoLidas && 'border-l-[3px] border-l-conv-accent'
      )}
    >
      {/* Avatar com icone de canal */}
      <div className="relative shrink-0">
        <Avatar className="h-11 w-11">
          <AvatarImage src={contato.avatarUrl || undefined} />
          <AvatarFallback
            className="text-sm font-semibold text-white"
            style={{ background: gradiente }}
          >
            {iniciais}
          </AvatarFallback>
        </Avatar>

        {/* Icone do canal */}
        {canal && (
          <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center h-[18px] w-[18px] rounded-full bg-conv-bg-secondary border border-conv-border">
            <IconeCanal canal={canal} tamanho="sm" />
          </div>
        )}
      </div>

      {/* Conteudo */}
      <div className="flex-1 min-w-0">
        {/* Linha 1: Nome + Timestamp */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            'text-sm truncate',
            temNaoLidas ? 'font-semibold text-conv-text-primary' : 'font-medium text-conv-text-primary'
          )}>
            {contato.nome}
          </span>
          <span className="text-[11px] text-conv-text-muted shrink-0">
            {formatarTempoRelativo(atualizadoEm)}
          </span>
        </div>

        {/* Linha 2: Preview + Badge nao lidas */}
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className={cn(
            'text-[13px] truncate',
            temNaoLidas ? 'text-conv-text-secondary font-medium' : 'text-conv-text-muted'
          )}>
            {ultimaMensagem?.conteudo || (
              <span className="flex items-center gap-1 text-conv-text-muted">
                <MessageSquare className="h-3 w-3" />
                Nova conversa
              </span>
            )}
          </p>

          {temNaoLidas && (
            <span className="flex items-center justify-center h-5 min-w-5 px-1.5 text-[10px] font-semibold bg-conv-accent text-white rounded-full shrink-0">
              {naoLidas > 99 ? '99+' : naoLidas}
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

ItemConversa.displayName = 'ItemConversa';
