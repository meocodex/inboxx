import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Wifi,
  WifiOff,
  Edit2,
  Trash2,
  Save,
  X,
  Check,
  RefreshCw,
  Send,
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
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Separator } from '@/componentes/ui/separator';
import { conexoesServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarData } from '@/utilitarios/formatadores';
import { QRCodeViewer } from './QRCodeViewer';
import {
  CANAL_CONFIG,
  STATUS_CONFIG,
  PROVEDOR_CONFIG,
  CANAIS_DISPONIVEIS,
  PROVEDORES_DISPONIVEIS,
  suportaQRCode,
  precisaQRCode,
} from './conexoes.config';
import type {
  TipoCanalConexao,
  ProvedorConexao,
  StatusCanalConexao,
  CriarConexaoResposta,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Schemas
// =============================================================================

const criarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  provedor: z.enum(['META_API', 'UAIZAP', 'GRAPH_API']),
});

const editarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
});

type CriarForm = z.infer<typeof criarSchema>;
type EditarForm = z.infer<typeof editarSchema>;

// =============================================================================
// Tipos
// =============================================================================

type ModoDialog = 'criar' | 'ver' | 'editar';

interface DialogConexaoProps {
  aberto: boolean;
  onFechar: () => void;
  conexaoId?: string | null;
  onSucesso?: () => void;
}

// =============================================================================
// Componente
// =============================================================================

