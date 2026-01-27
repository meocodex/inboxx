import { beforeAll, afterAll, vi } from 'vitest';

// =============================================================================
// Mock do Drizzle (substitui Prisma)
// =============================================================================

// Resultado padrao das queries - pode ser sobrescrito via mockDbResult
let _mockDbResult: unknown[] = [];
let _mockDbResultQueue: unknown[][] = [];

/**
 * Define o resultado que as proximas queries do db mock vao retornar.
 * Use em cada teste para definir o que o banco "retornaria".
 *
 * @example
 * mockDbResult([{ id: '123', nome: 'Teste' }]);
 * // proxima query retornara esse array
 */
export function mockDbResult(result: unknown[]): void {
  _mockDbResult = result;
}

/**
 * Enfileira multiplos resultados para queries sequenciais.
 * Cada chamada ao banco consome o proximo resultado da fila.
 * Quando a fila acaba, usa _mockDbResult como fallback.
 *
 * @example
 * mockDbResultQueue([[user1], [], [user2]]);
 * // 1a query retorna [user1], 2a retorna [], 3a retorna [user2]
 */
export function mockDbResultQueue(results: unknown[][]): void {
  _mockDbResultQueue = [...results];
}

function consumeResult(): unknown[] {
  if (_mockDbResultQueue.length > 0) {
    return _mockDbResultQueue.shift()!;
  }
  return _mockDbResult;
}

// Builder chainable que simula a API do Drizzle
function criarChainMock() {
  const chain: Record<string, any> = {};
  const metodos = [
    'select', 'from', 'where', 'limit', 'offset',
    'orderBy', 'innerJoin', 'leftJoin', 'rightJoin',
    'groupBy', 'having', 'returning', 'set', 'values',
    'as', 'onConflictDoNothing', 'onConflictDoUpdate',
  ];

  for (const metodo of metodos) {
    chain[metodo] = vi.fn().mockImplementation(() => chain);
  }

  // A chain e uma Promise-like: retorna resultado quando awaited
  chain.then = function (resolve: any, reject: any) {
    try {
      resolve(consumeResult());
    } catch (e) {
      if (reject) reject(e);
    }
  };

  return chain;
}

// Criar instancia principal do mock
const selectChain = criarChainMock();
const insertChain = criarChainMock();
const updateChain = criarChainMock();
const deleteChain = criarChainMock();
const executeChain = vi.fn().mockResolvedValue([{ '?column?': 1 }]);

export const dbMock = {
  select: vi.fn().mockImplementation(() => selectChain),
  insert: vi.fn().mockImplementation(() => insertChain),
  update: vi.fn().mockImplementation(() => updateChain),
  delete: vi.fn().mockImplementation(() => deleteChain),
  execute: executeChain,
  query: {},
};

// Reset todos os mocks entre testes
export function resetDbMocks(): void {
  _mockDbResult = [];
  _mockDbResultQueue = [];
  vi.clearAllMocks();
}

vi.mock('../infraestrutura/banco/drizzle.servico.js', () => ({
  db: dbMock,
  verificarConexaoBancoDrizzle: vi.fn().mockResolvedValue(true),
  fecharConexaoBanco: vi.fn().mockResolvedValue(undefined),
  schema: {},
}));

// =============================================================================
// Mock do Redis
// =============================================================================

vi.mock('../infraestrutura/cache/redis.servico.js', () => ({
  redis: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    quit: vi.fn(),
    ping: vi.fn().mockResolvedValue('PONG'),
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    hset: vi.fn(),
    hget: vi.fn(),
    hgetall: vi.fn(),
    hdel: vi.fn(),
    scan: vi.fn().mockResolvedValue(['0', []]),
    status: 'ready',
  },
  cacheUtils: {
    obter: vi.fn().mockResolvedValue(null),
    definir: vi.fn().mockResolvedValue(undefined),
    remover: vi.fn().mockResolvedValue(undefined),
    removerPorPadrao: vi.fn().mockResolvedValue(0),
    disponivel: vi.fn().mockReturnValue(true),
  },
  redisServico: {
    hset: vi.fn().mockResolvedValue(undefined),
    hdel: vi.fn().mockResolvedValue(undefined),
    hgetall: vi.fn().mockResolvedValue(null),
  },
}));

// =============================================================================
// Mock das Constantes
// =============================================================================

