import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Play, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/componentes/ui/button';
import { Badge } from '@/componentes/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/componentes/ui/dialog';
import { CanvasFluxo, type NoFluxo, type ArestaFluxo, type TipoNo } from '@/componentes/chatbot';
import { chatbotServico } from '@/servicos/chatbot.servico';
import { useToast } from '@/hooks/useToast';

// =============================================================================
// Tipos
// =============================================================================

interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
}

// =============================================================================
// Componente Editor de Fluxo
// =============================================================================

export default function EditorFluxo() {
  const { id: fluxoId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [nos, setNos] = useState<NoFluxo[]>([]);
  const [arestas, setArestas] = useState<ArestaFluxo[]>([]);
  const [dialogValidacao, setDialogValidacao] = useState(false);
  const [resultadoValidacao, setResultadoValidacao] = useState<ResultadoValidacao | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Buscar fluxo
  const { data: fluxo, isLoading: carregandoFluxo } = useQuery({
    queryKey: ['chatbot', 'fluxo', fluxoId],
    queryFn: () => chatbotServico.obterFluxo(fluxoId!),
    enabled: !!fluxoId,
  });

  // Buscar nos
  const { data: nosData, isLoading: carregandoNos } = useQuery({
    queryKey: ['chatbot', 'fluxo', fluxoId, 'nos'],
    queryFn: () => chatbotServico.listarNos(fluxoId!),
    enabled: !!fluxoId,
  });

  // Buscar transicoes
  const { data: transicoesData, isLoading: carregandoTransicoes } = useQuery({
    queryKey: ['chatbot', 'fluxo', fluxoId, 'transicoes'],
    queryFn: () => chatbotServico.listarTransicoes(fluxoId!),
    enabled: !!fluxoId,
  });

  // Converter dados do backend para formato do React Flow
  useEffect(() => {
    if (nosData?.dados) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const nosConvertidos: NoFluxo[] = (nosData.dados as any[]).map((no) => ({
        id: no.id,
        type: no.tipo as TipoNo,
        position: { x: no.posicaoX || 0, y: no.posicaoY || 0 },
        data: {
          tipo: no.tipo,
          nome: no.nome || '',
          configuracao: no.configuracao || {},
        },
      }));
      setNos(nosConvertidos);
    }
  }, [nosData]);

  useEffect(() => {
    if (transicoesData?.dados) {
      const arestasConvertidas: ArestaFluxo[] = transicoesData.dados.map((t: {
        id: string;
        noOrigemId: string;
        noDestinoId: string;
        evento: string;
        condicao?: Record<string, unknown>;
      }) => ({
        id: t.id,
        source: t.noOrigemId,
        target: t.noDestinoId,
        type: 'smoothstep',
        animated: true,
        style: { strokeWidth: 2 },
        data: {
          evento: t.evento,
          condicao: t.condicao,
        },
      }));
      setArestas(arestasConvertidas);
    }
  }, [transicoesData]);

  // Mutation para sincronizar transicoes
  const sincronizarMutation = useMutation({
    mutationFn: (dados: {
      transicoes: Array<{
        noOrigemId: string;
        noDestinoId: string;
        evento: string;
        condicao?: Record<string, unknown>;
      }>;
    }) => chatbotServico.sincronizarTransicoes(fluxoId!, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxo', fluxoId, 'transicoes'] });
    },
  });

  // Mutation para atualizar posicoes dos nos
  const atualizarPosicoesMutation = useMutation({
    mutationFn: (dados: {
      posicoes: Array<{ id: string; posicaoX: number; posicaoY: number }>;
    }) => chatbotServico.atualizarPosicoes(fluxoId!, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxo', fluxoId, 'nos'] });
    },
  });

  // Mutation para compilar
  const compilarMutation = useMutation({
    mutationFn: () => chatbotServico.compilarFluxo(fluxoId!),
    onSuccess: () => {
      toast({
        titulo: 'Sucesso',
        descricao: 'Fluxo compilado com sucesso!',
        variante: 'success',
      });
      queryClient.invalidateQueries({ queryKey: ['chatbot', 'fluxo', fluxoId] });
    },
    onError: () => {
      toast({
        titulo: 'Erro',
        descricao: 'Erro ao compilar fluxo',
        variante: 'destructive',
      });
    },
  });

  // Mutation para validar
  const validarMutation = useMutation({
    mutationFn: () => chatbotServico.validarFluxo(fluxoId!),
    onSuccess: (resultado) => {
      setResultadoValidacao(resultado);
      setDialogValidacao(true);
    },
    onError: () => {
      toast({
        titulo: 'Erro',
        descricao: 'Erro ao validar fluxo',
        variante: 'destructive',
      });
    },
  });

  // Handler de salvar
  const handleSalvar = useCallback(
    async (nosAtualizados: NoFluxo[], arestasAtualizadas: ArestaFluxo[]) => {
      if (!fluxoId) return;

      setSalvando(true);
      try {
        // Atualizar posicoes dos nos
        const posicoes = nosAtualizados.map((no) => ({
          id: no.id,
          posicaoX: no.position.x,
          posicaoY: no.position.y,
        }));
        await atualizarPosicoesMutation.mutateAsync({ posicoes });

        // Sincronizar transicoes
        const transicoes = arestasAtualizadas.map((aresta) => ({
          noOrigemId: aresta.source,
          noDestinoId: aresta.target,
          evento: aresta.data?.evento || 'PROXIMO',
          condicao: aresta.data?.condicao,
        }));
        await sincronizarMutation.mutateAsync({ transicoes });

        toast({
          titulo: 'Sucesso',
          descricao: 'Fluxo salvo com sucesso!',
          variante: 'success',
        });
      } catch {
        toast({
          titulo: 'Erro',
          descricao: 'Erro ao salvar fluxo',
          variante: 'destructive',
        });
      } finally {
        setSalvando(false);
      }
    },
    [fluxoId, atualizarPosicoesMutation, sincronizarMutation, toast]
  );

  // Handler de compilar
  const handleCompilar = useCallback(() => {
    compilarMutation.mutate();
  }, [compilarMutation]);

  // Handler de validar
  const handleValidar = useCallback(() => {
    validarMutation.mutate();
  }, [validarMutation]);

  const carregando = carregandoFluxo || carregandoNos || carregandoTransicoes;

  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Cabecalho */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/chatbot')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-semibold">{fluxo?.nome || 'Editor de Fluxo'}</h1>
            <p className="text-xs text-muted-foreground">
              Arraste os blocos para criar o fluxo do chatbot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {fluxo?.status && (
            <Badge variant={fluxo.status === 'ATIVO' ? 'default' : 'secondary'}>
              {fluxo.status}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleValidar}
            disabled={validarMutation.isPending}
          >
            {validarMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Validar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCompilar}
            disabled={compilarMutation.isPending}
          >
            {compilarMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Compilar
          </Button>

          <Button size="sm" onClick={() => handleSalvar(nos, arestas)} disabled={salvando}>
            {salvando ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <main className="flex-1">
        <CanvasFluxo
          fluxoId={fluxoId!}
          nosIniciais={nos}
          arestasIniciais={arestas}
          onSalvar={handleSalvar}
          onCompilar={handleCompilar}
          onValidar={handleValidar}
        />
      </main>

      {/* Dialog de Validacao */}
      <Dialog open={dialogValidacao} onOpenChange={setDialogValidacao}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {resultadoValidacao?.valido ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Fluxo Valido
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Problemas Encontrados
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {resultadoValidacao?.valido
                ? 'O fluxo esta pronto para ser compilado e ativado.'
                : 'Corrija os problemas abaixo antes de continuar.'}
            </DialogDescription>
          </DialogHeader>

          {resultadoValidacao?.erros && resultadoValidacao.erros.length > 0 && (
            <div className="space-y-2 mt-4">
              {resultadoValidacao.erros.map((erro, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {erro}
                </div>
              ))}
            </div>
          )}

          {resultadoValidacao?.valido && (
            <div className="mt-4">
              <Button onClick={handleCompilar} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                Compilar Agora
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
