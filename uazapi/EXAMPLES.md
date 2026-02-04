# Exemplos Práticos - UAZAPI WhatsApp API

## 1. Sistema Completo de Chatbot

### Cliente UAZAPI TypeScript
```typescript
// src/lib/uazapi-client.ts
import axios, { AxiosInstance } from 'axios';

export class UazapiClient {
  private client: AxiosInstance;
  
  constructor(
    private token: string,
    private baseURL: string = 'https://free.uazapi.com'
  ) {
    this.client = axios.create({
      baseURL,
      headers: { token }
    });
  }
  
  // Mensagens
  async enviarTexto(jid: string, text: string) {
    return this.client.post('/message/text', { jid, text });
  }
  
  async enviarImagem(jid: string, url: string, caption?: string) {
    return this.client.post('/message/image', { jid, url, caption });
  }
  
  async enviarAudio(jid: string, url: string) {
    return this.client.post('/message/audio', { jid, url });
  }
  
  async enviarDocumento(jid: string, url: string, filename: string, mimetype: string) {
    return this.client.post('/message/document', { jid, url, filename, mimetype });
  }
  
  async enviarLocalizacao(jid: string, lat: number, lng: number, name?: string, address?: string) {
    return this.client.post('/message/location', {
      jid,
      latitude: lat,
      longitude: lng,
      name,
      address
    });
  }
  
  async enviarBotoes(jid: string, text: string, buttons: Array<{ id: string; text: string }>) {
    return this.client.post('/message/buttons', { jid, text, buttons });
  }
  
  async enviarLista(
    jid: string,
    text: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>
  ) {
    return this.client.post('/message/list', { jid, text, buttonText, sections });
  }
  
  // Conversas
  async listarChats() {
    return this.client.get('/chats/all');
  }
  
  async obterMensagens(jid: string, limit: number = 50) {
    return this.client.post('/chats/messages', { jid, limit });
  }
  
  async marcarComoLido(jid: string) {
    return this.client.post('/chats/markasread', { jid });
  }
  
  async arquivarChat(jid: string, archive: boolean = true) {
    return this.client.post('/chats/archive', { jid, archive });
  }
  
  // Contatos
  async verificarNumero(jid: string) {
    return this.client.post('/contacts/check', { jid });
  }
  
  async buscarContato(query: string) {
    return this.client.post('/contacts/search', { query });
  }
  
  async obterFotoPerfil(jid: string) {
    return this.client.post('/contacts/profilepic', { jid });
  }
  
  // Status/Presença
  async definirPresenca(presence: 'available' | 'unavailable') {
    return this.client.post('/presence/update', { presence });
  }
  
  async definirStatus(status: string) {
    return this.client.post('/presence/status/update', { status });
  }
  
  // Grupos
  async criarGrupo(name: string, participants: string[]) {
    return this.client.post('/groups/create', { name, participants });
  }
  
  async adicionarParticipantes(jid: string, participants: string[]) {
    return this.client.post('/groups/participants/add', { jid, participants });
  }
  
  async removerParticipantes(jid: string, participants: string[]) {
    return this.client.post('/groups/participants/remove', { jid, participants });
  }
  
  async promoverAdmin(jid: string, participants: string[]) {
    return this.client.post('/groups/participants/promote', { jid, participants });
  }
  
  async rebaixarAdmin(jid: string, participants: string[]) {
    return this.client.post('/groups/participants/demote', { jid, participants });
  }
  
  async atualizarNomeGrupo(jid: string, name: string) {
    return this.client.post('/groups/name/update', { jid, name });
  }
  
  async atualizarDescricaoGrupo(jid: string, description: string) {
    return this.client.post('/groups/description/update', { jid, description });
  }
  
  // Instância
  async obterStatus() {
    return this.client.get('/instance/status');
  }
  
  async obterQRCode() {
    return this.client.get('/instance/qrcode');
  }
  
  async gerarPairCode(phone: string) {
    return this.client.post('/instance/paircode', { phone });
  }
  
  async desconectar() {
    return this.client.get('/instance/logout');
  }
  
  async configurarWebhook(config: {
    enabled: boolean;
    url: string;
    events: string[];
    excludeMessages?: string[];
  }) {
    return this.client.post('/instance/webhook', config);
  }
}
```

