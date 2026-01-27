import { memo } from 'react';
import { Bell, Search, Moon, Sun, LogOut, User, Settings } from 'lucide-react';
import { useUsuario, useUIStore, useTema } from '@/stores';
import { useAutenticacao } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
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
// Componente Cabeçalho
// =============================================================================

export const Cabecalho = memo(() => {
  const usuario = useUsuario();
  const tema = useTema();
  const setTema = useUIStore((s) => s.setTema);
  const { sair } = useAutenticacao();

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
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      {/* Busca */}
      <div className="flex items-center gap-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar..." className="pl-9" />
        </div>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-2">
        {/* Tema */}
        <Button variant="ghost" size="icon" onClick={alternarTema}>
          {tema === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Notificações */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
        </Button>

        {/* Perfil */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {iniciais || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{usuario?.nome}</p>
                <p className="text-xs leading-none text-muted-foreground">{usuario?.email}</p>
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
            <DropdownMenuItem onClick={sair} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
});
Cabecalho.displayName = 'Cabecalho';
