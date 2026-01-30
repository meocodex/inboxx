import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Kanban as KanbanIcon, ArrowLeft, Layout } from 'lucide-react';
import { kanbanServico } from '@/servicos';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { ScrollArea, ScrollBar } from '@/componentes/ui/scroll-area';
import {
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  CabecalhoPagina,
  GridCards,
  EstadoVazio,
  EstadoCarregando,
  EstadoErro,
} from '@/componentes/layout';
import { ColunaKanban } from '@/componentes/kanban/ColunaKanban';
import type { Cartao } from '@/tipos';

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
  const {
    data: quadros,
    isLoading: carregandoQuadros,
    error: erroQuadros,
    refetch: recarregar,
  } = useQuery({
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
      kanbanServico.criarCartao(quadroSelecionadoId!, colunaId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
      mostrarSucesso('Cartao criado', 'O cartao foi criado com sucesso');
      setModalCartao(null);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o cartao'),
  });

  const atualizarCartaoMutation = useMutation({
    mutationFn: ({ id, colunaId, dados }: { id: string; colunaId: string; dados: CartaoForm }) =>
      kanbanServico.atualizarCartao(quadroSelecionadoId!, colunaId, id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
      mostrarSucesso('Cartao atualizado', 'O cartao foi atualizado');
      setCartaoEditando(null);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar o cartao'),
  });

  const moverCartaoMutation = useMutation({
    mutationFn: ({ cartaoId, colunaOrigemId, colunaDestinoId, ordem }: { cartaoId: string; colunaOrigemId: string; colunaDestinoId: string; ordem: number }) =>
      kanbanServico.moverCartao(quadroSelecionadoId!, colunaOrigemId, cartaoId, { colunaDestinoId, ordem }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'quadro', quadroSelecionadoId] });
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel mover o cartao'),
  });

  const excluirCartaoMutation = useMutation({
    mutationFn: ({ cartaoId, colunaId }: { cartaoId: string; colunaId: string }) =>
      kanbanServico.excluirCartao(quadroSelecionadoId!, colunaId, cartaoId),
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
      atualizarCartaoMutation.mutate({ id: cartaoEditando.id, colunaId: cartaoEditando.colunaId, dados });
    }
  };

  const handleDropCartao = useCallback((cartaoId: string, colunaDestinoId: string, ordem: number) => {
    const colunaOrigemId = quadroAtual?.colunas.find(
      col => col.cartoes.some(c => c.id === cartaoId)
    )?.id || colunaDestinoId;
    moverCartaoMutation.mutate({ cartaoId, colunaOrigemId, colunaDestinoId, ordem });
  }, [moverCartaoMutation, quadroAtual]);

  const handleEditarCartao = useCallback((cartao: Cartao) => {
    setCartaoEditando(cartao);
    cartaoForm.reset({
      titulo: cartao.titulo,
      descricao: cartao.descricao || '',
      valor: cartao.valor || 0,
    });
  }, [cartaoForm]);

  // ---------------------------------------------------------------------------
  // Erro
  // ---------------------------------------------------------------------------
  if (erroQuadros) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center">
          <EstadoErro
            titulo="Erro ao carregar quadros"
            mensagem="Nao foi possivel carregar os quadros"
            onTentarNovamente={() => recarregar()}
          />
        </div>
      </div>
    );
  }

  const listaQuadros = quadros || [];

  return (
    <div className="flex h-full">
      {/* Sidebar Secundaria - Lista de Quadros */}
      <SidebarSecundaria largura="sm">
        <CabecalhoSidebar
          titulo="Kanban"
          subtitulo={`${listaQuadros.length} quadros`}
          acoes={
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setModalQuadro(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />

        <SecaoSidebar titulo="Quadros">
          {carregandoQuadros ? (
            <div className="p-4">
              <EstadoCarregando />
            </div>
          ) : listaQuadros.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum quadro criado
            </div>
          ) : (
            listaQuadros.map((quadro) => (
              <ItemSidebar
                key={quadro.id}
                icone={<Layout className="h-4 w-4" />}
                label={quadro.nome}
                badge={quadro.totalCartoes}
                ativo={quadroSelecionadoId === quadro.id}
                onClick={() => setQuadroSelecionadoId(quadro.id)}
              />
            ))
          )}
        </SecaoSidebar>
      </SidebarSecundaria>

      {/* Conteudo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {quadroSelecionadoId && quadroAtual ? (
          <>
            <CabecalhoPagina
              titulo={quadroAtual.nome}
              subtitulo={quadroAtual.descricao || 'Pipeline de vendas'}
              icone={<KanbanIcon className="h-5 w-5" />}
              acoes={
                <Button variant="outline" size="sm" onClick={() => setQuadroSelecionadoId(null)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
              }
            />

            {/* Colunas do Kanban */}
            <div className="flex-1 overflow-auto p-4">
              {carregandoQuadro ? (
                <EstadoCarregando texto="Carregando quadro..." />
              ) : (
                <ScrollArea className="w-full h-full">
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
                          onExcluirCartao={(cartaoId) => excluirCartaoMutation.mutate({ cartaoId, colunaId: coluna.id })}
                          onEditarColuna={() => {}}
                          onExcluirColuna={() => {}}
                          onDropCartao={handleDropCartao}
                        />
                      ))}
                  </div>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              )}
            </div>
          </>
        ) : (
          <>
            <CabecalhoPagina
              titulo="Kanban"
              subtitulo="Gerencie seus pipelines de vendas"
              icone={<KanbanIcon className="h-5 w-5" />}
              acoes={
                <Button onClick={() => setModalQuadro(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Quadro
                </Button>
              }
            />

            {/* Lista de Quadros */}
            <div className="flex-1 overflow-auto p-6">
              {carregandoQuadros ? (
                <EstadoCarregando texto="Carregando quadros..." />
              ) : listaQuadros.length === 0 ? (
                <EstadoVazio
                  titulo="Nenhum quadro"
                  descricao="Crie seu primeiro quadro kanban para gerenciar vendas"
                  icone={<KanbanIcon className="h-16 w-16" />}
                  acao={{ label: 'Novo Quadro', onClick: () => setModalQuadro(true) }}
                />
              ) : (
                <GridCards colunas={3}>
                  {listaQuadros.map((quadro) => (
                    <Card
                      key={quadro.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => setQuadroSelecionadoId(quadro.id)}
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
                </GridCards>
              )}
            </div>
          </>
        )}
      </div>

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

      {/* Modal Cartao */}
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
