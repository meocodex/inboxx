import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Smartphone, RefreshCw } from 'lucide-react';
import { conexoesServico } from '@/servicos';
import { Button } from '@/componentes/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import {
  PageLayout,
  GridCards,
  EmptyState,
  LoadingState,
} from '@/componentes/layout';
import { CardConexao, DialogConexao } from '@/componentes/canais';
import type { StatusCanalConexao } from '@/tipos/conexao.tipos';

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todas' | StatusCanalConexao;

// =============================================================================
// Componente Principal
// =============================================================================

export default function Conexoes() {
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [dialogAberto, setDialogAberto] = useState(false);
  const [conexaoSelecionada, setConexaoSelecionada] = useState<string | null>(null);

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
  // Handlers
  // ---------------------------------------------------------------------------
  const handleNovaConexao = () => {
    setConexaoSelecionada(null);
    setDialogAberto(true);
  };

  const handleAbrirDetalhes = (conexaoId: string) => {
    setConexaoSelecionada(conexaoId);
    setDialogAberto(true);
  };

  const handleFecharDialog = () => {
    setDialogAberto(false);
    setConexaoSelecionada(null);
  };

  const listaConexoes = conexoes || [];

  // Filtrar conexoes
  const conexoesFiltradas = listaConexoes.filter((conexao) => {
    if (filtroStatus !== 'todas' && conexao.status !== filtroStatus) return false;
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

  return (
    <PageLayout
      titulo="Canais"
      subtitulo="Gerencie suas conexões de canais"
      icone={<Smartphone className="h-5 w-5" />}
      acoes={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => recarregar()}
            disabled={carregando}
          >
            <RefreshCw
              className={`h-4 w-4 ${carregando ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button onClick={handleNovaConexao}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conexao
          </Button>
        </div>
      }
      hideSidebar
    >
      {/* Filtros Tabs Horizontais */}
      <div className="px-6 py-4 border-b -mt-6">
        <Tabs
          value={filtroStatus}
          onValueChange={(value) => setFiltroStatus(value as FiltroStatus)}
        >
          <TabsList>
            <TabsTrigger value="todas">
              Todas ({contadores.todas})
            </TabsTrigger>
            <TabsTrigger value="CONECTADO">
              Conectadas ({contadores.CONECTADO})
            </TabsTrigger>
            <TabsTrigger value="DESCONECTADO">
              Desconectadas ({contadores.DESCONECTADO})
            </TabsTrigger>
            <TabsTrigger value="AGUARDANDO_QR">
              Aguardando QR ({contadores.AGUARDANDO_QR})
            </TabsTrigger>
            <TabsTrigger value="ERRO">
              Erro ({contadores.ERRO})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Estados e conteúdo */}
      {erro ? (
        <EmptyState
          variant="error"
          title="Erro ao carregar conexoes"
          description="Não foi possível carregar a lista"
          primaryAction={{
            label: 'Tentar novamente',
            onClick: () => recarregar(),
          }}
        />
      ) : carregando ? (
        <LoadingState variant="page" text="Carregando conexoes..." />
      ) : conexoesFiltradas.length === 0 ? (
        <EmptyState
          variant="default"
          title="Nenhuma conexao"
          description={
            filtroStatus === 'todas'
              ? 'Crie sua primeira conexao WhatsApp'
              : `Nenhuma conexao com status ${filtroStatus}`
          }
          icon={<Smartphone className="h-16 w-16" />}
          primaryAction={{ label: 'Nova Conexao', onClick: handleNovaConexao }}
        />
      ) : (
          <GridCards colunas={3}>
            {conexoesFiltradas.map((conexao) => (
              <CardConexao
                key={conexao.id}
                conexao={conexao}
                onClick={() => handleAbrirDetalhes(conexao.id)}
              />
            ))}
          </GridCards>
        )}

      {/* Dialog Unificado - Criar/Ver/Editar */}
      <DialogConexao
        aberto={dialogAberto}
        onFechar={handleFecharDialog}
        conexaoId={conexaoSelecionada}
        onSucesso={() => recarregar()}
      />
    </PageLayout>
  );
}
