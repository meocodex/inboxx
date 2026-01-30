import { useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  type Node,
  ReactFlowProvider,
  useReactFlow,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ZoomIn, ZoomOut, Maximize2, Save, Play } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { cn } from '@/utilitarios/cn';
import { tiposNos, type DadosNo, type TipoNo } from './NoFluxo';
import { BarraFerramentas } from './BarraFerramentas';
import { PainelPropriedades } from './PainelPropriedades';
import { useGerenciamentoNos, useGerenciamentoArestas, useDragAndDrop } from './hooks';
import type { Edge } from '@xyflow/react';

// =============================================================================
// Tipos
// =============================================================================

export interface NoFluxo {
  id: string;
  type: TipoNo;
  position: { x: number; y: number };
  data: DadosNo;
}

export interface ArestaFluxo extends Edge {
  data?: {
    evento: string;
    condicao?: Record<string, unknown>;
  };
}

interface CanvasFluxoProps {
  fluxoId: string;
  nosIniciais?: NoFluxo[];
  arestasIniciais?: ArestaFluxo[];
  onSalvar?: (nos: NoFluxo[], arestas: ArestaFluxo[]) => void;
  onCompilar?: () => void;
  onValidar?: () => void;
  somenteLeitura?: boolean;
  className?: string;
}

// =============================================================================
// Canvas Principal (Refatorado - ~150 linhas)
// =============================================================================

function CanvasFluxoInterno({
  nosIniciais = [],
  arestasIniciais = [],
  onSalvar,
  onValidar,
  somenteLeitura = false,
  className,
}: CanvasFluxoProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  // Hooks customizados
  const {
    nos,
    setNos,
    onNosChange,
    noSelecionado,
    adicionarNo,
    atualizarNo,
    excluirNo,
    selecionarNo,
    converterNosParaSalvar,
  } = useGerenciamentoNos(nosIniciais);

  const {
    arestas,
    setArestas,
    onArestasChange,
    conectarNos,
    removerArestasDoNo,
  } = useGerenciamentoArestas(arestasIniciais);

  const { onDrop, onDragOver } = useDragAndDrop(adicionarNo);

  // Sincronizar com props
  useEffect(() => {
    if (nosIniciais.length > 0) {
      setNos(nosIniciais as unknown as Node[]);
    }
  }, [nosIniciais, setNos]);

  useEffect(() => {
    if (arestasIniciais.length > 0) {
      setArestas(arestasIniciais);
    }
  }, [arestasIniciais, setArestas]);

  // Handlers
  const onNoClick = useCallback(
    (_: React.MouseEvent, no: Node) => selecionarNo(no),
    [selecionarNo]
  );

  const onPaneClick = useCallback(() => selecionarNo(null), [selecionarNo]);

  const handleExcluirNo = useCallback(
    (id: string) => {
      removerArestasDoNo(id);
      excluirNo(id);
    },
    [excluirNo, removerArestasDoNo]
  );

  const handleSalvar = useCallback(() => {
    if (onSalvar) {
      onSalvar(converterNosParaSalvar(), arestas as ArestaFluxo[]);
    }
  }, [converterNosParaSalvar, arestas, onSalvar]);

  return (
    <div className={cn('flex h-full', className)}>
      <div ref={reactFlowWrapper} className="flex-1 relative">
        <ReactFlow
          nodes={nos}
          edges={arestas}
          onNodesChange={onNosChange}
          onEdgesChange={onArestasChange}
          onConnect={conectarNos}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNoClick}
          onPaneClick={onPaneClick}
          nodeTypes={tiposNos}
          fitView
          snapToGrid
          snapGrid={[15, 15]}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { strokeWidth: 2 },
          }}
          proOptions={{ hideAttribution: true }}
          nodesDraggable={!somenteLeitura}
          nodesConnectable={!somenteLeitura}
          elementsSelectable={!somenteLeitura}
        >
          <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="!bg-background border rounded-lg"
          />

          {/* Barra de Ferramentas */}
          {!somenteLeitura && (
            <Panel position="top-left">
              <BarraFerramentas onAdicionarNo={adicionarNo} />
            </Panel>
          )}

          {/* Controles Customizados */}
          <Panel position="top-right">
            <div className="flex items-center gap-2 bg-background border rounded-lg p-1 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomIn()}>
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => zoomOut()}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fitView()}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-border" />
              {onValidar && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onValidar}>
                  <Play className="h-4 w-4" />
                </Button>
              )}
              {onSalvar && !somenteLeitura && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleSalvar}>
                  <Save className="h-4 w-4" />
                </Button>
              )}
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* Painel de Propriedades */}
      {!somenteLeitura && (
        <PainelPropriedades
          no={noSelecionado}
          onAtualizar={atualizarNo}
          onFechar={() => selecionarNo(null)}
          onExcluir={handleExcluirNo}
        />
      )}
    </div>
  );
}

// =============================================================================
// Componente com Provider
// =============================================================================

export function CanvasFluxo(props: CanvasFluxoProps) {
  return (
    <ReactFlowProvider>
      <CanvasFluxoInterno {...props} />
    </ReactFlowProvider>
  );
}
