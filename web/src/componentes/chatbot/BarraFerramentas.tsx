import { memo } from 'react';
import {
  Play,
  MessageCircle,
  HelpCircle,
  ListOrdered,
  GitBranch,
  ArrowRightLeft,
  Webhook,
  Clock,
  Zap,
  Square,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { Button } from '@/componentes/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/componentes/ui/tooltip';
import type { TipoNo } from './NoFluxo';

// =============================================================================
// Configuracao dos Itens da Barra de Ferramentas
// =============================================================================

interface ItemFerramenta {
  tipo: TipoNo;
  icone: React.ElementType;
  rotulo: string;
  descricao: string;
  cor: string;
  corHover: string;
}

const itensFerramenta: ItemFerramenta[] = [
  {
    tipo: 'INICIO',
    icone: Play,
    rotulo: 'Inicio',
    descricao: 'Ponto de entrada do fluxo',
    cor: 'text-emerald-600',
    corHover: 'hover:bg-emerald-50',
  },
  {
    tipo: 'MENSAGEM',
    icone: MessageCircle,
    rotulo: 'Mensagem',
    descricao: 'Enviar uma mensagem de texto',
    cor: 'text-blue-600',
    corHover: 'hover:bg-blue-50',
  },
  {
    tipo: 'PERGUNTA',
    icone: HelpCircle,
    rotulo: 'Pergunta',
    descricao: 'Fazer uma pergunta e salvar resposta',
    cor: 'text-purple-600',
    corHover: 'hover:bg-purple-50',
  },
  {
    tipo: 'MENU',
    icone: ListOrdered,
    rotulo: 'Menu',
    descricao: 'Menu de opcoes numeradas',
    cor: 'text-amber-600',
    corHover: 'hover:bg-amber-50',
  },
  {
    tipo: 'CONDICAO',
    icone: GitBranch,
    rotulo: 'Condicao',
    descricao: 'Desviar fluxo baseado em condicoes',
    cor: 'text-orange-600',
    corHover: 'hover:bg-orange-50',
  },
  {
    tipo: 'TRANSFERIR',
    icone: ArrowRightLeft,
    rotulo: 'Transferir',
    descricao: 'Transferir para atendente ou equipe',
    cor: 'text-cyan-600',
    corHover: 'hover:bg-cyan-50',
  },
  {
    tipo: 'WEBHOOK',
    icone: Webhook,
    rotulo: 'Webhook',
    descricao: 'Chamar API externa',
    cor: 'text-rose-600',
    corHover: 'hover:bg-rose-50',
  },
  {
    tipo: 'ESPERAR',
    icone: Clock,
    rotulo: 'Esperar',
    descricao: 'Aguardar um tempo determinado',
    cor: 'text-slate-600',
    corHover: 'hover:bg-slate-50',
  },
  {
    tipo: 'ACAO',
    icone: Zap,
    rotulo: 'Acao',
    descricao: 'Executar uma acao customizada',
    cor: 'text-violet-600',
    corHover: 'hover:bg-violet-50',
  },
  {
    tipo: 'FIM',
    icone: Square,
    rotulo: 'Fim',
    descricao: 'Encerrar o fluxo',
    cor: 'text-red-600',
    corHover: 'hover:bg-red-50',
  },
];

// =============================================================================
// Props
// =============================================================================

interface BarraFerramentasProps {
  onAdicionarNo: (tipo: TipoNo) => void;
  className?: string;
}

// =============================================================================
// Componente Barra de Ferramentas
// =============================================================================

function BarraFerramentasBase({ onAdicionarNo, className }: BarraFerramentasProps) {
  const onDragStart = (event: React.DragEvent, tipo: TipoNo) => {
    event.dataTransfer.setData('application/reactflow', tipo);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'bg-background border rounded-lg p-2 shadow-sm',
          className
        )}
      >
        <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
          Arrastar para adicionar
        </div>
        <div className="grid grid-cols-2 gap-1">
          {itensFerramenta.map((item) => (
            <Tooltip key={item.tipo}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'justify-start gap-2 cursor-grab active:cursor-grabbing',
                    item.corHover
                  )}
                  draggable
                  onDragStart={(e) => onDragStart(e, item.tipo)}
                  onClick={() => onAdicionarNo(item.tipo)}
                >
                  <item.icone className={cn('h-4 w-4', item.cor)} />
                  <span className="text-xs">{item.rotulo}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.descricao}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>
    </TooltipProvider>
  );
}

export const BarraFerramentas = memo(BarraFerramentasBase);