### Webhook Handler com Fastify
```typescript
// src/webhooks/whatsapp-webhook.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UazapiClient } from '../lib/uazapi-client';

interface WebhookPayload {
  event: string;
  instance: string;
  data: any;
}

export async function setupWebhooks(fastify: FastifyInstance) {
  const uazapi = new UazapiClient(process.env.UAZAPI_TOKEN!);
  
  fastify.post<{ Body: WebhookPayload }>(
    '/webhooks/whatsapp',
    async (request, reply) => {
      const { event, instance, data } = request.body;
      
      try {
        await handleWebhookEvent(event, instance, data, uazapi);
        return { success: true };
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({ error: 'Internal server error' });
      }
    }
  );
}

async function handleWebhookEvent(
  event: string,
  instance: string,
  data: any,
  uazapi: UazapiClient
) {
  switch (event) {
    case 'messages':
      await handleNewMessage(data, uazapi);
      break;
      
    case 'connection':
      await handleConnectionChange(data);
      break;
      
    case 'messages_update':
      await handleMessageUpdate(data);
      break;
      
    case 'presence':
      await handlePresenceUpdate(data);
      break;
      
    default:
      console.log(`Evento não tratado: ${event}`);
  }
}

async function handleNewMessage(data: any, uazapi: UazapiClient) {
  const { key, message, pushName, messageTimestamp } = data;
  const from = key.remoteJid;
  const isFromMe = key.fromMe;
  
  // Ignorar mensagens enviadas por nós
  if (isFromMe) return;
  
  // Extrair texto da mensagem
  const text = 
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    '';
  
  console.log(`Nova mensagem de ${pushName} (${from}): ${text}`);
  
  // Processar comandos
  if (text.startsWith('/')) {
    await processCommand(text, from, uazapi);
    return;
  }
  
  // Resposta automática simples
  if (text.toLowerCase().includes('olá') || text.toLowerCase().includes('oi')) {
    await uazapi.enviarTexto(
      from,
      `Olá ${pushName}! 👋 Como posso ajudar você hoje?`
    );
  }
}

async function processCommand(command: string, from: string, uazapi: UazapiClient) {
  const [cmd, ...args] = command.slice(1).split(' ');
  
  switch (cmd.toLowerCase()) {
    case 'help':
      await uazapi.enviarTexto(
        from,
        `📋 *Comandos disponíveis:*
        
/help - Exibe esta mensagem
/menu - Mostra o menu de opções
/status - Verifica o status do atendimento
/falar - Falar com um atendente

Digite qualquer mensagem para iniciar uma conversa!`
      );
      break;
      
    case 'menu':
      await uazapi.enviarLista(
        from,
        '📱 Selecione uma opção abaixo:',
        'Ver Menu',
        [
          {
            title: 'Serviços',
            rows: [
              { id: 'servico_1', title: 'Consultoria', description: 'Consultoria especializada' },
              { id: 'servico_2', title: 'Suporte', description: 'Suporte técnico 24/7' },
              { id: 'servico_3', title: 'Vendas', description: 'Falar com vendas' }
            ]
          },
          {
            title: 'Informações',
            rows: [
              { id: 'info_1', title: 'Horário', description: 'Horário de atendimento' },
              { id: 'info_2', title: 'Localização', description: 'Nosso endereço' }
            ]
          }
        ]
      );
      break;
      
    case 'status':
      await uazapi.enviarTexto(
        from,
        '✅ Sistema operando normalmente!\n\n⏰ Horário: Seg-Sex 9h às 18h'
      );
      break;
      
    default:
      await uazapi.enviarTexto(
        from,
        'Comando não reconhecido. Digite /help para ver os comandos disponíveis.'
      );
  }
}

async function handleConnectionChange(data: any) {
  console.log(`Status de conexão: ${data.status}`);
  
  if (data.status === 'connected') {
    console.log(`✅ Conectado como: ${data.profileName}`);
  } else if (data.status === 'disconnected') {
    console.log(`❌ Desconectado. Motivo: ${data.reason || 'Desconhecido'}`);
  }
}

async function handleMessageUpdate(data: any) {
  const { key, update } = data;
  
  if (update.status) {
    const statusMap = {
      0: 'Erro',
      1: 'Pendente',
      2: 'Enviado',
      3: 'Entregue',
      4: 'Lido',
      5: 'Reproduzido'
    };
    
    console.log(
      `Mensagem ${key.id}: ${statusMap[update.status] || 'Desconhecido'}`
    );
  }
}

async function handlePresenceUpdate(data: any) {
  const { jid, presence } = data;
  console.log(`${jid} está ${presence}`);
}
```

## 2. Sistema de Filas com BullMQ

