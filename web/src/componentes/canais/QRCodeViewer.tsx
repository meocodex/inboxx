import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { conexoesServico } from '@/servicos';
import type { StatusCanalConexao } from '@/tipos/conexao.tipos';

// =============================================================================
// Tipos
// =============================================================================

interface QRCodeViewerProps {
  conexaoId: string;
  qrcodeInicial?: string | null;
  status: StatusCanalConexao;
  onStatusChange?: (novoStatus: StatusCanalConexao) => void;
  pollingInterval?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

// =============================================================================
// Componente
// =============================================================================

export function QRCodeViewer({
  conexaoId,
  qrcodeInicial,
  status,
  onStatusChange,
  pollingInterval = 5000,
  tamanho = 'md',
}: QRCodeViewerProps) {
  const [qrcodeAtual, setQrcodeAtual] = useState<string | null>(qrcodeInicial || null);
  const [tentativas, setTentativas] = useState(0);
  const MAX_TENTATIVAS = 60; // 5min com polling de 5s

  // Determinar se deve fazer polling
  const deveFazerPolling = status === 'AGUARDANDO_QR' && tentativas < MAX_TENTATIVAS;

  // Query para buscar QR Code
  const {
    data: qrcodeData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['conexoes', conexaoId, 'qrcode'],
    queryFn: () => conexoesServico.obterQRCode(conexaoId),
    enabled: deveFazerPolling, // Continua polling mesmo com QR exibido para detectar conexão
    refetchInterval: deveFazerPolling ? pollingInterval : false,
    retry: 2,
  });

  // Query para verificar status da conexão (polling separado)
  const { data: conexaoAtualizada } = useQuery({
    queryKey: ['conexoes', conexaoId],
    queryFn: () => conexoesServico.obterPorId(conexaoId),
    enabled: status === 'AGUARDANDO_QR',
    refetchInterval: status === 'AGUARDANDO_QR' ? pollingInterval : false,
  });

  // Atualizar QR Code quando receber e verificar status
  useEffect(() => {
    if (qrcodeData?.qrcode) {
      setQrcodeAtual(qrcodeData.qrcode);
    }
    // Se o status retornado pelo endpoint for CONECTADO, notificar imediatamente
    // Isso é mais rápido que esperar o polling separado da conexão
    if (qrcodeData?.status === 'CONECTADO') {
      onStatusChange?.('CONECTADO');
    }
  }, [qrcodeData, onStatusChange]);

  // Monitorar mudança de status
  useEffect(() => {
    if (conexaoAtualizada && conexaoAtualizada.status !== status) {
      onStatusChange?.(conexaoAtualizada.status);
    }
  }, [conexaoAtualizada, status, onStatusChange]);

  // Incrementar tentativas
  useEffect(() => {
    if (deveFazerPolling) {
      const timer = setInterval(() => {
        setTentativas((prev) => prev + 1);
      }, pollingInterval);
      return () => clearInterval(timer);
    }
  }, [deveFazerPolling, pollingInterval]);

  // Handler para atualizar manualmente
  const handleAtualizar = useCallback(() => {
    setTentativas(0);
    setQrcodeAtual(null);
    refetch();
  }, [refetch]);

  // Tamanhos do QR Code
  const tamanhos = {
    sm: 'w-48 h-48',
    md: 'w-64 h-64',
    lg: 'w-80 h-80',
  };

  // Status já conectado
  if (status === 'CONECTADO') {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-green-100 p-4">
          <CheckCircle className="h-12 w-12 text-green-600" />
        </div>
        <div className="text-center">
          <p className="font-medium text-green-700">WhatsApp Conectado!</p>
          <p className="text-sm text-muted-foreground">
            A conexão está funcionando corretamente
          </p>
        </div>
      </div>
    );
  }

  // Timeout - muitas tentativas
  if (tentativas >= MAX_TENTATIVAS && !qrcodeAtual) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-amber-100 p-4">
          <Clock className="h-12 w-12 text-amber-600" />
        </div>
        <div className="text-center">
          <p className="font-medium text-amber-700">Tempo esgotado</p>
          <p className="text-sm text-muted-foreground">
            O QR Code expirou. Clique para gerar um novo.
          </p>
        </div>
        <Button variant="outline" onClick={handleAtualizar}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Gerar Novo QR Code
        </Button>
      </div>
    );
  }

  // Erro
  if (isError && !qrcodeAtual) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="rounded-full bg-red-100 p-4">
          <AlertCircle className="h-12 w-12 text-red-600" />
        </div>
        <div className="text-center">
          <p className="font-medium text-red-700">Erro ao obter QR Code</p>
          <p className="text-sm text-muted-foreground">
            Não foi possível gerar o QR Code. Tente novamente.
          </p>
        </div>
        <Button variant="outline" onClick={handleAtualizar}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Tentar Novamente
        </Button>
      </div>
    );
  }

  // Carregando
  if (isLoading && !qrcodeAtual) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className={`${tamanhos[tamanho]} flex items-center justify-center border rounded-lg bg-muted/30`}>
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
        </div>
        <p className="text-sm text-center text-muted-foreground">
          Gerando QR Code...
        </p>
      </div>
    );
  }

  // Exibir QR Code
  return (
    <div className="flex flex-col items-center gap-4">
      {qrcodeAtual ? (
        <>
          <div className={`${tamanhos[tamanho]} border rounded-lg overflow-hidden bg-white p-2`}>
            <img
              src={qrcodeAtual}
              alt="QR Code WhatsApp"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-medium">
              Escaneie este QR Code com o WhatsApp
            </p>
            <p className="text-xs text-muted-foreground">
              Abra o WhatsApp {'>'} Menu {'>'} Aparelhos Conectados {'>'} Conectar
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleAtualizar}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar QR Code
            </Button>
          </div>
          {deveFazerPolling && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Verificando conexão automaticamente...
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className={`${tamanhos[tamanho]} flex items-center justify-center border rounded-lg bg-muted/30`}>
            <Clock className="h-12 w-12 text-muted-foreground" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Aguardando geração do QR Code...
          </p>
          <Button variant="outline" size="sm" onClick={handleAtualizar}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Gerar QR Code
          </Button>
        </div>
      )}
    </div>
  );
}
