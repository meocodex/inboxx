import { describe, it, expect } from 'vitest';

import {
  validarAssinaturaMeta,
  validarAssinaturaUaiZap,
  gerarAssinatura,
} from '../webhook/validador-hmac.js';

// =============================================================================
// Testes do Validador HMAC
// =============================================================================

describe('Validador HMAC', () => {
  const SECRET = 'meu-secret-para-testes';
  const PAYLOAD = JSON.stringify({ mensagem: 'teste', id: 123 });

  // ===========================================================================
  // Gerar Assinatura
  // ===========================================================================

  describe('gerarAssinatura', () => {
    it('deve gerar assinatura valida', () => {
      const assinatura = gerarAssinatura(PAYLOAD, SECRET);

      expect(assinatura).toBeDefined();
      expect(assinatura).toHaveLength(64); // SHA256 hex = 64 chars
    });

    it('deve gerar assinatura com prefixo', () => {
      const assinatura = gerarAssinatura(PAYLOAD, SECRET, 'sha256=');

      expect(assinatura.startsWith('sha256=')).toBe(true);
      expect(assinatura.replace('sha256=', '')).toHaveLength(64);
    });

    it('deve gerar assinaturas diferentes para payloads diferentes', () => {
      const assinatura1 = gerarAssinatura('payload1', SECRET);
      const assinatura2 = gerarAssinatura('payload2', SECRET);

      expect(assinatura1).not.toBe(assinatura2);
    });

    it('deve gerar assinaturas diferentes para secrets diferentes', () => {
      const assinatura1 = gerarAssinatura(PAYLOAD, 'secret1');
      const assinatura2 = gerarAssinatura(PAYLOAD, 'secret2');

      expect(assinatura1).not.toBe(assinatura2);
    });
  });

  // ===========================================================================
  // Validar Assinatura Meta
  // ===========================================================================

  describe('validarAssinaturaMeta', () => {
    it('deve validar assinatura correta', () => {
      const assinatura = gerarAssinatura(PAYLOAD, SECRET, 'sha256=');
      const valido = validarAssinaturaMeta(PAYLOAD, assinatura, SECRET);

      expect(valido).toBe(true);
    });

    it('deve rejeitar assinatura sem prefixo sha256=', () => {
      const assinatura = gerarAssinatura(PAYLOAD, SECRET);
      const valido = validarAssinaturaMeta(PAYLOAD, assinatura, SECRET);

      expect(valido).toBe(false);
    });

    it('deve rejeitar assinatura invalida', () => {
      const valido = validarAssinaturaMeta(PAYLOAD, 'sha256=invalida', SECRET);

      expect(valido).toBe(false);
    });

    it('deve rejeitar assinatura vazia', () => {
      const valido = validarAssinaturaMeta(PAYLOAD, '', SECRET);

      expect(valido).toBe(false);
    });

    it('deve validar com buffer como payload', () => {
      const payloadBuffer = Buffer.from(PAYLOAD);
      const assinatura = gerarAssinatura(PAYLOAD, SECRET, 'sha256=');
      const valido = validarAssinaturaMeta(payloadBuffer, assinatura, SECRET);

      expect(valido).toBe(true);
    });
  });

  // ===========================================================================
  // Validar Assinatura UaiZap
  // ===========================================================================

  describe('validarAssinaturaUaiZap', () => {
    it('deve validar assinatura correta', () => {
      const assinatura = gerarAssinatura(PAYLOAD, SECRET);
      const valido = validarAssinaturaUaiZap(PAYLOAD, assinatura, SECRET);

      expect(valido).toBe(true);
    });

    it('deve rejeitar assinatura invalida', () => {
      const valido = validarAssinaturaUaiZap(PAYLOAD, 'assinatura-invalida', SECRET);

      expect(valido).toBe(false);
    });

    it('deve rejeitar assinatura vazia', () => {
      const valido = validarAssinaturaUaiZap(PAYLOAD, '', SECRET);

      expect(valido).toBe(false);
    });

    it('deve validar com buffer como payload', () => {
      const payloadBuffer = Buffer.from(PAYLOAD);
      const assinatura = gerarAssinatura(PAYLOAD, SECRET);
      const valido = validarAssinaturaUaiZap(payloadBuffer, assinatura, SECRET);

      expect(valido).toBe(true);
    });
  });
});
