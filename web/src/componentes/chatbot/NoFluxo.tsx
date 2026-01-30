import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Play,
  MessageCircle,
  HelpCircle,
  ListOrdered,
  GitBranch,
  ArrowRightLeft,
  Webhook,
  Clock,
  Zap,
  Square,
  CircleDot,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Tipos de No
// =============================================================================

export type TipoNo =
  | 'INICIO'
  | 'MENSAGEM'
  | 'PERGUNTA'
  | 'MENU'
  | 'CONDICAO'
  | 'TRANSFERIR'
  | 'WEBHOOK'
  | 'ESPERAR'
  | 'ACAO'
  | 'FIM';

export interface DadosNo {
  tipo: TipoNo;
  nome: string;
  configuracao: Record<string, unknown>;
}

// Interface simplificada para props do no
interface NoProps {
  data: Record<string, unknown>;
  selected?: boolean;
}

// Helper para extrair dados do no de forma segura
function extrairDadosNo(data: Record<string, unknown>): DadosNo {
  return {
    tipo: (data.tipo as TipoNo) || 'MENSAGEM',
    nome: String(data.nome || ''),
    configuracao: (data.configuracao as Record<string, unknown>) || {},
  };
}

// =============================================================================
// Configuracao por Tipo de No
// =============================================================================

interface ConfiguracaoNo {
  icone: React.ElementType;
  cor: string;
  corBorda: string;
  corFundo: string;
  rotulo: string;
}

const configuracoesNo: Record<TipoNo, ConfiguracaoNo> = {
  INICIO: {
    icone: Play,
    cor: 'text-emerald-600',
    corBorda: 'border-emerald-500',
    corFundo: 'bg-emerald-50',
    rotulo: 'Inicio',
  },
  MENSAGEM: {
    icone: MessageCircle,
    cor: 'text-blue-600',
    corBorda: 'border-blue-500',
    corFundo: 'bg-blue-50',
    rotulo: 'Mensagem',
  },
  PERGUNTA: {
    icone: HelpCircle,
    cor: 'text-purple-600',
    corBorda: 'border-purple-500',
    corFundo: 'bg-purple-50',
    rotulo: 'Pergunta',
  },
  MENU: {
    icone: ListOrdered,
    cor: 'text-amber-600',
    corBorda: 'border-amber-500',
    corFundo: 'bg-amber-50',
    rotulo: 'Menu',
  },
  CONDICAO: {
    icone: GitBranch,
    cor: 'text-orange-600',
    corBorda: 'border-orange-500',
    corFundo: 'bg-orange-50',
    rotulo: 'Condicao',
  },
  TRANSFERIR: {
    icone: ArrowRightLeft,
    cor: 'text-cyan-600',
    corBorda: 'border-cyan-500',
    corFundo: 'bg-cyan-50',
    rotulo: 'Transferir',
  },
  WEBHOOK: {
    icone: Webhook,
    cor: 'text-rose-600',
    corBorda: 'border-rose-500',
    corFundo: 'bg-rose-50',
    rotulo: 'Webhook',
  },
  ESPERAR: {
    icone: Clock,
    cor: 'text-slate-600',
    corBorda: 'border-slate-500',
    corFundo: 'bg-slate-50',
    rotulo: 'Esperar',
  },
  ACAO: {
    icone: Zap,
    cor: 'text-violet-600',
    corBorda: 'border-violet-500',
    corFundo: 'bg-violet-50',
    rotulo: 'Acao',
  },
  FIM: {
    icone: Square,
    cor: 'text-red-600',
    corBorda: 'border-red-500',
    corFundo: 'bg-red-50',
    rotulo: 'Fim',
  },
};

// =============================================================================
// Componente No Base
// =============================================================================

function NoBase({ data, selected }: NoProps) {
  const dadosNo = extrairDadosNo(data);
  const config: ConfiguracaoNo = configuracoesNo[dadosNo.tipo] || configuracoesNo.MENSAGEM;
  const Icone = config.icone;
  const isInicio = dadosNo.tipo === 'INICIO';
  const isFim = dadosNo.tipo === 'FIM';

  const nomeExibicao = dadosNo.nome || 'Sem nome';
  const mensagem = dadosNo.configuracao?.mensagem ? String(dadosNo.configuracao.mensagem) : '';
  const opcoes = (dadosNo.configuracao?.opcoes as Array<{ texto: string }>) || [];

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[180px] shadow-sm transition-all',
        config.corBorda,
        config.corFundo,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {!isInicio && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
        />
      )}

      <div className="flex items-center gap-2 mb-1">
        <div className={cn('p-1 rounded', config.corFundo)}>
          <Icone className={cn('h-4 w-4', config.cor)} />
        </div>
        <span className={cn('text-xs font-medium uppercase', config.cor)}>
          {config.rotulo}
        </span>
      </div>

      <div className="font-medium text-sm text-foreground truncate">
        {nomeExibicao}
      </div>

      {dadosNo.tipo === 'MENSAGEM' && mensagem && (
        <div className="mt-2 text-xs text-muted-foreground line-clamp-2">
          {mensagem}
        </div>
      )}

      {dadosNo.tipo === 'MENU' && opcoes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {opcoes.slice(0, 3).map((opcao, i) => (
            <span
              key={i}
              className="text-xs px-2 py-0.5 bg-background rounded border"
            >
              {opcao.texto}
            </span>
          ))}
          {opcoes.length > 3 && (
            <span className="text-xs text-muted-foreground">
              +{opcoes.length - 3}
            </span>
          )}
        </div>
      )}

      {!isFim && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3 !h-3 !bg-primary !border-2 !border-background"
        />
      )}
    </div>
  );
}

