import { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
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
// ID Generator
// =============================================================================

let idContador = 0;
const gerarId = () => `no_${Date.now()}_${idContador++}`;

// =============================================================================
// Canvas Principal
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
  const [nos, setNos, onNosChange] = useNodesState(nosIniciais as unknown as Node[]);
  const [arestas, setArestas, onArestasChange] = useEdgesState(arestasIniciais);
  const [noSelecionado, setNoSelecionado] = useState<{ id: string; data: DadosNo } | null>(null);
  const { screenToFlowPosition, zoomIn, zoomOut, fitView } = useReactFlow();

  // Atualizar nos quando props mudarem
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

  // Handler de conexao entre nos
  const onConectar = useCallback(
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

  // Handler de drop (arrastar da toolbar)
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const tipo = event.dataTransfer.getData('application/reactflow') as TipoNo;
      if (!tipo) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const novoNo: Node = {
        id: gerarId(),
        type: tipo,
        position,
        data: {
          tipo,
          nome: obterNomePadrao(tipo),
          configuracao: obterConfiguracaoPadrao(tipo),
        },
      };

      setNos((nds) => nds.concat(novoNo));
    },
    [screenToFlowPosition, setNos]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  // Handler para adicionar no via clique na toolbar
  const handleAdicionarNo = useCallback(
    (tipo: TipoNo) => {
      const novoNo: Node = {
        id: gerarId(),
        type: tipo,
        position: { x: 250, y: nos.length * 100 + 50 },
        data: {
          tipo,
          nome: obterNomePadrao(tipo),
          configuracao: obterConfiguracaoPadrao(tipo),
        },
      };

      setNos((nds) => nds.concat(novoNo));
    },
    [nos.length, setNos]
  );

  // Handler de selecao de no
  const onNoClick = useCallback((_: React.MouseEvent, no: Node) => {
    setNoSelecionado({
      id: no.id,
      data: no.data as unknown as DadosNo,
    });
  }, []);

  const onPaneClick = useCallback(() => {
    setNoSelecionado(null);
  }, []);

  // Handler de atualizacao de no
  const handleAtualizarNo = useCallback(
    (id: string, dados: Partial<DadosNo>) => {
      setNos((nds) =>
        nds.map((no) => {
          if (no.id === id) {
            const dadosAtuais = no.data as unknown as DadosNo;
            return {
              ...no,
              data: {
                ...dadosAtuais,
                ...dados,
                configuracao: {
                  ...dadosAtuais.configuracao,
                  ...(dados.configuracao || {}),
                },
              },
            };
          }
          return no;
        })
      );
      // Atualizar o no selecionado também
      if (noSelecionado?.id === id) {
        setNoSelecionado((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            data: {
              ...prev.data,
              ...dados,
              configuracao: {
                ...prev.data.configuracao,
                ...(dados.configuracao || {}),
              },
            },
          };
        });
      }
    },
    [setNos, noSelecionado?.id]
  );

  // Handler de exclusao de no
  const handleExcluirNo = useCallback(
    (id: string) => {
      setNos((nds) => nds.filter((no) => no.id !== id));
      setArestas((eds) => eds.filter((ed) => ed.source !== id && ed.target !== id));
      setNoSelecionado(null);
    },
    [setNos, setArestas]
  );

  // Handler de salvar
  const handleSalvar = useCallback(() => {
    if (onSalvar) {
      const nosConvertidos = nos.map((no) => ({
        id: no.id,
        type: no.type as TipoNo,
        position: no.position,
        data: no.data as unknown as DadosNo,
      }));
      onSalvar(nosConvertidos, arestas as ArestaFluxo[]);
    }
  }, [nos, arestas, onSalvar]);

  return (
    <div className={cn('flex h-full', className)}>
      <div ref={reactFlowWrapper} className="flex-1 relative">
        <ReactFlow
          nodes={nos}
          edges={arestas}
          onNodesChange={onNosChange}
          onEdgesChange={onArestasChange}
          onConnect={onConectar}
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

          {/* Barra de Ferramentas (canto superior esquerdo) */}
          {!somenteLeitura && (
            <Panel position="top-left">
              <BarraFerramentas onAdicionarNo={handleAdicionarNo} />
            </Panel>
          )}

          {/* Controles Customizados (canto superior direito) */}
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
          onAtualizar={handleAtualizarNo}
          onFechar={() => setNoSelecionado(null)}
          onExcluir={handleExcluirNo}
        />
      )}
    </div>
  );
}

// =============================================================================
// Helpers
// =============================================================================

function obterNomePadrao(tipo: TipoNo): string {
  const nomes: Record<TipoNo, string> = {
    INICIO: 'Inicio do Fluxo',
    MENSAGEM: 'Nova Mensagem',
    PERGUNTA: 'Nova Pergunta',
    MENU: 'Novo Menu',
    CONDICAO: 'Nova Condicao',
    TRANSFERIR: 'Transferir',
    WEBHOOK: 'Webhook',
    ESPERAR: 'Esperar',
    ACAO: 'Nova Acao',
    FIM: 'Fim do Fluxo',
  };
  return nomes[tipo] || 'Novo No';
}

function obterConfiguracaoPadrao(tipo: TipoNo): Record<string, unknown> {
  switch (tipo) {
    case 'MENSAGEM':
      return { mensagem: '' };
    case 'PERGUNTA':
      return { mensagem: '', variavel: '', validacao: 'TEXTO' };
    case 'MENU':
      return { mensagem: '', opcoes: [{ texto: 'Opcao 1', valor: '1' }] };
    case 'CONDICAO':
      return { condicoes: [] };
    case 'TRANSFERIR':
      return { equipeId: '', usuarioId: '', mensagem: '' };
    case 'WEBHOOK':
      return { url: '', metodo: 'POST', headers: {}, body: '' };
    case 'ESPERAR':
      return { duracao: 5, unidade: 'segundos' };
    default:
      return {};
  }
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
