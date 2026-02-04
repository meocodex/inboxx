// =============================================================================
// Definicao dos Indices Meilisearch
// =============================================================================

export const INDICES = {
  CONTATOS: 'contatos',
  CONVERSAS: 'conversas',
  MENSAGENS: 'mensagens',
} as const;

export type IndiceNome = (typeof INDICES)[keyof typeof INDICES];

// Configuracao dos atributos por indice
export const INDICE_CONFIG: Record<IndiceNome, {
  searchableAttributes: string[];
  filterableAttributes: string[];
  sortableAttributes: string[];
  displayedAttributes?: string[];
}> = {
  [INDICES.CONTATOS]: {
    searchableAttributes: ['nome', 'telefone', 'email', 'observacoes'],
    filterableAttributes: ['clienteId', 'etiquetas'],
    sortableAttributes: ['nome', 'criadoEm'],
  },
  [INDICES.CONVERSAS]: {
    searchableAttributes: ['contatoNome', 'contatoTelefone', 'ultimaMensagem'],
    filterableAttributes: ['clienteId', 'status', 'conexaoId', 'usuarioId', 'equipeId'],
    sortableAttributes: ['ultimaMensagemEm', 'criadoEm'],
  },
  [INDICES.MENSAGENS]: {
    searchableAttributes: ['conteudo'],
    filterableAttributes: ['clienteId', 'conversaId', 'direcao'],
    sortableAttributes: ['criadoEm'],
  },
};

// Tipos dos documentos indexados
export interface ContatoDocumento {
  id: string;
  clienteId: string;
  nome: string;
  telefone: string;
  email: string | null;
  observacoes: string | null;
  etiquetas: string[];
  criadoEm: string;
}

export interface ConversaDocumento {
  id: string;
  clienteId: string;
  contatoNome: string;
  contatoTelefone: string;
  ultimaMensagem: string | null;
  status: string;
  conexaoId: string | null; // Nullable - conexão pode ser excluída
  usuarioId: string | null;
  equipeId: string | null;
  ultimaMensagemEm: string | null;
  criadoEm: string;
}

export interface MensagemDocumento {
  id: string;
  clienteId: string;
  conversaId: string;
  conteudo: string;
  direcao: string;
  criadoEm: string;
}
