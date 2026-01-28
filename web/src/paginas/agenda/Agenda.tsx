import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Calendar,
  Clock,
  Phone,
  CheckSquare,
  Bell,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react';
import { agendaServico } from '@/servicos/agenda.servico';
import { useToast } from '@/hooks';
import { formatarData } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Badge } from '@/componentes/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
import type { EventoResumo, TipoEvento, StatusEvento } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const eventoSchema = z.object({
  titulo: z.string().min(2, 'Titulo deve ter no minimo 2 caracteres'),
  descricao: z.string().optional(),
  tipo: z.enum(['REUNIAO', 'LIGACAO', 'TAREFA', 'LEMBRETE', 'OUTRO']),
  dataInicio: z.string().min(1, 'Data obrigatoria'),
  dataFim: z.string().optional(),
  diaInteiro: z.boolean().optional(),
});

type EventoForm = z.infer<typeof eventoSchema>;

// =============================================================================
// Configurações
// =============================================================================

const tipoConfig: Record<TipoEvento, { label: string; icon: React.ElementType; cor: string }> = {
  REUNIAO: { label: 'Reuniao', icon: Calendar, cor: '#3b82f6' },
  LIGACAO: { label: 'Ligacao', icon: Phone, cor: '#22c55e' },
  TAREFA: { label: 'Tarefa', icon: CheckSquare, cor: '#f59e0b' },
  LEMBRETE: { label: 'Lembrete', icon: Bell, cor: '#8b5cf6' },
  OUTRO: { label: 'Outro', icon: Clock, cor: '#64748b' },
};

const statusConfig: Record<StatusEvento, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' }> = {
  AGENDADO: { label: 'Agendado', variant: 'default' },
  CONCLUIDO: { label: 'Concluido', variant: 'success' },
  CANCELADO: { label: 'Cancelado', variant: 'destructive' },
};

// =============================================================================
// Componente Card Evento
// =============================================================================

interface CardEventoProps {
  evento: EventoResumo;
  onConcluir: (id: string) => void;
  onCancelar: (id: string) => void;
  onExcluir: (id: string) => void;
}

function CardEvento({ evento, onConcluir, onCancelar, onExcluir }: CardEventoProps) {
  const tipo = tipoConfig[evento.tipo];
  const status = statusConfig[evento.status];
  const Icon = tipo.icon;

  return (
    <Card className={evento.status === 'CANCELADO' ? 'opacity-60' : ''}>
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${tipo.cor}20` }}
        >
          <Icon className="h-5 w-5" style={{ color: tipo.cor }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{evento.titulo}</p>
            <Badge variant={status.variant} className="text-xs">
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {evento.diaInteiro
              ? formatarData(evento.dataInicio, 'dd/MM/yyyy')
              : formatarData(evento.dataInicio, 'dd/MM HH:mm')}
            {evento.contatoNome && ` • ${evento.contatoNome}`}
          </p>
        </div>

        {evento.status === 'AGENDADO' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onConcluir(evento.id)}>
                <Check className="mr-2 h-4 w-4 text-green-500" />
                Concluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCancelar(evento.id)}>
                <X className="mr-2 h-4 w-4 text-orange-500" />
                Cancelar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExcluir(evento.id)} className="text-destructive">
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Agenda() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const {
    data: eventos,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['agenda', 'eventos'],
    queryFn: () => agendaServico.listar(),
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: agendaServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda', 'eventos'] });
      mostrarSucesso('Evento criado', 'O evento foi criado com sucesso');
      setModalAberto(false);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o evento'),
  });

  const concluirMutation = useMutation({
    mutationFn: agendaServico.concluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda', 'eventos'] });
      mostrarSucesso('Evento concluido', 'O evento foi marcado como concluido');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel concluir'),
  });

  const cancelarMutation = useMutation({
    mutationFn: agendaServico.cancelar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda', 'eventos'] });
      mostrarSucesso('Evento cancelado', 'O evento foi cancelado');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel cancelar'),
  });

  const excluirMutation = useMutation({
    mutationFn: agendaServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agenda', 'eventos'] });
      mostrarSucesso('Evento excluido', 'O evento foi excluido');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir'),
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      titulo: '',
      descricao: '',
      tipo: 'TAREFA',
      dataInicio: '',
      dataFim: '',
      diaInteiro: false,
    },
  });

  const handleSubmit = (dados: EventoForm) => {
    criarMutation.mutate(dados);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar agenda"
        mensagem="Nao foi possivel carregar os eventos"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  // Agrupar eventos por data
  const eventosAgrupados = (eventos || []).reduce((acc, evento) => {
    const data = evento.dataInicio.split('T')[0];
    if (!acc[data]) acc[data] = [];
    acc[data].push(evento);
    return acc;
  }, {} as Record<string, EventoResumo[]>);

  const datasOrdenadas = Object.keys(eventosAgrupados).sort();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agenda</h1>
          <p className="text-muted-foreground">Gerencie seus compromissos e tarefas</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Evento
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando eventos..." />
        </div>
      ) : !eventos || eventos.length === 0 ? (
        <Vazio
          icone={<Calendar className="h-16 w-16" />}
          titulo="Nenhum evento"
          descricao="Crie seu primeiro evento ou tarefa"
          acao={
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {datasOrdenadas.map((data) => (
            <div key={data}>
              <h3 className="font-medium text-muted-foreground mb-3">
                {formatarData(data, "EEEE, dd 'de' MMMM")}
              </h3>
              <div className="space-y-2">
                {eventosAgrupados[data].map((evento) => (
                  <CardEvento
                    key={evento.id}
                    evento={evento}
                    onConcluir={(id) => concluirMutation.mutate(id)}
                    onCancelar={(id) => cancelarMutation.mutate(id)}
                    onExcluir={(id) => excluirMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Novo Evento</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Titulo *</Label>
                  <Input id="titulo" {...form.register('titulo')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    {...form.register('tipo')}
                  >
                    {Object.entries(tipoConfig).map(([valor, config]) => (
                      <option key={valor} value={valor}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataInicio">Data/Hora *</Label>
                  <Input
                    id="dataInicio"
                    type="datetime-local"
                    {...form.register('dataInicio')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descricao</Label>
                  <Input id="descricao" {...form.register('descricao')} />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
