import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

import {
  verificarWebhookMeta,
  receberWebhookMeta,
  receberWebhookUaiZap,
} from './webhook.controlador.js';

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
        querystring: {
          type: 'object',
          properties: {
            'hub.mode': { type: 'string' },
            'hub.verify_token': { type: 'string' },
            'hub.challenge': { type: 'string' },
          },
        },
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
        params: {
          type: 'object',
          properties: {
            instanciaId: { type: 'string' },
          },
          required: ['instanciaId'],
        },
      },
    },
    receberWebhookUaiZap as (req: FastifyRequest, reply: FastifyReply) => Promise<void>
  );
}
