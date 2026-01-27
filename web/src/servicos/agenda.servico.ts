import { api } from './api';
import type {
  RespostaApi,
  Evento,
  EventoResumo,
  CriarEventoDTO,
  AtualizarEventoDTO,
  FiltrosEvento,
} from '@/tipos';

// =============================================================================
// Serviço de Agenda/Eventos
// =============================================================================

export const agendaServico = {
  // ---------------------------------------------------------------------------
  // Listar Eventos
  // ---------------------------------------------------------------------------
  async listar(filtros?: FiltrosEvento): Promise<EventoResumo[]> {
    const response = await api.get<RespostaApi<EventoResumo[]>>('/agenda/eventos', {
      params: filtros,
    });
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Obter Evento por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Evento> {
    const response = await api.get<RespostaApi<Evento>>(`/agenda/eventos/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Evento
  // ---------------------------------------------------------------------------
  async criar(dados: CriarEventoDTO): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>('/agenda/eventos', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Evento
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarEventoDTO): Promise<Evento> {
    const response = await api.put<RespostaApi<Evento>>(`/agenda/eventos/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Evento
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/agenda/eventos/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Marcar como Concluído
  // ---------------------------------------------------------------------------
  async concluir(id: string): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>(`/agenda/eventos/${id}/concluir`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Cancelar Evento
  // ---------------------------------------------------------------------------
  async cancelar(id: string): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>(`/agenda/eventos/${id}/cancelar`);
    return response.data.dados;
  },
};
