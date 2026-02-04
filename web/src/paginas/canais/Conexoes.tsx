import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Smartphone, RefreshCw } from 'lucide-react';
import { conexoesServico } from '@/servicos';
import { Button } from '@/componentes/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import {
  CabecalhoPagina,
  GridCards,
  EstadoVazio,
  EstadoCarregando,
  EstadoErro,
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

  // ---------------------------------------------------------------------------
  // Erro
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <div className="flex h-full flex-col">
        <CabecalhoPagina
          titulo="Canais"
          subtitulo="Gerencie suas conexões de canais"
          icone={<Smartphone className="h-5 w-5" />}
        />
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
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <CabecalhoPagina
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
      />

      {/* Filtros Tabs Horizontais */}
      <div className="px-6 py-4 border-b">
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

      {/* Area de Conteudo */}
      <div className="flex-1 overflow-auto p-6">
        {carregando ? (
          <EstadoCarregando texto="Carregando conexoes..." />
        ) : conexoesFiltradas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma conexao"
            descricao={
              filtroStatus === 'todas'
                ? 'Crie sua primeira conexao WhatsApp'
                : `Nenhuma conexao com status ${filtroStatus}`
            }
            icone={<Smartphone className="h-16 w-16" />}
            acao={{ label: 'Nova Conexao', onClick: handleNovaConexao }}
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
      </div>

      {/* Dialog Unificado - Criar/Ver/Editar */}
      <DialogConexao
        aberto={dialogAberto}
        onFechar={handleFecharDialog}
        conexaoId={conexaoSelecionada}
        onSucesso={() => recarregar()}
      />
    </div>
  );
}
