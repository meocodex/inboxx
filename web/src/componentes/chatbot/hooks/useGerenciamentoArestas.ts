import { useCallback } from 'react';
import { useEdgesState, addEdge, type Connection } from '@xyflow/react';
import type { ArestaFluxo } from '../CanvasFluxo';

// =============================================================================
// Hook: Gerenciamento de Arestas
// =============================================================================

export const useGerenciamentoArestas = (arestasIniciais: ArestaFluxo[] = []) => {
  const [arestas, setArestas, onArestasChange] = useEdgesState(arestasIniciais);

  // Conectar nós
  const conectarNos = useCallback(
    (connection: Connection) => {
      const novaAresta: ArestaFluxo = {
        ...connection,
        id: `aresta_${connection.source}_${connection.target}`,
        source: connection.source || '',
        target: connection.target || '',
        type: 'smoothstep',
        animated: true,
        style: { strokeWidth: 2 },
        data: {
          evento: 'PROXIMO',
        },
      };
      setArestas((eds) => addEdge(novaAresta, eds));
    },
    [setArestas]
  );

  // Remover arestas de um nó específico
  const removerArestasDoNo = useCallback(
    (noId: string) => {
      setArestas((eds) => eds.filter((ed) => ed.source !== noId && ed.target !== noId));
    },
    [setArestas]
  );

  return {
    arestas,
    setArestas,
    onArestasChange,
    conectarNos,
    removerArestasDoNo,
  };
};
