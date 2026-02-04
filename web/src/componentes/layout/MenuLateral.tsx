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
  Smartphone,
  UserCog,
  Bell,
  Moon,
  Sun,
  LogOut,
  User,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { useUsuario, useUIStore, useTema } from '@/stores';
import { usePermissoes, useAutenticacao } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/componentes/ui/tooltip';
import { Separator } from '@/componentes/ui/separator';
import { Avatar, AvatarFallback } from '@/componentes/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';

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
  { titulo: 'Canais', icone: Smartphone, href: '/canais', permissao: 'conexoes:*' },
  { titulo: 'Usuarios', icone: UserCog, href: '/usuarios', permissao: 'usuarios:*' },
];

const itensConfig: ItemMenu[] = [
  { titulo: 'Configuracoes', icone: Settings, href: '/configuracoes', permissao: 'configuracoes:*' },
];

// =============================================================================
// Componente Item do Menu
// =============================================================================

const ItemMenuComponent = memo(({ item }: { item: ItemMenu }) => {
  const location = useLocation();
  const ativo = location.pathname === item.href;
  const Icone = item.icone;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <NavLink
          to={item.href}
          className={cn(
            'flex items-center justify-center rounded-lg p-2.5 transition-colors',
            'hover:bg-accent hover:text-accent-foreground',
            ativo && 'bg-accent text-accent-foreground'
          )}
        >
          <Icone className="h-5 w-5 shrink-0" />
        </NavLink>
      </TooltipTrigger>
      <TooltipContent side="right">{item.titulo}</TooltipContent>
    </Tooltip>
  );
});
ItemMenuComponent.displayName = 'ItemMenuComponent';

// =============================================================================
// Componente Menu Lateral
// =============================================================================

export const MenuLateral = memo(() => {
  const { temPermissao } = usePermissoes();
  const usuario = useUsuario();
  const tema = useTema();
  const setTema = useUIStore((s) => s.setTema);
  const { sair } = useAutenticacao();

  const itensFiltrados = itensMenu.filter(
    (item) => !item.permissao || temPermissao(item.permissao)
  );

  const itensConfigFiltrados = itensConfig.filter(
    (item) => !item.permissao || temPermissao(item.permissao)
  );

  const iniciais = usuario?.nome
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const alternarTema = () => {
    setTema(tema === 'dark' ? 'light' : 'dark');
  };

  return (
    <aside className="flex w-[70px] shrink-0 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b">
        <span className="text-lg font-bold text-primary">Inboxx</span>
      </div>

      {/* Navegacao */}
      <ScrollArea className="flex-1 py-4">
        <nav className="flex flex-col items-center gap-1 px-3">
          {itensFiltrados.map((item) => (
            <ItemMenuComponent key={item.href} item={item} />
          ))}
        </nav>
      </ScrollArea>

      {/* Secao Inferior */}
      <div className="flex flex-col items-center gap-1 border-t px-3 py-3">
        {/* Configuracoes */}
        {itensConfigFiltrados.map((item) => (
          <ItemMenuComponent key={item.href} item={item} />
        ))}

        <Separator className="my-2" />

        {/* Toggle de Tema */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={alternarTema}
            >
              {tema === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            {tema === 'dark' ? 'Modo claro' : 'Modo escuro'}
          </TooltipContent>
        </Tooltip>

        {/* Notificacoes */}
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="h-5 w-5" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Notificacoes</TooltipContent>
        </Tooltip>

        {/* Avatar do Usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="mt-1 rounded-full">
              <Avatar className="h-8 w-8 cursor-pointer ring-2 ring-border transition-all hover:ring-primary">
                <AvatarFallback className="bg-primary text-xs text-primary-foreground">
                  {iniciais || 'U'}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="right" align="end">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{usuario?.nome}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {usuario?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Meu Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuracoes</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={sair}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
});
MenuLateral.displayName = 'MenuLateral';