// =============================================================================
// No de Condicao (multiplas saidas)
// =============================================================================

function NoCondicao({ data, selected }: NoProps) {
  const dadosNo = extrairDadosNo(data);
  const config: ConfiguracaoNo = configuracoesNo.CONDICAO;
  const Icone = config.icone;
  const condicoes = (dadosNo.configuracao?.condicoes as Array<{ nome: string }>) || [];
  const nomeExibicao = dadosNo.nome || 'Condicao';

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[200px] shadow-sm transition-all',
        config.corBorda,
        config.corFundo,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1 rounded', config.corFundo)}>
          <Icone className={cn('h-4 w-4', config.cor)} />
        </div>
        <span className={cn('text-xs font-medium uppercase', config.cor)}>
          {config.rotulo}
        </span>
      </div>

      <div className="font-medium text-sm text-foreground mb-2">
        {nomeExibicao}
      </div>

      <div className="space-y-1">
        {condicoes.map((cond, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs px-2 py-1 bg-background rounded"
          >
            <CircleDot className="h-3 w-3 text-orange-500" />
            {cond.nome || `Condicao ${i + 1}`}
          </div>
        ))}
        <div className="flex items-center gap-2 text-xs px-2 py-1 bg-background rounded text-muted-foreground">
          <CircleDot className="h-3 w-3" />
          Senao
        </div>
      </div>

      {[...condicoes, { nome: 'senao' }].map((_, i, arr) => {
        const posicao = ((i + 1) / (arr.length + 1)) * 100;
        return (
          <Handle
            key={i}
            id={`saida-${i}`}
            type="source"
            position={Position.Bottom}
            style={{ left: `${posicao}%` }}
            className="!w-3 !h-3 !bg-orange-500 !border-2 !border-background"
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// No de Menu (multiplas saidas)
// =============================================================================

function NoMenu({ data, selected }: NoProps) {
  const dadosNo = extrairDadosNo(data);
  const config: ConfiguracaoNo = configuracoesNo.MENU;
  const Icone = config.icone;
  const opcoes = (dadosNo.configuracao?.opcoes as Array<{ texto: string }>) || [];
  const nomeExibicao = dadosNo.nome || 'Menu';
  const mensagem = dadosNo.configuracao?.mensagem ? String(dadosNo.configuracao.mensagem) : '';

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 min-w-[200px] shadow-sm transition-all',
        config.corBorda,
        config.corFundo,
        selected && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-muted-foreground !border-2 !border-background"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className={cn('p-1 rounded', config.corFundo)}>
          <Icone className={cn('h-4 w-4', config.cor)} />
        </div>
        <span className={cn('text-xs font-medium uppercase', config.cor)}>
          {config.rotulo}
        </span>
      </div>

      <div className="font-medium text-sm text-foreground mb-2">
        {nomeExibicao}
      </div>

      {mensagem && (
        <div className="text-xs text-muted-foreground line-clamp-1 mb-2">
          {mensagem}
        </div>
      )}

      <div className="space-y-1">
        {opcoes.map((opcao, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-xs px-2 py-1 bg-background rounded border"
          >
            <span className="font-medium text-amber-600">{i + 1}.</span>
            {opcao.texto}
          </div>
        ))}
      </div>

      {[...opcoes, { texto: 'invalido' }].map((_, i, arr) => {
        const posicao = ((i + 1) / (arr.length + 1)) * 100;
        return (
          <Handle
            key={i}
            id={`opcao-${i}`}
            type="source"
            position={Position.Bottom}
            style={{ left: `${posicao}%` }}
            className="!w-3 !h-3 !bg-amber-500 !border-2 !border-background"
          />
        );
      })}
    </div>
  );
}

// =============================================================================
// Exportar Tipos de Nos para o React Flow
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const tiposNos: Record<string, React.ComponentType<any>> = {
  INICIO: memo(NoBase),
  MENSAGEM: memo(NoBase),
  PERGUNTA: memo(NoBase),
  MENU: memo(NoMenu),
  CONDICAO: memo(NoCondicao),
  TRANSFERIR: memo(NoBase),
  WEBHOOK: memo(NoBase),
  ESPERAR: memo(NoBase),
  ACAO: memo(NoBase),
  FIM: memo(NoBase),
};

export { configuracoesNo };
