import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Users,
  Megaphone,
  Clock,
  TrendingUp,
  BarChart3,
  FileBarChart,
  Mail,
  CheckCircle,
  Eye,
  AlertCircle,
} from 'lucide-react';
import {
  relatoriosServico,
  calcularPeriodo,
  type RelatorioConversasProcessado,
  type RelatorioKanbanProcessado,
  type RelatorioCampanhasProcessado,
} from '@/servicos/relatorios.servico';
import { formatarNumero, formatarMoeda } from '@/utilitarios/formatadores';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import {
  PageLayout,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  SeparadorSidebar,
  LoadingState,
  EmptyState,
} from '@/componentes/layout';

// =============================================================================
// Tipos
// =============================================================================

type TipoRelatorio = 'conversas' | 'kanban' | 'campanhas';
type FiltroPeriodo = '7d' | '30d' | '90d' | '365d';

// =============================================================================
// Componente Card Metrica
// =============================================================================

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: React.ReactNode;
}

function CardMetrica({ titulo, valor, descricao, icone }: CardMetricaProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className="text-muted-foreground">{icone}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descricao && (
          <p className="text-xs text-muted-foreground">{descricao}</p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Principal
// =============================================================================

export default function Relatorios() {
  const [tipoRelatorio, setTipoRelatorio] = useState<TipoRelatorio>('conversas');
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('30d');

  // Calcular datas baseado no periodo selecionado
  const filtrosDatas = calcularPeriodo(filtroPeriodo);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const {
    data: conversas,
    isLoading: carregandoConversas,
    error: erroConversas,
    refetch: recarregarConversas,
  } = useQuery({
    queryKey: ['relatorios', 'conversas', filtroPeriodo],
    queryFn: () => relatoriosServico.conversas(filtrosDatas),
    enabled: tipoRelatorio === 'conversas',
  });

  const {
    data: kanban,
    isLoading: carregandoKanban,
    error: erroKanban,
    refetch: recarregarKanban,
  } = useQuery({
    queryKey: ['relatorios', 'kanban'],
    queryFn: () => relatoriosServico.kanban(),
    enabled: tipoRelatorio === 'kanban',
  });

  const {
    data: campanhas,
    isLoading: carregandoCampanhas,
    error: erroCampanhas,
    refetch: recarregarCampanhas,
  } = useQuery({
    queryKey: ['relatorios', 'campanhas', filtroPeriodo],
    queryFn: () => relatoriosServico.campanhas(filtrosDatas),
    enabled: tipoRelatorio === 'campanhas',
  });

  // ---------------------------------------------------------------------------
  // Render Conversas
  // ---------------------------------------------------------------------------
  const renderConversas = (dados: RelatorioConversasProcessado) => {
    const { resumo } = dados;

    return (
      <>
        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <CardMetrica
            titulo="Total de Conversas"
            valor={formatarNumero(resumo.total)}
            icone={<MessageSquare className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Abertas"
            valor={formatarNumero(resumo.abertas)}
            icone={<TrendingUp className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Em Atendimento"
            valor={formatarNumero(resumo.emAtendimento)}
            icone={<Clock className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Resolvidas"
            valor={formatarNumero(resumo.resolvidas)}
            icone={<CheckCircle className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Aguardando"
            valor={formatarNumero(resumo.aguardando)}
            icone={<Clock className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Mensagens"
            valor={formatarNumero(resumo.totalMensagens)}
            icone={<Mail className="h-5 w-5" />}
          />
        </div>

        {dados.porConexao.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conversas por Conexao</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dados.porConexao.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">Conexao {item.conexaoId.slice(0, 8)}...</span>
                    <span className="text-muted-foreground">{item._count.id} conversas</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Kanban
  // ---------------------------------------------------------------------------
  const renderKanban = (dados: RelatorioKanbanProcessado) => {
    const { resumo, porQuadro, valorPorColuna } = dados;

    return (
      <>
        <div className="grid gap-4 md:grid-cols-3">
          <CardMetrica
            titulo="Total de Quadros"
            valor={formatarNumero(resumo.totalQuadros)}
            icone={<BarChart3 className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Total de Cartoes"
            valor={formatarNumero(resumo.totalCartoes)}
            icone={<Users className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Valor Total"
            valor={formatarMoeda(resumo.valorTotal)}
            icone={<TrendingUp className="h-5 w-5" />}
          />
        </div>

        {porQuadro.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quadros e Colunas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {porQuadro.map((quadro) => (
                  <div key={quadro.id} className="border-b last:border-0 pb-4">
                    <h4 className="font-semibold mb-3">{quadro.nome}</h4>
                    <div className="grid gap-2 md:grid-cols-4">
                      {quadro.colunas.map((coluna) => (
                        <div key={coluna.id} className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium">{coluna.nome}</p>
                          <p className="text-lg font-bold">{coluna.totalCartoes}</p>
                          <p className="text-xs text-muted-foreground">cartoes</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {Object.keys(valorPorColuna).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Valor por Coluna</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(valorPorColuna).map(([coluna, data]) => (
                  <div key={coluna} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{coluna}</span>
                    <div className="text-right">
                      <p className="font-semibold">{formatarMoeda(data.valor)}</p>
                      <p className="text-xs text-muted-foreground">{data.total} cartoes</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Campanhas
  // ---------------------------------------------------------------------------
  const renderCampanhas = (dados: RelatorioCampanhasProcessado) => {
    const { resumo, envios, topCampanhas } = dados;

    return (
      <>
        <div className="grid gap-4 md:grid-cols-4">
          <CardMetrica
            titulo="Total de Campanhas"
            valor={formatarNumero(resumo.total)}
            icone={<Megaphone className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Concluidas"
            valor={formatarNumero(resumo.concluidas)}
            icone={<CheckCircle className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Em Andamento"
            valor={formatarNumero(resumo.emAndamento)}
            icone={<Clock className="h-5 w-5" />}
          />
          <CardMetrica
            titulo="Agendadas"
            valor={formatarNumero(resumo.agendadas)}
            icone={<Clock className="h-5 w-5" />}
          />
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estatisticas de Envio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <Mail className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                <p className="text-2xl font-bold">{formatarNumero(envios.enviados)}</p>
                <p className="text-sm text-muted-foreground">Enviados</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <CheckCircle className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="text-2xl font-bold">{formatarNumero(envios.entregues)}</p>
                <p className="text-sm text-muted-foreground">Entregues ({envios.taxaEntrega}%)</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <Eye className="h-6 w-6 mx-auto mb-2 text-purple-500" />
                <p className="text-2xl font-bold">{formatarNumero(envios.lidos)}</p>
                <p className="text-sm text-muted-foreground">Lidos ({envios.taxaLeitura}%)</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <AlertCircle className="h-6 w-6 mx-auto mb-2 text-red-500" />
                <p className="text-2xl font-bold">{formatarNumero(envios.erros)}</p>
                <p className="text-sm text-muted-foreground">Erros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {topCampanhas.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Top Campanhas (por envios)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCampanhas.map((campanha, index) => (
                  <div key={campanha.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <span className="font-medium">{campanha.nome}</span>
                    </div>
                    <span className="text-muted-foreground">{campanha._count.logs} envios</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  };

  // ---------------------------------------------------------------------------
  // Render Content
  // ---------------------------------------------------------------------------
  const renderConteudo = () => {
    if (tipoRelatorio === 'conversas') {
      if (carregandoConversas) return <LoadingState variant="page" text="Carregando relatorio..." />;
      if (erroConversas) {
        return (
          <EmptyState
            variant="error"
            title="Erro"
            description="Falha ao carregar relatorio de conversas"
            primaryAction={{ label: 'Tentar novamente', onClick: () => recarregarConversas() }}
          />
        );
      }
      if (!conversas) {
        return (
          <EmptyState
            variant="default"
            title="Sem dados"
            description="Nenhum dado disponivel para o periodo selecionado"
            icon={<BarChart3 className="h-16 w-16" />}
          />
        );
      }
      return renderConversas(conversas);
    }

    if (tipoRelatorio === 'kanban') {
      if (carregandoKanban) return <LoadingState variant="page" text="Carregando relatorio..." />;
      if (erroKanban) {
        return (
          <EmptyState
            variant="error"
            title="Erro"
            description="Falha ao carregar relatorio de kanban"
            primaryAction={{ label: 'Tentar novamente', onClick: () => recarregarKanban() }}
          />
        );
      }
      if (!kanban) {
        return (
          <EmptyState
            variant="default"
            title="Sem dados"
            description="Nenhum dado de kanban disponivel"
            icon={<Users className="h-16 w-16" />}
          />
        );
      }
      return renderKanban(kanban);
    }

    if (tipoRelatorio === 'campanhas') {
      if (carregandoCampanhas) return <LoadingState variant="page" text="Carregando relatorio..." />;
      if (erroCampanhas) {
        return (
          <EmptyState
            variant="error"
            title="Erro"
            description="Falha ao carregar relatorio de campanhas"
            primaryAction={{ label: 'Tentar novamente', onClick: () => recarregarCampanhas() }}
          />
        );
      }
      if (!campanhas) {
        return (
          <EmptyState
            variant="default"
            title="Sem dados"
            description="Nenhuma campanha disponivel"
            icon={<Megaphone className="h-16 w-16" />}
          />
        );
      }
      return renderCampanhas(campanhas);
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <PageLayout
      titulo="Relatorios"
      subtitulo="Analise o desempenho do seu atendimento"
      icone={<FileBarChart className="h-5 w-5" />}
      sidebarWidth="sm"
      sidebar={
        <>
          <CabecalhoSidebar
            titulo="Relatorios"
            subtitulo="Analise de dados"
          />

          <SecaoSidebar titulo="Tipo de Relatorio">
            <ItemSidebar
              icone={<MessageSquare className="h-4 w-4" />}
              label="Conversas"
              ativo={tipoRelatorio === 'conversas'}
              onClick={() => setTipoRelatorio('conversas')}
            />
            <ItemSidebar
              icone={<Users className="h-4 w-4" />}
              label="Kanban"
              ativo={tipoRelatorio === 'kanban'}
              onClick={() => setTipoRelatorio('kanban')}
            />
            <ItemSidebar
              icone={<Megaphone className="h-4 w-4" />}
              label="Campanhas"
              ativo={tipoRelatorio === 'campanhas'}
              onClick={() => setTipoRelatorio('campanhas')}
            />
          </SecaoSidebar>

          <SeparadorSidebar />

          <SecaoSidebar titulo="Periodo">
            <ItemSidebar
              icone={<Clock className="h-4 w-4" />}
              label="Ultimos 7 dias"
              ativo={filtroPeriodo === '7d'}
              onClick={() => setFiltroPeriodo('7d')}
            />
            <ItemSidebar
              icone={<Clock className="h-4 w-4" />}
              label="Ultimos 30 dias"
              ativo={filtroPeriodo === '30d'}
              onClick={() => setFiltroPeriodo('30d')}
            />
            <ItemSidebar
              icone={<Clock className="h-4 w-4" />}
              label="Ultimos 90 dias"
              ativo={filtroPeriodo === '90d'}
              onClick={() => setFiltroPeriodo('90d')}
            />
            <ItemSidebar
              icone={<Clock className="h-4 w-4" />}
              label="Ultimo ano"
              ativo={filtroPeriodo === '365d'}
              onClick={() => setFiltroPeriodo('365d')}
            />
          </SecaoSidebar>
        </>
      }
    >
      {renderConteudo()}
    </PageLayout>
  );
}
