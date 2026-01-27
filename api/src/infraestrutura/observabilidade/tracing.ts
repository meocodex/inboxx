import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// OpenTelemetry Tracing
// =============================================================================

let sdk: NodeSDK | null = null;

export async function iniciarTracing(): Promise<void> {
  try {
    sdk = new NodeSDK({
      serviceName: 'crm-api',
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-fs': { enabled: false },
          '@opentelemetry/instrumentation-dns': { enabled: false },
        }),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry tracing inicializado');
  } catch (erro) {
    logger.warn({ erro }, 'Falha ao iniciar OpenTelemetry tracing');
  }
}

export async function pararTracing(): Promise<void> {
  if (sdk) {
    try {
      await sdk.shutdown();
      logger.debug('OpenTelemetry tracing encerrado');
    } catch (erro) {
      logger.warn({ erro }, 'Erro ao encerrar tracing');
    }
  }
}
