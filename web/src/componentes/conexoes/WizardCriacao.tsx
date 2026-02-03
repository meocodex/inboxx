import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Smartphone,
  Instagram,
  Facebook,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/componentes/ui/dialog';
import { Button } from '@/componentes/ui/button';
import { Input } from '@/componentes/ui/input';
import { Label } from '@/componentes/ui/label';
import { Badge } from '@/componentes/ui/badge';
import { conexoesServico } from '@/servicos';
import { useToast } from '@/hooks';
import type {
  TipoCanalConexao,
  ProvedorConexao,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Schemas de Validação
// =============================================================================

const step1Schema = z.object({
  nome: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  provedor: z.enum(['META_API', 'UAIZAP', 'GRAPH_API']),
});

const step2Schema = z.object({
  telefone: z.string().optional(),
  token: z.string().optional(),
  phoneNumberId: z.string().optional(),
  webhook: z.string().url('URL inválida').optional().or(z.literal('')),
});

type Step1Form = z.infer<typeof step1Schema>;
type Step2Form = z.infer<typeof step2Schema>;

// =============================================================================
// Configurações
// =============================================================================

const canalConfig: Record<
  TipoCanalConexao,
  { label: string; cor: string; icone: React.ReactNode; descricao: string }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    cor: '#25D366',
    icone: <Smartphone className="h-6 w-6" />,
    descricao: 'Mensagens via WhatsApp Business API',
  },
  INSTAGRAM: {
    label: 'Instagram',
    cor: '#E4405F',
    icone: <Instagram className="h-6 w-6" />,
    descricao: 'Direct do Instagram Business',
  },
  FACEBOOK: {
    label: 'Facebook',
    cor: '#1877F2',
    icone: <Facebook className="h-6 w-6" />,
    descricao: 'Messenger do Facebook',
  },
};

const provedorConfig: Record<
  ProvedorConexao,
  { label: string; descricao: string; oficial?: boolean }
> = {
  META_API: {
    label: 'Meta Cloud API',
    descricao: 'API oficial do WhatsApp Business',
    oficial: true,
  },
  UAIZAP: {
    label: 'UaiZap',
    descricao: 'Instância criada automaticamente pelo administrador',
  },
  GRAPH_API: {
    label: 'Graph API',
    descricao: 'Para Instagram e Facebook',
  },
};

// =============================================================================
// Props
// =============================================================================

interface WizardCriacaoProps {
  aberto: boolean;
  onFechar: () => void;
  onSucesso?: () => void;
}

// =============================================================================
// Componente
// =============================================================================

