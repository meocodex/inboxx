import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import {
  verificarWebhookMeta,
  receberWebhookMeta,
  receberWebhookUaiZap,
} from './webhook.controlador.js';

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
  app.post('/meta', receberWebhookMeta);

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
    },
    receberWebhookUaiZap as (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  );
}
