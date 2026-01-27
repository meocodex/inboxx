import { memo } from 'react';
import { MoreHorizontal, User, DollarSign, GripVertical } from 'lucide-react';
import { cn } from '@/utilitarios/cn';
import { formatarMoeda } from '@/utilitarios/formatadores';
import { Button } from '@/componentes/ui/button';
import { Card, CardContent } from '@/componentes/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/componentes/ui/dropdown-menu';
import type { Cartao } from '@/tipos';

// =============================================================================
// Tipos
// =============================================================================

interface CartaoKanbanProps {
  cartao: Cartao;
  onEditar: (cartao: Cartao) => void;
  onExcluir: (id: string) => void;
  isDragging?: boolean;
}

// =============================================================================
// Componente
// =============================================================================

export const CartaoKanban = memo(({
  cartao,
  onEditar,
  onExcluir,
  isDragging = false,
}: CartaoKanbanProps) => {
  return (
    <Card
      className={cn(
        'cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg'
      )}
      draggable
      data-cartao-id={cartao.id}
    >
      <CardContent className="p-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
            <h4 className="font-medium text-sm leading-tight">{cartao.titulo}</h4>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditar(cartao)}>
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onExcluir(cartao.id)}
                className="text-destructive"
              >
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Descrição */}
        {cartao.descricao && (
          <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
            {cartao.descricao}
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t">
          {/* Contato */}
          {cartao.contato ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="truncate max-w-[100px]">{cartao.contato.nome}</span>
            </div>
          ) : (
            <span />
          )}

          {/* Valor */}
          {cartao.valor != null && cartao.valor > 0 && (
            <div className="flex items-center gap-1 text-xs font-medium text-green-600">
              <DollarSign className="h-3 w-3" />
              {formatarMoeda(cartao.valor)}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

CartaoKanban.displayName = 'CartaoKanban';
