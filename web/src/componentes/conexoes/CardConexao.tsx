import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Wifi,
  WifiOff,
  QrCode,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import { Card, CardContent } from '@/componentes/ui/card';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/componentes/ui/popover';
import { conexoesServico } from '@/servicos';
import { useToast } from '@/hooks';
import { formatarData } from '@/utilitarios/formatadores';
import { QRCodeViewer } from './QRCodeViewer';
import {
  CANAL_CONFIG,
  STATUS_CONFIG,
  PROVEDOR_CONFIG,
  suportaQRCode,
  precisaQRCode,
} from './conexoes.config';
import type { CanalConexaoResumo, StatusCanalConexao } from '@/tipos/conexao.tipos';

// =============================================================================
// Props
// =============================================================================

interface CardConexaoProps {
  conexao: CanalConexaoResumo;
  onClick?: () => void;
}

// =============================================================================
// Componente
// =============================================================================

export function CardConexao({ conexao, onClick }: CardConexaoProps) {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();

  const [isHovered, setIsHovered] = useState(false);
  const [qrPopoverAberto, setQrPopoverAberto] = useState(false);
  const [statusLocal, setStatusLocal] = useState<StatusCanalConexao>(conexao.status);

  const canal = CANAL_CONFIG[conexao.canal];
  const status = STATUS_CONFIG[statusLocal];
  const provedor = PROVEDOR_CONFIG[conexao.provedor];
  const CanalIcon = canal.icone;

  const mostraQR = precisaQRCode(statusLocal, conexao.provedor);
  const podeReconectar = suportaQRCode(conexao.provedor) &&
    (statusLocal === 'DESCONECTADO' || statusLocal === 'ERRO');

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const reconectarMutation = useMutation({
    mutationFn: () => conexoesServico.reconectar(conexao.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conexoes'] });
      mostrarSucesso('Reconectando', 'Aguarde o novo QR Code');
      setStatusLocal('AGUARDANDO_QR');
      setQrPopoverAberto(true);
    },
    onError: () => mostrarErro('Erro', 'Não foi possível reconectar'),
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleQRClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQrPopoverAberto(true);
  };

  const handleReconectar = (e: React.MouseEvent) => {
    e.stopPropagation();
    reconectarMutation.mutate();
  };

  const handleStatusChange = (novoStatus: StatusCanalConexao) => {
    setStatusLocal(novoStatus);
    queryClient.invalidateQueries({ queryKey: ['conexoes'] });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <Card
      className={`
        cursor-pointer transition-all duration-200
        ${isHovered ? 'shadow-lg border-border/80' : 'shadow-sm'}
        ${!conexao.ativa ? 'opacity-60' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header: Ícone + Nome + Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div style={{ color: canal.cor }} className="shrink-0">
              <CanalIcon className="h-8 w-8" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{conexao.nome}</h3>
              <p className="text-sm text-muted-foreground">{provedor.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={status.variant} className="text-xs shrink-0">
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Status de conexão */}
        <div className="flex items-center gap-2 text-sm">
          {statusLocal === 'CONECTADO' ? (
            <Wifi className="h-4 w-4 text-green-500" />
          ) : (
            <WifiOff className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-muted-foreground">
            {conexao.ultimaSincronizacao
              ? `Sincronizado ${formatarData(conexao.ultimaSincronizacao, 'relative')}`
              : 'Nunca sincronizado'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Ações Rápidas */}
        <div className="flex items-center gap-2">
          {/* Botão QR Code */}
          {mostraQR && (
            <Popover open={qrPopoverAberto} onOpenChange={setQrPopoverAberto}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleQRClick}
                  className="flex-1"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Code
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4" align="start">
                <QRCodeViewer
                  conexaoId={conexao.id}
                  status={statusLocal}
                  onStatusChange={handleStatusChange}
                  tamanho="sm"
                />
              </PopoverContent>
            </Popover>
          )}

          {/* Botão Reconectar */}
          {podeReconectar && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReconectar}
              disabled={reconectarMutation.isPending}
              className={mostraQR ? '' : 'flex-1'}
            >
              {reconectarMutation.isPending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Reconectar
            </Button>
          )}

          {/* Botão Ver Detalhes */}
          <Button
            variant="outline"
            size="sm"
            className={mostraQR || podeReconectar ? '' : 'flex-1'}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Ver Detalhes
          </Button>

          {/* Menu de mais opções */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onClick}>
                Ver Detalhes
              </DropdownMenuItem>
              {suportaQRCode(conexao.provedor) && (
                <DropdownMenuItem onClick={() => setQrPopoverAberto(true)}>
                  Ver QR Code
                </DropdownMenuItem>
              )}
              {podeReconectar && (
                <DropdownMenuItem onClick={() => reconectarMutation.mutate()}>
                  Reconectar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
