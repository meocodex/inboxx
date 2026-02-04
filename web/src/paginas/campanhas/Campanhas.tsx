import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Megaphone,
  Play,
  Pause,
  XCircle,
  MoreHorizontal,
  Clock,
  Send,
  AlertCircle,
  FileEdit,
  CalendarClock,
  CheckCircle,
  Ban,
} from 'lucide-react';
import { campanhasServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarData, formatarNumero } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import {
  PageLayout,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  BuscaSidebar,
  GridCards,
  EmptyState,
  LoadingState,
} from '@/componentes/layout';
import type { Campanha, StatusCampanha } from '@/tipos';

// =============================================================================
// Configuracao de Status
// =============================================================================

const statusConfig: Record<StatusCampanha, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icone: React.ReactNode }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'secondary', icone: <FileEdit className="h-4 w-4" /> },
  AGENDADA: { label: 'Agendada', variant: 'default', icone: <CalendarClock className="h-4 w-4" /> },
  EM_ANDAMENTO: { label: 'Em andamento', variant: 'warning', icone: <Play className="h-4 w-4" /> },
  PAUSADA: { label: 'Pausada', variant: 'secondary', icone: <Pause className="h-4 w-4" /> },
  CONCLUIDA: { label: 'Concluida', variant: 'success', icone: <CheckCircle className="h-4 w-4" /> },
  CANCELADA: { label: 'Cancelada', variant: 'destructive', icone: <Ban className="h-4 w-4" /> },
};

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todas' | StatusCampanha;

// =============================================================================
// Componente Card Campanha
// =============================================================================

interface CardCampanhaProps {
  campanha: Campanha;
  onIniciar: (id: string) => void;
  onPausar: (id: string) => void;
  onCancelar: (id: string) => void;
}

