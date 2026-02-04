# UAZAPI WhatsApp API - Claude Code Skill

> Skill completo para integração com a API UAZAPI do WhatsApp

## 📚 Documentação

Este skill está organizado nos seguintes arquivos:

### 1. [SKILL.md](./SKILL.md)
Documentação principal com:
- Visão geral da API
- Estruturas de dados
- Fluxos principais
- Configurações e autenticação
- Webhooks
- Boas práticas
- Troubleshooting

### 2. [EXAMPLES.md](./EXAMPLES.md)
Exemplos práticos de implementação:
- Cliente TypeScript completo
- Handler de webhooks com Fastify
- Sistema de filas com BullMQ
- Integração com banco de dados (Drizzle ORM)
- Chatbot inteligente com OpenAI
- Dashboard de monitoramento

### 3. [API_REFERENCE.md](./API_REFERENCE.md)
Referência rápida de todos os endpoints:
- Instâncias
- Mensagens (texto, mídia, interativas)
- Conversas e contatos
- Grupos
- Labels
- Business/Catálogo
- Formatos e códigos

## 🚀 Quick Start

### 1. Criar Instância

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://free.uazapi.com',
  headers: { admintoken: 'seu_admin_token' }
});

const response = await api.post('/instance/create', {
  name: 'Minha Instância',
  token: 'meu_token_unico'
});

console.log('Instância criada:', response.data);
```

### 2. Conectar via QR Code

```typescript
const api = axios.create({
  baseURL: 'https://free.uazapi.com',
  headers: { token: 'meu_token_unico' }
});

const qr = await api.get('/instance/qrcode');
console.log('Escaneie este QR Code:', qr.data.qrcode);

// Verificar status
const status = await api.get('/instance/status');
console.log('Status:', status.data.status);
```

### 3. Configurar Webhook

```typescript
await api.post('/instance/webhook', {
  enabled: true,
  url: 'https://seu-servidor.com/webhook',
  events: ['messages', 'connection', 'messages_update'],
  excludeMessages: ['fromMeYes', 'isGroupYes']
});
```

### 4. Enviar Mensagem

```typescript
await api.post('/message/text', {
  jid: '5511999999999@s.whatsapp.net',
  text: 'Olá! Esta é uma mensagem de teste.'
});
```

## 🛠️ Casos de Uso

### Sistema de Atendimento
```typescript
// Webhook handler
app.post('/webhook', async (req, res) => {
  const { event, data } = req.body;
  
  if (event === 'messages' && !data.key.fromMe) {
    const from = data.key.remoteJid;
    const text = data.message.conversation;
    
    // Processar mensagem e responder
    await processarAtendimento(from, text);
  }
  
  res.json({ ok: true });
});
```

### Envio em Massa com Fila
```typescript
import { Queue, Worker } from 'bullmq';

const queue = new Queue('whatsapp-messages');

// Adicionar mensagens na fila
await queue.add('send', {
  jid: '5511999999999@s.whatsapp.net',
  text: 'Mensagem personalizada'
});

// Processar fila
new Worker('whatsapp-messages', async (job) => {
  await api.post('/message/text', job.data);
  await new Promise(r => setTimeout(r, 3000)); // Rate limit
});
```

### Chatbot com IA
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

async function responderComIA(from: string, mensagem: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      { role: 'system', content: 'Você é um assistente prestativo.' },
      { role: 'user', content: mensagem }
    ]
  });
  
  const resposta = completion.choices[0].message.content;
  
  await api.post('/message/text', {
    jid: from,
    text: resposta
  });
}
```

## 📋 Recursos Principais

### ✅ Mensagens
- [x] Texto simples
- [x] Imagens, vídeos, áudio
- [x] Documentos
- [x] Localização
- [x] Contatos
- [x] Stickers
- [x] Botões e listas (Business)
- [x] Produtos (Business)
- [x] Enquetes
- [x] Reações

### ✅ Gerenciamento
- [x] Múltiplas instâncias
- [x] Webhooks configuráveis
- [x] Status e presença
- [x] Labels/Etiquetas
- [x] Arquivar conversas
- [x] Marcar como lido

