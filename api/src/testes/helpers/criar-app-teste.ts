import Fastify, { FastifyInstance } from 'fastify';
import { vi } from 'vitest';

// =============================================================================
// Criar Aplicacao Fastify para Testes
// =============================================================================

export async function criarAppTeste(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: false,
  });

  // Decorator mock para autenticacao
  app.decorate('autenticar', vi.fn().mockImplementation(async () => {}));

  // Decorator mock para verificar permissao
  app.decorate('verificarPermissao', () => vi.fn().mockImplementation(async () => {}));

  return app;
}

// =============================================================================
// Criar Headers de Autenticacao
// =============================================================================

export function criarHeadersAuth(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  };
}

// =============================================================================
// Mock de Request com Usuario
// =============================================================================

export function criarRequestMock(overrides: Record<string, unknown> = {}) {
  return {
    usuario: {
      id: 'user-123',
      clienteId: 'client-123',
      perfilId: 'perfil-123',
      permissoes: ['*'],
    },
    ...overrides,
  };
}

// =============================================================================
// Mock de Reply
// =============================================================================

export function criarReplyMock() {
  const reply = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    code: vi.fn().mockReturnThis(),
  };
  return reply;
}
