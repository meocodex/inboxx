import { memo, useRef, useEffect, useCallback } from 'react';
import {
  MoreVertical,
  User,
  Check,
  CheckCheck,
  ArrowLeftRight,
  CheckCircle,
  Info,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { formatarHora, formatarData } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/componentes/ui/avatar';
import { Badge } from '@/componentes/ui/badge';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentes/ui/tooltip';
import { Carregando } from '@/componentes/comum/Carregando';
import { EntradaMensagem } from './EntradaMensagem';
import { RespostasRapidas, respostasPadrao } from './RespostasRapidas';
import { IconeCanal } from './IconeCanal';
import { TipoCanal } from '@/tipos';
import type { Conversa, Mensagem, RespostaRapida } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface AreaChatProps {
  conversa: Conversa | null;
  mensagens: Mensagem[];
  carregando: boolean;
  onEnviarMensagem: (texto: string) => void;
  onEncerrar?: () => void;
  onReabrir?: () => void;
  onTogglePainelInfo?: () => void;
  painelInfoAberto?: boolean;
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
// Componente Balao de Mensagem
// =============================================================================

interface BalaoMensagemProps {
  mensagem: Mensagem;
}

const BalaoMensagem = memo(({ mensagem }: BalaoMensagemProps) => {
  const isEntrada = mensagem.origem === 'ENTRADA';

  return (
    <div className={cn('flex', isEntrada ? 'justify-start' : 'justify-end')}>
      <div
        className={cn(
          'max-w-[65%] rounded-conv-lg px-4 py-2.5 shadow-sm',
          isEntrada
            ? 'bg-conv-bg-tertiary text-conv-text-primary rounded-tl-none'
            : 'bg-conv-accent text-white rounded-tr-none'
        )}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{mensagem.conteudo}</p>
        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1',
            isEntrada ? 'text-conv-text-muted' : 'text-white/70'
          )}
        >
          <span className="text-[10px]">{formatarHora(mensagem.enviadoEm)}</span>
          {!isEntrada && (
            mensagem.lida ? (
              <CheckCheck className="h-3 w-3 text-blue-400" />
            ) : (
              <Check className="h-3 w-3" />
            )
          )}
        </div>
      </div>
    </div>
  );
});
BalaoMensagem.displayName = 'BalaoMensagem';

// =============================================================================
// Componente Principal
// =============================================================================