### ✅ Grupos
- [x] Criar e gerenciar grupos
- [x] Adicionar/remover participantes
- [x] Promover/rebaixar admins
- [x] Configurações de grupo

### ✅ Business
- [x] Catálogo de produtos
- [x] Perfil business
- [x] Envio de produtos

### ✅ Chatbot
- [x] Integração OpenAI nativa
- [x] Ignorar grupos
- [x] Pausa de conversa
- [x] Stop words

## ⚙️ Configuração

### Variáveis de Ambiente

```env
# UAZAPI
UAZAPI_BASE_URL=https://free.uazapi.com
UAZAPI_ADMIN_TOKEN=seu_admin_token
UAZAPI_INSTANCE_TOKEN=seu_instance_token
UAZAPI_INSTANCE_ID=sua_instance_id

# Webhook
WEBHOOK_URL=https://seu-servidor.com/webhook
WEBHOOK_PORT=3000

# OpenAI (opcional)
OPENAI_API_KEY=sk-...

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/db

# Redis (para filas)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - UAZAPI_BASE_URL=${UAZAPI_BASE_URL}
      - UAZAPI_INSTANCE_TOKEN=${UAZAPI_INSTANCE_TOKEN}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD=postgres
    volumes:
      - pgdata:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  pgdata:
```

## 🔒 Segurança

### Checklist de Segurança

- [ ] Tokens em variáveis de ambiente
- [ ] HTTPS para webhooks
- [ ] Validação de origem nos webhooks
- [ ] Rate limiting implementado
- [ ] Logs de auditoria
- [ ] Rotação periódica de tokens
- [ ] Backup de conversas
- [ ] Monitoramento de anomalias

### Exemplo de Validação de Webhook

```typescript
import crypto from 'crypto';

function validarWebhook(req: Request): boolean {
  const signature = req.headers['x-webhook-signature'];
  const payload = JSON.stringify(req.body);
  
  const expected = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  
  return signature === expected;
}

app.post('/webhook', (req, res) => {
  if (!validarWebhook(req)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Processar webhook...
});
```

## 📊 Monitoramento

### Métricas Importantes

```typescript
// Prometheus metrics
import { Counter, Gauge, Histogram } from 'prom-client';

const mensagensEnviadas = new Counter({
  name: 'whatsapp_messages_sent_total',
  help: 'Total de mensagens enviadas'
});

const mensagensRecebidas = new Counter({
  name: 'whatsapp_messages_received_total',
  help: 'Total de mensagens recebidas'
});

const statusConexao = new Gauge({
  name: 'whatsapp_connection_status',
  help: 'Status da conexão (1=connected, 0=disconnected)'
});

const latenciaMensagem = new Histogram({
  name: 'whatsapp_message_duration_seconds',
  help: 'Tempo para enviar mensagem'
});
```

## 🐛 Debug

### Logs Estruturados

```typescript
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Uso
logger.info({ event: 'message_sent', jid, messageId }, 'Mensagem enviada');
logger.error({ err, jid }, 'Erro ao enviar mensagem');
```

### Health Check

```typescript
app.get('/health', async (req, res) => {
  try {
    const status = await api.get('/instance/status');
    
    res.json({
      status: 'healthy',
      whatsapp: status.data.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});
```

## 📖 Recursos Adicionais

- [SKILL.md](./SKILL.md) - Documentação completa
- [EXAMPLES.md](./EXAMPLES.md) - Exemplos práticos
- [API_REFERENCE.md](./API_REFERENCE.md) - Referência de endpoints

## 🤝 Contribuindo

Sugestões de melhorias para este skill são bem-vindas!

## 📄 Licença

Este skill é fornecido como está, para uso com a API UAZAPI.

## ⚠️ Disclaimer

- Use sempre contas WhatsApp Business
- Respeite os termos de uso do WhatsApp
- Implemente rate limiting adequado
- Não faça spam
- Respeite a privacidade dos usuários
