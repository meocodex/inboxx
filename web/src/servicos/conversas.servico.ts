import { api } from './api';
import type {
  RespostaApi,
  RespostaPaginada,
  Conversa,
  Mensagem,
  NotaInterna,
  FiltrosConversa,
  CriarConversaDTO,
  AtribuirAtendenteDTO,
  EnviarMensagemDTO,
  CriarNotaDTO,
} from '@/tipos';

// =============================================================================
// Serviço de Conversas
// =============================================================================

export const conversasServico = {
  // ---------------------------------------------------------------------------
  // Listar Conversas
  // ---------------------------------------------------------------------------
  async listar(filtros?: FiltrosConversa): Promise<RespostaPaginada<Conversa>> {
    const response = await api.get<RespostaPaginada<Conversa>>('/conversas', {
      params: filtros,
    });
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Obter Conversa por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Conversa> {
    const response = await api.get<RespostaApi<Conversa>>(`/conversas/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Conversa
  // ---------------------------------------------------------------------------
  async criar(dados: CriarConversaDTO): Promise<Conversa> {
    const response = await api.post<RespostaApi<Conversa>>('/conversas', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atribuir Atendente
  // ---------------------------------------------------------------------------
  async atribuir(id: string, dados: AtribuirAtendenteDTO): Promise<Conversa> {
    const response = await api.post<RespostaApi<Conversa>>(
      `/conversas/${id}/atribuir`,
      dados
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Encerrar Conversa
  // ---------------------------------------------------------------------------
  async encerrar(id: string): Promise<Conversa> {
    const response = await api.post<RespostaApi<Conversa>>(`/conversas/${id}/encerrar`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Reabrir Conversa
  // ---------------------------------------------------------------------------
  async reabrir(id: string): Promise<Conversa> {
    const response = await api.post<RespostaApi<Conversa>>(`/conversas/${id}/reabrir`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Listar Mensagens
  // ---------------------------------------------------------------------------
  async listarMensagens(
    conversaId: string,
    params?: { pagina?: number; limite?: number }
  ): Promise<RespostaPaginada<Mensagem>> {
    const response = await api.get<RespostaPaginada<Mensagem>>(
      `/conversas/${conversaId}/mensagens`,
      { params }
    );
    return response.data;
  },

  // ---------------------------------------------------------------------------
  // Enviar Mensagem
  // ---------------------------------------------------------------------------
  async enviarMensagem(conversaId: string, dados: EnviarMensagemDTO): Promise<Mensagem> {
    const response = await api.post<RespostaApi<Mensagem>>(
      `/conversas/${conversaId}/mensagens`,
      dados
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Listar Notas
  // ---------------------------------------------------------------------------
  async listarNotas(conversaId: string): Promise<NotaInterna[]> {
    const response = await api.get<RespostaApi<NotaInterna[]>>(
      `/conversas/${conversaId}/notas`
    );
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Nota
  // ---------------------------------------------------------------------------
  async criarNota(conversaId: string, dados: CriarNotaDTO): Promise<NotaInterna> {
    const response = await api.post<RespostaApi<NotaInterna>>(
      `/conversas/${conversaId}/notas`,
      dados
    );
    return response.data.dados;
  },
};
