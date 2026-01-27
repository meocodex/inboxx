import { SignJWT, jwtVerify, decodeJwt } from 'jose';
import argon2 from 'argon2';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

import { env } from '../../configuracao/ambiente.js';

// =============================================================================
// Tipos
// =============================================================================

export interface JwtPayload {
  sub: string; // usuarioId
  clienteId: string | null;
  perfilId: string;
  iat: number;
  exp: number;
}

export interface TokenPar {
  accessToken: string;
  refreshToken: string;
}

// =============================================================================
// Secret (jose usa Uint8Array)
// =============================================================================

function obterSegredo(): Uint8Array {
  return new TextEncoder().encode(env.JWT_SECRET);
}

/**
 * Converte string de expiração (ex: "7d", "1h", "30m") para segundos.
 */
function converterExpiracaoParaSegundos(expiracao: string): number {
  const match = expiracao.match(/^(\d+)([smhd])$/);
  if (!match) {
    return 7 * 24 * 60 * 60; // default 7 dias
  }
  const valor = parseInt(match[1], 10);
  const unidade = match[2];
  switch (unidade) {
    case 's': return valor;
    case 'm': return valor * 60;
    case 'h': return valor * 60 * 60;
    case 'd': return valor * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}

// =============================================================================
// Hash de Senha (argon2 com fallback bcrypt para transição)
// =============================================================================

export async function hashSenha(senha: string): Promise<string> {
  return argon2.hash(senha, {
    type: argon2.argon2id,
    memoryCost: 65536, // 64 MB
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifica senha com suporte dual: argon2 (novo) + bcrypt (legado).
 * Retorna { valida, precisaRehash } para permitir re-hash transparente.
 */
export async function verificarSenha(
  senha: string,
  hash: string,
): Promise<boolean> {
  if (hash.startsWith('$argon2')) {
    return argon2.verify(hash, senha);
  }
  // Fallback bcrypt durante transição
  return bcrypt.compare(senha, hash);
}

/**
 * Verifica se o hash é bcrypt legado e precisa ser atualizado para argon2.
 */
export function precisaRehash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$');
}

// =============================================================================
// JWT (jose - ESM nativo, async)
// =============================================================================

export async function gerarAccessToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
  const segredo = obterSegredo();
  const expSegundos = converterExpiracaoParaSegundos(env.JWT_EXPIRES_IN);

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expSegundos)
    .sign(segredo);
}

export function gerarRefreshToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export async function verificarToken(token: string): Promise<JwtPayload> {
  const segredo = obterSegredo();
  const { payload } = await jwtVerify(token, segredo);

  return {
    sub: payload.sub as string,
    clienteId: (payload.clienteId as string | null) ?? null,
    perfilId: payload.perfilId as string,
    iat: payload.iat as number,
    exp: payload.exp as number,
  };
}

export function decodificarToken(token: string): JwtPayload | null {
  try {
    const payload = decodeJwt(token);
    return {
      sub: payload.sub as string,
      clienteId: (payload.clienteId as string | null) ?? null,
      perfilId: payload.perfilId as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Utilitários
// =============================================================================

export function gerarChaveAleatoria(tamanho: number = 32): string {
  return crypto.randomBytes(tamanho).toString('hex');
}

export function gerarHashMd5(conteudo: string): string {
  return crypto.createHash('md5').update(conteudo).digest('hex');
}
