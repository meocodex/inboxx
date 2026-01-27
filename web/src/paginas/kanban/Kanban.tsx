import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Kanban as KanbanIcon, ArrowLeft } from 'lucide-react';
import { kanbanServico } from '@/servicos';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
import { ColunaKanban } from '@/componentes/kanban/ColunaKanban';
import type { QuadroResumo, Cartao } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const quadroSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.string().optional(),
});

const cartaoSchema = z.object({
  titulo: z.string().min(2, 'Titulo deve ter no minimo 2 caracteres'),
  descricao: z.string().optional(),
  valor: z.coerce.number().min(0).optional(),
});

type QuadroForm = z.infer<typeof quadroSchema>;
type CartaoForm = z.infer<typeof cartaoSchema>;

// =============================================================================
// Componente Lista de Quadros
// =============================================================================

interface ListaQuadrosProps {
  quadros: QuadroResumo[];
  carregando: boolean;
  onSelecionar: (id: string) => void;
  onNovo: () => void;
}

function ListaQuadros({ quadros, carregando, onSelecionar, onNovo }: ListaQuadrosProps) {
  if (carregando) {
    return (
      <div className="flex justify-center py-12">
        <Carregando tamanho="lg" texto="Carregando quadros..." />
      </div>
    );
  }

  if (quadros.length === 0) {
    return (
      <Vazio
        icone={<KanbanIcon className="h-16 w-16" />}
        titulo="Nenhum quadro"
        descricao="Crie seu primeiro quadro kanban"
        acao={
          <Button onClick={onNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Quadro
          </Button>
        }
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {quadros.map((quadro) => (
        <Card
          key={quadro.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onSelecionar(quadro.id)}
        >
          <CardHeader>
            <CardTitle className="text-lg">{quadro.nome}</CardTitle>
          </CardHeader>
          <CardContent>
            {quadro.descricao && (
              <p className="text-sm text-muted-foreground mb-2">{quadro.descricao}</p>
            )}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{quadro.totalColunas} colunas</span>
              <span>{quadro.totalCartoes} cartoes</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Kanban() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [quadroSelecionadoId, setQuadroSelecionadoId] = useState<string | null>(null);
  const [modalQuadro, setModalQuadro] = useState(false);
  const [modalCartao, setModalCartao] = useState<{ colunaId: string } | null>(null);
  const [cartaoEditando, setCartaoEditando] = useState<Cartao | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const { data: quadros, isLoading: carregandoQuadros } = useQuery({
    queryKey: ['kanban', 'quadros'],
    queryFn: kanbanServico.listarQuadros,
  });

  const { data: quadroAtual, isLoading: carregandoQuadro } = useQuery({
    queryKey: ['kanban', 'quadro', quadroSelecionadoId],
    queryFn: () => kanbanServico.obterQuadro(quadroSelecionadoId!),
    enabled: !!quadroSelecionadoId,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarQuadroMutation = useMutation({
    mutationFn: kanbanServico.criarQuadro,
    onSuccess: (quadro) => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadros'] });
      mostrarSucesso('Quadro criado', 'O quadro foi criado com sucesso');
      setModalQuadro(false);
      setQuadroSelecionadoId(quadro.id);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o quadro'),
  });

  const criarCartaoMutation = useMutation({
    mutationFn: ({ colunaId, dados }: { colunaId: string; dados: CartaoForm }) =>
      kanbanServico.criarCartao(colunaId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
      mostrarSucesso('Cartao criado', 'O cartao foi criado com sucesso');
      setModalCartao(null);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o cartao'),
  });

  const atualizarCartaoMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: CartaoForm }) =>
      kanbanServico.atualizarCartao(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
      mostrarSucesso('Cartao atualizado', 'O cartao foi atualizado');
      setCartaoEditando(null);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar o cartao'),
  });

  const moverCartaoMutation = useMutation({
    mutationFn: ({ cartaoId, colunaDestinoId, ordem }: { cartaoId: string; colunaDestinoId: string; ordem: number }) =>
      kanbanServico.moverCartao(cartaoId, { colunaDestinoId, ordem }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel mover o cartao'),
  });

  const excluirCartaoMutation = useMutation({
    mutationFn: kanbanServico.excluirCartao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
      mostrarSucesso('Cartao excluido', 'O cartao foi excluido');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir o cartao'),
  });

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  const quadroForm = useForm<QuadroForm>({
    resolver: zodResolver(quadroSchema),
    defaultValues: { nome: '', descricao: '' },
  });

  const cartaoForm = useForm<CartaoForm>({
    resolver: zodResolver(cartaoSchema),
    defaultValues: { titulo: '', descricao: '', valor: 0 },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleCriarQuadro = (dados: QuadroForm) => {
    criarQuadroMutation.mutate(dados);
  };

  const handleCriarCartao = (dados: CartaoForm) => {
    if (modalCartao) {
      criarCartaoMutation.mutate({ colunaId: modalCartao.colunaId, dados });
    }
  };

  const handleAtualizarCartao = (dados: CartaoForm) => {
    if (cartaoEditando) {
      atualizarCartaoMutation.mutate({ id: cartaoEditando.id, dados });
    }
  };

  const handleDropCartao = useCallback((cartaoId: string, colunaDestinoId: string, ordem: number) => {
    moverCartaoMutation.mutate({ cartaoId, colunaDestinoId, ordem });
  }, [moverCartaoMutation]);

  const handleEditarCartao = useCallback((cartao: Cartao) => {
    setCartaoEditando(cartao);
    cartaoForm.reset({
      titulo: cartao.titulo,
      descricao: cartao.descricao || '',
      valor: cartao.valor || 0,
    });
  }, [cartaoForm]);

  // ---------------------------------------------------------------------------
  // Render - Visualização do Quadro
  // ---------------------------------------------------------------------------
  if (quadroSelecionadoId) {
    if (carregandoQuadro) {
      return (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando quadro..." />
        </div>
      );
    }

    if (!quadroAtual) {
      return <ErroMensagem titulo="Erro" mensagem="Quadro nao encontrado" />;
    }

    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setQuadroSelecionadoId(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quadroAtual.nome}</h1>
            {quadroAtual.descricao && (
              <p className="text-muted-foreground">{quadroAtual.descricao}</p>
            )}
          </div>
        </div>

        {/* Colunas */}
        <ScrollArea className="w-full">
          <div className="flex gap-4 pb-4 min-h-[500px]">
            {quadroAtual.colunas
              .sort((a, b) => a.ordem - b.ordem)
              .map((coluna) => (
                <ColunaKanban
                  key={coluna.id}
                  coluna={coluna}
                  onAdicionarCartao={(colunaId) => {
                    setModalCartao({ colunaId });
                    cartaoForm.reset({ titulo: '', descricao: '', valor: 0 });
                  }}
                  onEditarCartao={handleEditarCartao}
                  onExcluirCartao={(id) => excluirCartaoMutation.mutate(id)}
                  onEditarColuna={() => {}}
                  onExcluirColuna={() => {}}
                  onDropCartao={handleDropCartao}
                />
              ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Modal Cartão */}
        {(modalCartao || cartaoEditando) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>{cartaoEditando ? 'Editar Cartao' : 'Novo Cartao'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={cartaoForm.handleSubmit(cartaoEditando ? handleAtualizarCartao : handleCriarCartao)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="titulo">Titulo *</Label>
                    <Input id="titulo" {...cartaoForm.register('titulo')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descricao</Label>
                    <Input id="descricao" {...cartaoForm.register('descricao')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input id="valor" type="number" step="0.01" {...cartaoForm.register('valor')} />
                  </div>
                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setModalCartao(null);
                        setCartaoEditando(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">
                      {cartaoEditando ? 'Salvar' : 'Criar'}
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

  // ---------------------------------------------------------------------------
  // Render - Lista de Quadros
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kanban</h1>
          <p className="text-muted-foreground">Gerencie seus pipelines de vendas</p>
        </div>
        <Button onClick={() => setModalQuadro(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Quadro
        </Button>
      </div>

      <ListaQuadros
        quadros={quadros || []}
        carregando={carregandoQuadros}
        onSelecionar={setQuadroSelecionadoId}
        onNovo={() => setModalQuadro(true)}
      />

      {/* Modal Quadro */}
      {modalQuadro && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Novo Quadro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={quadroForm.handleSubmit(handleCriarQuadro)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...quadroForm.register('nome')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="descricao">Descricao</Label>
                  <Input id="descricao" {...quadroForm.register('descricao')} />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setModalQuadro(false)}>
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
