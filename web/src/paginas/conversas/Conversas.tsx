import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversasServico } from '@/servicos';
import { useToast } from '@/hooks';
import { useUIStore, usePainelInfoAberto } from '@/stores';
import { AppLayout, EmptyState } from '@/componentes/layout';
import { SidebarConversas } from '@/componentes/conversas/SidebarConversas';
import { ListaConversas } from '@/componentes/conversas/ListaConversas';
import { AreaChat } from '@/componentes/conversas/AreaChat';
import { PainelCliente } from '@/componentes/conversas/PainelCliente';
import type { ConversaResumo, Mensagem, TipoMensagem, FiltroSidebar, TipoCanal, Contato } from '@/tipos';

// =============================================================================
// Componente Principal
// =============================================================================

export default function Conversas() {
  const queryClient = useQueryClient();
  const { erro: mostrarErro, sucesso: mostrarSucesso } = useToast();
  const [conversaSelecionadaId, setConversaSelecionadaId] = useState<string | null>(null);

  // Estado da UI
  const painelInfoAberto = usePainelInfoAberto();
  const togglePainelInfo = useUIStore((s) => s.togglePainelInfo);
  const setPainelInfoAberto = useUIStore((s) => s.setPainelInfoAberto);

  // Estado de filtros da sidebar
  const [filtroSidebar, setFiltroSidebar] = useState<FiltroSidebar>('inbox');
  const [canalAtivo, setCanalAtivo] = useState<TipoCanal | null>(null);

  // ---------------------------------------------------------------------------
  // Queries
  // ---------------------------------------------------------------------------
  const {
    data: listaConversas,
    isLoading: carregandoLista,
    error: erroLista,
    refetch: recarregarLista,
  } = useQuery({
    queryKey: ['conversas'],
    queryFn: () => conversasServico.listar({ limite: 50 }),
    refetchInterval: 30000, // Atualizar a cada 30s
  });

  const {
    data: conversaAtual,
    isLoading: carregandoConversa,
  } = useQuery({
    queryKey: ['conversa', conversaSelecionadaId],
    queryFn: () => conversasServico.obterPorId(conversaSelecionadaId!),
    enabled: !!conversaSelecionadaId,
  });

  const {
    data: mensagensData,
    isLoading: carregandoMensagens,
  } = useQuery({
    queryKey: ['mensagens', conversaSelecionadaId],
    queryFn: () => conversasServico.listarMensagens(conversaSelecionadaId!, { limite: 100 }),
    enabled: !!conversaSelecionadaId,
    refetchInterval: 10000, // Atualizar a cada 10s
  });

  // ---------------------------------------------------------------------------
  // Mutations
  // ---------------------------------------------------------------------------
  const enviarMensagemMutation = useMutation({
    mutationFn: (texto: string) =>
      conversasServico.enviarMensagem(conversaSelecionadaId!, {
        tipo: 'TEXTO' as TipoMensagem,
        conteudo: texto,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mensagens', conversaSelecionadaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
    onError: () => {
      mostrarErro('Erro ao enviar', 'Nao foi possivel enviar a mensagem');
    },
  });

  const resolverMutation = useMutation({
    mutationFn: () => conversasServico.resolver(conversaSelecionadaId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversa', conversaSelecionadaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      mostrarSucesso('Conversa resolvida', 'A conversa foi resolvida com sucesso');
    },
    onError: () => {
      mostrarErro('Erro', 'Nao foi possivel resolver a conversa');
    },
  });

  const reabrirMutation = useMutation({
    mutationFn: () => conversasServico.reabrir(conversaSelecionadaId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversa', conversaSelecionadaId] });
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      mostrarSucesso('Conversa reaberta', 'A conversa foi reaberta com sucesso');
    },
    onError: () => {
      mostrarErro('Erro', 'Nao foi possivel reabrir a conversa');
    },
  });

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleSelecionarConversa = useCallback((id: string) => {
    setConversaSelecionadaId(id);
  }, []);

  const handleEnviarMensagem = useCallback((texto: string) => {
    enviarMensagemMutation.mutate(texto);
  }, [enviarMensagemMutation]);

  const handleEncerrar = useCallback(() => {
    resolverMutation.mutate();
  }, [resolverMutation]);

  const handleReabrir = useCallback(() => {
    reabrirMutation.mutate();
  }, [reabrirMutation]);

  const handleFecharPainelInfo = useCallback(() => {
    setPainelInfoAberto(false);
  }, [setPainelInfoAberto]);

  // ---------------------------------------------------------------------------
  // Erro na lista
  // ---------------------------------------------------------------------------
  if (erroLista) {
    return (
      <AppLayout showSidebar={false}>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            variant="error"
            title="Erro ao carregar conversas"
            description="Não foi possível carregar a lista de conversas"
            primaryAction={{
              label: 'Tentar novamente',
              onClick: () => recarregarLista(),
            }}
          />
        </div>
      </AppLayout>
    );
  }

  // ---------------------------------------------------------------------------
  // Preparar dados
  // ---------------------------------------------------------------------------
  const conversas: ConversaResumo[] = (listaConversas?.dados || []).map((c) => ({
    id: c.id,
    status: c.status,
    contato: c.contato,
    ultimaMensagem: c.ultimaMensagem,
    naoLidas: c.naoLidas,
    ultimaMensagemEm: c.ultimaMensagemEm || null,
    atualizadoEm: c.atualizadoEm || c.criadoEm || null,
  }));

  const mensagens: Mensagem[] = mensagensData?.dados || [];

  // Contadores para sidebar
  const contadoresSidebar = {
    inbox: conversas.length,
    chamadas: 0,
    resolvidos: conversas.filter(c => c.status === 'RESOLVIDA').length,
    pendentes: conversas.filter(c => c.status === 'AGUARDANDO').length,
    fixados: 0,
    arquivados: 0,
  };

  const contadoresCanais = {
    whatsapp: conversas.length,
    instagram: 0,
    facebook: 0,
  };

  // Contato completo para o painel
  const contatoCompleto: Contato | null = conversaAtual ? {
    ...conversaAtual.contato,
    ativo: true,
    bloqueado: false,
    observacoes: null,
    clienteId: conversaAtual.clienteId,
    etiquetas: [],
    criadoEm: conversaAtual.criadoEm,
    atualizadoEm: conversaAtual.atualizadoEm,
  } : null;

  // ---------------------------------------------------------------------------
  // Render - Layout especial de 4 colunas
  // ---------------------------------------------------------------------------
  return (
    <AppLayout showSidebar={false}>
      {/* Coluna 1: Sidebar de Conversas - 70px */}
      <SidebarConversas
        filtroAtivo={filtroSidebar}
        onFiltroChange={setFiltroSidebar}
        canalAtivo={canalAtivo}
        onCanalChange={setCanalAtivo}
        contadores={contadoresSidebar}
        contadoresCanais={contadoresCanais}
      />

      {/* Coluna 2: Lista de Conversas - 320px */}
      <div className="w-80 shrink-0 border-r border-border">
        <ListaConversas
          conversas={conversas}
          carregando={carregandoLista}
          conversaSelecionadaId={conversaSelecionadaId}
          onSelecionarConversa={handleSelecionarConversa}
          canalAtivo={canalAtivo}
        />
      </div>

      {/* Coluna 3: Area de Chat - flex-1 */}
      <AreaChat
        conversa={conversaAtual || null}
        mensagens={mensagens}
        carregando={carregandoConversa || carregandoMensagens}
        onEnviarMensagem={handleEnviarMensagem}
        onEncerrar={handleEncerrar}
        onReabrir={handleReabrir}
        onTogglePainelInfo={togglePainelInfo}
        painelInfoAberto={painelInfoAberto}
      />

      {/* Coluna 4: Painel de Informacoes do Cliente - 300px (condicional) */}
      {painelInfoAberto && (
        <div className="w-[300px] shrink-0 border-l border-border">
          <PainelCliente
            contato={contatoCompleto}
            conversa={conversaAtual || null}
            onFechar={handleFecharPainelInfo}
          />
        </div>
      )}
    </AppLayout>
  );
}
