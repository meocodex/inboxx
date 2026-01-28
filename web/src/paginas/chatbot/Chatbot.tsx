import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  MoreHorizontal,
} from 'lucide-react';
import { chatbotServico } from '@/servicos/chatbot.servico';
import { useToast } from '@/hooks';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
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
import type { FluxoResumo, StatusFluxo } from '@/tipos';

// =============================================================================
// Schemas
// =============================================================================

const fluxoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  descricao: z.string().optional(),
  gatilho: z.string().min(1, 'Gatilho obrigatorio'),
});

type FluxoForm = z.infer<typeof fluxoSchema>;

// =============================================================================
// Configuração de Status
// =============================================================================

const statusConfig: Record<StatusFluxo, { label: string; variant: 'default' | 'secondary' | 'success' }> = {
  RASCUNHO: { label: 'Rascunho', variant: 'secondary' },
  ATIVO: { label: 'Ativo', variant: 'success' },
  INATIVO: { label: 'Inativo', variant: 'default' },
};

// =============================================================================
// Componente Card Fluxo
// =============================================================================

interface CardFluxoProps {
  fluxo: FluxoResumo;
  onAtivar: (id: string) => void;
  onDesativar: (id: string) => void;
  onEditar: (fluxo: FluxoResumo) => void;
  onExcluir: (id: string) => void;
}

function CardFluxo({ fluxo, onAtivar, onDesativar, onEditar, onExcluir }: CardFluxoProps) {
  const config = statusConfig[fluxo.status];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{fluxo.nome}</CardTitle>
              <Badge variant={config.variant} className="mt-1">
                {config.label}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditar(fluxo)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              {fluxo.status !== 'ATIVO' && (
                <DropdownMenuItem onClick={() => onAtivar(fluxo.id)}>
                  <Play className="mr-2 h-4 w-4" />
                  Ativar
                </DropdownMenuItem>
              )}
              {fluxo.status === 'ATIVO' && (
                <DropdownMenuItem onClick={() => onDesativar(fluxo.id)}>
                  <Pause className="mr-2 h-4 w-4" />
                  Desativar
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onExcluir(fluxo.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {fluxo.descricao && (
          <p className="text-sm text-muted-foreground mb-4">{fluxo.descricao}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <GitBranch className="h-4 w-4" />
            {fluxo.totalNos} nos
          </div>
          <div>Gatilho: {fluxo.gatilho}</div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Chatbot() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<FluxoResumo | null>(null);

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
    mutationFn: ({ id, dados }: { id: string; dados: FluxoForm }) =>
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
    defaultValues: { nome: '', descricao: '', gatilho: '' },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const abrirCriar = () => {
    setEditando(null);
    form.reset({ nome: '', descricao: '', gatilho: '' });
    setModalAberto(true);
  };

  const abrirEditar = (fluxo: FluxoResumo) => {
    setEditando(fluxo);
    form.reset({ nome: fluxo.nome, descricao: fluxo.descricao || '', gatilho: fluxo.gatilho });
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setEditando(null);
  };

  const handleSubmit = (dados: FluxoForm) => {
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
        titulo="Erro ao carregar fluxos"
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
          <h1 className="text-2xl font-bold">Chatbot</h1>
          <p className="text-muted-foreground">Gerencie seus fluxos de automacao</p>
        </div>
        <Button onClick={abrirCriar}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Fluxo
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando fluxos..." />
        </div>
      ) : !fluxos || fluxos.length === 0 ? (
        <Vazio
          icone={<Bot className="h-16 w-16" />}
          titulo="Nenhum fluxo"
          descricao="Crie seu primeiro fluxo de automacao"
          acao={
            <Button onClick={abrirCriar}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fluxo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fluxos.map((fluxo) => (
            <CardFluxo
              key={fluxo.id}
              fluxo={fluxo}
              onAtivar={(id) => ativarMutation.mutate(id)}
              onDesativar={(id) => desativarMutation.mutate(id)}
              onEditar={abrirEditar}
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
                  <Label htmlFor="gatilho">Gatilho *</Label>
                  <Input
                    id="gatilho"
                    placeholder="Ex: #menu, oi, bom dia"
                    {...form.register('gatilho')}
                  />
                  <p className="text-xs text-muted-foreground">
                    Palavra-chave que inicia este fluxo
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
    </div>
  );
}
