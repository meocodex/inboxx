import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Tag, Pencil, Trash2 } from 'lucide-react';
import { etiquetasServico } from '@/servicos';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  PageLayout,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  CardItem,
  CardItemConteudo,
  GridCards,
  LoadingState,
  EmptyState,
} from '@/componentes/layout';
import type { Etiqueta } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const etiquetaSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  cor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor invalida'),
});

type EtiquetaForm = z.infer<typeof etiquetaSchema>;

// =============================================================================
// Cores Pre-definidas
// =============================================================================

const CORES_PREDEFINIDAS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

// Agrupar cores para sidebar
const GRUPOS_CORES = [
  { nome: 'Vermelho', cores: ['#ef4444', '#f43f5e'] },
  { nome: 'Laranja', cores: ['#f97316', '#f59e0b'] },
  { nome: 'Amarelo', cores: ['#eab308', '#84cc16'] },
  { nome: 'Verde', cores: ['#22c55e', '#14b8a6'] },
  { nome: 'Azul', cores: ['#06b6d4', '#3b82f6'] },
  { nome: 'Roxo', cores: ['#6366f1', '#8b5cf6', '#a855f7'] },
  { nome: 'Rosa', cores: ['#d946ef', '#ec4899'] },
  { nome: 'Cinza', cores: ['#64748b'] },
];

// =============================================================================
// Componente Principal
// =============================================================================

export default function Etiquetas() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Etiqueta | null>(null);
  const [corFiltro, setCorFiltro] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const {
    data: etiquetas,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['etiquetas'],
    queryFn: etiquetasServico.listar,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: etiquetasServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      mostrarSucesso('Etiqueta criada', 'A etiqueta foi criada com sucesso');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar a etiqueta'),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: EtiquetaForm }) =>
      etiquetasServico.atualizar(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      mostrarSucesso('Etiqueta atualizada', 'A etiqueta foi atualizada');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar'),
  });

  const excluirMutation = useMutation({
    mutationFn: etiquetasServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etiquetas'] });
      mostrarSucesso('Etiqueta excluida', 'A etiqueta foi excluida');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir'),
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<EtiquetaForm>({
    resolver: zodResolver(etiquetaSchema),
    defaultValues: { nome: '', cor: '#3b82f6' },
  });

  const corSelecionada = form.watch('cor');

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const abrirCriar = () => {
    setEditando(null);
    form.reset({ nome: '', cor: '#3b82f6' });
    setModalAberto(true);
  };

  const abrirEditar = (etiqueta: Etiqueta) => {
    setEditando(etiqueta);
    form.reset({ nome: etiqueta.nome, cor: etiqueta.cor });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = (dados: EtiquetaForm) => {
    if (editando) {
      atualizarMutation.mutate({ id: editando.id, dados });
    } else {
      criarMutation.mutate(dados);
    }
  };

  // ---------------------------------------------------------------------------
  const listaEtiquetas = etiquetas || [];

  // Filtrar por cor
  const etiquetasFiltradas = corFiltro
    ? listaEtiquetas.filter((e) => {
        const grupo = GRUPOS_CORES.find((g) => g.cores.includes(corFiltro));
        return grupo?.cores.includes(e.cor);
      })
    : listaEtiquetas;

  return (
    <>
      <PageLayout
        titulo="Etiquetas"
        subtitulo="Organize seus contatos com etiquetas"
        icone={<Tag className="h-5 w-5" />}
        acoes={
          <Button onClick={abrirCriar}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Etiqueta
          </Button>
        }
        sidebarWidth="sm"
        sidebar={
        <>
          <CabecalhoSidebar
            titulo="Etiquetas"
            subtitulo={`${listaEtiquetas.length} etiquetas`}
            acoes={
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={abrirCriar}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          />

          <SecaoSidebar titulo="Filtrar por Cor">
            <ItemSidebar
              icone={<Tag className="h-4 w-4" />}
              label="Todas as cores"
              badge={listaEtiquetas.length}
              ativo={corFiltro === null}
              onClick={() => setCorFiltro(null)}
            />
            {GRUPOS_CORES.map((grupo) => {
              const count = listaEtiquetas.filter((e) =>
                grupo.cores.includes(e.cor)
              ).length;
              if (count === 0) return null;
              return (
                <ItemSidebar
                  key={grupo.nome}
                  icone={
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: grupo.cores[0] }}
                    />
                  }
                  label={grupo.nome}
                  badge={count}
                  ativo={corFiltro === grupo.cores[0]}
                  onClick={() => setCorFiltro(grupo.cores[0])}
                />
              );
            })}
          </SecaoSidebar>
        </>
      }
    >
      {erro ? (
        <EmptyState
          variant="error"
          title="Erro ao carregar etiquetas"
          description="Não foi possível carregar a lista"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando etiquetas..." />
      ) : etiquetasFiltradas.length === 0 ? (
        <EmptyState
          variant="default"
          title="Nenhuma etiqueta"
          description="Crie sua primeira etiqueta para organizar contatos"
          icon={<Tag className="h-16 w-16" />}
          primaryAction={{ label: 'Nova Etiqueta', onClick: abrirCriar }}
        />
      ) : (
        <GridCards colunas={3}>
          {etiquetasFiltradas.map((etiqueta) => (
            <CardItem
              key={etiqueta.id}
              acoes={[
                {
                  label: 'Editar',
                  icone: <Pencil className="h-4 w-4" />,
                  onClick: () => abrirEditar(etiqueta),
                },
                {
                  label: 'Excluir',
                  icone: <Trash2 className="h-4 w-4" />,
                  onClick: () => excluirMutation.mutate(etiqueta.id),
                  variante: 'destructive',
                },
              ]}
            >
              <CardItemConteudo
                icone={
                  <div
                    className="h-5 w-5 rounded-full"
                    style={{ backgroundColor: etiqueta.cor }}
                  />
                }
                titulo={etiqueta.nome}
                subtitulo={etiqueta.cor}
              />
            </CardItem>
          ))}
        </GridCards>
      )}
    </PageLayout>

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editando ? 'Editar Etiqueta' : 'Nova Etiqueta'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...form.register('nome')} />
                </div>

                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg border"
                      style={{ backgroundColor: corSelecionada }}
                    />
                    <Input {...form.register('cor')} className="w-28" />
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {CORES_PREDEFINIDAS.map((cor) => (
                      <button
                        key={cor}
                        type="button"
                        className={`h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 ${
                          corSelecionada === cor ? 'border-primary' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: cor }}
                        onClick={() => form.setValue('cor', cor)}
                      />
                    ))}
                  </div>
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
    </>
  );
}