vi.mock('../configuracao/constantes.js', () => ({
  CUSTO_BCRYPT: 12,
  MAX_TENTATIVAS_LOGIN: 5,
  TEMPO_BLOQUEIO_LOGIN_MINUTOS: 15,
  PAGINACAO_LIMITE_PADRAO: 20,
  PAGINACAO_LIMITE_MAXIMO: 100,
  CACHE_TTL: {
    LICENCA: 86400,
    SESSAO: 604800,
    USUARIO: 300,
    CONFIGURACOES: 3600,
  },
  STATUS_CONVERSA: {
    ABERTA: 'ABERTA',
    EM_ATENDIMENTO: 'EM_ATENDIMENTO',
    AGUARDANDO: 'AGUARDANDO',
    RESOLVIDA: 'RESOLVIDA',
    ARQUIVADA: 'ARQUIVADA',
  },
  PERFIS: {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN_CLIENTE: 'ADMIN_CLIENTE',
    SUPERVISOR: 'SUPERVISOR',
    ATENDENTE: 'ATENDENTE',
  },
  CANAIS: {
    WHATSAPP: 'WHATSAPP',
    INSTAGRAM: 'INSTAGRAM',
    FACEBOOK: 'FACEBOOK',
  },
  PROVEDORES: {
    META_API: 'META_API',
    UAIZAP: 'UAIZAP',
    GRAPH_API: 'GRAPH_API',
  },
  MENSAGENS_ERRO: {
    NAO_AUTORIZADO: 'Nao autorizado',
    SEM_PERMISSAO: 'Sem permissao para esta acao',
    NAO_ENCONTRADO: 'Recurso nao encontrado',
    CREDENCIAIS_INVALIDAS: 'Credenciais invalidas',
    TOKEN_INVALIDO: 'Token invalido ou expirado',
    CONTA_BLOQUEADA: 'Conta bloqueada temporariamente',
    VALIDACAO: 'Erro de validacao',
    INTERNO: 'Erro interno do servidor',
  },
  REGEX: {
    TELEFONE_BR: /^\+55\d{10,11}$/,
    CPF: /^\d{11}$/,
    CNPJ: /^\d{14}$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  },
}));

// =============================================================================
// Mock da Criptografia
// =============================================================================

vi.mock('../compartilhado/utilitarios/criptografia.js', () => ({
  hashSenha: vi.fn().mockResolvedValue('$argon2id$hashed$password'),
  verificarSenha: vi.fn().mockResolvedValue(true),
  precisaRehash: vi.fn().mockReturnValue(false),
  gerarAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  gerarRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verificarToken: vi.fn().mockResolvedValue({
    sub: 'user-123',
    clienteId: 'client-123',
    perfilId: 'perfil-123',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  }),
  decodificarToken: vi.fn().mockReturnValue(null),
  gerarChaveAleatoria: vi.fn().mockReturnValue('mock-random-key'),
  gerarHashMd5: vi.fn().mockReturnValue('mock-md5-hash'),
}));

// =============================================================================
// Mock do Logger
// =============================================================================

vi.mock('../compartilhado/utilitarios/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(() => ({
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn(),
    })),
  },
}));

// =============================================================================
// Mock do WebSocket
// =============================================================================

vi.mock('../websocket/socket.gateway.js', () => ({
  criarSocketGateway: vi.fn(),
  emitirParaConversa: vi.fn(),
  emitirParaCliente: vi.fn(),
  emitirParaUsuario: vi.fn(),
  emitirNotificacao: vi.fn(),
}));

// =============================================================================
// Mock do BullMQ
// =============================================================================

vi.mock('../infraestrutura/filas/bullmq.servico.js', () => ({
  iniciarFilas: vi.fn().mockResolvedValue(undefined),
  pararFilas: vi.fn().mockResolvedValue(undefined),
  enviarJob: vi.fn().mockResolvedValue('job-id-123'),
  agendarJob: vi.fn().mockResolvedValue('job-id-123'),
  registrarWorker: vi.fn().mockResolvedValue('worker-id-123'),
  cancelarJob: vi.fn().mockResolvedValue(undefined),
  cancelarJobsPorChave: vi.fn().mockResolvedValue(undefined),
  obterStatusJob: vi.fn().mockResolvedValue(null),
  completarJob: vi.fn().mockResolvedValue(undefined),
  falharJob: vi.fn().mockResolvedValue(undefined),
  obterContagemJobs: vi.fn().mockResolvedValue({ deferred: 0, queued: 0, active: 0, total: 0 }),
  limparJobsAntigos: vi.fn().mockResolvedValue(undefined),
  obterTodasFilas: vi.fn().mockReturnValue([]),
}));

vi.mock('../infraestrutura/filas/dashboard.js', () => ({
  registrarDashboardFilas: vi.fn().mockResolvedValue(undefined),
}));

// =============================================================================
// Variaveis de Ambiente para Testes
// =============================================================================

process.env.NODE_ENV = 'test';
process.env.PORT = '3333';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.JWT_SECRET = 'test-jwt-secret-with-at-least-32-chars';
process.env.COOKIE_SECRET = 'test-cookie-secret-with-at-least-32-chars';
process.env.META_WEBHOOK_VERIFY_TOKEN = 'test-verify-token';
process.env.META_APP_SECRET = 'test-app-secret';

// =============================================================================
// Setup e Teardown Global
// =============================================================================

beforeAll(() => {
  // Setup global antes de todos os testes
});

afterAll(() => {
  // Cleanup global apos todos os testes
  vi.clearAllMocks();
});
