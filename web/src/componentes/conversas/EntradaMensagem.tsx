import { memo, useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { Button } from '@/componentes/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentes/ui/tooltip';

// =============================================================================
// Tipos
// =============================================================================

interface EntradaMensagemProps {
  onEnviar: (mensagem: string) => void;
  desabilitado?: boolean;
  placeholder?: string;
}

// =============================================================================
// Componente
// =============================================================================

export const EntradaMensagem = memo(({
  onEnviar,
  desabilitado = false,
  placeholder = 'Digite sua mensagem...',
}: EntradaMensagemProps) => {
  const [mensagem, setMensagem] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 100)}px`;
    }
  }, [mensagem]);

  const handleEnviar = () => {
    const texto = mensagem.trim();
    if (texto && !desabilitado) {
      onEnviar(texto);
      setMensagem('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  };

  return (
    <div className="border-t border-border bg-muted p-4">
      <div className="flex items-end gap-2">
        {/* Botoes de Acao - Esquerda */}
        <div className="flex gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                disabled={desabilitado}
              >
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Modelos de mensagem</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                disabled={desabilitado}
              >
                <Paperclip className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Anexar arquivo</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                disabled={desabilitado}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Emoji</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-primary hover:text-primary hover:bg-primary/10"
                disabled={desabilitado}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>IA Assist</TooltipContent>
          </Tooltip>
        </div>

        {/* Campo de Texto */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={mensagem}
            onChange={(e) => setMensagem(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={desabilitado}
            rows={1}
            className={cn(
              'w-full resize-none rounded-md px-4 py-2.5 text-sm',
              'bg-secondary border border-border',
              'text-foreground placeholder:text-muted-foreground',
              'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'max-h-[100px] transition-colors'
            )}
          />
        </div>

        {/* Botao Enviar/Audio */}
        {mensagem.trim() ? (
          <Button
            onClick={handleEnviar}
            disabled={desabilitado || !mensagem.trim()}
            size="icon"
            className={cn(
              'h-9 w-9 shrink-0 rounded-md',
              'bg-primary hover:bg-primary/90 text-white'
            )}
          >
            <Send className="h-5 w-5" />
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                disabled={desabilitado}
              >
                <Mic className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Gravar audio</TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
});

EntradaMensagem.displayName = 'EntradaMensagem';
