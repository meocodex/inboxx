import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Search,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  User,
  Pencil,
  Trash2,
} from 'lucide-react';
import { contatosServico, etiquetasServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarTelefone, formatarData } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Badge } from '@/componentes/ui/badge';
import { Avatar, AvatarFallback } from '@/componentes/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';
import type { Contato } from '@/tipos';

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
// Componente Card de Contato
// =============================================================================

interface CardContatoProps {
  contato: Contato;
  onEditar: (contato: Contato) => void;
  onExcluir: (id: string) => void;
}

function CardContato({ contato, onEditar, onExcluir }: CardContatoProps) {
  const iniciais = contato.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary">
                {iniciais}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{contato.nome}</h3>
              {contato.telefone && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {formatarTelefone(contato.telefone)}
                </p>
              )}
              {contato.email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {contato.email}
                </p>
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
              <DropdownMenuItem onClick={() => onEditar(contato)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExcluir(contato.id)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Etiquetas */}
        {contato.etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contato.etiquetas.map((etiqueta) => (
              <Badge
                key={etiqueta.id}
                variant="outline"
                style={{ borderColor: etiqueta.cor, color: etiqueta.cor }}
              >
                {etiqueta.nome}
              </Badge>
            ))}
          </div>
        )}

        <p className="text-xs text-muted-foreground mt-3">
          Criado em {formatarData(contato.criadoEm)}
        </p>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Contatos() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [busca, setBusca] = useState('');
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

  // Etiquetas (para uso futuro)
  useQuery({
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

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar contatos"
        mensagem="Nao foi possivel carregar a lista de contatos"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  const contatos = contatosData?.dados || [];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-muted-foreground">Gerencie seus contatos</p>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Busca */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou email..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando contatos..." />
        </div>
      ) : contatos.length === 0 ? (
        <Vazio
          icone={<User className="h-16 w-16" />}
          titulo={busca ? 'Nenhum contato encontrado' : 'Nenhum contato'}
          descricao={busca ? 'Tente outra busca' : 'Crie seu primeiro contato'}
          acao={
            !busca && (
              <Button onClick={handleNovo}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Contato
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {contatos.map((contato) => (
            <CardContato
              key={contato.id}
              contato={contato}
              onEditar={handleEditar}
              onExcluir={(id) => excluirMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal (simplificado como card) */}
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
    </div>
  );
}
