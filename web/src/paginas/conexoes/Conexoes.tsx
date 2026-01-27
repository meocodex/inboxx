import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus,
  Smartphone,
  Wifi,
  WifiOff,
  QrCode,
  MoreHorizontal,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
} from 'lucide-react';
import { conexoesServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarData } from '@/utilitarios/formatadores';
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
import type {
  CanalConexaoResumo,
  TipoCanalConexao,
  StatusCanalConexao,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Schemas
// =============================================================================

const conexaoSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter no minimo 2 caracteres'),
  canal: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK']),
  provedor: z.enum(['META_API', 'UAIZAP', 'GRAPH_API']),
  telefone: z.string().optional(),
});

type ConexaoForm = z.infer<typeof conexaoSchema>;

// =============================================================================
// Configurações
// =============================================================================

const canalConfig: Record<TipoCanalConexao, { label: string; cor: string }> = {
  WHATSAPP: { label: 'WhatsApp', cor: '#25D366' },
  INSTAGRAM: { label: 'Instagram', cor: '#E4405F' },
  FACEBOOK: { label: 'Facebook', cor: '#1877F2' },
};

const statusConfig: Record<StatusCanalConexao, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }> = {
  CONECTADO: { label: 'Conectado', variant: 'success' },
  DESCONECTADO: { label: 'Desconectado', variant: 'default' },
  AGUARDANDO_QR: { label: 'Aguardando QR', variant: 'warning' },
  ERRO: { label: 'Erro', variant: 'destructive' },
};

// =============================================================================
// Componente Card Conexão
// =============================================================================

interface CardConexaoProps {
  conexao: CanalConexaoResumo;
  onConectar: (id: string) => void;
  onDesconectar: (id: string) => void;
  onSincronizar: (id: string) => void;
  onExcluir: (id: string) => void;
}

function CardConexao({ conexao, onConectar, onDesconectar, onSincronizar, onExcluir }: CardConexaoProps) {
  const canal = canalConfig[conexao.canal];
  const status = statusConfig[conexao.status];

  return (
    <Card className={!conexao.ativa ? 'opacity-60' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: `${canal.cor}20` }}
            >
              <Smartphone className="h-5 w-5" style={{ color: canal.cor }} />
            </div>
            <div>
              <CardTitle className="text-lg">{conexao.nome}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{canal.label}</Badge>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {conexao.status === 'DESCONECTADO' && (
                <DropdownMenuItem onClick={() => onConectar(conexao.id)}>
                  <Power className="mr-2 h-4 w-4 text-green-500" />
                  Conectar
                </DropdownMenuItem>
              )}
              {conexao.status === 'CONECTADO' && (
                <>
                  <DropdownMenuItem onClick={() => onSincronizar(conexao.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sincronizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDesconectar(conexao.id)}>
                    <PowerOff className="mr-2 h-4 w-4 text-orange-500" />
                    Desconectar
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onClick={() => onExcluir(conexao.id)} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          {/* Status Icon */}
          <div className="flex items-center gap-2">
            {conexao.status === 'CONECTADO' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm text-muted-foreground">
              {conexao.telefone || 'Telefone não configurado'}
            </span>
          </div>

          {/* Última Sincronização */}
          {conexao.ultimaSincronizacao && (
            <p className="text-xs text-muted-foreground">
              Última sincronização: {formatarData(conexao.ultimaSincronizacao, 'dd/MM HH:mm')}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Conexoes() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Query
  // ---------------------------------------------------------------------------
  const {
    data: conexoes,
    isLoading: carregando,
    error: erro,
    refetch: recarregar,
  } = useQuery({
    queryKey: ['conexoes'],
    queryFn: () => conexoesServico.listar(),
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const criarMutation = useMutation({
    mutationFn: conexoesServico.criar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão criada', 'A conexão foi criada com sucesso');
      setModalAberto(false);
    },
    onError: () => mostrarErro('Erro', 'Não foi possível criar a conexão'),
  });

  const conectarMutation = useMutation({
    mutationFn: conexoesServico.conectar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      if (data.qrCode) {
        setQrCode(data.qrCode);
      } else {
        mostrarSucesso('Conectando', 'Iniciando conexão...');
      }
    },
    onError: () => mostrarErro('Erro', 'Não foi possível conectar'),
  });

  const desconectarMutation = useMutation({
    mutationFn: conexoesServico.desconectar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Desconectado', 'A conexão foi encerrada');
    },
    onError: () => mostrarErro('Erro', 'Não foi possível desconectar'),
  });

  const sincronizarMutation = useMutation({
    mutationFn: conexoesServico.sincronizar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Sincronizado', 'Dados sincronizados com sucesso');
    },
    onError: () => mostrarErro('Erro', 'Não foi possível sincronizar'),
  });

  const excluirMutation = useMutation({
    mutationFn: conexoesServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexão excluída', 'A conexão foi removida');
    },
    onError: () => mostrarErro('Erro', 'Não foi possível excluir'),
  });

  // ---------------------------------------------------------------------------
  // Form
  // ---------------------------------------------------------------------------
  const form = useForm<ConexaoForm>({
    resolver: zodResolver(conexaoSchema),
    defaultValues: {
      nome: '',
      canal: 'WHATSAPP',
      provedor: 'META_API',
      telefone: '',
    },
  });

  const handleSubmit = (dados: ConexaoForm) => {
    criarMutation.mutate({
      nome: dados.nome,
      canal: dados.canal,
      provedor: dados.provedor,
      telefone: dados.telefone || undefined,
    });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <ErroMensagem
        titulo="Erro ao carregar conexões"
        mensagem="Não foi possível carregar a lista"
        onTentarNovamente={() => recarregar()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conexões</h1>
          <p className="text-muted-foreground">Gerencie suas conexões de canais</p>
        </div>
        <Button onClick={() => setModalAberto(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Conexão
        </Button>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex justify-center py-12">
          <Carregando tamanho="lg" texto="Carregando conexões..." />
        </div>
      ) : !conexoes || conexoes.length === 0 ? (
        <Vazio
          icone={<Smartphone className="h-16 w-16" />}
          titulo="Nenhuma conexão"
          descricao="Crie sua primeira conexão WhatsApp"
          acao={
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conexão
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {conexoes.map((conexao) => (
            <CardConexao
              key={conexao.id}
              conexao={conexao}
              onConectar={(id) => conectarMutation.mutate(id)}
              onDesconectar={(id) => desconectarMutation.mutate(id)}
              onSincronizar={(id) => sincronizarMutation.mutate(id)}
              onExcluir={(id) => excluirMutation.mutate(id)}
            />
          ))}
        </div>
      )}

      {/* Modal Nova Conexão */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Conexão</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input id="nome" placeholder="Ex: WhatsApp Principal" {...form.register('nome')} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="canal">Canal</Label>
                  <select
                    id="canal"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    {...form.register('canal')}
                  >
                    <option value="WHATSAPP">WhatsApp</option>
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="FACEBOOK">Facebook</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provedor">Provedor</Label>
                  <select
                    id="provedor"
                    className="w-full h-10 px-3 rounded-md border bg-background"
                    {...form.register('provedor')}
                  >
                    <option value="META_API">Meta Cloud API</option>
                    <option value="UAIZAP">UaiZap</option>
                    <option value="GRAPH_API">Graph API</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="Ex: 5511999999999"
                    {...form.register('telefone')}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setModalAberto(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">Criar</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal QR Code */}
      {qrCode && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Escaneie o QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Abra o WhatsApp no seu celular e escaneie este código
              </p>
              <Button variant="outline" onClick={() => setQrCode(null)}>
                Fechar
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
