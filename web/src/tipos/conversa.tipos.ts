import type { StatusConversa, TipoMensagem, OrigemMensagem, TipoCanal } from './api.tipos';
import type { UsuarioResumo } from './usuario.tipos';

// =============================================================================
// Tipos de Contato
// =============================================================================

export interface Contato {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  ativo: boolean;
  bloqueado: boolean;
  observacoes?: string | null;
  clienteId: string;
  etiquetas: Etiqueta[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface ContatoResumo {
  id: string;
  nome: string;
  telefone?: string | null;
  avatarUrl?: string | null;
}

export interface Etiqueta {
  id: string;
  nome: string;
  cor: string;
}

// =============================================================================
// Tipos de Conexão (Canal)
// =============================================================================

export interface Conexao {
  id: string;
  nome: string;
  canal: TipoCanal;
  telefone?: string | null;
  status: string;
  conectadoEm?: string | null;
  clienteId: string;
  criadoEm: string;
}

// =============================================================================
// Tipos de Conversa
// =============================================================================

export interface Conversa {
  id: string;
  status: StatusConversa;
  protocolo?: string | null;
  clienteId: string;
  contatoId: string;
  canalId: string;
  atendenteId?: string | null;
  contato: ContatoResumo;
  canal: Conexao;
  atendente?: UsuarioResumo | null;
  ultimaMensagem?: MensagemResumo | null;
  naoLidas: number;
  ultimaMensagemEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
}

export interface ConversaResumo {
  id: string;
  status: StatusConversa;
  contato: ContatoResumo;
  ultimaMensagem?: MensagemResumo | null;
  naoLidas: number;
  ultimaMensagemEm: string | null;
  atualizadoEm: string | null;
}

// =============================================================================
// Tipos de Mensagem
// =============================================================================

export interface Mensagem {
  id: string;
  tipo: TipoMensagem;
  conteudo?: string | null;
  midiaUrl?: string | null;
  midiaTipo?: string | null;
  origem: OrigemMensagem;
  lida: boolean;
  conversaId: string;
  remetenteId?: string | null;
  remetente?: UsuarioResumo | null;
  enviadoEm: string;
}

export interface MensagemResumo {
  id: string;
  conteudo?: string | null;
  tipo: TipoMensagem;
  enviadoEm: string;
}

// =============================================================================
// Tipos de Nota Interna
// =============================================================================

export interface NotaInterna {
  id: string;
  conteudo: string;
  conversaId: string;
  autorId: string;
  autor: UsuarioResumo;
  criadoEm: string;
  atualizadoEm: string;
}

// =============================================================================
// DTOs
// =============================================================================

export interface CriarContatoDTO {
  nome: string;
  telefone?: string;
  email?: string;
  etiquetaIds?: string[];
}

export interface AtualizarContatoDTO {
  nome?: string;
  telefone?: string;
  email?: string;
  observacoes?: string;
  etiquetaIds?: string[];
}

export interface CriarConversaDTO {
  contatoId: string;
  conexaoId: string;
}

export interface AtribuirAtendenteDTO {
  atendenteId: string;
}

export interface EnviarMensagemDTO {
  tipo: TipoMensagem;
  conteudo?: string;
  midiaUrl?: string;
}

export interface CriarNotaDTO {
  conteudo: string;
}

export interface CriarEtiquetaDTO {
  nome: string;
  cor: string;
}

export interface FiltrosConversa {
  pagina?: number;
  limite?: number;
  status?: StatusConversa;
  atendenteId?: string;
  contatoId?: string;
}

export interface FiltrosContato {
  pagina?: number;
  limite?: number;
  busca?: string;
  etiquetaId?: string;
}

// =============================================================================
// Tipos para UI de Conversas
// =============================================================================

export type FiltroSidebar = 'inbox' | 'chamadas' | 'resolvidos' | 'pendentes' | 'fixados' | 'arquivados';

export interface RespostaRapida {
  id: string;
  texto: string;
  atalho?: string;
  icone?: string;
  categoria?: string;
}

export interface EstatisticasContato {
  totalAtendimentos: number;
  atendimentosAbertos: number;
  tempoMedioResposta: string;
}

export interface InteracaoRecente {
  id: string;
  tipo: TipoCanal;
  data: string;
  descricao?: string;
}

export interface FiltrosAvancadosConversa extends FiltrosConversa {
  canalTipo?: TipoCanal;
  naoLidas?: boolean;
  minhas?: boolean;
  atribuidas?: boolean;
  periodo?: {
    inicio: string;
    fim: string;
  };
  etiquetaIds?: string[];
}

export interface ContadoresSidebar {
  inbox: number;
  chamadas: number;
  resolvidos: number;
  pendentes: number;
  fixados: number;
  arquivados: number;
}

export interface ContadoresCanais {
  whatsapp: number;
  instagram: number;
  facebook: number;
}