export const AreaChat = memo(({
  conversa,
  mensagens,
  carregando,
  onEnviarMensagem,
  onEncerrar,
  onReabrir,
  onTogglePainelInfo,
  painelInfoAberto,
}: AreaChatProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll para o final quando novas mensagens chegam
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensagens]);

  const handleSelecionarResposta = useCallback((resposta: RespostaRapida) => {
    onEnviarMensagem(resposta.texto);
  }, [onEnviarMensagem]);

  // Se nao ha conversa selecionada
  if (!conversa) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-conv-bg-primary text-conv-text-muted">
        <User className="h-16 w-16 mb-4 opacity-50" />
        <p className="text-lg font-medium">Selecione uma conversa</p>
        <p className="text-sm mt-1">Escolha uma conversa da lista para iniciar o atendimento</p>
      </div>
    );
  }

  const iniciais = conversa.contato.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const conversaEncerrada = conversa.status === 'ENCERRADA';
  const canalAtual = conversa.canal?.canal as TipoCanal | undefined;
  const gradiente = gerarCorGradiente(conversa.contato.nome);

  // Tags mock - em producao viriam do contato
  const tags: Array<{ nome: string; variante: string }> = [
    { nome: 'VIP', variante: 'bg-amber-500/15 text-amber-500 border-amber-500/30' },
    { nome: 'Prioridade alta', variante: 'bg-red-500/15 text-red-500 border-red-500/30' },
    { nome: 'Em atendimento', variante: 'bg-conv-accent/15 text-conv-accent border-conv-accent/30' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-conv-bg-primary min-w-0">
      {/* Header do Chat */}
      <div className="border-b border-conv-border bg-conv-bg-secondary">
        {/* Linha 1: Info do contato + acoes */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {/* Avatar com status */}
            <div className="relative">
              <Avatar className="h-9 w-9">
                <AvatarImage src={conversa.contato.avatarUrl || undefined} />
                <AvatarFallback
                  className="text-sm font-semibold text-white"
                  style={{ background: gradiente }}
                >
                  {iniciais}
                </AvatarFallback>
              </Avatar>
              {/* Status online */}
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-online border-2 border-conv-bg-secondary" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-conv-text-primary">
                  {conversa.contato.nome}
                </h3>
                {canalAtual && (
                  <div className="flex items-center gap-1 text-xs text-conv-text-muted">
                    <span>•</span>
                    <span>Online</span>
                    <span>•</span>
                    <IconeCanal canal={canalAtual} tamanho="sm" />
                    <span className="text-conv-text-secondary">
                      {canalAtual === TipoCanal.WHATSAPP && 'WhatsApp Vendas'}
                      {canalAtual === TipoCanal.INSTAGRAM && 'Instagram'}
                      {canalAtual === TipoCanal.FACEBOOK && 'Facebook'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Acoes */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-conv-md text-conv-text-muted hover:text-conv-text-primary hover:bg-conv-bg-hover"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Transferir</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-conv-md text-conv-text-muted hover:text-conv-text-primary hover:bg-conv-bg-hover"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Resolver</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onTogglePainelInfo}
                  className={cn(
                    'h-8 w-8 rounded-conv-md',
                    painelInfoAberto
                      ? 'bg-conv-accent/15 text-conv-accent'
                      : 'text-conv-text-muted hover:text-conv-text-primary hover:bg-conv-bg-hover'
                  )}
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Informacoes do cliente</TooltipContent>
            </Tooltip>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-conv-md text-conv-text-muted hover:text-conv-text-primary hover:bg-conv-bg-hover"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem>Ver contato</DropdownMenuItem>
                <DropdownMenuItem>Fixar conversa</DropdownMenuItem>
                <DropdownMenuItem>Silenciar notificacoes</DropdownMenuItem>
                <DropdownMenuSeparator />
                {conversaEncerrada ? (
                  <DropdownMenuItem onClick={onReabrir}>
                    Reabrir conversa
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={onEncerrar}
                    className="text-destructive focus:text-destructive"
                  >
                    Encerrar conversa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Linha 2: Tags */}
        <div className="flex items-center gap-2 px-4 pb-3 overflow-x-auto">
          {tags.map((tag, index) => (
            <Badge
              key={index}
              variant="outline"
              className={cn('text-xs rounded-conv-full border shrink-0', tag.variante)}
            >
              {tag.nome}
            </Badge>
          ))}
        </div>
      </div>

      {/* Area de Mensagens */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {carregando ? (
          <div className="flex items-center justify-center h-full">
            <Carregando texto="Carregando mensagens..." />
          </div>
        ) : mensagens.length === 0 ? (
          <div className="flex items-center justify-center h-full text-conv-text-muted">
            <p>Nenhuma mensagem ainda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {mensagens.map((msg, index) => {
              // Mostrar separador de data
              const msgAnterior = mensagens[index - 1];
              const dataAtual = formatarData(msg.enviadoEm, 'dd/MM/yyyy');
              const dataAnterior = msgAnterior
                ? formatarData(msgAnterior.enviadoEm, 'dd/MM/yyyy')
                : null;
              const mostrarData = dataAtual !== dataAnterior;

              return (
                <div key={msg.id}>
                  {mostrarData && (
                    <div className="flex justify-center my-4">
                      <span className="text-[11px] bg-conv-bg-tertiary px-3 py-1 rounded-conv-full text-conv-text-muted font-medium">
                        {dataAtual === formatarData(new Date().toISOString(), 'dd/MM/yyyy')
                          ? 'Hoje'
                          : dataAtual}
                      </span>
                    </div>
                  )}
                  <BalaoMensagem mensagem={msg} />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Respostas Rapidas */}
      {!conversaEncerrada && (
        <RespostasRapidas
          respostas={respostasPadrao}
          onSelecionar={handleSelecionarResposta}
        />
      )}

      {/* Entrada de Mensagem */}
      {conversaEncerrada ? (
        <div className="border-t border-conv-border bg-conv-bg-tertiary/50 p-4 text-center">
          <p className="text-sm text-conv-text-muted mb-2">
            Esta conversa foi encerrada
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onReabrir}
            className="rounded-conv-md"
          >
            Reabrir conversa
          </Button>
        </div>
      ) : (
        <EntradaMensagem onEnviar={onEnviarMensagem} />
      )}
    </div>
  );
});

AreaChat.displayName = 'AreaChat';
