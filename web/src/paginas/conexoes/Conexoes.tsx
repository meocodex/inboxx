import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Smartphone, RefreshCw } from 'lucide-react';
import { conexoesServico } from '@/servicos';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/componentes/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/componentes/ui/tabs';
import {
  CabecalhoPagina,
  GridCards,
  EstadoVazio,
  EstadoCarregando,
  EstadoErro,
} from '@/componentes/layout';
import {
  CardConexao,
  DetalhesConexao,
  WizardCriacao,
} from '@/componentes/conexoes';
import type { StatusCanalConexao } from '@/tipos/conexao.tipos';

// =============================================================================
// Tipos
// =============================================================================

type FiltroStatus = 'todas' | StatusCanalConexao;

// =============================================================================
// Componente Principal
// =============================================================================

export default function Conexoes() {
  const [modalQRCode, setModalQRCode] = useState<{
    aberto: boolean;
    conexaoId?: string;
  }>({
    aberto: false,
  });
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [conexaoSelecionada, setConexaoSelecionada] = useState<string | null>(
    null
  );
  const [wizardAberto, setWizardAberto] = useState(false);

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

  const { data: qrcodeData, refetch: recarregarQRCode } = useQuery({
    queryKey: ['conexoes', 'qrcode', modalQRCode.conexaoId],
    queryFn: () => conexoesServico.obterQRCode(modalQRCode.conexaoId!),
    enabled: modalQRCode.aberto && !!modalQRCode.conexaoId,
    refetchInterval: 5000,
  });

  // Handlers para novo wizard
  const handleAbrirWizard = () => {
    setWizardAberto(true);
  };

  const handleFecharWizard = () => {
    setWizardAberto(false);
  };

  // ---------------------------------------------------------------------------
  // Erro
  // ---------------------------------------------------------------------------
  if (erro) {
    return (
      <div className="flex h-full flex-col">
        <CabecalhoPagina
          titulo="Conexões"
          subtitulo="Gerencie suas conexões de canais"
          icone={<Smartphone className="h-5 w-5" />}
        />
        <div className="flex-1 flex items-center justify-center">
          <EstadoErro
            titulo="Erro ao carregar conexões"
            mensagem="Não foi possível carregar a lista"
            onTentarNovamente={() => recarregar()}
          />
        </div>
      </div>
    );
  }

  const listaConexoes = conexoes || [];

  // Filtrar conexões
  const conexoesFiltradas = listaConexoes.filter((conexao) => {
    if (filtroStatus !== 'todas' && conexao.status !== filtroStatus)
      return false;
    return true;
  });

  // Contadores
  const contadores = {
    todas: listaConexoes.length,
    CONECTADO: listaConexoes.filter((c) => c.status === 'CONECTADO').length,
    DESCONECTADO: listaConexoes.filter((c) => c.status === 'DESCONECTADO')
      .length,
    AGUARDANDO_QR: listaConexoes.filter((c) => c.status === 'AGUARDANDO_QR')
      .length,
    ERRO: listaConexoes.filter((c) => c.status === 'ERRO').length,
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header Clean */}
      <CabecalhoPagina
        titulo="Conexões"
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
            <Button onClick={handleAbrirWizard}>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conexão
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
            <TabsTrigger value="ERRO">Erro ({contadores.ERRO})</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Área de Conteúdo */}
      <div className="flex-1 overflow-auto p-6">
        {carregando ? (
          <EstadoCarregando texto="Carregando conexões..." />
        ) : conexoesFiltradas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma conexão"
            descricao={
              filtroStatus === 'todas'
                ? 'Crie sua primeira conexão WhatsApp'
                : `Nenhuma conexão com status ${filtroStatus}`
            }
            icone={<Smartphone className="h-16 w-16" />}
            acao={{ label: 'Nova Conexão', onClick: handleAbrirWizard }}
          />
        ) : (
          <GridCards colunas={3}>
            {conexoesFiltradas.map((conexao) => (
              <CardConexao
                key={conexao.id}
                conexao={conexao}
                onClick={() => setConexaoSelecionada(conexao.id)}
                totalConversas={0}
                totalMensagensAgendadas={0}
              />
            ))}
          </GridCards>
        )}
      </div>

      {/* Wizard de Criação */}
      <WizardCriacao
        aberto={wizardAberto}
        onFechar={handleFecharWizard}
        onSucesso={() => {
          recarregar();
          handleFecharWizard();
        }}
      />

      {/* Modal QR Code UaiZap */}
      {modalQRCode.aberto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>QR Code - UaiZap</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {qrcodeData?.qrcode ? (
                <div className="flex flex-col items-center gap-4">
                  <img
                    src={qrcodeData.qrcode}
                    alt="QR Code WhatsApp"
                    className="w-64 h-64 border rounded"
                  />
                  <p className="text-sm text-center text-muted-foreground">
                    Escaneie este QR Code com o WhatsApp do seu celular
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => recarregarQRCode()}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar QR Code
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary" />
                  <p className="text-sm text-center">
                    Aguardando geração do QR Code...
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalQRCode({ aberto: false })}
                >
                  Fechar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal Detalhes */}
      {conexaoSelecionada && (
        <DetalhesConexao
          conexaoId={conexaoSelecionada}
          aberto={!!conexaoSelecionada}
          onFechar={() => setConexaoSelecionada(null)}
        />
      )}
    </div>
  );
}
