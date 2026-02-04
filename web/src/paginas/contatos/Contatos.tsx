import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Phone,
  Mail,
  User,
  Pencil,
  Trash2,
  Users,
  Tag,
  Star,
  Clock,
} from 'lucide-react';
import { contatosServico, etiquetasServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarTelefone } from '@/utilitarios/formatadores';
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
  SeparadorSidebar,
  BuscaSidebar,
  CardItem,
  CardItemAvatar,
  GridCards,
  EmptyState,
  LoadingState,
} from '@/componentes/layout';
import type { Contato, Etiqueta } from '@/tipos';

// =============================================================================
// Schema
// =============================================================================

const contatoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  telefone: z.string().optional(),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
});

type ContatoForm = z.infer<typeof contatoSchema>;

// =============================================================================
// Tipos
// =============================================================================

type FiltroContato = 'todos' | 'ativos' | 'inativos' | 'favoritos' | 'recentes';

// =============================================================================
// Componente Principal
// =============================================================================

export default function Contatos() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroContato>('todos');
  const [etiquetaSelecionada, setEtiquetaSelecionada] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [contatoEditando, setContatoEditando] = useState<Contato | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const {
    data: contatosData,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['contatos', busca],
    queryFn: () => contatosServico.listar({ busca: busca || undefined, limite: 50 }),
  });

  const { data: etiquetasData } = useQuery({
    queryKey: ['etiquetas'],
    queryFn: etiquetasServico.listar,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: contatosServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      mostrarSucesso('Contato criado', 'O contato foi criado com sucesso');
      setModalAberto(false);
    },
    onError: () => {
      mostrarErro('Erro', 'Nao foi possivel criar o contato');
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: ContatoForm }) =>
      contatosServico.atualizar(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      mostrarSucesso('Contato atualizado', 'O contato foi atualizado com sucesso');
      setContatoEditando(null);
    },
    onError: () => {
      mostrarErro('Erro', 'Nao foi possivel atualizar o contato');
    },
  });

  const excluirMutation = useMutation({
    mutationFn: contatosServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contatos'] });
      mostrarSucesso('Contato excluido', 'O contato foi excluido com sucesso');
    },
    onError: () => {
      mostrarErro('Erro', 'Nao foi possivel excluir o contato');
    },
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContatoForm>({
    resolver: zodResolver(contatoSchema),
  });

  const onSubmit = (dados: ContatoForm) => {
    if (contatoEditando) {
      atualizarMutation.mutate({ id: contatoEditando.id, dados });
    } else {
      criarMutation.mutate(dados);
    }
  };

  const handleEditar = (contato: Contato) => {
    setContatoEditando(contato);
    reset({
      nome: contato.nome,
      telefone: contato.telefone || '',
      email: contato.email || '',
    });
  };

  const handleNovo = () => {
    setContatoEditando(null);
    reset({ nome: '', telefone: '', email: '' });
    setModalAberto(true);
  };

  const contatos = contatosData?.dados || [];
  const etiquetas: Etiqueta[] = etiquetasData || [];

  // Filtrar contatos
  const contatosFiltrados = contatos.filter((contato) => {
    if (etiquetaSelecionada) {
      return contato.etiquetas.some((e) => e.id === etiquetaSelecionada);
    }
    return true;
  });

  // Contadores
  const contadores = {
    todos: contatos.length,
    ativos: contatos.filter((c) => c.ativo).length,
    inativos: contatos.filter((c) => !c.ativo).length,
    favoritos: 0,
    recentes: contatos.slice(0, 10).length,
  };

  return (
    <PageLayout
      titulo="Contatos"
      subtitulo="Gerencie seus contatos"
      icone={<Users className="h-5 w-5" />}
      acoes={
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      }
      sidebarWidth="sm"
      sidebar={
        <>
          <CabecalhoSidebar
            titulo="Contatos"
            subtitulo={`${contatos.length} contatos`}
            acoes={
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleNovo}>
                <Plus className="h-4 w-4" />
              </Button>
            }
          />

          <BuscaSidebar
            valor={busca}
            onChange={setBusca}
            placeholder="Buscar contatos..."
          />

          <SecaoSidebar titulo="Filtros">
            <ItemSidebar
              icone={<Users className="h-4 w-4" />}
              label="Todos"
              badge={contadores.todos}
              ativo={filtroAtivo === 'todos'}
              onClick={() => setFiltroAtivo('todos')}
            />
            <ItemSidebar
              icone={<User className="h-4 w-4" />}
              label="Ativos"
              badge={contadores.ativos}
              ativo={filtroAtivo === 'ativos'}
              onClick={() => setFiltroAtivo('ativos')}
            />
            <ItemSidebar
              icone={<User className="h-4 w-4" />}
              label="Inativos"
              badge={contadores.inativos}
              ativo={filtroAtivo === 'inativos'}
              onClick={() => setFiltroAtivo('inativos')}
            />
            <ItemSidebar
              icone={<Star className="h-4 w-4" />}
              label="Favoritos"
              badge={contadores.favoritos}
              ativo={filtroAtivo === 'favoritos'}
              onClick={() => setFiltroAtivo('favoritos')}
            />
            <ItemSidebar
              icone={<Clock className="h-4 w-4" />}
              label="Recentes"
              badge={contadores.recentes}
              ativo={filtroAtivo === 'recentes'}
              onClick={() => setFiltroAtivo('recentes')}
            />
          </SecaoSidebar>

          <SeparadorSidebar />

          <SecaoSidebar titulo="Etiquetas">
            <ItemSidebar
              icone={<Tag className="h-4 w-4" />}
              label="Todas as etiquetas"
              ativo={etiquetaSelecionada === null}
              onClick={() => setEtiquetaSelecionada(null)}
            />
            {etiquetas.map((etiqueta) => (
              <ItemSidebar
                key={etiqueta.id}
                icone={
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: etiqueta.cor }}
                  />
                }
                label={etiqueta.nome}
                ativo={etiquetaSelecionada === etiqueta.id}
                onClick={() => setEtiquetaSelecionada(etiqueta.id)}
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
          title="Erro ao carregar contatos"
          description="Não foi possível carregar a lista de contatos"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando contatos..." />
      ) : contatosFiltrados.length === 0 ? (
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
            title="Nenhum contato"
            description="Crie seu primeiro contato para começar"
            icon={<User className="h-16 w-16" />}
            primaryAction={{ label: 'Novo Contato', onClick: handleNovo }}
          />
        )
      ) : (
            <GridCards colunas={3}>
              {contatosFiltrados.map((contato) => (
                <CardItem
                  key={contato.id}
                  acoes={[
                    {
                      label: 'Editar',
                      icone: <Pencil className="h-4 w-4" />,
                      onClick: () => handleEditar(contato),
                    },
                    {
                      label: 'Excluir',
                      icone: <Trash2 className="h-4 w-4" />,
                      onClick: () => excluirMutation.mutate(contato.id),
                      variante: 'destructive',
                    },
                  ]}
                >
                  <CardItemAvatar
                    nome={contato.nome}
                    subtitulo={
                      contato.telefone
                        ? formatarTelefone(contato.telefone)
                        : contato.email || undefined
                    }
                    meta={
                      <div className="flex flex-col gap-2">
                        {contato.telefone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            <span>{formatarTelefone(contato.telefone)}</span>
                          </div>
                        )}
                        {contato.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            <span>{contato.email}</span>
                          </div>
                        )}
                        {contato.etiquetas.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {contato.etiquetas.map((etiqueta) => (
                              <Badge
                                key={etiqueta.id}
                                variant="outline"
                                className="text-[10px] px-1.5 py-0"
                                style={{ borderColor: etiqueta.cor, color: etiqueta.cor }}
                              >
                                {etiqueta.nome}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    }
                  />
                </CardItem>
              ))}
            </GridCards>
          )}

      {/* Form Modal */}
      {(modalAberto || contatoEditando) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>
                {contatoEditando ? 'Editar Contato' : 'Novo Contato'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...register('nome')} />
                  {errors.nome && (
                    <p className="text-xs text-destructive">{errors.nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input id="telefone" {...register('telefone')} placeholder="+55 11 99999-9999" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" {...register('email')} />
                  {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setModalAberto(false);
                      setContatoEditando(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={criarMutation.isPending || atualizarMutation.isPending}
                  >
                    {contatoEditando ? 'Salvar' : 'Criar'}
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
