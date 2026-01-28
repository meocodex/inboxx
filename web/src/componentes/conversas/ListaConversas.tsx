import { memo, useState } from 'react';
import { Search, RotateCw, SlidersHorizontal, MoreVertical, MessageSquare } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { Input } from '@/componentes/ui/input';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Separator } from '@/componentes/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/componentes/ui/select';
import { Carregando } from '@/componentes/comum/Carregando';
import { Vazio } from '@/componentes/comum/ErroMensagem';
import { ItemConversa } from './ItemConversa';
import { TipoCanal } from '@/tipos';
import type { ConversaResumo } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface ListaConversasProps {
  conversas: ConversaResumo[];
  carregando: boolean;
  conversaSelecionadaId: string | null;
  onSelecionarConversa: (id: string) => void;
  onNovaConversa?: () => void;
  canalAtivo?: TipoCanal | null;
}

// =============================================================================
// Filtros Rapidos
// =============================================================================

type FiltroRapido = 'nao_lidas' | 'aguardando' | 'minhas' | 'atribuidas';

interface BotaoFiltroRapidoProps {
  label: string;
  contador: number;
  ativo: boolean;
  onClick: () => void;
}

const BotaoFiltroRapido = memo(({ label, contador, ativo, onClick }: BotaoFiltroRapidoProps) => (
  <button
    onClick={onClick}
    className={cn(
      'flex items-center justify-between p-2 rounded-md text-xs font-medium transition-colors',
      'border border-border',
      ativo
        ? 'bg-primary/15 border-primary text-primary'
        : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground'
    )}
  >
    <span>{label}</span>
    <Badge
      variant="secondary"
      className={cn(
        'h-5 px-1.5 text-[10px]',
        ativo ? 'bg-primary/20 text-primary' : 'bg-accent text-muted-foreground'
      )}
    >
      {contador}
    </Badge>
  </button>
));
BotaoFiltroRapido.displayName = 'BotaoFiltroRapido';

// =============================================================================
// Componente
// =============================================================================

export const ListaConversas = memo(({
  conversas,
  carregando,
  conversaSelecionadaId,
  onSelecionarConversa,
  canalAtivo,
}: ListaConversasProps) => {
  const [busca, setBusca] = useState('');
  const [filtroRapidoAtivo, setFiltroRapidoAtivo] = useState<FiltroRapido | null>(null);
  const [filtrosAvancadosAbertos, setFiltrosAvancadosAbertos] = useState(false);

  // Filtrar conversas
  const conversasFiltradas = conversas.filter((c) => {
    const matchBusca =
      busca === '' || c.contato.nome.toLowerCase().includes(busca.toLowerCase());

    // Filtros rapidos
    if (filtroRapidoAtivo === 'nao_lidas' && c.naoLidas === 0) return false;
    if (filtroRapidoAtivo === 'aguardando' && c.status !== 'AGUARDANDO') return false;

    return matchBusca;
  });

  // Contadores
  const contadores = {
    nao_lidas: conversas.filter((c) => c.naoLidas > 0).length,
    aguardando: conversas.filter((c) => c.status === 'AGUARDANDO').length,
    minhas: conversas.filter((c) => c.status === 'EM_ATENDIMENTO').length,
    atribuidas: conversas.filter((c) => c.status !== 'ENCERRADA').length,
  };

  const toggleFiltroRapido = (filtro: FiltroRapido) => {
    setFiltroRapidoAtivo(filtroRapidoAtivo === filtro ? null : filtro);
  };

  return (
    <div className="flex flex-col h-full bg-muted">
      {/* Header */}
      <div className="p-4 space-y-3">
        {/* Titulo + Acoes */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-foreground">Conversas</h2>
            <Badge
              variant="secondary"
              className="bg-primary/15 text-primary text-[11px] font-semibold rounded-full"
            >
              {conversas.length}
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              <RotateCw className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFiltrosAvancadosAbertos(!filtrosAvancadosAbertos)}
              className={cn(
                'h-8 w-8 rounded-md',
                filtrosAvancadosAbertos
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Marcar todas como lidas</DropdownMenuItem>
                <DropdownMenuItem>Exportar conversas</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversas..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className={cn(
              'pl-9 h-10 rounded-md',
              'bg-secondary border-border',
              'text-foreground placeholder:text-muted-foreground',
              'focus:ring-primary focus:border-primary'
            )}
          />
        </div>

        {/* Filtros Rapidos - Grid 2x2 */}
        <div className="grid grid-cols-2 gap-2">
          <BotaoFiltroRapido
            label="Nao lidas"
            contador={contadores.nao_lidas}
            ativo={filtroRapidoAtivo === 'nao_lidas'}
            onClick={() => toggleFiltroRapido('nao_lidas')}
          />
          <BotaoFiltroRapido
            label="Aguardando"
            contador={contadores.aguardando}
            ativo={filtroRapidoAtivo === 'aguardando'}
            onClick={() => toggleFiltroRapido('aguardando')}
          />
          <BotaoFiltroRapido
            label="Minhas"
            contador={contadores.minhas}
            ativo={filtroRapidoAtivo === 'minhas'}
            onClick={() => toggleFiltroRapido('minhas')}
          />
          <BotaoFiltroRapido
            label="Atribuidas"
            contador={contadores.atribuidas}
            ativo={filtroRapidoAtivo === 'atribuidas'}
            onClick={() => toggleFiltroRapido('atribuidas')}
          />
        </div>

        {/* Filtros Avancados (Expansivel) */}
        {filtrosAvancadosAbertos && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="grid grid-cols-2 gap-2">
              <Select>
                <SelectTrigger className="h-9 text-xs bg-secondary border-border rounded-md">
                  <SelectValue placeholder="Canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-9 text-xs bg-secondary border-border rounded-md">
                  <SelectValue placeholder="Agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="me">Eu</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-9 text-xs bg-secondary border-border rounded-md">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                </SelectContent>
              </Select>

              <Select>
                <SelectTrigger className="h-9 text-xs bg-secondary border-border rounded-md">
                  <SelectValue placeholder="Etiqueta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vip">VIP</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-border" />

      {/* Lista */}
      <ScrollArea className="flex-1">
        {carregando ? (
          <div className="flex items-center justify-center h-40">
            <Carregando texto="Carregando..." />
          </div>
        ) : conversasFiltradas.length === 0 ? (
          <Vazio
            icone={<MessageSquare className="h-12 w-12 text-muted-foreground" />}
            titulo="Nenhuma conversa"
            descricao={busca ? 'Tente outra busca' : 'As conversas aparecerao aqui'}
          />
        ) : (
          <div className="divide-y divide-border">
            {conversasFiltradas.map((conversa) => (
              <ItemConversa
                key={conversa.id}
                conversa={conversa}
                selecionada={conversa.id === conversaSelecionadaId}
                onClick={() => onSelecionarConversa(conversa.id)}
                canal={canalAtivo || TipoCanal.WHATSAPP}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
});

ListaConversas.displayName = 'ListaConversas';