```typescript
// src/queues/message-queue.ts
import { Queue, Worker } from 'bullmq';
import { UazapiClient } from '../lib/uazapi-client';

const connection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379')
};

export const messageQueue = new Queue('whatsapp-messages', { connection });

interface MessageJob {
  jid: string;
  type: 'text' | 'image' | 'audio' | 'document';
  content: any;
  priority?: number;
}

export function setupMessageWorker() {
  const uazapi = new UazapiClient(process.env.UAZAPI_TOKEN!);
  
  const worker = new Worker<MessageJob>(
    'whatsapp-messages',
    async (job) => {
      const { jid, type, content } = job.data;
      
      console.log(`Processando mensagem ${type} para ${jid}`);
      
      switch (type) {
        case 'text':
          await uazapi.enviarTexto(jid, content.text);
          break;
          
        case 'image':
          await uazapi.enviarImagem(jid, content.url, content.caption);
          break;
          
        case 'audio':
          await uazapi.enviarAudio(jid, content.url);
          break;
          
        case 'document':
          await uazapi.enviarDocumento(
            jid,
            content.url,
            content.filename,
            content.mimetype
          );
          break;
      }
      
      // Aguardar 3 segundos entre mensagens (rate limiting)
      await new Promise(resolve => setTimeout(resolve, 3000));
    },
    {
      connection,
      concurrency: 1, // Processar uma mensagem por vez
      limiter: {
        max: 20, // Máximo 20 mensagens
        duration: 60000 // Por minuto
      }
    }
  );
  
  worker.on('completed', (job) => {
    console.log(`✅ Mensagem enviada: ${job.id}`);
  });
  
  worker.on('failed', (job, err) => {
    console.error(`❌ Erro ao enviar mensagem ${job?.id}:`, err);
  });
  
  return worker;
}

// Funções auxiliares para adicionar jobs
export async function enviarMensagemNaFila(
  jid: string,
  text: string,
  priority: number = 5
) {
  await messageQueue.add(
    'send-text',
    { jid, type: 'text', content: { text } },
    { priority }
  );
}

export async function enviarImagemNaFila(
  jid: string,
  url: string,
  caption?: string,
  priority: number = 5
) {
  await messageQueue.add(
    'send-image',
    { jid, type: 'image', content: { url, caption } },
    { priority }
  );
}
```

## 3. Integração com Banco de Dados (Drizzle ORM)

```typescript
// src/db/schema.ts
import { pgTable, uuid, text, timestamp, boolean, integer } from 'drizzle-orm/pg-core';

export const conversas = pgTable('conversas', {
  id: uuid('id').primaryKey().defaultRandom(),
  waJid: text('wa_jid').notNull().unique(),
  nome: text('nome'),
  ultimaMensagem: text('ultima_mensagem'),
  dataUltimaMensagem: timestamp('data_ultima_mensagem'),
  naoLidas: integer('nao_lidas').default(0),
  arquivado: boolean('arquivado').default(false),
  criadoEm: timestamp('criado_em').defaultNow(),
  atualizadoEm: timestamp('atualizado_em').defaultNow()
});

export const mensagens = pgTable('mensagens', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id),
  waMsgId: text('wa_msg_id').notNull(),
  deMin: boolean('de_mim').default(false),
  tipo: text('tipo').notNull(), // text, image, audio, etc
  conteudo: text('conteudo'),
  mediaUrl: text('media_url'),
  status: integer('status').default(0), // ack
  timestamp: timestamp('timestamp').notNull(),
  criadoEm: timestamp('criado_em').defaultNow()
});

export const atendimentos = pgTable('atendimentos', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversaId: uuid('conversa_id').references(() => conversas.id),
  atendenteId: uuid('atendente_id'),
  status: text('status').notNull(), // aguardando, em_atendimento, finalizado
  protocolo: text('protocolo').unique(),
  iniciadoEm: timestamp('iniciado_em').defaultNow(),
  finalizadoEm: timestamp('finalizado_em')
});

// src/services/conversa-service.ts
import { db } from '../db';
import { conversas, mensagens } from '../db/schema';
import { eq } from 'drizzle-orm';

export class ConversaService {
  async criarOuAtualizar(waJid: string, nome?: string) {
    const existente = await db
      .select()
      .from(conversas)
      .where(eq(conversas.waJid, waJid))
      .limit(1);
    
    if (existente.length > 0) {
      return existente[0];
    }
    
    const [novaConversa] = await db
      .insert(conversas)
      .values({ waJid, nome })
      .returning();
    
    return novaConversa;
  }
  
  async adicionarMensagem(data: {
    conversaId: string;
    waMsgId: string;
    deMin: boolean;
    tipo: string;
    conteudo?: string;
    mediaUrl?: string;
    timestamp: Date;
  }) {
    const [mensagem] = await db
      .insert(mensagens)
      .values(data)
      .returning();
    
    // Atualizar última mensagem na conversa
    await db
      .update(conversas)
      .set({
        ultimaMensagem: data.conteudo,
        dataUltimaMensagem: data.timestamp,
        atualizadoEm: new Date()
      })
      .where(eq(conversas.id, data.conversaId));
    
    return mensagem;
  }
  
  async atualizarStatusMensagem(waMsgId: string, status: number) {
    await db
      .update(mensagens)
      .set({ status })
      .where(eq(mensagens.waMsgId, waMsgId));
  }
  
  async incrementarNaoLidas(conversaId: string) {
    await db.execute(sql`
      UPDATE ${conversas}
      SET nao_lidas = nao_lidas + 1
      WHERE id = ${conversaId}
    `);
  }
  
  async marcarComoLido(conversaId: string) {
    await db
      .update(conversas)
      .set({ naoLidas: 0 })
      .where(eq(conversas.id, conversaId));
  }
}
```

