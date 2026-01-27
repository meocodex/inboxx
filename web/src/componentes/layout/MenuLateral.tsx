import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Tags,
  Bot,
  Megaphone,
  Kanban,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  UserCog,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { useUIStore, useSidebarColapsada } from '@/stores';
import { usePermissoes } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentes/ui/tooltip';
import { Separator } from '@/componentes/ui/separator';

// =============================================================================
// Tipos
// =============================================================================

interface ItemMenu {
  titulo: string;
  icone: React.ElementType;
  href: string;
  permissao?: string;
}

// =============================================================================
// Itens do Menu
// =============================================================================

const itensMenu: ItemMenu[] = [
  { titulo: 'Dashboard', icone: LayoutDashboard, href: '/' },
  { titulo: 'Conversas', icone: MessageSquare, href: '/conversas', permissao: 'conversas:*' },
  { titulo: 'Contatos', icone: Users, href: '/contatos', permissao: 'contatos:*' },
  { titulo: 'Etiquetas', icone: Tags, href: '/etiquetas', permissao: 'contatos:*' },
  { titulo: 'Chatbot', icone: Bot, href: '/chatbot', permissao: 'chatbot:*' },
  { titulo: 'Campanhas', icone: Megaphone, href: '/campanhas', permissao: 'campanhas:*' },
  { titulo: 'Kanban', icone: Kanban, href: '/kanban', permissao: 'kanban:*' },
  { titulo: 'Agenda', icone: Calendar, href: '/agenda', permissao: 'agendamento:*' },
  { titulo: 'Relatorios', icone: BarChart3, href: '/relatorios', permissao: 'relatorios:*' },
  { titulo: 'Conexoes', icone: Smartphone, href: '/conexoes', permissao: 'conexoes:*' },
  { titulo: 'Usuarios', icone: UserCog, href: '/usuarios', permissao: 'usuarios:*' },
];

const itensConfig: ItemMenu[] = [
  { titulo: 'Configuracoes', icone: Settings, href: '/configuracoes', permissao: 'configuracoes:*' },
];

// =============================================================================
// Componente Item do Menu
// =============================================================================

interface ItemMenuProps {
  item: ItemMenu;
  colapsado: boolean;
}

const ItemMenuComponent = memo(({ item, colapsado }: ItemMenuProps) => {
  const location = useLocation();
  const ativo = location.pathname === item.href;
  const Icone = item.icone;

  const conteudo = (
    <NavLink
      to={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        ativo && 'bg-accent text-accent-foreground',
        colapsado && 'justify-center'
      )}
    >
      <Icone className="h-5 w-5 shrink-0" />
      {!colapsado && <span>{item.titulo}</span>}
    </NavLink>
  );

  if (colapsado) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{conteudo}</TooltipTrigger>
        <TooltipContent side="right">{item.titulo}</TooltipContent>
      </Tooltip>
    );
  }

  return conteudo;
});
ItemMenuComponent.displayName = 'ItemMenuComponent';

// =============================================================================
// Componente Menu Lateral
// =============================================================================

export const MenuLateral = memo(() => {
  const colapsado = useSidebarColapsada();
  const toggleColapsado = useUIStore((s) => s.toggleSidebarColapsada);
  const { temPermissao } = usePermissoes();

  const itensFiltrados = itensMenu.filter(
    (item) => !item.permissao || temPermissao(item.permissao)
  );

  const itensConfigFiltrados = itensConfig.filter(
    (item) => !item.permissao || temPermissao(item.permissao)
  );

  return (
    <aside
      className={cn(
        'flex flex-col border-r bg-background transition-all duration-300',
        colapsado ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 items-center border-b px-4', colapsado && 'justify-center')}>
        {!colapsado ? (
          <span className="text-lg font-bold text-primary">CRM Omnichannel</span>
        ) : (
          <span className="text-lg font-bold text-primary">CRM</span>
        )}
      </div>

      {/* Menu */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col gap-1 px-2">
          {itensFiltrados.map((item) => (
            <ItemMenuComponent key={item.href} item={item} colapsado={colapsado} />
          ))}
        </nav>
      </ScrollArea>

      {/* Configurações */}
      <div className="border-t py-4">
        <nav className="flex flex-col gap-1 px-2">
          {itensConfigFiltrados.map((item) => (
            <ItemMenuComponent key={item.href} item={item} colapsado={colapsado} />
          ))}
        </nav>
      </div>

      {/* Botão Colapsar */}
      <Separator />
      <div className="p-2">
        <Button variant="ghost" size="sm" className="w-full" onClick={toggleColapsado}>
          {colapsado ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!colapsado && <span className="ml-2">Recolher</span>}
        </Button>
      </div>
    </aside>
  );
});
MenuLateral.displayName = 'MenuLateral';