export function WizardCriacao({
  aberto,
  onFechar,
  onSucesso,
}: WizardCriacaoProps) {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [etapaAtual, setEtapaAtual] = useState(1);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [dadosStep1, setDadosStep1] = useState<Step1Form | null>(null);

  // ---------------------------------------------------------------------------
  // Forms
  // ---------------------------------------------------------------------------
  const formStep1 = useForm<Step1Form>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      nome: '',
      canal: 'WHATSAPP',
      provedor: 'META_API',
    },
  });

  const formStep2 = useForm<Step2Form>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      telefone: '',
      token: '',
      phoneNumberId: '',
      webhook: '',
    },
  });

  // ---------------------------------------------------------------------------
  // Mutation
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: conexoesServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão criada', 'A conexão foi criada com sucesso');
      handleFechar();
      onSucesso?.();
    },
    onError: (error: any) => {
      mostrarErro(
        'Erro ao criar conexão',
        error?.response?.data?.mensagem || 'Não foi possível criar a conexão'
      );
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleFechar = () => {
    setEtapaAtual(1);
    setDadosStep1(null);
    formStep1.reset();
    formStep2.reset();
    setMostrarSenha(false);
    onFechar();
  };

  const handleStep1Submit = (dados: Step1Form) => {
    setDadosStep1(dados);
    setEtapaAtual(2);
  };

  const handleStep2Submit = () => {
    if (!dadosStep1) return;

    setEtapaAtual(3);
  };

  const handleConfirmar = () => {
    if (!dadosStep1) return;

    const dadosStep2 = formStep2.getValues();

    criarMutation.mutate({
      nome: dadosStep1.nome,
      canal: dadosStep1.canal,
      provedor: dadosStep1.provedor,
      telefone: dadosStep2.telefone || undefined,
      webhook: dadosStep2.webhook || undefined,
    });
  };

  const handleVoltar = () => {
    if (etapaAtual > 1) {
      setEtapaAtual(etapaAtual - 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Render Steps
  // ---------------------------------------------------------------------------
  const renderStep1 = () => (
    <form onSubmit={formStep1.handleSubmit(handleStep1Submit)} className="space-y-6">
      {/* Nome */}
      <div className="space-y-2">
        <Label htmlFor="nome">Nome da Conexão *</Label>
        <Input
          id="nome"
          placeholder="Ex: WhatsApp Principal"
          {...formStep1.register('nome')}
        />
        {formStep1.formState.errors.nome && (
          <p className="text-sm text-destructive">
            {formStep1.formState.errors.nome.message}
          </p>
        )}
      </div>

      {/* Canal */}
      <div className="space-y-3">
        <Label>Canal *</Label>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(canalConfig) as TipoCanalConexao[]).map((canal) => {
            const config = canalConfig[canal];
            const selecionado = formStep1.watch('canal') === canal;

            return (
              <label
                key={canal}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selecionado
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80'
                  }
                `}
              >
                <input
                  type="radio"
                  value={canal}
                  className="sr-only"
                  {...formStep1.register('canal')}
                />
                <div style={{ color: config.cor }}>{config.icone}</div>
                <div className="flex-1">
                  <p className="font-medium">{config.label}</p>
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

      {/* Provedor */}
      <div className="space-y-3">
        <Label>Provedor *</Label>
        <div className="grid grid-cols-1 gap-3">
          {(Object.keys(provedorConfig) as ProvedorConexao[]).map((provedor) => {
            const config = provedorConfig[provedor];
            const selecionado = formStep1.watch('provedor') === provedor;

            return (
              <label
                key={provedor}
                className={`
                  flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all
                  ${
                    selecionado
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-border/80'
                  }
                `}
              >
                <input
                  type="radio"
                  value={provedor}
                  className="sr-only"
                  {...formStep1.register('provedor')}
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

      {/* Aviso informativo para UaiZap */}
      {formStep1.watch('provedor') === 'UAIZAP' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="text-blue-600">ℹ️</div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Configuração Automática
              </p>
              <p className="text-blue-700">
                O sistema criará automaticamente uma instância UaiZap para esta conexão.
                Não é necessário fornecer credenciais - a configuração é gerenciada
                centralmente pelo administrador.
              </p>
            </div>
          </div>
        </div>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleFechar}>
          Cancelar
        </Button>
        <Button type="submit">
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogFooter>
    </form>
  );

  const renderStep2 = () => (
    <form onSubmit={formStep2.handleSubmit(handleStep2Submit)} className="space-y-6">
      {/* Telefone */}
      <div className="space-y-2">
        <Label htmlFor="telefone">Telefone</Label>
        <Input
          id="telefone"
          placeholder="Ex: 5511999999999"
          {...formStep2.register('telefone')}
        />
        <p className="text-xs text-muted-foreground">
          Formato: código país + DDD + número
        </p>
      </div>

      {/* Token/API Key */}
      {dadosStep1?.provedor === 'META_API' && (
        <>
          <div className="space-y-2">
            <Label htmlFor="token">Token de Acesso</Label>
            <div className="relative">
              <Input
                id="token"
                type={mostrarSenha ? 'text' : 'password'}
                placeholder="Token da Meta Cloud API"
                {...formStep2.register('token')}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0"
                onClick={() => setMostrarSenha(!mostrarSenha)}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumberId">Phone Number ID</Label>
            <Input
              id="phoneNumberId"
              placeholder="ID do número de telefone"
              {...formStep2.register('phoneNumberId')}
            />
          </div>
        </>
      )}

      {dadosStep1?.provedor === 'UAIZAP' && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <div className="flex gap-3">
            <div className="text-blue-600">ℹ️</div>
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-900 mb-1">
                Criação Automática de Instância
              </p>
              <p className="text-blue-700">
                A instância UaiZap será criada automaticamente usando as credenciais
                configuradas pelo administrador do sistema. Você receberá o QR Code
                para vincular seu WhatsApp após a criação.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Webhook (opcional) */}
      <div className="space-y-2">
        <Label htmlFor="webhook">Webhook URL (opcional)</Label>
        <Input
          id="webhook"
          type="url"
          placeholder="https://seu-dominio.com/webhook"
          {...formStep2.register('webhook')}
        />
        {formStep2.formState.errors.webhook && (
          <p className="text-sm text-destructive">
            {formStep2.formState.errors.webhook.message}
          </p>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={handleVoltar}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <Button type="submit">
          Próximo
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </DialogFooter>
    </form>
  );

  const renderStep3 = () => {
    if (!dadosStep1) return null;

    const dadosStep2 = formStep2.getValues();
    const canal = canalConfig[dadosStep1.canal];
    const provedor = provedorConfig[dadosStep1.provedor];

    return (
      <div className="space-y-6">
        {/* Resumo */}
        <div className="rounded-lg border p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div style={{ color: canal.cor }}>{canal.icone}</div>
            <div>
              <h3 className="font-semibold text-lg">{dadosStep1.nome}</h3>
              <p className="text-sm text-muted-foreground">
                {canal.label} • {provedor.label}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Canal:</span>
              <span className="font-medium">{canal.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Provedor:</span>
              <span className="font-medium">{provedor.label}</span>
            </div>
            {dadosStep2.telefone && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Telefone:</span>
                <span className="font-medium">{dadosStep2.telefone}</span>
              </div>
            )}
            {dadosStep2.webhook && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Webhook:</span>
                <span className="font-medium text-xs truncate max-w-[200px]">
                  {dadosStep2.webhook}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            Ao criar a conexão, você poderá testar a conectividade e configurar
            as credenciais completas se necessário.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleVoltar}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={handleConfirmar}
            disabled={criarMutation.isPending}
          >
            {criarMutation.isPending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Criar e Testar
          </Button>
        </DialogFooter>
      </div>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Principal
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={aberto} onOpenChange={handleFechar}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="space-y-2">
            <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 flex-1 rounded-full transition-colors ${
                    step <= etapaAtual ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
              <span className="text-sm text-muted-foreground">
                {etapaAtual}/3
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {etapaAtual === 1 && renderStep1()}
          {etapaAtual === 2 && renderStep2()}
          {etapaAtual === 3 && renderStep3()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
