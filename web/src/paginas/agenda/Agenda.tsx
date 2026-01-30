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
  Check,
  X,
  Trash2,
  CalendarDays,
  CalendarCheck,
  CalendarX,
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
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  SeparadorSidebar,
  CabecalhoPagina,
  CardItem,
  CardItemConteudo,
  ListaCards,
  EstadoVazio,
  EstadoCarregando,
  EstadoErro,
} from '@/componentes/layout';
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
// Configuracoes
// =============================================================================

const tipoConfig: Record<TipoEvento, { label: string; icon: React.ElementType; cor: string }> = {
  REUNIAO: { label: 'Reuniao', icon: Calendar, cor: '#3b82f6' },
  LIGACAO: { label: 'Ligacao', icon: Phone, cor: '#22c55e' },
  TAREFA: { label: 'Tarefa', icon: CheckSquare, cor: '#f59e0b' },
  LEMBRETE: { label: 'Lembrete', icon: Bell, cor: '#8b5cf6' },
  OUTRO: { label: 'Outro', icon: Clock, cor: '#64748b' },
};

const statusConfig: Record<StatusEvento, { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive'; icone: React.ReactNode }> = {
  AGENDADO: { label: 'Agendado', variant: 'default', icone: <CalendarDays className="h-4 w-4" /> },
  CONCLUIDO: { label: 'Concluido', variant: 'success', icone: <CalendarCheck className="h-4 w-4" /> },
  CANCELADO: { label: 'Cancelado', variant: 'destructive', icone: <CalendarX className="h-4 w-4" /> },
};

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todos' | StatusEvento;
type FiltroTipo = 'todos' | TipoEvento;

// =============================================================================
// Componente Principal
// =============================================================================