function CardCampanha({ campanha, onIniciar, onPausar, onCancelar }: CardCampanhaProps) {
  const config = statusConfig[campanha.status];
  const progresso = campanha.totalContatos > 0
    ? Math.round((campanha.totalEnviados / campanha.totalContatos) * 100)
    : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{campanha.nome}</CardTitle>
            <Badge variant={config.variant} className="mt-1">
              {config.label}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {campanha.status === 'RASCUNHO' && (
                <DropdownMenuItem onClick={() => onIniciar(campanha.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Iniciar
                </DropdownMenuItem>
              )}
              {campanha.status === 'EM_ANDAMENTO' && (
                <DropdownMenuItem onClick={() => onPausar(campanha.id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pausar
                </DropdownMenuItem>
              )}
              {campanha.status === 'PAUSADA' && (
                <DropdownMenuItem onClick={() => onIniciar(campanha.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Retomar
                </DropdownMenuItem>
              )}
              {['RASCUNHO', 'AGENDADA', 'EM_ANDAMENTO', 'PAUSADA'].includes(campanha.status) && (
                <DropdownMenuItem onClick={() => onCancelar(campanha.id)} className="text-destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Cancelar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {campanha.descricao && (
          <p className="text-sm text-muted-foreground mb-4">{campanha.descricao}</p>
        )}

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progresso}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>

        {/* Estatisticas */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Megaphone className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{formatarNumero(campanha.totalContatos)}</p>
            <p className="text-xs text-muted-foreground">Contatos</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-500">
              <Send className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{formatarNumero(campanha.totalEnviados)}</p>
            <p className="text-xs text-muted-foreground">Enviados</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
            <p className="text-lg font-semibold">{formatarNumero(campanha.totalErros)}</p>
            <p className="text-xs text-muted-foreground">Erros</p>
          </div>
        </div>

        {/* Datas */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground">
          {campanha.agendadaPara && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Agendada: {formatarData(campanha.agendadaPara, 'dd/MM HH:mm')}
            </div>
          )}
          <div>
            Criada em {formatarData(campanha.criadoEm)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Campanhas() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const {
    data: campanhasData,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['campanhas'],
    queryFn: () => campanhasServico.listar({ limite: 50 }),
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const iniciarMutation = useMutation({
    mutationFn: campanhasServico.iniciar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      mostrarSucesso('Campanha iniciada', 'A campanha foi iniciada');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel iniciar a campanha'),
  });

  const pausarMutation = useMutation({
    mutationFn: campanhasServico.pausar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      mostrarSucesso('Campanha pausada', 'A campanha foi pausada');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel pausar a campanha'),
  });

  const cancelarMutation = useMutation({
    mutationFn: campanhasServico.cancelar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campanhas'] });
      mostrarSucesso('Campanha cancelada', 'A campanha foi cancelada');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel cancelar a campanha'),
  });

  // ---------------------------------------------------------------------------
  const campanhas = campanhasData?.dados || [];

  // Filtrar campanhas
  const campanhasFiltradas = campanhas.filter((campanha) => {
    if (filtroStatus !== 'todas' && campanha.status !== filtroStatus) return false;
    if (busca && !campanha.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  // Contadores
  const contadores = {
    todas: campanhas.length,
    RASCUNHO: campanhas.filter((c) => c.status === 'RASCUNHO').length,
    AGENDADA: campanhas.filter((c) => c.status === 'AGENDADA').length,
    EM_ANDAMENTO: campanhas.filter((c) => c.status === 'EM_ANDAMENTO').length,
    PAUSADA: campanhas.filter((c) => c.status === 'PAUSADA').length,
    CONCLUIDA: campanhas.filter((c) => c.status === 'CONCLUIDA').length,
    CANCELADA: campanhas.filter((c) => c.status === 'CANCELADA').length,
  };

  return (
    <PageLayout
      titulo="Campanhas"
      subtitulo="Gerencie suas campanhas de envio em massa"
      icone={<Megaphone className="h-5 w-5" />}
      acoes={
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      }
      sidebarWidth="sm"
      sidebar={
        <>
          <CabecalhoSidebar
            titulo="Campanhas"
            subtitulo={`${campanhas.length} campanhas`}
          />

          <BuscaSidebar
            valor={busca}
            onChange={setBusca}
            placeholder="Buscar campanhas..."
          />

          <SecaoSidebar titulo="Status">
            <ItemSidebar
              icone={<Megaphone className="h-4 w-4" />}
              label="Todas"
              badge={contadores.todas}
              ativo={filtroStatus === 'todas'}
              onClick={() => setFiltroStatus('todas')}
            />
            {(Object.keys(statusConfig) as StatusCampanha[]).map((status) => (
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
        </>
      }
    >
      {/* Estados de erro/loading/vazio */}
      {erro ? (
        <EmptyState
          variant="error"
          title="Erro ao carregar campanhas"
          description="Não foi possível carregar a lista"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando campanhas..." />
      ) : campanhasFiltradas.length === 0 ? (
        busca ? (
          <EmptyState
            variant="search"
            title="Nenhum resultado encontrado"
            description={`Não encontramos resultados para "${busca}". Tente usar outros termos.`}
            primaryAction={{
              label: 'Limpar busca',
              onClick: () => setBusca(''),
            }}
          />
        ) : (
          <EmptyState
            variant="default"
            title="Nenhuma campanha"
            description="Crie sua primeira campanha de envio"
            icon={<Megaphone className="h-16 w-16" />}
          />
        )
      ) : (
            <GridCards colunas={3}>
              {campanhasFiltradas.map((campanha) => (
                <CardCampanha
                  key={campanha.id}
                  campanha={campanha}
                  onIniciar={(id) => iniciarMutation.mutate(id)}
                  onPausar={(id) => pausarMutation.mutate(id)}
                  onCancelar={(id) => cancelarMutation.mutate(id)}
                />
              ))}
            </GridCards>
          )}
    </PageLayout>
  );
}
