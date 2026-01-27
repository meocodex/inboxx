import { SignJWT } from 'jose';

// =============================================================================
// Constantes
// =============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-with-at-least-32-chars';

function obterSegredo(): Uint8Array {
  return new TextEncoder().encode(JWT_SECRET);
}

// =============================================================================
// Gerar Token JWT para Testes
// =============================================================================

export async function gerarTokenTeste(
  payload: {
    sub: string;
    clienteId: string;
    perfilId: string;
    permissoes?: string[];
  },
  expiresIn: string = '1h'
): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    clienteId: payload.clienteId,
    perfilId: payload.perfilId,
    permissoes: payload.permissoes || ['*'],
    tipo: 'access',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(obterSegredo());
}

// =============================================================================
// Gerar Refresh Token para Testes
// =============================================================================

export async function gerarRefreshTokenTeste(
  payload: {
    sub: string;
    clienteId: string;
  },
  expiresIn: string = '7d'
): Promise<string> {
  return new SignJWT({
    sub: payload.sub,
    clienteId: payload.clienteId,
    tipo: 'refresh',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(obterSegredo());
}

// =============================================================================
// Payload de Usuario Admin
// =============================================================================

export const adminPayload = {
  sub: 'admin-id-123',
  clienteId: 'client-id-123',
  perfilId: 'super-admin-perfil',
  permissoes: ['*'],
};

// =============================================================================
// Payload de Usuario Comum
// =============================================================================

export const usuarioPayload = {
  sub: 'user-id-456',
  clienteId: 'client-id-123',
  perfilId: 'atendente-perfil',
  permissoes: ['conversas:ler', 'mensagens:criar'],
};