export default function Agenda() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipo>('todos');

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
  // Erro
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center">
          <EstadoErro
            titulo="Erro ao carregar agenda"
            mensagem="Nao foi possivel carregar os eventos"
            onTentarNovamente={() => recarregar()}
          />
        </div>
      </div>
    );
  }

  const listaEventos = eventos || [];

  // Filtrar eventos
  const eventosFiltrados = listaEventos.filter((evento) => {
    if (filtroStatus !== 'todos' && evento.status !== filtroStatus) return false;
    if (filtroTipo !== 'todos' && evento.tipo !== filtroTipo) return false;
    return true;
  });

  // Agrupar eventos por data
  const eventosAgrupados = eventosFiltrados.reduce((acc, evento) => {
    const data = evento.dataInicio.split('T')[0];
    if (!acc[data]) acc[data] = [];
    acc[data].push(evento);
    return acc;
  }, {} as Record<string, EventoResumo[]>);

  const datasOrdenadas = Object.keys(eventosAgrupados).sort();

  // Contadores
  const contadores = {
    todos: listaEventos.length,
    AGENDADO: listaEventos.filter((e) => e.status === 'AGENDADO').length,
    CONCLUIDO: listaEventos.filter((e) => e.status === 'CONCLUIDO').length,
    CANCELADO: listaEventos.filter((e) => e.status === 'CANCELADO').length,
  };

  const contadoresTipo = {
    todos: listaEventos.length,
    REUNIAO: listaEventos.filter((e) => e.tipo === 'REUNIAO').length,
    LIGACAO: listaEventos.filter((e) => e.tipo === 'LIGACAO').length,
    TAREFA: listaEventos.filter((e) => e.tipo === 'TAREFA').length,
    LEMBRETE: listaEventos.filter((e) => e.tipo === 'LEMBRETE').length,
    OUTRO: listaEventos.filter((e) => e.tipo === 'OUTRO').length,
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Secundaria - Filtros */}
      <SidebarSecundaria largura="sm">
        <CabecalhoSidebar
          titulo="Agenda"
          subtitulo={`${listaEventos.length} eventos`}
          acoes={
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setModalAberto(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />

        <SecaoSidebar titulo="Status">
          <ItemSidebar
            icone={<Calendar className="h-4 w-4" />}
            label="Todos"
            badge={contadores.todos}
            ativo={filtroStatus === 'todos'}
            onClick={() => setFiltroStatus('todos')}
          />
          {(Object.keys(statusConfig) as StatusEvento[]).map((status) => (
            <ItemSidebar
              key={status}
              icone={statusConfig[status].icone}
              label={statusConfig[status].label}
              badge={contadores[status]}
              ativo={filtroStatus === status}
              onClick={() => setFiltroStatus(status)}
            />
          ))}
        </SecaoSidebar>

        <SeparadorSidebar />

        <SecaoSidebar titulo="Tipo">
          <ItemSidebar
            icone={<Calendar className="h-4 w-4" />}
            label="Todos os tipos"
            badge={contadoresTipo.todos}
            ativo={filtroTipo === 'todos'}
            onClick={() => setFiltroTipo('todos')}
          />
          {(Object.keys(tipoConfig) as TipoEvento[]).map((tipo) => {
            const TipoIcon = tipoConfig[tipo].icon;
            return (
              <ItemSidebar
                key={tipo}
                icone={<TipoIcon className="h-4 w-4" style={{ color: tipoConfig[tipo].cor }} />}
                label={tipoConfig[tipo].label}
                badge={contadoresTipo[tipo]}
                ativo={filtroTipo === tipo}
                onClick={() => setFiltroTipo(tipo)}
              />
            );
          })}
        </SecaoSidebar>
      </SidebarSecundaria>

      {/* Conteudo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CabecalhoPagina
          titulo="Agenda"
          subtitulo="Gerencie seus compromissos e tarefas"
          icone={<Calendar className="h-5 w-5" />}
          acoes={
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          }
        />

        {/* Area de Conteudo */}
        <div className="flex-1 overflow-auto p-6">
          {carregando ? (
            <EstadoCarregando texto="Carregando eventos..." />
          ) : eventosFiltrados.length === 0 ? (
            <EstadoVazio
              titulo="Nenhum evento"
              descricao="Crie seu primeiro evento ou tarefa"
              icone={<Calendar className="h-16 w-16" />}
              acao={{ label: 'Novo Evento', onClick: () => setModalAberto(true) }}
            />
          ) : (
            <div className="space-y-6">
              {datasOrdenadas.map((data) => (
                <div key={data}>
                  <h3 className="font-medium text-muted-foreground mb-3">
                    {formatarData(data, "EEEE, dd 'de' MMMM")}
                  </h3>
                  <ListaCards>
                    {eventosAgrupados[data].map((evento) => {
                      const tipo = tipoConfig[evento.tipo];
                      const status = statusConfig[evento.status];
                      const Icon = tipo.icon;

                      return (
                        <CardItem
                          key={evento.id}
                          className={evento.status === 'CANCELADO' ? 'opacity-60' : ''}
                          acoes={
                            evento.status === 'AGENDADO'
                              ? [
                                  {
                                    label: 'Concluir',
                                    icone: <Check className="h-4 w-4" />,
                                    onClick: () => concluirMutation.mutate(evento.id),
                                  },
                                  {
                                    label: 'Cancelar',
                                    icone: <X className="h-4 w-4" />,
                                    onClick: () => cancelarMutation.mutate(evento.id),
                                  },
                                  {
                                    label: 'Excluir',
                                    icone: <Trash2 className="h-4 w-4" />,
                                    onClick: () => excluirMutation.mutate(evento.id),
                                    variante: 'destructive',
                                  },
                                ]
                              : undefined
                          }
                        >
                          <CardItemConteudo
                            icone={<Icon className="h-5 w-5" style={{ color: tipo.cor }} />}
                            titulo={evento.titulo}
                            badge={
                              <Badge variant={status.variant} className="text-xs">
                                {status.label}
                              </Badge>
                            }
                            subtitulo={
                              evento.diaInteiro
                                ? formatarData(evento.dataInicio, 'dd/MM/yyyy')
                                : formatarData(evento.dataInicio, 'dd/MM HH:mm')
                            }
                            meta={evento.contatoNome && <span>{evento.contatoNome}</span>}
                          />
                        </CardItem>
                      );
                    })}
                  </ListaCards>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
