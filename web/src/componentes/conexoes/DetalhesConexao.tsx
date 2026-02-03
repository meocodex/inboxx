import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Smartphone,
  Instagram,
  Facebook,
  Wifi,
  WifiOff,
  MessageCircle,
  Calendar,
  Send,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Save,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import { Separator } from '@/componentes/ui/separator';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { conexoesServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarData } from '@/utilitarios/formatadores';
import type {
  TipoCanalConexao,
  StatusCanalConexao,
  ProvedorConexao,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Schema de Edição
// =============================================================================

const edicaoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  telefone: z.string().optional(),
  webhook: z.string().url('URL inválida').optional().or(z.literal('')),
});

type EdicaoForm = z.infer<typeof edicaoSchema>;

// =============================================================================
// Configurações
// =============================================================================

const canalConfig: Record<
  TipoCanalConexao,
  { label: string; cor: string; icone: React.ReactNode }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    cor: '#25D366',
    icone: <Smartphone className="h-5 w-5" />,
  },
  INSTAGRAM: {
    label: 'Instagram',
    cor: '#E4405F',
    icone: <Instagram className="h-5 w-5" />,
  },
  FACEBOOK: {
    label: 'Facebook',
    cor: '#1877F2',
    icone: <Facebook className="h-5 w-5" />,
  },
};

const statusConfig: Record<
  StatusCanalConexao,
  {
    label: string;
    variant: 'default' | 'success' | 'warning' | 'destructive';
    icone: React.ReactNode;
  }
> = {
  CONECTADO: {
    label: 'Conectado',
    variant: 'success',
    icone: <CheckCircle className="h-4 w-4" />,
  },
  DESCONECTADO: {
    label: 'Desconectado',
    variant: 'default',
    icone: <XCircle className="h-4 w-4" />,
  },
  AGUARDANDO_QR: {
    label: 'Aguardando QR',
    variant: 'warning',
    icone: <Clock className="h-4 w-4" />,
  },
  ERRO: {
    label: 'Erro',
    variant: 'destructive',
    icone: <AlertCircle className="h-4 w-4" />,
  },
};

const provedorConfig: Record<ProvedorConexao, { label: string }> = {
  META_API: { label: 'Meta Cloud API' },
  UAIZAP: { label: 'UaiZap' },
  GRAPH_API: { label: 'Graph API' },
};

// =============================================================================
// Props
// =============================================================================

interface DetalhesConexaoProps {
  conexaoId: string;
  aberto: boolean;
  onFechar: () => void;
}

// =============================================================================
// Componente
// =============================================================================

