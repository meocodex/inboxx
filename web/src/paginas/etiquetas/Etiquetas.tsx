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
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
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
// Cores Pré-definidas
// =============================================================================

const CORES_PREDEFINIDAS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308',
  '#84cc16', '#22c55e', '#14b8a6', '#06b6d4',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

// =============================================================================
// Componente Principal
// =============================================================================

export default function Etiquetas() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Etiqueta | null>(null);

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
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar etiquetas"
        mensagem="Nao foi possivel carregar a lista"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Etiquetas</h1>
          <p className="text-muted-foreground">Organize seus contatos com etiquetas</p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Etiqueta
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando etiquetas..." />
        </div>
      ) : !etiquetas || etiquetas.length === 0 ? (
        <Vazio
          icone={<Tag className="h-16 w-16" />}
          titulo="Nenhuma etiqueta"
          descricao="Crie sua primeira etiqueta"
          acao={
            <Button onClick={abrirCriar}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Etiqueta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {etiquetas.map((etiqueta) => (
            <Card key={etiqueta.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: etiqueta.cor }}
                  />
                  <span className="font-medium">{etiqueta.nome}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => abrirEditar(etiqueta)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => excluirMutation.mutate(etiqueta.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
