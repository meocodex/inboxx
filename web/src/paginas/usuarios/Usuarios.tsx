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
  MoreHorizontal,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { usuariosServico, perfisServico, equipesServico } from '@/servicos';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Badge } from '@/componentes/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Avatar, AvatarFallback } from '@/componentes/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
import type { Usuario } from '@/tipos';

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
// Componente Card Usuário
// =============================================================================

interface CardUsuarioProps {
  usuario: Usuario;
  onEditar: (usuario: Usuario) => void;
  onAlterarStatus: (id: string, ativo: boolean) => void;
  onExcluir: (id: string) => void;
}

function CardUsuario({ usuario, onEditar, onAlterarStatus, onExcluir }: CardUsuarioProps) {
  const iniciais = usuario.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className={!usuario.ativo ? 'opacity-60' : ''}>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback>{iniciais}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{usuario.nome}</p>
            {!usuario.ativo && (
              <Badge variant="secondary">Inativo</Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground truncate">{usuario.email}</p>
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
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEditar(usuario)}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            {usuario.ativo ? (
              <DropdownMenuItem onClick={() => onAlterarStatus(usuario.id, false)}>
                <UserX className="mr-2 h-4 w-4 text-orange-500" />
                Desativar
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onAlterarStatus(usuario.id, true)}>
                <UserCheck className="mr-2 h-4 w-4 text-green-500" />
                Ativar
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onExcluir(usuario.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Usuarios() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [busca, setBusca] = useState('');

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
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar usuarios"
        mensagem="Nao foi possivel carregar a lista"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  const usuarios = usuariosData?.dados || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gerencie os usuarios do sistema</p>
        </div>
        <Button onClick={abrirCriar}>
          <UserPlus className="mr-2 h-4 w-4" />
          Novo Usuario
        </Button>
      </div>

      {/* Busca */}
      <div className="max-w-sm">
        <Input
          placeholder="Buscar por nome ou email..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando usuarios..." />
        </div>
      ) : usuarios.length === 0 ? (
        <Vazio
          icone={<Users className="h-16 w-16" />}
          titulo="Nenhum usuario"
          descricao={busca ? 'Nenhum usuario encontrado' : 'Crie o primeiro usuario'}
          acao={
            !busca && (
              <Button onClick={abrirCriar}>
                <UserPlus className="mr-2 h-4 w-4" />
                Novo Usuario
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {usuarios.map((usuario) => (
            <CardUsuario
              key={usuario.id}
              usuario={usuario}
              onEditar={abrirEditar}
              onAlterarStatus={(id, ativo) => alterarStatusMutation.mutate({ id, ativo })}
              onExcluir={(id) => excluirMutation.mutate(id)}
            />
          ))}
        </div>
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
                    {perfis?.map((perfil) => (
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
                    {equipes?.map((equipe) => (
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
    </div>
  );
}
