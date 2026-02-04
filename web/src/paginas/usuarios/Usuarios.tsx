import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Users,
  UserPlus,
  Pencil,
  Trash2,
  Shield,
  UserCheck,
  UserX,
  User,
  UsersRound,
} from 'lucide-react';
import { usuariosServico, perfisServico, equipesServico } from '@/servicos';
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
  SeparadorSidebar,
  BuscaSidebar,
  CardItem,
  CardItemAvatar,
  GridCards,
  EmptyState,
  LoadingState,
} from '@/componentes/layout';
import type { Usuario, Perfil, Equipe } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const usuarioSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  email: z.string().email('Email invalido'),
  senha: z.string().min(6, 'Senha deve ter no minimo 6 caracteres').optional(),
  perfilId: z.string().min(1, 'Selecione um perfil'),
  equipeId: z.string().optional(),
});

type UsuarioForm = z.infer<typeof usuarioSchema>;

// =============================================================================
// Tipos
// =============================================================================

type FiltroUsuario = 'todos' | 'ativos' | 'inativos';

// =============================================================================
// Componente Principal
// =============================================================================

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<FiltroUsuario>('todos');
  const [perfilSelecionado, setPerfilSelecionado] = useState<string | null>(null);
  const [equipeSelecionada, setEquipeSelecionada] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const {
    data: usuariosData,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['usuarios', busca],
    queryFn: () => usuariosServico.listar({ busca: busca || undefined }),
  });

  const { data: perfis } = useQuery({
    queryKey: ['perfis'],
    queryFn: perfisServico.listar,
  });

  const { data: equipes } = useQuery({
    queryKey: ['equipes'],
    queryFn: equipesServico.listar,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: usuariosServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      mostrarSucesso('Usuario criado', 'O usuario foi criado com sucesso');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar o usuario'),
  });

  const atualizarMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: UsuarioForm }) =>
      usuariosServico.atualizar(id, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      mostrarSucesso('Usuario atualizado', 'O usuario foi atualizado');
      fecharModal();
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel atualizar'),
  });

  const alterarStatusMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: string; ativo: boolean }) =>
      usuariosServico.alterarStatus(id, ativo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      mostrarSucesso('Status alterado', 'O status foi atualizado');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel alterar o status'),
  });

  const excluirMutation = useMutation({
    mutationFn: usuariosServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      mostrarSucesso('Usuario excluido', 'O usuario foi removido');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir'),
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<UsuarioForm>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: {
      nome: '',
      email: '',
      senha: '',
      perfilId: '',
      equipeId: '',
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const abrirCriar = () => {
    setEditando(null);
    form.reset({ nome: '', email: '', senha: '', perfilId: '', equipeId: '' });
    setModalAberto(true);
  };

  const abrirEditar = (usuario: Usuario) => {
    setEditando(usuario);
    form.reset({
      nome: usuario.nome,
      email: usuario.email,
      senha: '',
      perfilId: usuario.perfilId,
      equipeId: usuario.equipeId || '',
    });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = (dados: UsuarioForm) => {
    const payload = {
      ...dados,
      equipeId: dados.equipeId || undefined,
      senha: dados.senha || undefined,
    };

    if (editando) {
      atualizarMutation.mutate({ id: editando.id, dados: payload });
    } else {
      if (!dados.senha) {
        mostrarErro('Erro', 'Senha obrigatoria para novo usuario');
        return;
      }
      criarMutation.mutate({ ...payload, senha: dados.senha });
    }
  };

  // ---------------------------------------------------------------------------
  // Erro
  const usuarios = usuariosData?.dados || [];
  const listaPerfis: Perfil[] = perfis || [];
  const listaEquipes: Equipe[] = equipes || [];

  // Filtrar usuarios
  const usuariosFiltrados = usuarios.filter((usuario) => {
    if (filtroAtivo === 'ativos' && !usuario.ativo) return false;
    if (filtroAtivo === 'inativos' && usuario.ativo) return false;
    if (perfilSelecionado && usuario.perfilId !== perfilSelecionado) return false;
    if (equipeSelecionada && usuario.equipeId !== equipeSelecionada) return false;
    return true;
  });

  // Contadores
  const contadores = {
    todos: usuarios.length,
    ativos: usuarios.filter((u) => u.ativo).length,
    inativos: usuarios.filter((u) => !u.ativo).length,
  };

  return (
    <PageLayout
      titulo="Usuarios"
      subtitulo="Gerencie os usuarios do sistema"
      icone={<Users className="h-5 w-5" />}
      acoes={
        <Button onClick={abrirCriar}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      }
      sidebarWidth="sm"
      sidebar={
        <>
          <CabecalhoSidebar
            titulo="Usuarios"
            subtitulo={`${usuarios.length} usuarios`}
            acoes={
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={abrirCriar}>
                <UserPlus className="h-4 w-4" />
              </Button>
            }
          />

          <BuscaSidebar
            valor={busca}
            onChange={setBusca}
            placeholder="Buscar usuarios..."
          />

          <SecaoSidebar titulo="Status">
            <ItemSidebar
              icone={<Users className="h-4 w-4" />}
              label="Todos"
              badge={contadores.todos}
              ativo={filtroAtivo === 'todos'}
              onClick={() => setFiltroAtivo('todos')}
            />
            <ItemSidebar
              icone={<UserCheck className="h-4 w-4" />}
              label="Ativos"
              badge={contadores.ativos}
              ativo={filtroAtivo === 'ativos'}
              onClick={() => setFiltroAtivo('ativos')}
            />
            <ItemSidebar
              icone={<UserX className="h-4 w-4" />}
              label="Inativos"
              badge={contadores.inativos}
              ativo={filtroAtivo === 'inativos'}
              onClick={() => setFiltroAtivo('inativos')}
            />
          </SecaoSidebar>

          <SeparadorSidebar />

          <SecaoSidebar titulo="Perfis">
            <ItemSidebar
              icone={<Shield className="h-4 w-4" />}
              label="Todos os perfis"
              ativo={perfilSelecionado === null}
              onClick={() => setPerfilSelecionado(null)}
            />
            {listaPerfis.map((perfil) => (
              <ItemSidebar
                key={perfil.id}
                icone={<Shield className="h-4 w-4" />}
                label={perfil.nome}
                badge={usuarios.filter((u) => u.perfilId === perfil.id).length}
                ativo={perfilSelecionado === perfil.id}
                onClick={() => setPerfilSelecionado(perfil.id)}
              />
            ))}
          </SecaoSidebar>

          <SeparadorSidebar />

          <SecaoSidebar titulo="Equipes">
            <ItemSidebar
              icone={<UsersRound className="h-4 w-4" />}
              label="Todas as equipes"
              ativo={equipeSelecionada === null}
              onClick={() => setEquipeSelecionada(null)}
            />
            {listaEquipes.map((equipe) => (
              <ItemSidebar
                key={equipe.id}
                icone={<UsersRound className="h-4 w-4" />}
                label={equipe.nome}
                badge={usuarios.filter((u) => u.equipeId === equipe.id).length}
                ativo={equipeSelecionada === equipe.id}
                onClick={() => setEquipeSelecionada(equipe.id)}
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
          title="Erro ao carregar usuarios"
          description="Não foi possível carregar a lista"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando usuarios..." />
      ) : usuariosFiltrados.length === 0 ? (
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
            title="Nenhum usuario"
            description="Crie o primeiro usuario do sistema"
            icon={<User className="h-16 w-16" />}
            primaryAction={{ label: 'Novo Usuario', onClick: abrirCriar }}
          />
        )
      ) : (
            <GridCards colunas={2}>
              {usuariosFiltrados.map((usuario) => (
                <CardItem
                  key={usuario.id}
                  className={!usuario.ativo ? 'opacity-60' : ''}
                  acoes={[
                    {
                      label: 'Editar',
                      icone: <Pencil className="h-4 w-4" />,
                      onClick: () => abrirEditar(usuario),
                    },
                    usuario.ativo
                      ? {
                          label: 'Desativar',
                          icone: <UserX className="h-4 w-4" />,
                          onClick: () => alterarStatusMutation.mutate({ id: usuario.id, ativo: false }),
                        }
                      : {
                          label: 'Ativar',
                          icone: <UserCheck className="h-4 w-4" />,
                          onClick: () => alterarStatusMutation.mutate({ id: usuario.id, ativo: true }),
                        },
                    {
                      label: 'Excluir',
                      icone: <Trash2 className="h-4 w-4" />,
                      onClick: () => excluirMutation.mutate(usuario.id),
                      variante: 'destructive',
                    },
                  ]}
                >
                  <CardItemAvatar
                    nome={usuario.nome}
                    subtitulo={usuario.email}
                    badge={!usuario.ativo && <Badge variant="secondary">Inativo</Badge>}
                    meta={
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          <Shield className="mr-1 h-3 w-3" />
                          {usuario.perfil.nome}
                        </Badge>
                        {usuario.equipe && (
                          <Badge variant="outline" className="text-xs">
                            {usuario.equipe.nome}
                          </Badge>
                        )}
                      </div>
                    }
                  />
                </CardItem>
              ))}
            </GridCards>
          )}

      {/* Modal */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{editando ? 'Editar Usuario' : 'Novo Usuario'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" {...form.register('nome')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" {...form.register('email')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="senha">
                    Senha {editando ? '(deixe vazio para manter)' : '*'}
                  </Label>
                  <Input id="senha" type="password" {...form.register('senha')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="perfilId">Perfil *</Label>
                  <select
                    id="perfilId"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    {...form.register('perfilId')}
                  >
                    <option value="">Selecione...</option>
                    {listaPerfis.map((perfil) => (
                      <option key={perfil.id} value={perfil.id}>
                        {perfil.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="equipeId">Equipe</Label>
                  <select
                    id="equipeId"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    {...form.register('equipeId')}
                  >
                    <option value="">Nenhuma</option>
                    {listaEquipes.map((equipe) => (
                      <option key={equipe.id} value={equipe.id}>
                        {equipe.nome}
                      </option>
                    ))}
                  </select>
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
