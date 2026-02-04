# Templates de Código - UAZAPI WhatsApp API

## 🎯 Templates Prontos para Uso

### 1. Cliente Base TypeScript

```typescript
// lib/uazapi.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

export interface UazapiConfig {
  token: string;
  baseURL?: string;
  timeout?: number;
}

export class UazapiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'UazapiError';
  }
}

export class Uazapi {
  private client: AxiosInstance;

  constructor(config: UazapiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL || 'https://free.uazapi.com',
      timeout: config.timeout || 30000,
      headers: { token: config.token }
    });

    // Interceptor de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const message = error.response?.data?.error || error.message;
        throw new UazapiError(
          message,
          error.response?.status,
          error.response?.data
        );
      }
    );
  }

  // Mensagens
  async sendText(jid: string, text: string) {
    const { data } = await this.client.post('/message/text', { jid, text });
    return data;
  }

  async sendImage(jid: string, url: string, caption?: string) {
    const { data } = await this.client.post('/message/image', { jid, url, caption });
    return data;
  }

  async sendAudio(jid: string, url: string) {
    const { data } = await this.client.post('/message/audio', { jid, url });
    return data;
  }

  async sendDocument(jid: string, url: string, filename: string, mimetype: string) {
    const { data } = await this.client.post('/message/document', {
      jid, url, filename, mimetype
    });
    return data;
  }

  async sendLocation(jid: string, latitude: number, longitude: number, name?: string, address?: string) {
    const { data } = await this.client.post('/message/location', {
      jid, latitude, longitude, name, address
    });
    return data;
  }

  async sendButtons(jid: string, text: string, buttons: Array<{ id: string; text: string }>) {
    const { data } = await this.client.post('/message/buttons', { jid, text, buttons });
    return data;
  }

  async sendList(jid: string, text: string, buttonText: string, sections: any[]) {
    const { data } = await this.client.post('/message/list', {
      jid, text, buttonText, sections
    });
    return data;
  }

  // Chats
  async getAllChats() {
    const { data } = await this.client.get('/chats/all');
    return data;
  }

  async getChatMessages(jid: string, limit: number = 50) {
    const { data } = await this.client.post('/chats/messages', { jid, limit });
    return data;
  }

  async markAsRead(jid: string) {
    const { data } = await this.client.post('/chats/markasread', { jid });
    return data;
  }

  // Status
  async getStatus() {
    const { data } = await this.client.get('/instance/status');
    return data;
  }

  async getQRCode() {
    const { data } = await this.client.get('/instance/qrcode');
    return data;
  }

  // Webhook
  async setWebhook(config: {
    enabled: boolean;
    url: string;
    events: string[];
    excludeMessages?: string[];
  }) {
    const { data } = await this.client.post('/instance/webhook', config);
    return data;
  }
}
```

---

### 2. Webhook Handler Express

```typescript
// routes/webhook.ts
import express, { Request, Response } from 'express';
import { Uazapi } from '../lib/uazapi';

const router = express.Router();
const uazapi = new Uazapi({ token: process.env.UAZAPI_TOKEN! });

interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
}

router.post('/webhook', async (req: Request<{}, {}, WebhookPayload>, res: Response) => {
  const { event, instance, data } = req.body;

  console.log(`[Webhook] Event: ${event}, Instance: ${instance}`);

  try {
    switch (event) {
      case 'messages':
        await handleMessage(data);
        break;
      case 'connection':
        await handleConnection(data);
        break;
      case 'messages_update':
        await handleMessageUpdate(data);
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    res.status(500).json({ error: 'Internal error' });
  }
});

async function handleMessage(data: any) {
  const { key, message, pushName } = data;
  const from = key.remoteJid;
  const isFromMe = key.fromMe;

  if (isFromMe) return; // Ignorar mensagens próprias

  const text = message.conversation || message.extendedTextMessage?.text || '';

  console.log(`Message from ${pushName} (${from}): ${text}`);

  // Resposta automática
  if (text.toLowerCase().includes('oi') || text.toLowerCase().includes('olá')) {
    await uazapi.sendText(from, `Olá ${pushName}! Como posso ajudar?`);
  }
}

async function handleConnection(data: any) {
  console.log(`Connection status: ${data.status}`);
}

async function handleMessageUpdate(data: any) {
  const { key, update } = data;
  if (update.status) {
    console.log(`Message ${key.id} status: ${update.status}`);
  }
}

export default router;
```

