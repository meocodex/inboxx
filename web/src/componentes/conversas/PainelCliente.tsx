import { memo, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MoreHorizontal,
  Building2,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { formatarTempoRelativo } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/componentes/ui/avatar';
import { Badge } from '@/componentes/ui/badge';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Separator } from '@/componentes/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { IconeCanal } from './IconeCanal';
import { TipoCanal } from '@/tipos';
import type { Contato, Conversa, Etiqueta, EstatisticasContato, InteracaoRecente } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface PainelClienteProps {
  contato: Contato | null;
  conversa: Conversa | null;
  estatisticas?: EstatisticasContato;
  interacoes?: InteracaoRecente[];
  onFechar: () => void;
  onAtualizarContato?: (dados: Partial<Contato>) => void;
  onAdicionarNota?: (conteudo: string) => void;
  onAdicionarEtiqueta?: () => void;
}

// =============================================================================
// Dados Mock para Demonstracao
// =============================================================================

const estatisticasMock: EstatisticasContato = {
  totalAtendimentos: 47,
  atendimentosAbertos: 2,
  tempoMedioResposta: '8min',
};

const interacoesMock: InteracaoRecente[] = [
  { id: '1', tipo: TipoCanal.WHATSAPP, data: new Date().toISOString(), descricao: 'Conversa atual' },
  { id: '2', tipo: TipoCanal.WHATSAPP, data: new Date(Date.now() - 86400000).toISOString(), descricao: 'Duvida sobre produto' },
  { id: '3', tipo: TipoCanal.INSTAGRAM, data: new Date(Date.now() - 172800000).toISOString(), descricao: 'Solicitacao de orcamento' },
];

// =============================================================================
// Componente Secao
// =============================================================================

interface SecaoProps {
  titulo: string;
  children: React.ReactNode;
  acao?: React.ReactNode;
}

const Secao = memo(({ titulo, children, acao }: SecaoProps) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-conv-text-muted">
        {titulo}
      </h4>
      {acao}
    </div>
    {children}
  </div>
));
Secao.displayName = 'Secao';

// =============================================================================
// Componente Principal
// =============================================================================