export function DialogConexao({
  aberto,
  onFechar,
  conexaoId,
  onSucesso,
}: DialogConexaoProps) {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modo, setModo] = useState<ModoDialog>(conexaoId ? 'ver' : 'criar');
  const [conexaoCriada, setConexaoCriada] = useState<CriarConexaoResposta | null>(null);
  const [statusAtual, setStatusAtual] = useState<StatusCanalConexao>('AGUARDANDO_QR');
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  const criarForm = useForm<CriarForm>({
    resolver: zodResolver(criarSchema),
    defaultValues: {
      nome: '',
      canal: 'WHATSAPP',
      provedor: 'UAIZAP',
    },
  });

  const editarForm = useForm<EditarForm>({
    resolver: zodResolver(editarSchema),
    defaultValues: {
      nome: '',
    },
  });

  // ---------------------------------------------------------------------------
  // Query - Detalhes da conexão
  // ---------------------------------------------------------------------------
  const {
    data: conexao,
    isLoading: carregandoConexao,
  } = useQuery({
    queryKey: ['conexoes', conexaoId],
    queryFn: () => conexoesServico.obterPorId(conexaoId!),
    enabled: aberto && !!conexaoId,
  });

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (aberto) {
      setModo(conexaoId ? 'ver' : 'criar');
      setConexaoCriada(null);
      setConfirmandoExclusao(false);
      criarForm.reset({
        nome: '',
        canal: 'WHATSAPP',
        provedor: 'UAIZAP',
      });
    }
  }, [aberto, conexaoId, criarForm]);

  useEffect(() => {
    if (conexao) {
      setStatusAtual(conexao.status);
      editarForm.reset({
        nome: conexao.nome,
      });
    }
  }, [conexao, editarForm]);

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: conexoesServico.criar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão criada', 'A conexão foi criada com sucesso');
      setConexaoCriada(data);
      setStatusAtual('AGUARDANDO_QR');
    },
    onError: (error: any) => {
      mostrarErro(
        'Erro ao criar conexão',
        error?.response?.data?.mensagem || 'Não foi possível criar a conexão'
      );
    },
  });

  const atualizarMutation = useMutation({
    mutationFn: (dados: EditarForm) =>
      conexoesServico.atualizar(conexaoId!, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      queryClient.invalidateQueries({ queryKey: ['conexoes', conexaoId] });
      mostrarSucesso('Conexão atualizada', 'As alterações foram salvas');
      setModo('ver');
    },
    onError: () => mostrarErro('Erro', 'Não foi possível atualizar a conexão'),
  });

  const excluirMutation = useMutation({
    mutationFn: () => conexoesServico.excluir(conexaoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão excluída', 'A conexão foi removida com sucesso');
      handleFechar();
    },
    onError: () => mostrarErro('Erro', 'Não foi possível excluir a conexão'),
  });

  const testarMutation = useMutation({
    mutationFn: () => conexoesServico.testar(conexaoId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      queryClient.invalidateQueries({ queryKey: ['conexoes', conexaoId] });
      if (data.sucesso) {
        mostrarSucesso('Conectado', data.mensagem);
        setStatusAtual('CONECTADO');
      } else {
        mostrarErro('Teste falhou', data.mensagem);
        setStatusAtual(data.status);
      }
    },
    onError: () => mostrarErro('Erro', 'Não foi possível testar a conexão'),
  });

  const reconectarMutation = useMutation({
    mutationFn: () => conexoesServico.reconectar(conexaoId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      queryClient.invalidateQueries({ queryKey: ['conexoes', conexaoId] });
      mostrarSucesso('Reconectando', 'Aguarde o novo QR Code');
      setStatusAtual('AGUARDANDO_QR');
    },
    onError: () => mostrarErro('Erro', 'Não foi possível reconectar'),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleFechar = () => {
    setModo('criar');
    setConexaoCriada(null);
    setConfirmandoExclusao(false);
    criarForm.reset();
    editarForm.reset();
    onFechar();
    if (conexaoCriada || modo === 'criar') {
      onSucesso?.();
    }
  };

  const handleCriar = (dados: CriarForm) => {
    criarMutation.mutate({
      nome: dados.nome,
      canal: dados.canal,
      provedor: dados.provedor,
    });
  };

  const handleSalvar = () => {
    editarForm.handleSubmit((dados) => {
      atualizarMutation.mutate(dados);
    })();
  };

  const handleExcluir = () => {
    if (confirmandoExclusao) {
      excluirMutation.mutate();
    } else {
      setConfirmandoExclusao(true);
      setTimeout(() => setConfirmandoExclusao(false), 3000);
    }
  };

  const handleStatusChange = (novoStatus: StatusCanalConexao) => {
    setStatusAtual(novoStatus);
    queryClient.invalidateQueries({ queryKey: ['conexoes'] });
  };

  // ---------------------------------------------------------------------------
  // Render - Modo Criar
  // ---------------------------------------------------------------------------
  const renderCriar = () => {
    // Se já criou, mostrar QR Code
    if (conexaoCriada) {
      const provedor = conexaoCriada.provedor as ProvedorConexao;
      const canal = CANAL_CONFIG[conexaoCriada.canal as TipoCanalConexao];
      const CanalIcon = canal.icone;

      return (
        <div className="space-y-6">
          {/* Info da conexão criada */}
          <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/30">
            <div style={{ color: canal.cor }}>
              <CanalIcon className="h-8 w-8" />
            </div>
            <div>
              <h3 className="font-semibold">{conexaoCriada.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {canal.label} • {PROVEDOR_CONFIG[provedor].label}
              </p>
            </div>
            <Badge variant={STATUS_CONFIG[statusAtual].variant} className="ml-auto">
              {STATUS_CONFIG[statusAtual].label}
            </Badge>
          </div>

          {/* QR Code se suportar */}
          {suportaQRCode(provedor) && statusAtual === 'AGUARDANDO_QR' && (
            <QRCodeViewer
              conexaoId={conexaoCriada.id}
              qrcodeInicial={conexaoCriada.qrcode}
              status={statusAtual}
              onStatusChange={handleStatusChange}
              tamanho="lg"
            />
          )}

          {/* Mensagem de sucesso se conectado */}
          {statusAtual === 'CONECTADO' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-green-700">WhatsApp Conectado!</p>
                <p className="text-sm text-muted-foreground">
                  A conexão está pronta para uso
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={handleFechar}>
              {statusAtual === 'CONECTADO' ? 'Concluir' : 'Fechar'}
            </Button>
          </DialogFooter>
        </div>
      );
    }

    // Form de criação
    const provedorSelecionado = criarForm.watch('provedor');

    return (
      <form onSubmit={criarForm.handleSubmit(handleCriar)} className="space-y-6">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="nome">Nome da Conexão *</Label>
          <Input
            id="nome"
            placeholder="Ex: WhatsApp Principal"
            {...criarForm.register('nome')}
          />
          {criarForm.formState.errors.nome && (
            <p className="text-sm text-destructive">
              {criarForm.formState.errors.nome.message}
            </p>
          )}
        </div>

        {/* Canal */}
        <div className="space-y-3">
          <Label>Canal *</Label>
          <div className="grid grid-cols-3 gap-3">
            {CANAIS_DISPONIVEIS.map((canal) => {
              const config = CANAL_CONFIG[canal];
              const selecionado = criarForm.watch('canal') === canal;
              const CanalIcon = config.icone;

              return (
                <label
                  key={canal}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selecionado ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}
                  `}
                >
                  <input
                    type="radio"
                    value={canal}
                    className="sr-only"
                    {...criarForm.register('canal')}
                  />
                  <div style={{ color: config.cor }}>
                    <CanalIcon className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium">{config.label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* Provedor */}
        <div className="space-y-3">
          <Label>Provedor *</Label>
          <div className="space-y-2">
            {PROVEDORES_DISPONIVEIS.map((provedor) => {
              const config = PROVEDOR_CONFIG[provedor];
              const selecionado = criarForm.watch('provedor') === provedor;

              return (
                <label
                  key={provedor}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all
                    ${selecionado ? 'border-primary bg-primary/5' : 'border-border hover:border-border/80'}
                  `}
                >
                  <input
                    type="radio"
                    value={provedor}
                    className="sr-only"
                    {...criarForm.register('provedor')}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{config.label}</p>
                      {config.oficial && (
                        <Badge variant="secondary" className="text-xs">
                          Oficial
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {config.descricao}
                    </p>
                  </div>
                  {selecionado && <Check className="h-5 w-5 text-primary" />}
                </label>
              );
            })}
          </div>
        </div>

        {/* Aviso UaiZap */}
        {provedorSelecionado === 'UAIZAP' && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex gap-3">
              <div className="text-blue-600 text-lg">i</div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Configuração Automática
                </p>
                <p className="text-blue-700">
                  Ao criar a conexão, o QR Code será exibido automaticamente para
                  você escanear com o WhatsApp.
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleFechar}>
            Cancelar
          </Button>
          <Button type="submit" disabled={criarMutation.isPending}>
            {criarMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Criar Conexão
          </Button>
        </DialogFooter>
      </form>
    );
  };

  // ---------------------------------------------------------------------------
  // Render - Modo Ver/Editar
  // ---------------------------------------------------------------------------
  const renderVerEditar = () => {
    if (carregandoConexao || !conexao) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    const canal = CANAL_CONFIG[conexao.canal as TipoCanalConexao];
    const status = STATUS_CONFIG[statusAtual];
    const provedor = PROVEDOR_CONFIG[conexao.provedor as ProvedorConexao];
    const CanalIcon = canal.icone;
    const StatusIcon = status.icone;
    const mostraQR = precisaQRCode(statusAtual, conexao.provedor as ProvedorConexao);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div style={{ color: canal.cor }}>
              <CanalIcon className="h-8 w-8" />
            </div>
            <div>
              {modo === 'editar' ? (
                <div className="space-y-1">
                  <Input
                    {...editarForm.register('nome')}
                    className="text-lg font-semibold h-auto py-1"
                  />
                  {editarForm.formState.errors.nome && (
                    <p className="text-xs text-destructive">
                      {editarForm.formState.errors.nome.message}
                    </p>
                  )}
                </div>
              ) : (
                <h3 className="text-lg font-semibold">{conexao.nome}</h3>
              )}
              <p className="text-sm text-muted-foreground">
                {canal.label} • {provedor.label}
              </p>
            </div>
          </div>
          <Badge variant={status.variant}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {status.label}
          </Badge>
        </div>

        <Separator />

        {/* QR Code se necessário */}
        {mostraQR && (
          <>
            <QRCodeViewer
              conexaoId={conexao.id}
              status={statusAtual}
              onStatusChange={handleStatusChange}
              tamanho="md"
            />
            <Separator />
          </>
        )}

        {/* Informações */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Status</span>
            <div className="flex items-center gap-2 mt-1">
              {statusAtual === 'CONECTADO' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
              <span className="font-medium">{status.label}</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Canal</span>
            <p className="font-medium mt-1">{canal.label}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Provedor</span>
            <p className="font-medium mt-1">{provedor.label}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Criado em</span>
            <p className="font-medium mt-1">
              {formatarData(conexao.criadoEm, 'dd/MM/yyyy')}
            </p>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="gap-2">
          {modo === 'editar' ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setModo('ver');
                  editarForm.reset({ nome: conexao.nome });
                }}
                disabled={atualizarMutation.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleSalvar} disabled={atualizarMutation.isPending}>
                {atualizarMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Salvar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => testarMutation.mutate()}
                disabled={testarMutation.isPending}
              >
                {testarMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Testar
              </Button>

              {suportaQRCode(conexao.provedor as ProvedorConexao) && (
                <Button
                  variant="outline"
                  onClick={() => reconectarMutation.mutate()}
                  disabled={reconectarMutation.isPending}
                >
                  {reconectarMutation.isPending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Reconectar
                </Button>
              )}

              <Button variant="outline" onClick={() => setModo('editar')}>
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
                {confirmandoExclusao ? 'Confirmar?' : 'Excluir'}
              </Button>
            </>
          )}
        </DialogFooter>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Principal
  // ---------------------------------------------------------------------------
  const titulo = conexaoId
    ? modo === 'editar'
      ? 'Editar Conexão'
      : conexao?.nome || 'Detalhes da Conexão'
    : conexaoCriada
      ? 'Conectar WhatsApp'
      : 'Nova Conexão';

  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
        </DialogHeader>

        {conexaoId ? renderVerEditar() : renderCriar()}
      </DialogContent>
    </Dialog>
  );
}