---

### 3. Sistema de Filas com BullMQ

```typescript
// queues/message-queue.ts
import { Queue, Worker, Job } from 'bullmq';
import { Uazapi } from '../lib/uazapi';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export interface MessageJob {
  jid: string;
  type: 'text' | 'image' | 'audio' | 'document';
  data: any;
}

export const messageQueue = new Queue<MessageJob>('whatsapp-messages', { connection });

export function startWorker() {
  const uazapi = new Uazapi({ token: process.env.UAZAPI_TOKEN! });

  const worker = new Worker<MessageJob>(
    'whatsapp-messages',
    async (job: Job<MessageJob>) => {
      const { jid, type, data } = job.data;

      console.log(`[Queue] Processing ${type} message to ${jid}`);

      try {
        switch (type) {
          case 'text':
            await uazapi.sendText(jid, data.text);
            break;
          case 'image':
            await uazapi.sendImage(jid, data.url, data.caption);
            break;
          case 'audio':
            await uazapi.sendAudio(jid, data.url);
            break;
          case 'document':
            await uazapi.sendDocument(jid, data.url, data.filename, data.mimetype);
            break;
        }

        // Rate limiting: aguardar 3 segundos entre mensagens
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`[Queue] Error processing job ${job.id}:`, error);
        throw error; // Para retry
      }
    },
    {
      connection,
      concurrency: 1, // Uma mensagem por vez
      limiter: {
        max: 20, // 20 mensagens
        duration: 60000, // por minuto
      },
    }
  );

  worker.on('completed', (job) => {
    console.log(`[Queue] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Queue] Job ${job?.id} failed:`, err);
  });

  return worker;
}

// Helper functions
export async function queueTextMessage(jid: string, text: string, priority: number = 5) {
  await messageQueue.add(
    'send-text',
    { jid, type: 'text', data: { text } },
    { priority, attempts: 3 }
  );
}

export async function queueImageMessage(
  jid: string,
  url: string,
  caption?: string,
  priority: number = 5
) {
  await messageQueue.add(
    'send-image',
    { jid, type: 'image', data: { url, caption } },
    { priority, attempts: 3 }
  );
}
```

---

### 4. Chatbot com OpenAI

```typescript
// services/chatbot.ts
import OpenAI from 'openai';
import { Uazapi } from '../lib/uazapi';

export class ChatbotService {
  private openai: OpenAI;
  private uazapi: Uazapi;
  private conversations = new Map<string, any[]>();

  constructor(openaiKey: string, uazapiToken: string) {
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.uazapi = new Uazapi({ token: uazapiToken });
  }

  async processMessage(from: string, text: string, pushName: string) {
    // Obter histórico da conversa
    let history = this.conversations.get(from) || [];

    // Adicionar mensagem do usuário
    history.push({ role: 'user', content: text });

    // Limitar a 10 últimas mensagens
    if (history.length > 10) {
      history = history.slice(-10);
    }

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente virtual prestativo.
            
Nome do cliente: ${pushName}
Seja educado, objetivo e útil.
Use emojis apropriadamente.
Mantenha respostas em até 300 caracteres.

Você pode ajudar com:
- Informações sobre produtos
- Agendamentos
- Dúvidas gerais
- Direcionamento para setores

Se não souber algo, seja honesto e ofereça transferir para um humano.`,
          },
          ...history,
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      const response = completion.choices[0].message.content || 
        'Desculpe, não consegui processar sua mensagem.';

      // Adicionar resposta ao histórico
      history.push({ role: 'assistant', content: response });
      this.conversations.set(from, history);

      // Enviar resposta
      await this.uazapi.sendText(from, response);

      return response;
    } catch (error) {
      console.error('Error processing with OpenAI:', error);
      const errorMsg = 'Desculpe, tive um problema. Tente novamente.';
      await this.uazapi.sendText(from, errorMsg);
      throw error;
    }
  }

  clearHistory(from: string) {
    this.conversations.delete(from);
  }

  getHistory(from: string) {
    return this.conversations.get(from) || [];
  }
}
```

---

### 5. Database Schema (Drizzle ORM)

```typescript
// db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const instancias = pgTable('instancias', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  token: text('token').notNull().unique(),
  waId: text('wa_id'),
  status: text('status').default('disconnected'),
  profileName: text('profile_name'),
  isBusiness: boolean('is_business').default(false),
  webhookUrl: text('webhook_url'),
  ativa: boolean('ativa').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

