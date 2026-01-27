import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registrarSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'CRM WhatsApp Omnichannel API',
        description: 'API do CRM WhatsApp Omnichannel - Multi-tenant SaaS',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3335',
          description: 'Desenvolvimento',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ bearerAuth: [] }],
      tags: [
        { name: 'Saude', description: 'Health check' },
        { name: 'Autenticacao', description: 'Login e tokens' },
        { name: 'Licencas', description: 'Gerenciamento de licencas' },
        { name: 'Clientes', description: 'Gerenciamento de clientes' },
        { name: 'Usuarios', description: 'Gerenciamento de usuarios' },
        { name: 'Equipes', description: 'Gerenciamento de equipes' },
        { name: 'Perfis', description: 'Perfis e permissoes' },
        { name: 'Conexoes', description: 'Conexoes WhatsApp/Instagram' },
        { name: 'Contatos', description: 'Gerenciamento de contatos' },
        { name: 'Etiquetas', description: 'Etiquetas para contatos' },
        { name: 'Conversas', description: 'Conversas e atendimento' },
        { name: 'Mensagens', description: 'Envio e recebimento de mensagens' },
        { name: 'Notas Internas', description: 'Notas internas em conversas' },
        { name: 'Chatbot', description: 'Fluxos e nos do chatbot' },
        { name: 'Respostas Rapidas', description: 'Respostas rapidas' },
        { name: 'Campanhas', description: 'Campanhas de mensagens' },
        { name: 'Mensagens Agendadas', description: 'Agendamento de mensagens' },
        { name: 'Kanban', description: 'Quadros Kanban' },
        { name: 'Agendamento', description: 'Compromissos e lembretes' },
        { name: 'Relatorios', description: 'Relatorios e dashboard' },
        { name: 'Uploads', description: 'Upload de arquivos' },
        { name: 'Webhooks', description: 'Webhooks WhatsApp' },
      ],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/api/documentacao',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      persistAuthorization: true,
    },
  });
}
