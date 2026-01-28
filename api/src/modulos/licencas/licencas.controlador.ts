import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';

import { licencasServico } from './licencas.servico.js';
import { obterIpServidor } from '../../compartilhado/guardas/index.js';
import { extrairClienteId } from '../../compartilhado/utilitarios/cliente-contexto.js';

// =============================================================================
// Schemas
// =============================================================================

const verificarBodySchema = z.object({
  chave: z.string().min(1, 'Chave de licenca obrigatoria'),
});

type VerificarBody = z.infer<typeof verificarBodySchema>;

// =============================================================================
// Rotas de Licencas
// =============================================================================

export async function licencasRotas(app: FastifyInstance) {
  // ---------------------------------------------------------------------------
  // GET /api/licencas/status - Status da Licenca do Cliente
  // ---------------------------------------------------------------------------
  app.get(
    '/status',
    {
      preHandler: [app.autenticar],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = extrairClienteId(request);

      const status = await licencasServico.obterStatus(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: status,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // POST /api/licencas/verificar - Verificar Licenca por Chave (Publico)
  // ---------------------------------------------------------------------------
  app.post<{ Body: VerificarBody }>(
    '/verificar',
    {
      schema: {
        body: verificarBodySchema,
      },
    },
    async (request: FastifyRequest<{ Body: VerificarBody }>, reply: FastifyReply) => {
      const { chave } = verificarBodySchema.parse(request.body);
      const ipServidor = obterIpServidor(request);

      const licenca = await licencasServico.verificarPorChave(chave, ipServidor);

      return reply.status(200).send({
        sucesso: true,
        dados: {
          valida: true,
          clienteId: licenca.clienteId,
          expiraEm: licenca.expiraEm,
          ipAutorizado: licenca.ipServidor,
        },
      });
    }
  );

  // ---------------------------------------------------------------------------
  // GET /api/licencas/validar - Validar se Cliente Atual Possui Licenca
  // ---------------------------------------------------------------------------
  app.get(
    '/validar',
    {
      preHandler: [app.autenticar],
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const clienteId = request.usuario.clienteId;

      if (!clienteId) {
        // Super admin sempre tem acesso
        return reply.status(200).send({
          sucesso: true,
          dados: {
            valida: true,
            tipo: 'super_admin',
          },
        });
      }

      const valida = await licencasServico.clientePossuiLicencaValida(clienteId);

      return reply.status(200).send({
        sucesso: true,
        dados: {
          valida,
          tipo: valida ? 'licenciado' : 'sem_licenca',
        },
      });
    }
  );
}
