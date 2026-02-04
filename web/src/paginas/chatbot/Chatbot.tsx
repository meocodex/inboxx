import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Bot,
  Play,
  Pause,
  Pencil,
  Trash2,
  GitBranch,
  FileEdit,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { chatbotServico } from '@/servicos/chatbot.servico';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Badge } from '@/componentes/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  PageLayout,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  BuscaSidebar,
  CardItem,
  CardItemConteudo,
  GridCards,
  EmptyState,
  LoadingState,
} from '@/componentes/layout';
import type { FluxoResumo, StatusFluxo, AtualizarFluxoDTO } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const fluxoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.string().optional(),
  gatilhoTipo: z.enum(['PALAVRA_CHAVE', 'PRIMEIRA_MENSAGEM', 'HORARIO', 'ETIQUETA']),
  gatilhoValor: z.string().optional(),
});

type FluxoForm = z.infer<typeof fluxoSchema>;

// =============================================================================
// Configuracao de Status
// =============================================================================

const statusConfig: Record<StatusFluxo, { label: string; variant: 'default' | 'secondary' | 'success'; icone: React.ReactNode }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'secondary', icone: <FileEdit className="h-4 w-4" /> },
  ATIVO: { label: 'Ativo', variant: 'success', icone: <CheckCircle className="h-4 w-4" /> },
  INATIVO: { label: 'Inativo', variant: 'default', icone: <XCircle className="h-4 w-4" /> },
};

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todos' | StatusFluxo;

// =============================================================================
// Componente Principal
// =============================================================================