export const conversas = pgTable('conversas', {
  id: uuid('id').primaryKey().defaultRandom(),
  instanciaId: uuid('instancia_id').references(() => instancias.id),
  waJid: text('wa_jid').notNull(),
  nome: text('nome'),
  isGroup: boolean('is_group').default(false),
  ultimaMensagem: text('ultima_mensagem'),
  timestampUltimaMensagem: timestamp('timestamp_ultima_mensagem'),
  naoLidas: integer('nao_lidas').default(0),
  arquivado: boolean('arquivado').default(false),
  labels: jsonb('labels').$type<string[]>().default([]),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow(),
});

export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id),
  waMsgId: text('wa_msg_id').notNull().unique(),
  deMin: boolean('de_mim').default(false),
  tipo: text('tipo').notNull(),
  conteudo: text('conteudo'),
  mediaUrl: text('media_url'),
  caption: text('caption'),
  quotedMsgId: text('quoted_msg_id'),
  status: integer('status').default(0),
  timestamp: timestamp('timestamp').notNull(),
  metadata: jsonb('metadata'),
  criadoEm: timestamp('criado_em').defaultNow(),
});

export const atendimentos = pgTable('atendimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id),
  atendenteId: uuid('atendente_id'),
  protocolo: text('protocolo').unique(),
  status: text('status').notNull().default('aguardando'),
  prioridade: integer('prioridade').default(3),
  categoria: text('categoria'),
  tags: jsonb('tags').$type<string[]>().default([]),
  observacoes: text('observacoes'),
  iniciadoEm: timestamp('iniciado_em').defaultNow(),
  finalizadoEm: timestamp('finalizado_em'),
});

export const usuarios = pgTable('usuarios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nome: text('nome').notNull(),
  email: text('email').unique(),
  papel: text('papel').notNull().default('atendente'),
  ativo: boolean('ativo').default(true),
  criadoEm: timestamp('criado_em').defaultNow(),
});

// Relations
export const conversasRelations = relations(conversas, ({ one, many }) => ({
  instancia: one(instancias, {
    fields: [conversas.instanciaId],
    references: [instancias.id],
  }),
  mensagens: many(mensagens),
  atendimentos: many(atendimentos),
}));

export const mensagensRelations = relations(mensagens, ({ one }) => ({
  conversa: one(conversas, {
    fields: [mensagens.conversaId],
    references: [conversas.id],
  }),
}));

export const atendimentosRelations = relations(atendimentos, ({ one }) => ({
  conversa: one(conversas, {
    fields: [atendimentos.conversaId],
    references: [conversas.id],
  }),
  atendente: one(usuarios, {
    fields: [atendimentos.atendenteId],
    references: [usuarios.id],
  }),
}));
```

---

### 6. Service Layer Completo

```typescript
// services/conversa-service.ts
import { db } from '../db';
import { conversas, mensagens } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';

