import type { StatusConversa, TipoMensagem } from './api.tipos';

// =============================================================================
// Tipos de Dashboard
// =============================================================================

export interface DashboardGeral {
  contatos: {
    total: number;
  };
  conversas: {
    total: number;
    abertas: number;
    hoje: number;
    mensagensHoje: number;
  };
  campanhas: {
    total: number;
    ativas: number;
  };
  kanban: {
    quadros: number;
    cartoes: number;
    valorTotal: number;
  };
  agenda: {
    compromissosHoje: number;
  };
}

// =============================================================================
// Tipos de Atividades
// =============================================================================

export interface AtividadeConversa {
  id: string;
  status: StatusConversa;
  atualizadoEm: string;
  contato: {
    id: string;
    nome: string;
  };
}

export interface AtividadeMensagem {
  id: string;
  conteudo?: string | null;
  tipo: TipoMensagem;
  enviadoEm: string;
  conversaId: string;
  contatoNome?: string | null;
}

export interface AtividadeCompromisso {
  id: string;
  titulo: string;
  dataHora: string;
  contato?: {
    nome: string;
  } | null;
}

export interface AtividadesRecentes {
  conversas: AtividadeConversa[];
  mensagens: AtividadeMensagem[];
  compromissos: AtividadeCompromisso[];
}

// =============================================================================
// Tipos de Gráficos
// =============================================================================

export interface PontoGrafico {
  data: string;
  total: number;
}

// =============================================================================
// Tipos de Kanban Resumo
// =============================================================================

export interface ResumoQuadro {
  id: string;
  nome: string;
  colunas: ResumoColuna[];
}

export interface ResumoColuna {
  id: string;
  nome: string;
  cor?: string | null;
  totalCartoes: number;
  valorTotal: number;
}
