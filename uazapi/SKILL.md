# UAZAPI WhatsApp API Skill

Este skill permite que o Claude Code interaja com a API UAZAPI para gerenciar instâncias do WhatsApp e realizar operações de mensageria.

## Visão Geral

A UAZAPI é uma API completa para integração com WhatsApp que permite:
- Gerenciar múltiplas instâncias do WhatsApp
- Enviar e receber mensagens de texto, mídia, áudio, vídeo
- Gerenciar grupos, contatos e conversas
- Configurar webhooks para receber eventos
- Integrar chatbots com OpenAI
- Gerenciar catálogos de produtos (WhatsApp Business)

## ⚠️ Recomendação Importante

**Use SEMPRE contas WhatsApp Business** em vez do WhatsApp normal. O WhatsApp normal pode apresentar:
- Inconsistências
- Desconexões frequentes
- Limitações de API
- Instabilidades durante o uso

## Autenticação

A API possui dois tipos de autenticação:

### 1. Token de Instância (endpoints regulares)
```
Header: token: <seu_token_de_instancia>
```

### 2. Admin Token (endpoints administrativos)
```
Header: admintoken: <seu_admin_token>
```

## Configuração Base

### Servidores Disponíveis
- **Free/Demo**: `https://free.uazapi.com`
- **Produção**: `https://api.uazapi.com`

### Estados da Instância
- `disconnected`: Desconectado do WhatsApp
- `connecting`: Em processo de conexão
- `connected`: Conectado e autenticado com sucesso

## Estrutura de Dados Principais

### Instance (Instância WhatsApp)
```typescript
interface Instance {
  id: string;              // UUID único
  token: string;           // Token de autenticação
  status: 'disconnected' | 'connecting' | 'connected';
  name: string;            // Nome da instância
  profileName?: string;    // Nome do perfil WhatsApp
  profilePicUrl?: string;  // URL da foto do perfil
  isBusiness: boolean;     // Conta business?
  qrcode?: string;         // QR Code base64
  paircode?: string;       // Código de pareamento
  
  // Chatbot OpenAI
  openai_apikey?: string;
  chatbot_enabled: boolean;
  chatbot_ignoreGroups: boolean;
  chatbot_stopConversation?: string;
  chatbot_stopMinutes?: number;
  
  // Metadados
  created: string;         // ISO datetime
  updated: string;         // ISO datetime
  lastDisconnect?: string; // ISO datetime
  lastDisconnectReason?: string;
}
```

### Webhook Configuration
```typescript
interface Webhook {
  id: string;
  enabled: boolean;
  url: string;             // URL de destino
  events: Array<           // Eventos monitorados
    'connection' | 'history' | 'messages' | 'messages_update' |
    'call' | 'contacts' | 'presence' | 'groups' | 'labels' |
    'chats' | 'chat_labels' | 'blocks' | 'leads'
  >;
  addUrlTypesMessages?: boolean;
  addUrlEvents?: boolean;
  excludeMessages?: Array<
    'wasSentByApi' | 'wasNotSentByApi' | 'fromMeYes' | 
    'fromMeNo' | 'isGroupYes' | 'isGroupNo'
  >;
}
```

### Chat (Conversa)
```typescript
interface Chat {
  id: string;              // ID único (r + 7 bytes hex)
  wa_chatid: string;       // ID completo do chat WhatsApp
  unreadCount: number;     // Mensagens não lidas
  conversationTimestamp: number;
  name?: string;           // Nome do contato/grupo
  isGroup: boolean;
  labels?: string[];       // Labels aplicadas
  messages?: Message[];    // Últimas mensagens
}
```

### Message (Mensagem)
```typescript
interface Message {
  id: string;
  fromMe: boolean;
  timestamp: number;
  body?: string;           // Texto da mensagem
  hasMedia: boolean;
  type: 'text' | 'image' | 'video' | 'audio' | 'document' | 
        'sticker' | 'location' | 'vcard' | 'poll' | 'reaction';
  
  // Para mensagens com mídia
  mediaUrl?: string;
  caption?: string;
  mimetype?: string;
  filename?: string;
  
  // Metadados
  quotedMsg?: Message;     // Mensagem citada
  mentions?: string[];     // Usuários mencionados
  ack?: number;            // Status de entrega (1-5)
}
```

## Fluxos Principais

### 1. Criar e Conectar Instância

