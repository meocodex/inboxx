import { useState } from 'react';
import {
  MessageCircle,
  Calendar,
  Smartphone,
  Instagram,
  Facebook,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardContent } from '@/componentes/ui/card';
import { Badge } from '@/componentes/ui/badge';
import { Button } from '@/componentes/ui/button';
import { formatarData } from '@/utilitarios/formatadores';
import type {
  CanalConexaoResumo,
  TipoCanalConexao,
  StatusCanalConexao,
  ProvedorConexao,
} from '@/tipos/conexao.tipos';

// =============================================================================
// Configurações
// =============================================================================

const canalConfig: Record<
  TipoCanalConexao,
  { label: string; cor: string; icone: React.ReactNode }
> = {
  WHATSAPP: {
    label: 'WhatsApp',
    cor: '#25D366',
    icone: <Smartphone className="h-8 w-8" />,
  },
  INSTAGRAM: {
    label: 'Instagram',
    cor: '#E4405F',
    icone: <Instagram className="h-8 w-8" />,
  },
  FACEBOOK: {
    label: 'Facebook',
    cor: '#1877F2',
    icone: <Facebook className="h-8 w-8" />,
  },
};

const statusConfig: Record<
  StatusCanalConexao,
  { label: string; variant: 'default' | 'success' | 'warning' | 'destructive' }
> = {
  CONECTADO: { label: 'Conectado', variant: 'success' },
  DESCONECTADO: { label: 'Desconectado', variant: 'default' },
  AGUARDANDO_QR: { label: 'Aguardando QR', variant: 'warning' },
  ERRO: { label: 'Erro', variant: 'destructive' },
};

const provedorConfig: Record<ProvedorConexao, { label: string }> = {
  META_API: { label: 'Meta Cloud API' },
  UAIZAP: { label: 'UaiZap' },
  GRAPH_API: { label: 'Graph API' },
};

// =============================================================================
// Props
// =============================================================================

interface CardConexaoProps {
  conexao: CanalConexaoResumo;
  onClick?: () => void;
  totalConversas?: number;
  totalMensagensAgendadas?: number;
}

// =============================================================================
// Componente
// =============================================================================

export function CardConexao({
  conexao,
  onClick,
  totalConversas = 0,
  totalMensagensAgendadas = 0,
}: CardConexaoProps) {
  const [isHovered, setIsHovered] = useState(false);

  const canal = canalConfig[conexao.canal];
  const status = statusConfig[conexao.status];
  const provedor = provedorConfig[conexao.provedor];

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
      <CardContent className="p-6 space-y-4">
        {/* Header: Ícone + Nome + Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div style={{ color: canal.cor }}>{canal.icone}</div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate">{conexao.nome}</h3>
              <p className="text-sm text-muted-foreground">{provedor.label}</p>
            </div>
          </div>
          <Badge variant={status.variant} className="text-xs shrink-0 ml-2">
            {status.label}
          </Badge>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Métricas */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {totalConversas} conversas ativas
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {totalMensagensAgendadas} mensagens agendadas
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {conexao.status === 'CONECTADO' ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">
              {conexao.ultimaSincronizacao
                ? `Sincronizado ${formatarData(
                    conexao.ultimaSincronizacao,
                    'relative'
                  )}`
                : 'Nunca sincronizado'}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Botão de ação */}
        <Button
          variant="outline"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          Ver Detalhes
        </Button>
      </CardContent>
    </Card>
  );
}
