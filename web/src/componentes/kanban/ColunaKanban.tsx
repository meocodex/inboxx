import { memo, useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { formatarMoeda } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { ScrollArea } from '@/componentes/ui/scroll-area';
import { Badge } from '@/componentes/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import { CartaoKanban } from './CartaoKanban';
import type { Coluna, Cartao } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface ColunaKanbanProps {
  coluna: Coluna;
  onAdicionarCartao: (colunaId: string) => void;
  onEditarCartao: (cartao: Cartao) => void;
  onExcluirCartao: (cartaoId: string) => void;
  onEditarColuna: (coluna: Coluna) => void;
  onExcluirColuna: (colunaId: string) => void;
  onDropCartao: (cartaoId: string, colunaDestinoId: string, ordem: number) => void;
}

// =============================================================================
// Componente
// =============================================================================

export const ColunaKanban = memo(({
  coluna,
  onAdicionarCartao,
  onEditarCartao,
  onExcluirCartao,
  onEditarColuna,
  onExcluirColuna,
  onDropCartao,
}: ColunaKanbanProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const totalValor = coluna.cartoes.reduce((acc, c) => acc + (c.valor || 0), 0);

  // Handlers de drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const cartaoId = e.dataTransfer.getData('cartaoId');
    if (cartaoId) {
      onDropCartao(cartaoId, coluna.id, coluna.cartoes.length);
    }
  };

  const handleDragStart = (e: React.DragEvent, cartaoId: string) => {
    e.dataTransfer.setData('cartaoId', cartaoId);
  };

  return (
    <div
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-lg bg-muted/50',
        isDragOver && 'ring-2 ring-primary ring-offset-2'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {coluna.cor && (
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: coluna.cor }}
              />
            )}
            <h3 className="font-semibold text-sm">{coluna.nome}</h3>
            <Badge variant="secondary" className="text-xs">
              {coluna.cartoes.length}
            </Badge>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditarColuna(coluna)}>
                Editar coluna
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExcluirColuna(coluna.id)}
                className="text-destructive"
              >
                Excluir coluna
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Total valor */}
        {totalValor > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Total: {formatarMoeda(totalValor)}
          </p>
        )}
      </div>

      {/* Cartões */}
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2">
          {coluna.cartoes
            .sort((a, b) => a.ordem - b.ordem)
            .map((cartao) => (
              <div
                key={cartao.id}
                draggable
                onDragStart={(e) => handleDragStart(e, cartao.id)}
              >
                <CartaoKanban
                  cartao={cartao}
                  onEditar={onEditarCartao}
                  onExcluir={onExcluirCartao}
                />
              </div>
            ))}
        </div>
      </ScrollArea>

      {/* Botão Adicionar */}
      <div className="p-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => onAdicionarCartao(coluna.id)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar cartao
        </Button>
      </div>
    </div>
  );
});

ColunaKanban.displayName = 'ColunaKanban';
