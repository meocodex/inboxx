import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';

import {
  verificarWebhookMeta,
  receberWebhookMeta,
  receberWebhookUaiZap,
} from './webhook.controlador.js';
import { env } from '../../../configuracao/ambiente.js';

const metaQuerySchema = z.object({
  'hub.mode': z.string().optional(),
  'hub.verify_token': z.string().optional(),
  'hub.challenge': z.string().optional(),
});

const uaizapParamsSchema = z.object({
  instanciaId: z.string(),
});

// =============================================================================
// Rotas de Webhook
// =============================================================================

export async function webhookRotas(app: FastifyInstance): Promise<void> {
  // ===========================================================================
  // Rate Limiting para Webhooks
  // ===========================================================================

  await app.register(rateLimit, {
    max: 200, // 200 requests por janela de tempo
    timeWindow: '1 minute',
    cache: 10000, // Cache de 10k IPs
    keyGenerator: (req) => {
      // Rate limit por IP + User-Agent (prevenir bypass simples)
      const userAgent = req.headers['user-agent'] || 'unknown';
      return `${req.ip}:${userAgent}`;
    },
    errorResponseBuilder: () => ({
      sucesso: false,
      erro: {
        codigo: 'LIMITE_EXCEDIDO',
        mensagem: 'Limite de webhooks excedido. Tente novamente em 1 minuto.',
      },
    }),
    // Whitelist de IPs confiáveis (Meta/UaiZap)
    allowList: (req) => {
      const ipsConfiaveisStr = env.WEBHOOK_WHITELIST_IPS;
      if (!ipsConfiaveisStr) return false;

      const ipsConfiaveies = ipsConfiaveisStr.split(',').map(ip => ip.trim());
      return ipsConfiaveies.includes(req.ip);
    },
  });

  // ===========================================================================
  // Meta Cloud API Webhook
  // ===========================================================================

  // Verificacao do webhook (GET)
  app.get(
    '/meta',
    {
      schema: {
        querystring: metaQuerySchema,
      },
    },
    verificarWebhookMeta as (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  );

  // Recebimento de eventos (POST)
  app.post(
    '/meta',
    {
      config: {
        rateLimit: {
          max: 300, // Meta pode ter volume maior
          timeWindow: '1 minute',
        },
      },
    },
    receberWebhookMeta
  );

  // ===========================================================================
  // UaiZap Webhook
  // ===========================================================================

  // Recebimento de eventos (POST)
  app.post(
    '/uaizap/:instanciaId',
    {
      schema: {
        params: uaizapParamsSchema,
      },
      config: {
        rateLimit: {
          max: 150, // UaiZap com limite menor
          timeWindow: '1 minute',
        },
      },
    },
    receberWebhookUaiZap as (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  );
}