```typescript
// 1. Criar instância
POST /instance/create
Headers: { admintoken: "seu_admin_token" }
Body: {
  name: "Instância Principal",
  token: "seu_token_unico"  // Opcional, será gerado se omitido
}
Response: { instance: Instance }

// 2. Conectar via QR Code
GET /instance/qrcode
Headers: { token: "token_da_instancia" }
Response: { qrcode: "data:image/png;base64,..." }

// 3. OU conectar via PairCode (melhor para automação)
POST /instance/paircode
Headers: { token: "token_da_instancia" }
Body: { phone: "5511999999999" }
Response: { paircode: "ABCD-EFGH" }

// 4. Verificar status
GET /instance/status
Headers: { token: "token_da_instancia" }
Response: { 
  status: "connected",
  profileName: "Meu WhatsApp",
  isBusiness: true
}
```

### 2. Configurar Webhook

```typescript
POST /instance/webhook
Headers: { token: "token_da_instancia" }
Body: {
  enabled: true,
  url: "https://seu-servidor.com/webhook",
  events: ["messages", "connection", "messages_update"],
  excludeMessages: ["fromMeYes", "isGroupYes"]
}
```

### 3. Enviar Mensagens

```typescript
// Texto simples
POST /message/text
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  text: "Olá! Esta é uma mensagem de teste."
}

// Imagem
POST /message/image
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  url: "https://example.com/imagem.jpg",
  caption: "Confira esta imagem!"
}

// Áudio
POST /message/audio
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  url: "https://example.com/audio.mp3"
}

// Documento
POST /message/document
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  url: "https://example.com/documento.pdf",
  filename: "contrato.pdf",
  mimetype: "application/pdf"
}

// Localização
POST /message/location
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  latitude: -23.550520,
  longitude: -46.633308,
  name: "Av. Paulista",
  address: "São Paulo, SP"
}

// Botões (WhatsApp Business)
POST /message/buttons
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  text: "Escolha uma opção:",
  buttons: [
    { id: "1", text: "Opção 1" },
    { id: "2", text: "Opção 2" },
    { id: "3", text: "Opção 3" }
  ]
}

// Lista (WhatsApp Business)
POST /message/list
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  text: "Nossos serviços:",
  buttonText: "Ver Opções",
  sections: [
    {
      title: "Serviços",
      rows: [
        { id: "s1", title: "Consultoria", description: "Consultoria especializada" },
        { id: "s2", title: "Desenvolvimento", description: "Desenvolvimento de sistemas" }
      ]
    }
  ]
}
```

### 4. Gerenciar Conversas e Contatos

```typescript
// Listar conversas
GET /chats/all
Headers: { token: "token_da_instancia" }
Response: { chats: Chat[] }

// Obter mensagens de um chat
POST /chats/messages
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  limit: 50
}

// Buscar contatos
POST /contacts/search
Headers: { token: "token_da_instancia" }
Body: { query: "João" }

// Verificar se número existe no WhatsApp
POST /contacts/check
Headers: { token: "token_da_instancia" }
Body: { jid: "5511999999999@s.whatsapp.net" }
```

### 5. Gerenciar Grupos

```typescript
// Criar grupo
POST /groups/create
Headers: { token: "token_da_instancia" }
Body: {
  name: "Grupo de Testes",
  participants: [
    "5511999999999@s.whatsapp.net",
    "5511888888888@s.whatsapp.net"
  ]
}

// Adicionar participantes
POST /groups/participants/add
Headers: { token: "token_da_instancia" }
Body: {
  jid: "123456789@g.us",
  participants: ["5511777777777@s.whatsapp.net"]
}

// Promover a admin
POST /groups/participants/promote
Headers: { token: "token_da_instancia" }
Body: {
  jid: "123456789@g.us",
  participants: ["5511999999999@s.whatsapp.net"]
}
```

### 6. Chatbot com OpenAI

```typescript
// Configurar chatbot
PATCH /instance/update
Headers: { token: "token_da_instancia" }
Body: {
  openai_apikey: "sk-...",
  chatbot_enabled: true,
  chatbot_ignoreGroups: true,
  chatbot_stopConversation: "parar",
  chatbot_stopMinutes: 60
}

// O chatbot responderá automaticamente usando GPT
```

### 7. Business (WhatsApp Business)

```typescript
// Criar produto no catálogo
POST /business/catalog/product/create
Headers: { token: "token_da_instancia" }
Body: {
  name: "Produto Teste",
  description: "Descrição do produto",
  price: "99.90",
  currency: "BRL",
  url: "https://example.com/imagem.jpg"
}

// Listar catálogo
POST /business/catalog/list
Headers: { token: "token_da_instancia" }
Body: { jid: "5511999999999@s.whatsapp.net" }

// Enviar produto
POST /message/product
Headers: { token: "token_da_instancia" }
Body: {
  jid: "5511999999999@s.whatsapp.net",
  productId: "product_id_here"
}
```

## Formatação de JID (WhatsApp ID)

- **Contato individual**: `5511999999999@s.whatsapp.net`
- **Grupo**: `123456789@g.us`
- **Status/Stories**: `5511999999999@broadcast`

