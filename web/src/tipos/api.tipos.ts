// =============================================================================
// Tipos de Resposta da API
// =============================================================================

export interface RespostaApi<T> {
  sucesso: boolean;
  dados: T;
  mensagem?: string;
}

export interface RespostaErro {
  erro: string;
  codigo: string;
}

export interface RespostaPaginada<T> {
  sucesso: boolean;
  dados: T[];
  paginacao: Paginacao;
}

export interface Paginacao {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
}

export interface QueryPaginacao {
  pagina?: number;
  limite?: number;
}

// =============================================================================
// Enums
// =============================================================================

export enum StatusConversa {
  ABERTA = 'ABERTA',
  EM_ATENDIMENTO = 'EM_ATENDIMENTO',
  AGUARDANDO = 'AGUARDANDO',
  ENCERRADA = 'ENCERRADA',
}

export enum TipoMensagem {
  TEXTO = 'TEXTO',
  IMAGEM = 'IMAGEM',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  DOCUMENTO = 'DOCUMENTO',
  LOCALIZACAO = 'LOCALIZACAO',
  CONTATO = 'CONTATO',
  STICKER = 'STICKER',
}

export enum OrigemMensagem {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export enum TipoCanal {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
}

export enum StatusCampanha {
  RASCUNHO = 'RASCUNHO',
  AGENDADA = 'AGENDADA',
  EM_ANDAMENTO = 'EM_ANDAMENTO',
  PAUSADA = 'PAUSADA',
  CONCLUIDA = 'CONCLUIDA',
  CANCELADA = 'CANCELADA',
}

export enum TipoNoFluxo {
  MENSAGEM = 'MENSAGEM',
  PERGUNTA = 'PERGUNTA',
  CONDICAO = 'CONDICAO',
  ACAO = 'ACAO',
  ESPERA = 'ESPERA',
  TRANSFERIR = 'TRANSFERIR',
}
