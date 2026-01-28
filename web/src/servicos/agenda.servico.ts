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
    const response = await api.get<RespostaApi<EventoResumo[]>>('/agendamento/compromissos', {
      params: filtros,
    });
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Obter Evento por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<Evento> {
    const response = await api.get<RespostaApi<Evento>>(`/agendamento/compromissos/${id}`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Criar Evento
  // ---------------------------------------------------------------------------
  async criar(dados: CriarEventoDTO): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>('/agendamento/compromissos', dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Evento
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarEventoDTO): Promise<Evento> {
    const response = await api.put<RespostaApi<Evento>>(`/agendamento/compromissos/${id}`, dados);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Excluir Evento
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    await api.delete(`/agendamento/compromissos/${id}`);
  },

  // ---------------------------------------------------------------------------
  // Marcar como Concluído
  // ---------------------------------------------------------------------------
  async concluir(id: string): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>(`/agendamento/compromissos/${id}/concluir`);
    return response.data.dados;
  },

  // ---------------------------------------------------------------------------
  // Cancelar Evento
  // ---------------------------------------------------------------------------
  async cancelar(id: string): Promise<Evento> {
    const response = await api.post<RespostaApi<Evento>>(`/agendamento/compromissos/${id}/cancelar`);
    return response.data.dados;
  },
};
