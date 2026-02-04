import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import underPressure from '@fastify/under-pressure';
import {
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod';
import { join } from 'path';
import { existsSync } from 'fs';

import { env } from './configuracao/ambiente.js';
import { registrarSwagger } from './configuracao/swagger.js';
import { tratadorErrosGlobal } from './compartilhado/erros/index.js';
import { logger } from './compartilhado/utilitarios/logger.js';
import { httpRequestsTotal, httpRequestDuration } from './infraestrutura/observabilidade/index.js';

// Middlewares e Guardas
import { autenticacaoMiddleware } from './compartilhado/middlewares/index.js';
import { criarGuardaPermissao } from './compartilhado/guardas/index.js';

// Rotas
import { saudeRotas } from './modulos/saude/saude.rotas.js';
import { autenticacaoRotas } from './modulos/autenticacao/index.js';
import { licencasRotas } from './modulos/licencas/index.js';
import { clientesRotas } from './modulos/clientes/index.js';
import { usuariosRotas } from './modulos/usuarios/index.js';
import { equipesRotas } from './modulos/equipes/index.js';
import { perfisRotas } from './modulos/perfis/index.js';
import { conexoesRotas } from './modulos/conexoes/index.js';
import { contatosRotas } from './modulos/contatos/index.js';
import { etiquetasRotas } from './modulos/etiquetas/index.js';
import { conversasRotas } from './modulos/conversas/index.js';
import { mensagensRotas } from './modulos/mensagens/index.js';
import { notasInternasRotas } from './modulos/notas-internas/index.js';
import { fluxosRotas, nosRotas, respostasRapidasRotas, registrarRotasTransicoes } from './modulos/chatbot/index.js';
import { campanhasRotas, logsRotas, mensagensAgendadasRotas } from './modulos/campanhas/index.js';
import { quadrosRotas, colunasRotas, cartoesRotas } from './modulos/kanban/index.js';
import { compromissosRotas, lembretesRotas } from './modulos/agendamento/index.js';
import { relatoriosRotas, dashboardRotas } from './modulos/relatorios/index.js';
import { uploadsRotas } from './modulos/uploads/index.js';
import { webhookRotas } from './modulos/whatsapp/index.js';

export async function criarServidor(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: env.NODE_ENV === 'development'
      ? {
          level: env.LOG_LEVEL,
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
              colorize: true,
            },
          },
        }
      : true,
    trustProxy: true,
  });

  // =============================================================================
  // Type Provider Zod (validacao e serializacao tipada)
  // =============================================================================

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // =============================================================================
  // Plugins de Seguranca
  // =============================================================================

  await app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : ['http://localhost:5000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(cookie, {
    secret: env.COOKIE_SECRET,
    parseOptions: {},
  });

  await app.register(rateLimit, {
    max: 500, // Aumentado de 100 para 500 requisições por minuto
    timeWindow: '1 minute',
    allowList: (request) => {
      // Rotas de autenticação têm limite mais alto
      if (request.url?.startsWith('/api/autenticacao/')) {
        return true; // Sem limite para auth (já tem proteção de tentativas de login)
      }
      // Health check sem limite
      if (request.url?.startsWith('/api/saude')) {
        return true;
      }
      return false;
    },
    errorResponseBuilder: (_request, context) => ({
      sucesso: false,
      erro: {
        codigo: 'LIMITE_EXCEDIDO',
        mensagem: `Muitas requisicoes (${context.max}/min). Tente novamente em ${context.after}.`,
      },
    }),
  });

  // =============================================================================
  // Under Pressure (monitoramento de carga)
  // =============================================================================

  await app.register(underPressure, {
    maxEventLoopDelay: 1000,         // ms - event loop lag máximo
    maxHeapUsedBytes: 1_500_000_000, // ~1.5GB heap
    maxRssBytes: 2_500_000_000,      // ~2.5GB RSS
    pressureHandler: (_req, rep, type, value) => {
      logger.warn({ type, value }, 'Servidor sob pressao');
      rep.status(503).send({ sucesso: false, erro: { codigo: 'SERVIDOR_SOBRECARREGADO', mensagem: 'Servidor temporariamente sobrecarregado. Tente novamente.' } });
    },
    exposeStatusRoute: {
      routeOpts: { logLevel: 'silent' as const },
      routeSchemaOpts: { hide: true },
      url: '/api/saude/pressao',
    },
  });

  // =============================================================================
  // Swagger / OpenAPI
  // =============================================================================

  await registrarSwagger(app);

  // =============================================================================
  // Multipart (Upload de Arquivos)
  // =============================================================================

  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB max
      files: 10, // Max 10 arquivos por requisicao
    },
  });

  // =============================================================================
  // Static Files - Frontend SPA (producao)
  // =============================================================================

  const frontendPath = join(process.cwd(), 'public');
  const temFrontend = existsSync(join(frontendPath, 'index.html'));

  if (temFrontend) {
    await app.register(fastifyStatic, {
      root: frontendPath,
      wildcard: false, // Não usar wildcard - deixar setNotFoundHandler lidar com rotas SPA
    });
    logger.info({ path: frontendPath }, 'Frontend SPA disponivel');
  }

  // =============================================================================
  // Static Files - Uploads locais
  // =============================================================================

  await app.register(fastifyStatic, {
    root: join(process.cwd(), env.STORAGE_LOCAL_PATH || './uploads'),
    prefix: '/uploads/',
    decorateReply: !temFrontend,
  });

  // =============================================================================
  // Tratador de Erros Global
  // =============================================================================

  app.setErrorHandler(tratadorErrosGlobal);

  // =============================================================================
  // Decorators (Helpers globais)
  // =============================================================================

  // Decorator para autenticacao
  app.decorate('autenticar', autenticacaoMiddleware);

  // Decorator para verificar permissao
  app.decorate('verificarPermissao', (permissao: string) => criarGuardaPermissao(permissao));

  // =============================================================================
  // Rotas
  // =============================================================================

  // Prefixo padrao para API
  app.register(
    async (apiRouter) => {
      // Health Check (publico)
      apiRouter.register(saudeRotas, { prefix: '/saude' });

      // Autenticacao (publico)
      apiRouter.register(autenticacaoRotas, { prefix: '/autenticacao' });

      // Licencas (misto)
      apiRouter.register(licencasRotas, { prefix: '/licencas' });

      // Clientes (super admin apenas)
      apiRouter.register(clientesRotas, { prefix: '/clientes' });

      // Usuarios (protegido)
      apiRouter.register(usuariosRotas, { prefix: '/usuarios' });

      // Equipes (protegido)
      apiRouter.register(equipesRotas, { prefix: '/equipes' });

      // Perfis (protegido)
      apiRouter.register(perfisRotas, { prefix: '/perfis' });

      // Conexoes (protegido)
      apiRouter.register(conexoesRotas, { prefix: '/conexoes' });

      // Contatos (protegido)
      apiRouter.register(contatosRotas, { prefix: '/contatos' });

      // Etiquetas (protegido)
      apiRouter.register(etiquetasRotas, { prefix: '/etiquetas' });

      // Conversas (protegido) - inclui mensagens e notas como sub-rotas
      apiRouter.register(conversasRotas, { prefix: '/conversas' });
      apiRouter.register(mensagensRotas, { prefix: '/conversas' });
      apiRouter.register(notasInternasRotas, { prefix: '/conversas' });

      // WhatsApp Webhooks (Meta Cloud API e UaiZap)
      apiRouter.register(webhookRotas, { prefix: '/whatsapp/webhook' });

      // Chatbot (fluxos, nós e transições)
      apiRouter.register(fluxosRotas, { prefix: '/chatbot/fluxos' });
      apiRouter.register(nosRotas, { prefix: '/chatbot/fluxos' });
      await registrarRotasTransicoes(apiRouter);

      // Respostas Rápidas
      apiRouter.register(respostasRapidasRotas, { prefix: '/respostas-rapidas' });

      // Campanhas
      apiRouter.register(campanhasRotas, { prefix: '/campanhas' });
      apiRouter.register(logsRotas, { prefix: '/campanhas' });

      // Mensagens Agendadas
      apiRouter.register(mensagensAgendadasRotas, { prefix: '/mensagens-agendadas' });

      // Kanban
      apiRouter.register(quadrosRotas, { prefix: '/kanban/quadros' });
      apiRouter.register(colunasRotas, { prefix: '/kanban/quadros' });
      apiRouter.register(cartoesRotas, { prefix: '/kanban/quadros' });

      // Agendamento
      apiRouter.register(compromissosRotas, { prefix: '/agendamento/compromissos' });
      apiRouter.register(lembretesRotas, { prefix: '/agendamento/compromissos' });

      // Relatórios e Dashboard
      apiRouter.register(relatoriosRotas, { prefix: '/relatorios' });
      apiRouter.register(dashboardRotas, { prefix: '/dashboard' });

      // Uploads
      apiRouter.register(uploadsRotas, { prefix: '/uploads' });
    },
    { prefix: '/api' }
  );

  // =============================================================================
  // SPA Fallback (producao: retorna index.html para rotas do React)
  // =============================================================================

  app.setNotFoundHandler(async (request, reply) => {
    // Rotas da API: retorna 404 JSON
    if (request.url.startsWith('/api/')) {
      return reply.status(404).send({
        sucesso: false,
        erro: { codigo: 'ROTA_NAO_ENCONTRADA', mensagem: 'Rota nao encontrada' },
      });
    }

    // Arquivos estáticos que não existem (com extensão): retorna 404
    const temExtensao = /\.[a-zA-Z0-9]+$/.test(request.url.split('?')[0]);
    if (temExtensao) {
      return reply.status(404).send({
        sucesso: false,
        erro: { codigo: 'ARQUIVO_NAO_ENCONTRADO', mensagem: 'Arquivo nao encontrado' },
      });
    }

    // SPA fallback: retorna index.html para rotas do frontend (sem extensão)
    if (temFrontend) {
      try {
        return reply.sendFile('index.html');
      } catch (err) {
        logger.error({ err, url: request.url }, 'Erro ao servir index.html');
        return reply.status(500).send({
          sucesso: false,
          erro: { codigo: 'ERRO_FRONTEND', mensagem: 'Erro ao carregar aplicacao' },
        });
      }
    }

    // Dev sem frontend: mostra info da API
    return reply.send({
      nome: 'Inboxx API',
      versao: '1.0.0',
      documentacao: '/api/saude',
    });
  });

  // =============================================================================
  // Hooks
  // =============================================================================

  app.addHook('onRequest', async (request) => {
    request.log.info({
      metodo: request.method,
      url: request.url,
      ip: request.ip,
    });
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info({
      metodo: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      tempoResposta: reply.elapsedTime,
    });

    // Metricas Prometheus (protegido contra erros)
    try {
      const rota = request.routeOptions?.url ?? request.url;
      const labels = {
        method: request.method,
        route: rota,
        status_code: String(reply.statusCode),
      };
      httpRequestsTotal.inc(labels);
      httpRequestDuration.observe(labels, reply.elapsedTime / 1000);
    } catch {
      // Ignora erros de metricas para nao afetar a resposta
    }
  });

  return app;
}