## 4. Sistema de Chatbot Inteligente

```typescript
// src/services/chatbot-service.ts
import OpenAI from 'openai';
import { UazapiClient } from '../lib/uazapi-client';

export class ChatbotService {
  private openai: OpenAI;
  private conversationHistory = new Map<string, any[]>();
  
  constructor(
    private uazapi: UazapiClient,
    openaiKey: string
  ) {
    this.openai = new OpenAI({ apiKey: openaiKey });
  }
  
  async processarMensagem(from: string, text: string, pushName: string) {
    // Obter histórico da conversa
    let history = this.conversationHistory.get(from) || [];
    
    // Adicionar mensagem do usuário
    history.push({
      role: 'user',
      content: text
    });
    
    // Limitar histórico a últimas 10 mensagens
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente virtual prestativo de uma empresa.
            
Seu nome é Assistant Bot.
Seja educado, objetivo e útil.
Use emojis quando apropriado.
Mantenha respostas concisas (máximo 300 caracteres para WhatsApp).

O cliente se chama ${pushName}.

Você pode ajudar com:
- Informações sobre produtos e serviços
- Agendamento de atendimentos
- Dúvidas gerais
- Direcionar para setores específicos

Se não souber algo, seja honesto e ofereça transferir para um atendente humano.`
          },
          ...history
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const resposta = completion.choices[0].message.content || 
        'Desculpe, não consegui processar sua mensagem.';
      
      // Adicionar resposta ao histórico
      history.push({
        role: 'assistant',
        content: resposta
      });
      
      // Salvar histórico
      this.conversationHistory.set(from, history);
      
      // Enviar resposta
      await this.uazapi.enviarTexto(from, resposta);
      
    } catch (error) {
      console.error('Erro ao processar com OpenAI:', error);
      await this.uazapi.enviarTexto(
        from,
        'Desculpe, tive um problema ao processar sua mensagem. Por favor, tente novamente.'
      );
    }
  }
  
  limparHistorico(from: string) {
    this.conversationHistory.delete(from);
  }
}
```

## 5. Dashboard de Monitoramento

```typescript
// src/routes/dashboard.ts
import { FastifyInstance } from 'fastify';
import { UazapiClient } from '../lib/uazapi-client';
import { db } from '../db';
import { conversas, mensagens } from '../db/schema';
import { count, desc, sql } from 'drizzle-orm';

export async function dashboardRoutes(fastify: FastifyInstance) {
  const uazapi = new UazapiClient(process.env.UAZAPI_TOKEN!);
  
  fastify.get('/api/dashboard/stats', async (request, reply) => {
    const [stats] = await db
      .select({
        totalConversas: count(conversas.id),
        conversasAtivas: sql<number>`count(*) filter (where ${conversas.arquivado} = false)`,
        mensagensHoje: sql<number>`
          (select count(*) from ${mensagens} 
           where date(${mensagens.timestamp}) = current_date)
        `
      })
      .from(conversas);
    
    const statusInstance = await uazapi.obterStatus();
    
    return {
      instance: statusInstance.data,
      stats
    };
  });
  
  fastify.get('/api/dashboard/conversas', async (request, reply) => {
    const conversasAtivas = await db
      .select()
      .from(conversas)
      .where(eq(conversas.arquivado, false))
      .orderBy(desc(conversas.dataUltimaMensagem))
      .limit(50);
    
    return { conversas: conversasAtivas };
  });
  
  fastify.get('/api/dashboard/mensagens/:conversaId', async (request, reply) => {
    const { conversaId } = request.params as { conversaId: string };
    
    const msgs = await db
      .select()
      .from(mensagens)
      .where(eq(mensagens.conversaId, conversaId))
      .orderBy(mensagens.timestamp)
      .limit(100);
    
    return { mensagens: msgs };
  });
}
```

Esses exemplos cobrem os casos de uso mais comuns. Precisa de mais exemplos específicos?