export function DetalhesConexao({
  conexaoId,
  aberto,
  onFechar,
}: DetalhesConexaoProps) {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [modoEdicao, setModoEdicao] = useState(false);

  // ---------------------------------------------------------------------------
  // Form de Edição
  // ---------------------------------------------------------------------------
  const form = useForm<EdicaoForm>({
    resolver: zodResolver(edicaoSchema),
    defaultValues: {
      nome: '',
      telefone: '',
      webhook: '',
    },
  });

  // ---------------------------------------------------------------------------
  // Query - Obter detalhes completos
  // ---------------------------------------------------------------------------
  const {
    data: conexao,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['conexoes', conexaoId],
    queryFn: () => conexoesServico.obterPorId(conexaoId),
    enabled: aberto && !!conexaoId,
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const testarMutation = useMutation({
    mutationFn: () => conexoesServico.testar(conexaoId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      if (data.conectado) {
        mostrarSucesso('Conectado', 'A conexão está funcionando corretamente');
      } else {
        mostrarErro('Desconectado', `Status: ${data.status}`);
      }
    },
    onError: () => mostrarErro('Erro', 'Não foi possível testar a conexão'),
  });

  const excluirMutation = useMutation({
    mutationFn: () => conexoesServico.excluir(conexaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão excluída', 'A conexão foi removida com sucesso');
      onFechar();
    },
    onError: () => mostrarErro('Erro', 'Não foi possível excluir a conexão'),
  });

  const atualizarMutation = useMutation({
    mutationFn: (dados: EdicaoForm) =>
      conexoesServico.atualizar(conexaoId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      queryClient.invalidateQueries({ queryKey: ['conexoes', conexaoId] });
      mostrarSucesso('Conexão atualizada', 'As alterações foram salvas');
      setModoEdicao(false);
    },
    onError: () => mostrarErro('Erro', 'Não foi possível atualizar a conexão'),
  });

  // ---------------------------------------------------------------------------
  // Effect - Preencher form quando conexão carregar
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (conexao && !modoEdicao) {
      form.reset({
        nome: conexao.nome,
        telefone: conexao.telefone || '',
        webhook: conexao.webhook || '',
      });
    }
  }, [conexao, modoEdicao, form]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleTestar = () => {
    testarMutation.mutate();
  };

  const handleExcluir = () => {
    if (confirmandoExclusao) {
      excluirMutation.mutate();
    } else {
      setConfirmandoExclusao(true);
      setTimeout(() => setConfirmandoExclusao(false), 3000);
    }
  };

  const handleAtivarEdicao = () => {
    setModoEdicao(true);
  };

  const handleCancelarEdicao = () => {
    setModoEdicao(false);
    if (conexao) {
      form.reset({
        nome: conexao.nome,
        telefone: conexao.telefone || '',
        webhook: conexao.webhook || '',
      });
    }
  };

  const handleSalvarEdicao = () => {
    form.handleSubmit((dados) => {
      atualizarMutation.mutate(dados);
    })();
  };

  // ---------------------------------------------------------------------------
  // Loading/Error states
  // ---------------------------------------------------------------------------
  if (isLoading) {
    return (
      <Dialog open={aberto} onOpenChange={onFechar}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (error || !conexao) {
    return (
      <Dialog open={aberto} onOpenChange={onFechar}>
        <DialogContent className="max-w-3xl">
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <p className="text-center text-muted-foreground">
              Erro ao carregar detalhes da conexão
            </p>
            <Button onClick={onFechar}>Fechar</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const canal = canalConfig[conexao.canal];
  const status = statusConfig[conexao.status];
  const provedor = provedorConfig[conexao.provedor];

  return (
    <Dialog open={aberto} onOpenChange={onFechar}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
        {/* Header */}
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div style={{ color: canal.cor }}>{canal.icone}</div>
              <DialogTitle className="text-xl">{conexao.nome}</DialogTitle>
            </div>
            <Badge variant={status.variant} className="text-xs">
              {status.icone}
              <span className="ml-1">{status.label}</span>
            </Badge>
          </div>
        </DialogHeader>

        {/* Content - Layout 2 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div>
              <h3 className="font-semibold mb-3">Informações</h3>
              <div className="space-y-3">
                {modoEdicao ? (
                  <>
                    {/* Modo Edição */}
                    <div className="space-y-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input
                        id="nome"
                        {...form.register('nome')}
                      />
                      {form.formState.errors.nome && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.nome.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input
                        id="telefone"
                        {...form.register('telefone')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="webhook">Webhook URL</Label>
                      <Input
                        id="webhook"
                        type="url"
                        {...form.register('webhook')}
                      />
                      {form.formState.errors.webhook && (
                        <p className="text-xs text-destructive">
                          {form.formState.errors.webhook.message}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Modo Visualização */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Canal:</span>
                        <span className="font-medium">{canal.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Provedor:</span>
                        <span className="font-medium">{provedor.label}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <div className="flex items-center gap-2">
                          {conexao.status === 'CONECTADO' ? (
                            <Wifi className="h-3 w-3 text-green-500" />
                          ) : (
                            <WifiOff className="h-3 w-3 text-muted-foreground" />
                          )}
                          <span className="font-medium">{status.label}</span>
                        </div>
                      </div>
                      {conexao.telefone && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Telefone:</span>
                          <span className="font-medium">{conexao.telefone}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Criado em:</span>
                        <span className="font-medium">
                          {formatarData(conexao.criadoEm, 'dd/MM/yyyy')}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Credenciais (Mascaradas) */}
            <div>
              <h3 className="font-semibold mb-3">Credenciais</h3>
              <div className="space-y-2 text-sm">
                {conexao.identificadorExterno && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID Externo:</span>
                    <span className="font-mono text-xs">
                      {conexao.identificadorExterno.slice(0, 8)}...
                    </span>
                  </div>
                )}
                {conexao.webhook && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Webhook:</span>
                    <span className="font-mono text-xs">Configurado ✓</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            {/* Métricas */}
            <div>
              <h3 className="font-semibold mb-3">Métricas</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <MessageCircle className="h-5 w-5 text-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Conversas Ativas
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Mensagens Agendadas
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Send className="h-5 w-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Mensagens Enviadas (30d)
                    </p>
                    <p className="text-2xl font-bold">0</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sincronização */}
            <div>
              <h3 className="font-semibold mb-3">Sincronização</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {conexao.ultimaSincronizacao
                      ? `Última: ${formatarData(
                          conexao.ultimaSincronizacao,
                          'dd/MM/yyyy HH:mm'
                        )}`
                      : 'Nunca sincronizado'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer - Ações */}
        <DialogFooter className="gap-2">
          {modoEdicao ? (
            <>
              {/* Modo Edição */}
              <Button
                variant="outline"
                onClick={handleCancelarEdicao}
                disabled={atualizarMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button
                onClick={handleSalvarEdicao}
                disabled={atualizarMutation.isPending}
              >
                {atualizarMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </>
          ) : (
            <>
              {/* Modo Visualização */}
              <Button
                variant="outline"
                onClick={handleTestar}
                disabled={testarMutation.isPending}
              >
                {testarMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Testar
              </Button>
              <Button variant="outline" onClick={handleAtivarEdicao}>
                <Edit2 className="mr-2 h-4 w-4" />
                Editar
              </Button>
              <Button
                variant={confirmandoExclusao ? 'destructive' : 'outline'}
                onClick={handleExcluir}
                disabled={excluirMutation.isPending}
              >
                {excluirMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                {confirmandoExclusao ? 'Confirmar Exclusão?' : 'Excluir'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
