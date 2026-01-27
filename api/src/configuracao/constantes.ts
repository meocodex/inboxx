// =============================================================================
// Constantes do Sistema
// =============================================================================

// Seguranca
export const CUSTO_BCRYPT = 12;
export const MAX_TENTATIVAS_LOGIN = 5;
export const TEMPO_BLOQUEIO_LOGIN_MINUTOS = 15;

// Paginacao
export const PAGINACAO_LIMITE_PADRAO = 20;
export const PAGINACAO_LIMITE_MAXIMO = 100;

// Cache TTL (em segundos)
export const CACHE_TTL = {
  LICENCA: 24 * 60 * 60, // 24 horas
  SESSAO: 7 * 24 * 60 * 60, // 7 dias
  USUARIO: 5 * 60, // 5 minutos
  CONFIGURACOES: 60 * 60, // 1 hora
} as const;

// Status de Conversa
export const STATUS_CONVERSA = {
  ABERTA: 'ABERTA',
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  AGUARDANDO: 'AGUARDANDO',
  RESOLVIDA: 'RESOLVIDA',
  ARQUIVADA: 'ARQUIVADA',
} as const;

// Perfis
export const PERFIS = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_CLIENTE: 'ADMIN_CLIENTE',
  SUPERVISOR: 'SUPERVISOR',
  ATENDENTE: 'ATENDENTE',
} as const;

// Canais
export const CANAIS = {
  WHATSAPP: 'WHATSAPP',
  INSTAGRAM: 'INSTAGRAM',
  FACEBOOK: 'FACEBOOK',
} as const;

// Provedores
export const PROVEDORES = {
  META_API: 'META_API',
  UAIZAP: 'UAIZAP',
  GRAPH_API: 'GRAPH_API',
} as const;

// Mensagens de erro padrao
export const MENSAGENS_ERRO = {
  NAO_AUTORIZADO: 'Nao autorizado',
  SEM_PERMISSAO: 'Sem permissao para esta acao',
  NAO_ENCONTRADO: 'Recurso nao encontrado',
  CREDENCIAIS_INVALIDAS: 'Credenciais invalidas',
  TOKEN_INVALIDO: 'Token invalido ou expirado',
  CONTA_BLOQUEADA: 'Conta bloqueada temporariamente',
  VALIDACAO: 'Erro de validacao',
  INTERNO: 'Erro interno do servidor',
} as const;

// Regex comuns
export const REGEX = {
  TELEFONE_BR: /^\+55\d{10,11}$/,
  CPF: /^\d{11}$/,
  CNPJ: /^\d{14}$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
} as const;
