import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  MessageSquare,
  Megaphone,
  Kanban,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Clock,
  CalendarDays,
} from 'lucide-react';
import { dashboardServico } from '@/servicos';
import { formatarMoeda, formatarData } from '@/utilitarios/formatadores';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Badge } from '@/componentes/ui/badge';
import {
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  SeparadorSidebar,
  CabecalhoPagina,
  EstadoCarregando,
  EstadoErro,
} from '@/componentes/layout';
import type { DashboardGeral, PontoGrafico, AtividadesRecentes } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

type FiltroPeriodo = '7d' | '15d' | '30d' | '90d';

// =============================================================================
// Componente Card de Metrica
// =============================================================================

interface CardMetricaProps {
  titulo: string;
  valor: string | number;
  descricao?: string;
  icone: React.ReactNode;
  tendencia?: 'up' | 'down' | 'neutral';
  corIcone?: string;
}

function CardMetrica({ titulo, valor, descricao, icone, tendencia, corIcone }: CardMetricaProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{titulo}</CardTitle>
        <div className={corIcone || 'text-muted-foreground'}>{icone}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{valor}</div>
        {descricao && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {tendencia === 'up' && <ArrowUpRight className="h-3 w-3 text-green-500" />}
            {tendencia === 'down' && <ArrowDownRight className="h-3 w-3 text-red-500" />}
            {descricao}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Componente Grafico Simples
// =============================================================================

interface GraficoBarrasProps {
  dados: PontoGrafico[];
}

function GraficoBarras({ dados }: GraficoBarrasProps) {
  const maxValor = Math.max(...dados.map((d) => d.total), 1);

  return (
    <div className="flex h-40 items-end gap-2">
      {dados.map((ponto) => (
        <div key={ponto.data} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t bg-primary transition-all hover:bg-primary/80"
            style={{ height: `${(ponto.total / maxValor) * 100}%`, minHeight: '4px' }}
          />
          <span className="text-xs text-muted-foreground">
            {formatarData(ponto.data, 'dd/MM')}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Componente Dashboard
// =============================================================================

export default function Dashboard() {
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('7d');

  // Queries
  const {
    data: dashboard,
    isLoading: carregandoDashboard,
    error: erroDashboard,
    refetch: recarregarDashboard,
  } = useQuery<DashboardGeral>({
    queryKey: ['dashboard'],
    queryFn: dashboardServico.obterGeral,
  });

  const { data: grafico, isLoading: carregandoGrafico } = useQuery<PontoGrafico[]>({
    queryKey: ['dashboard', 'grafico'],
    queryFn: dashboardServico.obterGraficoConversas,
  });

  const { data: atividades, isLoading: carregandoAtividades } = useQuery<AtividadesRecentes>({
    queryKey: ['dashboard', 'atividades'],
    queryFn: () => dashboardServico.obterAtividades(5),
  });

  // Erro
  if (erroDashboard) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center">
          <EstadoErro
            titulo="Erro ao carregar dashboard"
            mensagem="Nao foi possivel carregar os dados do dashboard."
            onTentarNovamente={() => recarregarDashboard()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar Secundaria - Filtros */}
      <SidebarSecundaria largura="sm">
        <CabecalhoSidebar
          titulo="Dashboard"
          subtitulo="Visao geral"
        />

        <SecaoSidebar titulo="Periodo">
          <ItemSidebar
            icone={<Clock className="h-4 w-4" />}
            label="Ultimos 7 dias"
            ativo={filtroPeriodo === '7d'}
            onClick={() => setFiltroPeriodo('7d')}
          />
          <ItemSidebar
            icone={<Clock className="h-4 w-4" />}
            label="Ultimos 15 dias"
            ativo={filtroPeriodo === '15d'}
            onClick={() => setFiltroPeriodo('15d')}
          />
          <ItemSidebar
            icone={<CalendarDays className="h-4 w-4" />}
            label="Ultimos 30 dias"
            ativo={filtroPeriodo === '30d'}
            onClick={() => setFiltroPeriodo('30d')}
          />
          <ItemSidebar
            icone={<CalendarDays className="h-4 w-4" />}
            label="Ultimos 90 dias"
            ativo={filtroPeriodo === '90d'}
            onClick={() => setFiltroPeriodo('90d')}
          />
        </SecaoSidebar>

        <SeparadorSidebar />

        <SecaoSidebar titulo="Modulos">
          <ItemSidebar
            icone={<MessageSquare className="h-4 w-4" />}
            label="Conversas"
            badge={dashboard?.conversas.abertas}
          />
          <ItemSidebar
            icone={<Users className="h-4 w-4" />}
            label="Contatos"
            badge={dashboard?.contatos.total}
          />
          <ItemSidebar
            icone={<Megaphone className="h-4 w-4" />}
            label="Campanhas"
            badge={dashboard?.campanhas.ativas}
          />
          <ItemSidebar
            icone={<Kanban className="h-4 w-4" />}
            label="Kanban"
            badge={dashboard?.kanban.cartoes}
          />
          <ItemSidebar
            icone={<Calendar className="h-4 w-4" />}
            label="Agenda"
            badge={dashboard?.agenda.compromissosHoje}
          />
        </SecaoSidebar>
      </SidebarSecundaria>

      {/* Conteudo Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <CabecalhoPagina
          titulo="Dashboard"
          subtitulo="Visao geral do seu CRM"
          icone={<LayoutDashboard className="h-5 w-5" />}
        />

        {/* Area de Conteudo */}
        <div className="flex-1 overflow-auto p-6">
          {carregandoDashboard ? (
            <EstadoCarregando texto="Carregando dashboard..." />
          ) : dashboard ? (
            <div className="space-y-6">
              {/* Cards de Metricas */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <CardMetrica
                  titulo="Total de Contatos"
                  valor={dashboard.contatos.total}
                  icone={<Users className="h-5 w-5" />}
                  corIcone="text-blue-500"
                />
                <CardMetrica
                  titulo="Conversas Abertas"
                  valor={dashboard.conversas.abertas}
                  descricao={`${dashboard.conversas.hoje} novas hoje`}
                  icone={<MessageSquare className="h-5 w-5" />}
                  corIcone="text-green-500"
                  tendencia="up"
                />
                <CardMetrica
                  titulo="Campanhas Ativas"
                  valor={dashboard.campanhas.ativas}
                  descricao={`${dashboard.campanhas.total} total`}
                  icone={<Megaphone className="h-5 w-5" />}
                  corIcone="text-orange-500"
                />
                <CardMetrica
                  titulo="Valor no Kanban"
                  valor={formatarMoeda(dashboard.kanban.valorTotal)}
                  descricao={`${dashboard.kanban.cartoes} cartoes`}
                  icone={<Kanban className="h-5 w-5" />}
                  corIcone="text-purple-500"
                />
                <CardMetrica
                  titulo="Compromissos Hoje"
                  valor={dashboard.agenda.compromissosHoje}
                  icone={<Calendar className="h-5 w-5" />}
                  corIcone="text-pink-500"
                />
              </div>

              {/* Grid de Conteudo */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Grafico de Conversas */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">Conversas nos Ultimos 7 Dias</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    {carregandoGrafico ? (
                      <div className="flex h-40 items-center justify-center">
                        <EstadoCarregando />
                      </div>
                    ) : grafico && grafico.length > 0 ? (
                      <GraficoBarras dados={grafico} />
                    ) : (
                      <div className="flex h-40 items-center justify-center text-muted-foreground">
                        Sem dados para exibir
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Atividades Recentes */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Atividades Recentes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {carregandoAtividades ? (
                      <EstadoCarregando />
                    ) : atividades ? (
                      <div className="space-y-4">
                        {atividades.conversas.slice(0, 5).map((conversa) => (
                          <div key={conversa.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <MessageSquare className="h-4 w-4 text-muted-foreground" />
                              <span>{conversa.contato.nome}</span>
                            </div>
                            <Badge variant="outline">{conversa.status}</Badge>
                          </div>
                        ))}
                        {atividades.compromissos.slice(0, 3).map((comp) => (
                          <div key={comp.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span>{comp.titulo}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {formatarData(comp.dataHora, 'HH:mm')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">Nenhuma atividade recente</div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
