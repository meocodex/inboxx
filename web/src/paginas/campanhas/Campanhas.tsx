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
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
import type { Campanha, StatusCampanha } from '@/tipos';

// =============================================================================
// Configuração de Status
// =============================================================================

const statusConfig: Record<StatusCampanha, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'secondary' },
  AGENDADA: { label: 'Agendada', variant: 'default' },
  EM_ANDAMENTO: { label: 'Em andamento', variant: 'warning' },
  PAUSADA: { label: 'Pausada', variant: 'secondary' },
  CONCLUIDA: { label: 'Concluida', variant: 'success' },
  CANCELADA: { label: 'Cancelada', variant: 'destructive' },
};

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

        {/* Estatísticas */}
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
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar campanhas"
        mensagem="Nao foi possivel carregar a lista"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  const campanhas = campanhasData?.dados || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campanhas</h1>
          <p className="text-muted-foreground">Gerencie suas campanhas de envio em massa</p>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando campanhas..." />
        </div>
      ) : campanhas.length === 0 ? (
        <Vazio
          icone={<Megaphone className="h-16 w-16" />}
          titulo="Nenhuma campanha"
          descricao="Crie sua primeira campanha de envio"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campanhas.map((campanha) => (
            <CardCampanha
              key={campanha.id}
              campanha={campanha}
              onIniciar={(id) => iniciarMutation.mutate(id)}
              onPausar={(id) => pausarMutation.mutate(id)}
              onCancelar={(id) => cancelarMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
