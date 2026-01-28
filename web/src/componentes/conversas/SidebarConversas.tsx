import { memo } from 'react';
import {
  Inbox,
  Phone,
  CheckCircle,
  Clock,
  Pin,
  Archive,
  Zap,
  Bot,
  Users,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { Button } from '@/componentes/ui/button';
import { Avatar, AvatarFallback } from '@/componentes/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentes/ui/tooltip';
import { Separator } from '@/componentes/ui/separator';
import { IconeCanal } from './IconeCanal';
import { useUsuario } from '@/stores';
import { TipoCanal } from '@/tipos';
import type { FiltroSidebar, ContadoresSidebar, ContadoresCanais } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface SidebarConversasProps {
  filtroAtivo: FiltroSidebar;
  onFiltroChange: (filtro: FiltroSidebar) => void;
  canalAtivo: TipoCanal | null;
  onCanalChange: (canal: TipoCanal | null) => void;
  contadores?: ContadoresSidebar;
  contadoresCanais?: ContadoresCanais;
}

// =============================================================================
// Configuracao de Navegacao
// =============================================================================

const itensNavegacao: Array<{
  id: FiltroSidebar;
  icone: React.ElementType;
  label: string;
  comBadge?: boolean;
}> = [
  { id: 'inbox', icone: Inbox, label: 'Inbox', comBadge: true },
  { id: 'chamadas', icone: Phone, label: 'Chamadas' },
  { id: 'resolvidos', icone: CheckCircle, label: 'Resolvidos' },
  { id: 'pendentes', icone: Clock, label: 'Pendentes', comBadge: true },
  { id: 'fixados', icone: Pin, label: 'Fixados' },
  { id: 'arquivados', icone: Archive, label: 'Arquivados' },
];

const canais: Array<{
  tipo: TipoCanal;
  label: string;
}> = [
  { tipo: TipoCanal.WHATSAPP, label: 'WhatsApp' },
  { tipo: TipoCanal.INSTAGRAM, label: 'Instagram' },
  { tipo: TipoCanal.FACEBOOK, label: 'Facebook' },
];

// =============================================================================
// Componente Botao de Navegacao
// =============================================================================

interface BotaoNavProps {
  icone: React.ElementType;
  label: string;
  ativo: boolean;
  badge?: number;
  onClick: () => void;
}

const BotaoNav = memo(({ icone: Icone, label, ativo, badge, onClick }: BotaoNavProps) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          'relative h-[42px] w-[42px] rounded-md',
          'text-muted-foreground hover:text-foreground',
          'hover:bg-accent',
          'transition-colors',
          ativo && 'bg-primary/15 text-primary hover:bg-primary/20'
        )}
      >
        <Icone className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={8}>
      {label}
    </TooltipContent>
  </Tooltip>
));
BotaoNav.displayName = 'BotaoNav';

// =============================================================================
// Componente Botao de Canal
// =============================================================================

interface BotaoCanalProps {
  canal: TipoCanal;
  label: string;
  ativo: boolean;
  badge?: number;
  onClick: () => void;
}

const BotaoCanal = memo(({ canal, label, ativo, badge, onClick }: BotaoCanalProps) => (
  <Tooltip delayDuration={0}>
    <TooltipTrigger asChild>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        className={cn(
          'relative h-[42px] w-[42px] rounded-md',
          'hover:bg-accent',
          'transition-all',
          ativo && 'ring-2',
          ativo && canal === 'WHATSAPP' && 'ring-whatsapp bg-whatsapp/15',
          ativo && canal === 'INSTAGRAM' && 'ring-instagram bg-instagram/15',
          ativo && canal === 'FACEBOOK' && 'ring-facebook bg-facebook/15'
        )}
      >
        <IconeCanal canal={canal} tamanho="md" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </Button>
    </TooltipTrigger>
    <TooltipContent side="right" sideOffset={8}>
      {label}
    </TooltipContent>
  </Tooltip>
));
BotaoCanal.displayName = 'BotaoCanal';

// =============================================================================
// Componente Principal
// =============================================================================

export const SidebarConversas = memo(({
  filtroAtivo,
  onFiltroChange,
  canalAtivo,
  onCanalChange,
  contadores,
  contadoresCanais,
}: SidebarConversasProps) => {
  const usuario = useUsuario();

  const iniciais = usuario?.nome
    ? usuario.nome
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  return (
    <aside className="flex flex-col h-full w-[70px] shrink-0 bg-muted border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b border-border">
        <div
          className="flex items-center justify-center h-10 w-10 rounded-md text-white font-bold text-lg"
          style={{
            background: 'linear-gradient(135deg, #00d67d, #00a86b)',
            boxShadow: '0 4px 15px rgba(0, 214, 125, 0.3)',
          }}
        >
          O
        </div>
      </div>

      {/* Navegacao Principal */}
      <div className="flex-1 flex flex-col py-4">
        <nav className="flex flex-col items-center gap-1 px-3">
          {itensNavegacao.map((item) => (
            <BotaoNav
              key={item.id}
              icone={item.icone}
              label={item.label}
              ativo={filtroAtivo === item.id}
              badge={item.comBadge ? contadores?.[item.id] : undefined}
              onClick={() => onFiltroChange(item.id)}
            />
          ))}
        </nav>

        {/* Separador */}
        <div className="px-5 my-4">
          <Separator className="bg-border" />
        </div>

        {/* Label Canais */}
        <div className="px-3 mb-2">
          <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground block text-center">
            Canais
          </span>
        </div>

        {/* Botoes de Canais */}
        <nav className="flex flex-col items-center gap-1 px-3">
          {canais.map((canal) => (
            <BotaoCanal
              key={canal.tipo}
              canal={canal.tipo}
              label={canal.label}
              ativo={canalAtivo === canal.tipo}
              badge={contadoresCanais?.[canal.tipo.toLowerCase() as keyof ContadoresCanais]}
              onClick={() =>
                onCanalChange(canalAtivo === canal.tipo ? null : canal.tipo)
              }
            />
          ))}
        </nav>
      </div>

      {/* Navegacao Inferior */}
      <div className="flex flex-col items-center gap-1 px-3 pb-4 border-t border-border pt-4">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-[42px] w-[42px] rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Zap className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Automacoes
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-[42px] w-[42px] rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Bot className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            IA
          </TooltipContent>
        </Tooltip>

        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-[42px] w-[42px] rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <Users className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Equipe
          </TooltipContent>
        </Tooltip>

        {/* Avatar do Usuario */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <button className="mt-2">
              <Avatar className="h-7 w-7 ring-2 ring-border hover:ring-primary transition-all">
                <AvatarFallback className="bg-secondary text-foreground text-xs">
                  {iniciais}
                </AvatarFallback>
              </Avatar>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            {usuario?.nome || 'Meu Perfil'}
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
});

SidebarConversas.displayName = 'SidebarConversas';
