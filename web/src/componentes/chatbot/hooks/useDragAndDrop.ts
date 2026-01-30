import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';
import type { TipoNo } from '../NoFluxo';

// =============================================================================
// Hook: Drag and Drop
// =============================================================================

export const useDragAndDrop = (onAdicionarNo: (tipo: TipoNo, position: { x: number; y: number }) => void) => {
  const { screenToFlowPosition } = useReactFlow();

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const tipo = event.dataTransfer.getData('application/reactflow') as TipoNo;
      if (!tipo) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      onAdicionarNo(tipo, position);
    },
    [screenToFlowPosition, onAdicionarNo]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  return { onDrop, onDragOver };
};