export default function Chatbot() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<FluxoResumo | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todos');

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const {
    data: fluxos,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['chatbot', 'fluxos'],
    queryFn: chatbotServico.listarFluxos,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: chatbotServico.criarFluxo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxos'] });
      mostrarSucesso('Fluxo criado', 'O fluxo foi criado com sucesso');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o fluxo'),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: AtualizarFluxoDTO }) =>
      chatbotServico.atualizarFluxo(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxos'] });
      mostrarSucesso('Fluxo atualizado', 'O fluxo foi atualizado');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar'),
  });

  const ativarMutation = useMutation({
    mutationFn: chatbotServico.ativarFluxo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxos'] });
      mostrarSucesso('Fluxo ativado', 'O fluxo foi ativado');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel ativar'),
  });

  const desativarMutation = useMutation({
    mutationFn: chatbotServico.desativarFluxo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxos'] });
      mostrarSucesso('Fluxo desativado', 'O fluxo foi desativado');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel desativar'),
  });

  const excluirMutation = useMutation({
    mutationFn: chatbotServico.excluirFluxo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxos'] });
      mostrarSucesso('Fluxo excluido', 'O fluxo foi excluido');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir'),
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<FluxoForm>({
    resolver: zodResolver(fluxoSchema),
    defaultValues: { nome: '', descricao: '', gatilhoTipo: 'PALAVRA_CHAVE', gatilhoValor: '' },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const abrirCriar = () => {
    setEditando(null);
    form.reset({ nome: '', descricao: '', gatilhoTipo: 'PALAVRA_CHAVE', gatilhoValor: '' });
    setModalAberto(true);
  };

  const abrirEditar = (fluxo: FluxoResumo) => {
    setEditando(fluxo);
    form.reset({
      nome: fluxo.nome,
      descricao: fluxo.descricao || '',
      gatilhoTipo: fluxo.gatilho?.tipo || 'PALAVRA_CHAVE',
      gatilhoValor: fluxo.gatilho?.valor || '',
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = (dados: FluxoForm) => {
    const payload = {
      nome: dados.nome,
      descricao: dados.descricao,
      gatilho: {
        tipo: dados.gatilhoTipo,
        valor: dados.gatilhoValor,
      },
    };

    if (editando) {
      atualizarMutation.mutate({ id: editando.id, dados: payload });
    } else {
      criarMutation.mutate(payload);
    }
  };

  // ---------------------------------------------------------------------------
  // Erro
  // ---------------------------------------------------------------------------
  const listaFluxos = fluxos || [];

  // Filtrar fluxos
  const fluxosFiltrados = listaFluxos.filter((fluxo) => {
    if (filtroStatus !== 'todos' && fluxo.status !== filtroStatus) return false;
    if (busca && !fluxo.nome.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  // Contadores
  const contadores = {
    todos: listaFluxos.length,
    RASCUNHO: listaFluxos.filter((f) => f.status === 'RASCUNHO').length,
    ATIVO: listaFluxos.filter((f) => f.status === 'ATIVO').length,
    INATIVO: listaFluxos.filter((f) => f.status === 'INATIVO').length,
  };

  return (
    <PageLayout
      titulo="Chatbot"
      subtitulo="Gerencie seus fluxos de automacao"
      icone={<Bot className="h-5 w-5" />}
      acoes={
        <Button onClick={abrirCriar}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fluxo
            </Button>
          }
      sidebarWidth="sm"
      sidebar={
        <>
          <CabecalhoSidebar
            titulo="Chatbot"
            subtitulo={`${listaFluxos.length} fluxos`}
            acoes={
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={abrirCriar}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          />

          <BuscaSidebar
            valor={busca}
            onChange={setBusca}
            placeholder="Buscar fluxos..."
          />

          <SecaoSidebar titulo="Status">
            <ItemSidebar
              icone={<Bot className="h-4 w-4" />}
              label="Todos"
              badge={contadores.todos}
              ativo={filtroStatus === 'todos'}
              onClick={() => setFiltroStatus('todos')}
            />
            {(Object.keys(statusConfig) as StatusFluxo[]).map((status) => (
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
          title="Erro ao carregar fluxos"
          description="Não foi possível carregar a lista"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando fluxos..." />
      ) : fluxosFiltrados.length === 0 ? (
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
            title="Nenhum fluxo"
            description="Crie seu primeiro fluxo de automacao"
            icon={<Bot className="h-16 w-16" />}
            primaryAction={{ label: 'Novo Fluxo', onClick: abrirCriar }}
          />
        )
      ) : (
            <GridCards colunas={3}>
              {fluxosFiltrados.map((fluxo) => {
                const config = statusConfig[fluxo.status] || statusConfig.RASCUNHO;

                return (
                  <CardItem
                    key={fluxo.id}
                    acoes={[
                      {
                        label: 'Abrir Editor',
                        icone: <GitBranch className="h-4 w-4" />,
                        onClick: () => navigate(`/chatbot/fluxo/${fluxo.id}`),
                      },
                      {
                        label: 'Editar',
                        icone: <Pencil className="h-4 w-4" />,
                        onClick: () => abrirEditar(fluxo),
                      },
                      ...(fluxo.status !== 'ATIVO'
                        ? [{
                            label: 'Ativar',
                            icone: <Play className="h-4 w-4" />,
                            onClick: () => ativarMutation.mutate(fluxo.id),
                          }]
                        : [{
                            label: 'Desativar',
                            icone: <Pause className="h-4 w-4" />,
                            onClick: () => desativarMutation.mutate(fluxo.id),
                          }]),
                      {
                        label: 'Excluir',
                        icone: <Trash2 className="h-4 w-4" />,
                        onClick: () => excluirMutation.mutate(fluxo.id),
                        variante: 'destructive' as const,
                      },
                    ]}
                  >
                    <CardItemConteudo
                      icone={<Bot className="h-5 w-5 text-primary" />}
                      titulo={fluxo.nome}
                      badge={
                        <Badge variant={config.variant} className="text-xs">
                          {config.label}
                        </Badge>
                      }
                      subtitulo={fluxo.descricao}
                      meta={
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <GitBranch className="h-3 w-3" />
                            {fluxo.totalNos} nos
                          </div>
                          <span>Gatilho: {fluxo.gatilho?.valor || fluxo.gatilho?.tipo}</span>
                        </div>
                      }
                    />
                  </CardItem>
                );
              })}
            </GridCards>
          )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editando ? 'Editar Fluxo' : 'Novo Fluxo'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...form.register('nome')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="descricao">Descricao</Label>
                  <Input id="descricao" {...form.register('descricao')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gatilhoTipo">Tipo de Gatilho *</Label>
                  <select
                    id="gatilhoTipo"
                    {...form.register('gatilhoTipo')}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="PALAVRA_CHAVE">Palavra-chave</option>
                    <option value="PRIMEIRA_MENSAGEM">Primeira mensagem</option>
                    <option value="HORARIO">Horário</option>
                    <option value="ETIQUETA">Etiqueta</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gatilhoValor">Valor do Gatilho</Label>
                  <Input
                    id="gatilhoValor"
                    placeholder="Ex: #menu, oi, bom dia"
                    {...form.register('gatilhoValor')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Palavra-chave ou configuração que inicia este fluxo
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={fecharModal}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editando ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </PageLayout>
  );
}