## Códigos de Status de Mensagem (ack)

- `0`: Erro
- `1`: Pendente
- `2`: Enviado ao servidor
- `3`: Entregue ao destinatário
- `4`: Lido pelo destinatário
- `5`: Reproduzido (para áudio)

## Webhooks - Eventos Recebidos

### Event: messages
```typescript
{
  event: "messages",
  instance: "instance_id",
  data: {
    key: {
      remoteJid: "5511999999999@s.whatsapp.net",
      fromMe: false,
      id: "message_id"
    },
    message: {
      conversation: "Texto da mensagem"
    },
    messageTimestamp: 1234567890,
    pushName: "Nome do Contato"
  }
}
```

### Event: connection
```typescript
{
  event: "connection",
  instance: "instance_id",
  data: {
    status: "connected",
    profileName: "Meu WhatsApp"
  }
}
```

### Event: messages_update
```typescript
{
  event: "messages_update",
  instance: "instance_id",
  data: {
    key: { /* ... */ },
    update: {
      status: 3  // ack status
    }
  }
}
```

## Limites e Boas Práticas

### Limites do Servidor
- Máximo de instâncias conectadas por servidor
- Rate limiting aplicado (429 Too Many Requests)
- Servidores free/demo têm restrições de tempo

### Boas Práticas
1. **Use WhatsApp Business** sempre que possível
2. **Implemente retry logic** para requisições falhadas
3. **Valide números** antes de enviar mensagens
4. **Respeite rate limits** do WhatsApp (evite spam)
5. **Configure webhooks** para receber eventos em tempo real
6. **Monitore status** da instância regularmente
7. **Trate desconexões** gracefully com reconexão automática

### Rate Limiting Recomendado
- Máximo 20 mensagens por minuto por número
- Intervalo de 3-5 segundos entre mensagens para o mesmo contato
- Use filas (BullMQ) para gerenciar envios em massa

## Códigos HTTP de Resposta

- `200`: Sucesso
- `400`: Bad Request (payload inválido)
- `401`: Unauthorized (token inválido)
- `404`: Not Found (instância/recurso não encontrado)
- `429`: Too Many Requests (rate limit atingido)
- `500`: Internal Server Error

## Exemplos de Integração

### Node.js com Axios
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://free.uazapi.com',
  headers: {
    'token': 'seu_token_aqui'
  }
});

// Enviar mensagem
async function enviarMensagem(numero: string, texto: string) {
  const response = await api.post('/message/text', {
    jid: `${numero}@s.whatsapp.net`,
    text: texto
  });
  return response.data;
}

// Configurar webhook
async function configurarWebhook(url: string) {
  const response = await api.post('/instance/webhook', {
    enabled: true,
    url: url,
    events: ['messages', 'connection'],
    excludeMessages: ['fromMeYes']
  });
  return response.data;
}
```

### Fastify Webhook Handler
```typescript
import Fastify from 'fastify';

const fastify = Fastify();

fastify.post('/webhook', async (request, reply) => {
  const { event, instance, data } = request.body;
  
  switch (event) {
    case 'messages':
      // Nova mensagem recebida
      const message = data.message?.conversation;
      const from = data.key.remoteJid;
      console.log(`Mensagem de ${from}: ${message}`);
      break;
      
    case 'connection':
      // Mudança no status de conexão
      console.log(`Status: ${data.status}`);
      break;
      
    case 'messages_update':
      // Atualização de status de mensagem
      console.log(`Mensagem ${data.key.id} - Status: ${data.update.status}`);
      break;
  }
  
  return { success: true };
});

fastify.listen({ port: 3000 });
```

## Troubleshooting

### Instância não conecta
1. Verifique se está usando WhatsApp Business
2. Certifique-se que o número não está conectado em outro lugar
3. Tente usar paircode em vez de QR code
4. Verifique logs de `lastDisconnectReason`

### Mensagens não são entregues
1. Valide o formato do JID
2. Verifique se o número existe no WhatsApp (`/contacts/check`)
3. Confirme que a instância está `connected`
4. Respeite rate limits

### Webhook não recebe eventos
1. Certifique-se que a URL é acessível publicamente
2. Verifique os eventos configurados
3. Teste a URL com ferramentas como webhook.site
4. Confira os filtros `excludeMessages`

## Recursos Adicionais

- **Documentação Oficial**: [docs.uazapi.com]
- **Suporte**: [support@uazapi.com]
- **Status do Serviço**: [status.uazapi.com]

## Considerações de Segurança

1. **Nunca exponha tokens** em repositórios públicos
2. **Use HTTPS** para webhooks
3. **Valide origem** dos webhooks
4. **Implemente autenticação** nos webhooks
5. **Rotacione tokens** periodicamente
6. **Monitore atividade suspeita** nas instâncias