export class ConversaService {
  async criarOuAtualizar(instanciaId: string, waJid: string, nome?: string, isGroup: boolean = false) {
    const existente = await db
      .select()
      .from(conversas)
      .where(and(
        eq(conversas.instanciaId, instanciaId),
        eq(conversas.waJid, waJid)
      ))
      .limit(1);

    if (existente.length > 0) {
      const [atualizada] = await db
        .update(conversas)
        .set({ nome, atualizadoEm: new Date() })
        .where(eq(conversas.id, existente[0].id))
        .returning();
      return atualizada;
    }

    const [nova] = await db
      .insert(conversas)
      .values({ instanciaId, waJid, nome, isGroup })
      .returning();

    return nova;
  }

  async adicionarMensagem(data: {
    conversaId: string;
    waMsgId: string;
    deMin: boolean;
    tipo: string;
    conteudo?: string;
    mediaUrl?: string;
    caption?: string;
    timestamp: Date;
  }) {
    const [msg] = await db.insert(mensagens).values(data).returning();

    // Atualizar conversa
    await db
      .update(conversas)
      .set({
        ultimaMensagem: data.conteudo || 'Mídia',
        timestampUltimaMensagem: data.timestamp,
        naoLidas: data.deMin ? 0 : sql`${conversas.naoLidas} + 1`,
        atualizadoEm: new Date(),
      })
      .where(eq(conversas.id, data.conversaId));

    return msg;
  }

  async listarConversas(instanciaId: string, limit: number = 50) {
    return await db
      .select()
      .from(conversas)
      .where(eq(conversas.instanciaId, instanciaId))
      .orderBy(desc(conversas.timestampUltimaMensagem))
      .limit(limit);
  }

  async obterMensagens(conversaId: string, limit: number = 100) {
    return await db
      .select()
      .from(mensagens)
      .where(eq(mensagens.conversaId, conversaId))
      .orderBy(desc(mensagens.timestamp))
      .limit(limit);
  }

  async marcarComoLido(conversaId: string) {
    await db
      .update(conversas)
      .set({ naoLidas: 0, atualizadoEm: new Date() })
      .where(eq(conversas.id, conversaId));
  }

  async arquivar(conversaId: string, arquivado: boolean = true) {
    await db
      .update(conversas)
      .set({ arquivado, atualizadoEm: new Date() })
      .where(eq(conversas.id, conversaId));
  }
}
```

---

### 7. Aplicação Completa (index.ts)

```typescript
// index.ts
import express from 'express';
import { Uazapi } from './lib/uazapi';
import webhookRoutes from './routes/webhook';
import { startWorker } from './queues/message-queue';
import { ChatbotService } from './services/chatbot';

const app = express();
app.use(express.json());

// Inicializar serviços
const uazapi = new Uazapi({ token: process.env.UAZAPI_TOKEN! });
const chatbot = new ChatbotService(
  process.env.OPENAI_API_KEY!,
  process.env.UAZAPI_TOKEN!
);

// Worker de filas
startWorker();

// Routes
app.use('/api', webhookRoutes);

// Health check
app.get('/health', async (req, res) => {
  try {
    const status = await uazapi.getStatus();
    res.json({
      status: 'healthy',
      whatsapp: status.status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 WhatsApp integration ready`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});
```

---

### 8. Package.json

```json
{
  "name": "whatsapp-uazapi-integration",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg"
  },
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "bullmq": "^5.0.0",
    "openai": "^4.20.0",
    "drizzle-orm": "^0.29.0",
    "postgres": "^3.4.0",
    "ioredis": "^5.3.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3",
    "drizzle-kit": "^0.20.0"
  }
}
```

---

### 9. .env.example

```env
# UAZAPI Configuration
UAZAPI_TOKEN=seu_token_aqui
UAZAPI_BASE_URL=https://free.uazapi.com

# OpenAI
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Server
PORT=3000
NODE_ENV=development

# Webhook
WEBHOOK_URL=https://seu-dominio.com/api/webhook
```

---

### 10. Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - UAZAPI_TOKEN=${UAZAPI_TOKEN}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/whatsapp
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=whatsapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Esses templates fornecem uma base sólida para começar a desenvolver com a API UAZAPI!
