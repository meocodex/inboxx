import { createHmac, timingSafeEqual } from 'crypto';

import { logger } from '../../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Validar Assinatura HMAC - Meta
// =============================================================================

export function validarAssinaturaMeta(
  payload: string | Buffer,
  assinatura: string,
  appSecret: string
): boolean {
  if (!assinatura || !assinatura.startsWith('sha256=')) {
    logger.warn('Webhook: Assinatura Meta invalida ou ausente');
    return false;
  }

  try {
    const assinaturaRecebida = assinatura.replace('sha256=', '');
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    const hmac = createHmac('sha256', appSecret);
    hmac.update(payloadString);
    const assinaturaCalculada = hmac.digest('hex');

    // Usar comparacao segura contra timing attacks
    const bufferRecebido = Buffer.from(assinaturaRecebida, 'hex');
    const bufferCalculado = Buffer.from(assinaturaCalculada, 'hex');

    if (bufferRecebido.length !== bufferCalculado.length) {
      logger.warn('Webhook: Tamanho da assinatura Meta nao corresponde');
      return false;
    }

    const valido = timingSafeEqual(bufferRecebido, bufferCalculado);

    if (!valido) {
      logger.warn('Webhook: Assinatura Meta nao corresponde');
    }

    return valido;
  } catch (erro) {
    logger.error({ erro }, 'Webhook: Erro ao validar assinatura Meta');
    return false;
  }
}

// =============================================================================
// Validar Assinatura HMAC - UaiZap
// =============================================================================

export function validarAssinaturaUaiZap(
  payload: string | Buffer,
  assinatura: string,
  apiKey: string
): boolean {
  if (!assinatura) {
    logger.warn('Webhook: Assinatura UaiZap ausente');
    return false;
  }

  try {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    const hmac = createHmac('sha256', apiKey);
    hmac.update(payloadString);
    const assinaturaCalculada = hmac.digest('hex');

    // Usar comparacao segura contra timing attacks
    const bufferRecebido = Buffer.from(assinatura, 'hex');
    const bufferCalculado = Buffer.from(assinaturaCalculada, 'hex');

    if (bufferRecebido.length !== bufferCalculado.length) {
      logger.warn('Webhook: Tamanho da assinatura UaiZap nao corresponde');
      return false;
    }

    const valido = timingSafeEqual(bufferRecebido, bufferCalculado);

    if (!valido) {
      logger.warn('Webhook: Assinatura UaiZap nao corresponde');
    }

    return valido;
  } catch (erro) {
    logger.error({ erro }, 'Webhook: Erro ao validar assinatura UaiZap');
    return false;
  }
}

// =============================================================================
// Gerar Assinatura para Testes
// =============================================================================

export function gerarAssinatura(payload: string, secret: string, prefixo = ''): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  const assinatura = hmac.digest('hex');

  return prefixo ? `${prefixo}${assinatura}` : assinatura;
}
