import * as Sentry from '@sentry/node';
import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Sentry - Monitoramento de Erros
// =============================================================================

let inicializado = false;

export function iniciarSentry(): void {
  if (!env.SENTRY_DSN) {
    logger.info('Sentry DSN nao configurado, monitoramento de erros desabilitado');
    return;
  }

  try {
    Sentry.init({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
      profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 0,
    });

    inicializado = true;
    logger.info('Sentry inicializado');
  } catch (erro) {
    logger.warn({ erro }, 'Falha ao iniciar Sentry');
  }
}

export function capturarErro(erro: Error, contexto?: Record<string, unknown>): void {
  if (!inicializado) return;

  Sentry.withScope((scope) => {
    if (contexto) {
      scope.setExtras(contexto);
    }
    Sentry.captureException(erro);
  });
}

export function sentryDisponivel(): boolean {
  return inicializado;
}

export async function fecharSentry(): Promise<void> {
  if (inicializado) {
    await Sentry.close(2000);
    logger.debug('Sentry encerrado');
  }
}