export const PainelCliente = memo(({
  contato,
  conversa,
  estatisticas: _estatisticas = estatisticasMock,
  interacoes = interacoesMock,
  onFechar,
  onAdicionarEtiqueta,
}: PainelClienteProps) => {
  const [notaInterna, setNotaInterna] = useState('Cliente VIP - sempre muito educada. Prefere WhatsApp.');

  if (!contato) {
    return (
      <div className="h-full flex items-center justify-center bg-conv-bg-secondary text-conv-text-muted">
        <p className="text-sm">Selecione uma conversa</p>
      </div>
    );
  }

  const iniciais = contato.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const canalAtual = conversa?.canal?.canal as TipoCanal | undefined;

  return (
    <div className="flex flex-col h-full bg-conv-bg-secondary">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-conv-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-conv-text-muted">
          Detalhes do Cliente
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onFechar}
          className="h-7 w-7 text-conv-text-muted hover:text-conv-text-primary"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Avatar e Info Principal */}
          <div className="flex flex-col items-center text-center">
            <Avatar className="h-16 w-16 ring-4 ring-conv-accent/20">
              <AvatarImage src={contato.avatarUrl || undefined} />
              <AvatarFallback
                className="text-lg font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #00d67d, #00a86b)',
                  color: 'white',
                }}
              >
                {iniciais}
              </AvatarFallback>
            </Avatar>

            <h2 className="mt-3 text-base font-semibold text-conv-text-primary">
              {contato.nome}
            </h2>

            <p className="text-sm text-conv-text-secondary">
              Cliente desde Jan 2024
            </p>
          </div>

          {/* Acoes Rapidas */}
          <div className="flex items-center justify-center gap-2">
            {canalAtual && (
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  'h-9 w-9 rounded-conv-md border-conv-border',
                  'hover:bg-conv-bg-hover'
                )}
              >
                <IconeCanal canal={canalAtual} tamanho="sm" />
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-conv-md border-conv-border hover:bg-conv-bg-hover"
            >
              <Phone className="h-4 w-4 text-conv-text-secondary" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 rounded-conv-md border-conv-border hover:bg-conv-bg-hover"
            >
              <Mail className="h-4 w-4 text-conv-text-secondary" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-conv-md border-conv-border hover:bg-conv-bg-hover"
                >
                  <MoreHorizontal className="h-4 w-4 text-conv-text-secondary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem>Ver perfil completo</DropdownMenuItem>
                <DropdownMenuItem>Editar contato</DropdownMenuItem>
                <DropdownMenuItem>Bloquear</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <Separator className="bg-conv-border" />

          {/* Informacoes */}
          <Secao titulo="Informacoes">
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-conv-md bg-conv-bg-tertiary">
                <Phone className="h-4 w-4 text-conv-text-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-conv-text-muted">Telefone</p>
                  <p className="text-sm text-conv-text-primary truncate">
                    {contato.telefone || '+55 11 99999-0000'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2 rounded-conv-md bg-conv-bg-tertiary">
                <Mail className="h-4 w-4 text-conv-text-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-conv-text-muted">Email</p>
                  <p className="text-sm text-conv-text-primary truncate">
                    {contato.email || 'maria@email.com'}
                  </p>
                </div>
              </div>

              {canalAtual && (
                <div className="flex items-center gap-3 p-2 rounded-conv-md bg-conv-bg-tertiary">
                  <IconeCanal canal={canalAtual} tamanho="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-conv-text-muted">Canal</p>
                    <p className="text-sm text-conv-text-primary">
                      {canalAtual === TipoCanal.WHATSAPP && 'WhatsApp Vendas'}
                      {canalAtual === TipoCanal.INSTAGRAM && 'Instagram'}
                      {canalAtual === TipoCanal.FACEBOOK && 'Facebook'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-2 rounded-conv-md bg-conv-bg-tertiary">
                <Building2 className="h-4 w-4 text-conv-text-muted" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-conv-text-muted">Localizacao</p>
                  <p className="text-sm text-conv-text-primary">Sao Paulo, SP</p>
                </div>
              </div>
            </div>
          </Secao>

          <Separator className="bg-conv-border" />

          {/* Tags */}
          <Secao
            titulo="Tags"
            acao={
              <Button
                variant="ghost"
                size="sm"
                onClick={onAdicionarEtiqueta}
                className="h-6 px-2 text-xs text-conv-text-muted hover:text-conv-accent"
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar
              </Button>
            }
          >
            <div className="flex flex-wrap gap-1.5">
              {contato.etiquetas && contato.etiquetas.length > 0 ? (
                contato.etiquetas.map((etiqueta: Etiqueta) => (
                  <Badge
                    key={etiqueta.id}
                    variant="outline"
                    className="text-xs rounded-conv-full"
                    style={{
                      borderColor: etiqueta.cor,
                      color: etiqueta.cor,
                      backgroundColor: `${etiqueta.cor}15`,
                    }}
                  >
                    {etiqueta.nome}
                  </Badge>
                ))
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className="text-xs rounded-conv-full border-amber-500 text-amber-500 bg-amber-500/15"
                  >
                    VIP
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs rounded-conv-full border-blue-500 text-blue-500 bg-blue-500/15"
                  >
                    Comprador frequente
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs rounded-conv-full border-conv-accent text-conv-accent bg-conv-accent/15"
                  >
                    Sao Paulo
                  </Badge>
                </>
              )}
            </div>
          </Secao>

          <Separator className="bg-conv-border" />

          {/* Historico */}
          <Secao titulo="Historico">
            <div className="space-y-2">
              {interacoes.slice(0, 3).map((interacao) => (
                <div
                  key={interacao.id}
                  className="flex items-center gap-3 p-2 rounded-conv-md bg-conv-bg-tertiary hover:bg-conv-bg-hover cursor-pointer transition-colors"
                >
                  <IconeCanal canal={interacao.tipo} tamanho="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-conv-text-primary truncate">
                      {interacao.descricao || 'Interacao'}
                    </p>
                    <p className="text-xs text-conv-text-muted">
                      {formatarTempoRelativo(interacao.data)}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-conv-text-muted" />
                </div>
              ))}

              <Button
                variant="ghost"
                className="w-full h-8 text-xs text-conv-text-muted hover:text-conv-accent"
              >
                Ver historico completo
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </Secao>

          <Separator className="bg-conv-border" />

          {/* Notas Internas */}
          <Secao titulo="Notas Internas">
            <textarea
              value={notaInterna}
              onChange={(e) => setNotaInterna(e.target.value)}
              placeholder="Adicionar nota..."
              className={cn(
                'w-full min-h-[80px] p-3 rounded-conv-md text-sm resize-none',
                'bg-conv-bg-tertiary border border-conv-border',
                'text-conv-text-primary placeholder:text-conv-text-muted',
                'focus:outline-none focus:ring-2 focus:ring-conv-accent/50 focus:border-conv-accent'
              )}
            />
          </Secao>
        </div>
      </ScrollArea>
    </div>
  );
});

PainelCliente.displayName = 'PainelCliente';
