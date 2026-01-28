import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MessageSquare,
  Users,
  Megaphone,
  Clock,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { relatoriosServico } from '@/servicos/relatorios.servico';
import { formatarNumero } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Carregando } from '@/componentes/comum/Carregando';
import { ErroMensagem, Vazio } from '@/componentes/comum/ErroMensagem';

// =============================================================================
// Tipos
// =============================================================================

type TipoRelatorio = 'conversas' | 'kanban' | 'campanhas';

// =============================================================================
// Componente Card Métrica
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

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const {
    data: conversas,
    isLoading: carregandoConversas,
    error: erroConversas,
  } = useQuery({
    queryKey: ['relatorios', 'conversas'],
    queryFn: () => relatoriosServico.conversas(),
    enabled: tipoRelatorio === 'conversas',
  });

  const {
    data: kanban,
    isLoading: carregandoKanban,
    error: erroKanban,
  } = useQuery({
    queryKey: ['relatorios', 'kanban'],
    queryFn: () => relatoriosServico.kanban(),
    enabled: tipoRelatorio === 'kanban',
  });

  const {
    data: campanhas,
    isLoading: carregandoCampanhas,
    error: erroCampanhas,
  } = useQuery({
    queryKey: ['relatorios', 'campanhas'],
    queryFn: () => relatoriosServico.campanhas(),
    enabled: tipoRelatorio === 'campanhas',
  });

  // ---------------------------------------------------------------------------
  // Render Content
  // ---------------------------------------------------------------------------
  const renderConteudo = () => {
    if (tipoRelatorio === 'conversas') {
      if (carregandoConversas) return <Carregando tamanho="lg" texto="Carregando..." />;
      if (erroConversas) return <ErroMensagem titulo="Erro" mensagem="Falha ao carregar" />;
      if (!conversas || conversas.length === 0) {
        return <Vazio icone={<BarChart3 className="h-12 w-12" />} titulo="Sem dados" descricao="Nenhum dado disponivel" />;
      }

      const totais = conversas.reduce(
        (acc, c) => ({
          total: acc.total + c.total,
          abertas: acc.abertas + c.abertas,
          encerradas: acc.encerradas + c.encerradas,
        }),
        { total: 0, abertas: 0, encerradas: 0 }
      );

      return (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <CardMetrica
              titulo="Total de Conversas"
              valor={formatarNumero(totais.total)}
              icone={<MessageSquare className="h-5 w-5" />}
            />
            <CardMetrica
              titulo="Conversas Abertas"
              valor={formatarNumero(totais.abertas)}
              icone={<TrendingUp className="h-5 w-5" />}
            />
            <CardMetrica
              titulo="Conversas Encerradas"
              valor={formatarNumero(totais.encerradas)}
              icone={<Clock className="h-5 w-5" />}
            />
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Conversas por Periodo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {conversas.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="font-medium">{item.periodo}</span>
                    <div className="flex gap-6 text-sm">
                      <span>Total: {item.total}</span>
                      <span className="text-green-600">Abertas: {item.abertas}</span>
                      <span className="text-muted-foreground">Encerradas: {item.encerradas}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      );
    }

    if (tipoRelatorio === 'kanban') {
      if (carregandoKanban) return <Carregando tamanho="lg" texto="Carregando..." />;
      if (erroKanban) return <ErroMensagem titulo="Erro" mensagem="Falha ao carregar" />;
      if (!kanban || kanban.length === 0) {
        return <Vazio icone={<Users className="h-12 w-12" />} titulo="Sem dados" descricao="Nenhum dado de kanban" />;
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle>Relatorio Kanban</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {kanban.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.conversasAtendidas} itens | {item.mensagensEnviadas} movimentacoes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">Tempo medio</p>
                    <p className="font-medium">{Math.round(item.tempoMedioResposta / 60)} min</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (tipoRelatorio === 'campanhas') {
      if (carregandoCampanhas) return <Carregando tamanho="lg" texto="Carregando..." />;
      if (erroCampanhas) return <ErroMensagem titulo="Erro" mensagem="Falha ao carregar" />;
      if (!campanhas || campanhas.length === 0) {
        return <Vazio icone={<Megaphone className="h-12 w-12" />} titulo="Sem dados" descricao="Nenhuma campanha" />;
      }

      return (
        <Card>
          <CardHeader>
            <CardTitle>Desempenho das Campanhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {campanhas.map((campanha) => (
                <div key={campanha.campanhaId} className="py-3 border-b last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">{campanha.nome}</p>
                    <span className="text-sm text-green-600">{campanha.taxaSucesso}% sucesso</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Contatos: {campanha.totalContatos}</span>
                    <span>Enviados: {campanha.enviados}</span>
                    <span className="text-destructive">Erros: {campanha.erros}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Relatorios</h1>
        <p className="text-muted-foreground">Analise o desempenho do seu atendimento</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <Button
          variant={tipoRelatorio === 'conversas' ? 'default' : 'outline'}
          onClick={() => setTipoRelatorio('conversas')}
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Conversas
        </Button>
        <Button
          variant={tipoRelatorio === 'kanban' ? 'default' : 'outline'}
          onClick={() => setTipoRelatorio('kanban')}
        >
          <Users className="mr-2 h-4 w-4" />
          Kanban
        </Button>
        <Button
          variant={tipoRelatorio === 'campanhas' ? 'default' : 'outline'}
          onClick={() => setTipoRelatorio('campanhas')}
        >
          <Megaphone className="mr-2 h-4 w-4" />
          Campanhas
        </Button>
      </div>

      {/* Conteúdo */}
      {renderConteudo()}
    </div>
  );
}
