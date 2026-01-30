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
  RefreshCw,
  Trash2,
  PowerOff,
  CheckCircle,
  XCircle,
  Clock,
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
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  SeparadorSidebar,
  CabecalhoPagina,
  CardItem,
  CardItemConteudo,
  GridCards,
  EstadoVazio,
  EstadoCarregando,
  EstadoErro,
} from '@/componentes/layout';
import type {
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
// Configuracoes
// =============================================================================

const canalConfig: Record<TipoCanalConexao, { label: string; cor: string }> = {
  WHATSAPP: { label: 'WhatsApp', cor: '#25D366' },
  INSTAGRAM: { label: 'Instagram', cor: '#E4405F' },
  FACEBOOK: { label: 'Facebook', cor: '#1877F2' },
};

const statusConfig: Record<StatusCanalConexao, { label: string; variant: 'default' | 'success' | 'warning' | 'destructive'; icone: React.ReactNode }> = {
  CONECTADO: { label: 'Conectado', variant: 'success', icone: <CheckCircle className="h-4 w-4" /> },
  DESCONECTADO: { label: 'Desconectado', variant: 'default', icone: <XCircle className="h-4 w-4" /> },
  AGUARDANDO_QR: { label: 'Aguardando QR', variant: 'warning', icone: <Clock className="h-4 w-4" /> },
  ERRO: { label: 'Erro', variant: 'destructive', icone: <XCircle className="h-4 w-4" /> },
};

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todas' | StatusCanalConexao;
type FiltroCanal = 'todos' | TipoCanalConexao;

// =============================================================================
// Componente Principal
// =============================================================================

export default function Conexoes() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [modalAberto, setModalAberto] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [filtroCanal, setFiltroCanal] = useState<FiltroCanal>('todos');

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
      mostrarSucesso('Conexao criada', 'A conexao foi criada com sucesso');
      setModalAberto(false);
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel criar a conexao'),
  });

  const testarMutation = useMutation({
    mutationFn: conexoesServico.testar,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      if (data.conectado) {
        mostrarSucesso('Conectado', 'A conexao esta funcionando');
      } else {
        mostrarErro('Desconectado', `Status: ${data.status}`);
      }
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel testar a conexao'),
  });

  const desativarMutation = useMutation({
    mutationFn: (id: string) => conexoesServico.atualizarStatus(id, false),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Desativado', 'A conexao foi desativada');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel desativar'),
  });

  const excluirMutation = useMutation({
    mutationFn: conexoesServico.excluir,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Conexao excluida', 'A conexao foi removida');
    },
    onError: () => mostrarErro('Erro', 'Nao foi possivel excluir'),
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
  // Erro
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center">
          <EstadoErro
            titulo="Erro ao carregar conexoes"
            mensagem="Nao foi possivel carregar a lista"
            onTentarNovamente={() => recarregar()}
          />
        </div>
      </div>
    );
  }

  const listaConexoes = conexoes || [];

  // Filtrar conexoes
  const conexoesFiltradas = listaConexoes.filter((conexao) => {
    if (filtroStatus !== 'todas' && conexao.status !== filtroStatus) return false;
    if (filtroCanal !== 'todos' && conexao.canal !== filtroCanal) return false;
    return true;
  });

  // Contadores
  const contadores = {
    todas: listaConexoes.length,
    CONECTADO: listaConexoes.filter((c) => c.status === 'CONECTADO').length,
    DESCONECTADO: listaConexoes.filter((c) => c.status === 'DESCONECTADO').length,
    AGUARDANDO_QR: listaConexoes.filter((c) => c.status === 'AGUARDANDO_QR').length,
    ERRO: listaConexoes.filter((c) => c.status === 'ERRO').length,
  };

  const contadoresCanais = {
    todos: listaConexoes.length,
    WHATSAPP: listaConexoes.filter((c) => c.canal === 'WHATSAPP').length,
    INSTAGRAM: listaConexoes.filter((c) => c.canal === 'INSTAGRAM').length,
    FACEBOOK: listaConexoes.filter((c) => c.canal === 'FACEBOOK').length,
  };

  return (
    <div className="flex h-full">
      {/* Sidebar Secundaria - Filtros */}
      <SidebarSecundaria largura="sm">
        <CabecalhoSidebar
          titulo="Conexoes"
          subtitulo={`${listaConexoes.length} conexoes`}
          acoes={
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setModalAberto(true)}>
              <Plus className="h-4 w-4" />
            </Button>
          }
        />

        <SecaoSidebar titulo="Status">
          <ItemSidebar
            icone={<Smartphone className="h-4 w-4" />}
            label="Todas"
            badge={contadores.todas}
            ativo={filtroStatus === 'todas'}
            onClick={() => setFiltroStatus('todas')}
          />
          {(Object.keys(statusConfig) as StatusCanalConexao[]).map((status) => (
            <ItemSidebar
              key={status}
              icone={statusConfig[status].icone}
              label={statusConfig[status].label}
              badge={contadores[status]}
              ativo={filtroStatus === status}
              onClick={() => setFiltroStatus(status)}
            />
          ))}
        </SecaoSidebar>

        <SeparadorSidebar />

        <SecaoSidebar titulo="Canais">
          <ItemSidebar
            icone={<Smartphone className="h-4 w-4" />}
            label="Todos os canais"
            badge={contadoresCanais.todos}
            ativo={filtroCanal === 'todos'}
            onClick={() => setFiltroCanal('todos')}
          />
          {(Object.keys(canalConfig) as TipoCanalConexao[]).map((canal) => (
            <ItemSidebar
              key={canal}
              icone={
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: canalConfig[canal].cor }}
                />
              }
              label={canalConfig[canal].label}
              badge={contadoresCanais[canal]}
              ativo={filtroCanal === canal}
              onClick={() => setFiltroCanal(canal)}
            />
          ))}
        </SecaoSidebar>
      </SidebarSecundaria>

      {/* Conteudo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CabecalhoPagina
          titulo="Conexoes"
          subtitulo="Gerencie suas conexoes de canais"
          icone={<Smartphone className="h-5 w-5" />}
          acoes={
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conexao
            </Button>
          }
        />

        {/* Area de Conteudo */}
        <div className="flex-1 overflow-auto p-6">
          {carregando ? (
            <EstadoCarregando texto="Carregando conexoes..." />
          ) : conexoesFiltradas.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma conexao"
              descricao="Crie sua primeira conexao WhatsApp"
              icone={<Smartphone className="h-16 w-16" />}
              acao={{ label: 'Nova Conexao', onClick: () => setModalAberto(true) }}
            />
          ) : (
            <GridCards colunas={3}>
              {conexoesFiltradas.map((conexao) => {
                const canal = canalConfig[conexao.canal];
                const status = statusConfig[conexao.status];

                return (
                  <CardItem
                    key={conexao.id}
                    className={!conexao.ativa ? 'opacity-60' : ''}
                    acoes={[
                      {
                        label: 'Testar Conexao',
                        icone: <RefreshCw className="h-4 w-4" />,
                        onClick: () => testarMutation.mutate(conexao.id),
                      },
                      ...(conexao.status === 'CONECTADO'
                        ? [{
                            label: 'Desativar',
                            icone: <PowerOff className="h-4 w-4" />,
                            onClick: () => desativarMutation.mutate(conexao.id),
                          }]
                        : []),
                      {
                        label: 'Excluir',
                        icone: <Trash2 className="h-4 w-4" />,
                        onClick: () => excluirMutation.mutate(conexao.id),
                        variante: 'destructive' as const,
                      },
                    ]}
                  >
                    <CardItemConteudo
                      icone={
                        <Smartphone className="h-5 w-5" style={{ color: canal.cor }} />
                      }
                      titulo={conexao.nome}
                      badge={
                        <Badge variant={status.variant} className="text-xs">
                          {status.label}
                        </Badge>
                      }
                      subtitulo={canal.label}
                      meta={
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {conexao.status === 'CONECTADO' ? (
                              <Wifi className="h-3 w-3 text-green-500" />
                            ) : (
                              <WifiOff className="h-3 w-3 text-muted-foreground" />
                            )}
                            <span>{conexao.telefone || 'Telefone nao configurado'}</span>
                          </div>
                          {conexao.ultimaSincronizacao && (
                            <p className="text-xs">
                              Sincronizado: {formatarData(conexao.ultimaSincronizacao, 'dd/MM HH:mm')}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </CardItem>
                );
              })}
            </GridCards>
          )}
        </div>
      </div>

      {/* Modal Nova Conexao */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Nova Conexao</CardTitle>
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
    </div>
  );
}
