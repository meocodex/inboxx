# Referência Rápida de Endpoints - UAZAPI

## 🔐 Autenticação
- **Token de Instância**: Header `token: seu_token`
- **Admin Token**: Header `admintoken: seu_admin_token`

---

## 📱 Instância (Instance)

### Administrativo (requer admintoken)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/instance/create` | Criar nova instância |
| GET | `/instance/list` | Listar todas instâncias |
| POST | `/instance/delete` | Deletar instância |
| POST | `/instance/setautorun` | Configurar auto-execução |

### Gerenciamento (requer token)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/instance/status` | Obter status da conexão |
| GET | `/instance/qrcode` | Obter QR Code para conexão |
| POST | `/instance/paircode` | Gerar código de pareamento |
| GET | `/instance/logout` | Desconectar instância |
| PATCH | `/instance/update` | Atualizar configurações |
| POST | `/instance/webhook` | Configurar webhook |
| GET | `/instance/webhook` | Obter configuração webhook |

**Body para criar instância:**
```json
{
  "name": "Minha Instância",
  "token": "token_opcional"
}
```

**Body para paircode:**
```json
{
  "phone": "5511999999999"
}
```

**Body para webhook:**
```json
{
  "enabled": true,
  "url": "https://seu-webhook.com",
  "events": ["messages", "connection"],
  "excludeMessages": ["fromMeYes"]
}
```

---

## 💬 Mensagens (Messages)

### Enviar Mensagens
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/text` | Enviar texto |
| POST | `/message/image` | Enviar imagem |
| POST | `/message/video` | Enviar vídeo |
| POST | `/message/audio` | Enviar áudio |
| POST | `/message/document` | Enviar documento |
| POST | `/message/sticker` | Enviar sticker |
| POST | `/message/location` | Enviar localização |
| POST | `/message/contact` | Enviar contato |
| POST | `/message/poll` | Enviar enquete |
| POST | `/message/reaction` | Enviar reação |

### Mensagens Interativas (WhatsApp Business)
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/buttons` | Enviar botões |
| POST | `/message/list` | Enviar lista |
| POST | `/message/product` | Enviar produto |

### Outras Operações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/message/reply` | Responder mensagem |
| POST | `/message/forward` | Encaminhar mensagem |
| POST | `/message/edit` | Editar mensagem |
| POST | `/message/delete` | Deletar mensagem |
| POST | `/message/react` | Reagir a mensagem |

**Exemplos de Body:**

```json
// Texto
{
  "jid": "5511999999999@s.whatsapp.net",
  "text": "Olá! Como posso ajudar?"
}

// Imagem
{
  "jid": "5511999999999@s.whatsapp.net",
  "url": "https://example.com/image.jpg",
  "caption": "Confira esta imagem!"
}

// Áudio
{
  "jid": "5511999999999@s.whatsapp.net",
  "url": "https://example.com/audio.mp3"
}

// Documento
{
  "jid": "5511999999999@s.whatsapp.net",
  "url": "https://example.com/doc.pdf",
  "filename": "documento.pdf",
  "mimetype": "application/pdf"
}

// Localização
{
  "jid": "5511999999999@s.whatsapp.net",
  "latitude": -23.550520,
  "longitude": -46.633308,
  "name": "Av. Paulista",
  "address": "São Paulo, SP"
}

// Botões
{
  "jid": "5511999999999@s.whatsapp.net",
  "text": "Escolha uma opção:",
  "buttons": [
    { "id": "1", "text": "Opção 1" },
    { "id": "2", "text": "Opção 2" }
  ]
}

// Lista
{
  "jid": "5511999999999@s.whatsapp.net",
  "text": "Selecione um serviço:",
  "buttonText": "Ver Opções",
  "sections": [
    {
      "title": "Serviços",
      "rows": [
        { "id": "s1", "title": "Consultoria", "description": "Desc" }
      ]
    }
  ]
}

// Enquete
{
  "jid": "5511999999999@s.whatsapp.net",
  "name": "Qual sua preferência?",
  "options": ["Opção A", "Opção B", "Opção C"],
  "multipleAnswers": false
}

// Reação
{
  "key": {
    "remoteJid": "5511999999999@s.whatsapp.net",
    "id": "message_id_here"
  },
  "reaction": "👍"
}
```

---

## 💼 Conversas (Chats)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/chats/all` | Listar todas conversas |
| POST | `/chats/messages` | Obter mensagens de um chat |
| POST | `/chats/search` | Buscar conversas |
| POST | `/chats/markasread` | Marcar como lido |
| POST | `/chats/archive` | Arquivar/desarquivar |
| POST | `/chats/delete` | Deletar conversa |
| POST | `/chats/pin` | Fixar conversa |
| POST | `/chats/mute` | Silenciar conversa |

**Exemplos:**

```json
// Obter mensagens
{
  "jid": "5511999999999@s.whatsapp.net",
  "limit": 50
}

// Marcar como lido
{
  "jid": "5511999999999@s.whatsapp.net"
}

// Arquivar
{
  "jid": "5511999999999@s.whatsapp.net",
  "archive": true
}
```

---

## 👥 Contatos (Contacts)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/contacts/all` | Listar todos contatos |
| POST | `/contacts/search` | Buscar contato |
| POST | `/contacts/check` | Verificar se número existe |
| POST | `/contacts/profilepic` | Obter foto de perfil |
| POST | `/contacts/status` | Obter status do contato |
| POST | `/contacts/block` | Bloquear contato |
| POST | `/contacts/unblock` | Desbloquear contato |

**Exemplos:**

```json
// Buscar
{
  "query": "João"
}

// Verificar número
{
  "jid": "5511999999999@s.whatsapp.net"
}

// Foto de perfil
{
  "jid": "5511999999999@s.whatsapp.net"
}
```

---

## 🔄 Presença (Presence)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/presence/update` | Atualizar presença |
| POST | `/presence/subscribe` | Monitorar presença |
| POST | `/presence/status/update` | Atualizar status |
| POST | `/presence/composing` | Enviar "digitando..." |
| POST | `/presence/recording` | Enviar "gravando áudio..." |

**Exemplos:**

```json
// Atualizar presença
{
  "presence": "available"  // ou "unavailable"
}

// Monitorar presença
{
  "jid": "5511999999999@s.whatsapp.net"
}

// Status
{
  "status": "Disponível para atendimento"
}

// Digitando
{
  "jid": "5511999999999@s.whatsapp.net",
  "isComposing": true
}
```

---

## 👨‍👩‍👧‍👦 Grupos (Groups)

### Gerenciamento
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/groups/create` | Criar grupo |
| POST | `/groups/list` | Listar grupos |
| POST | `/groups/info` | Info do grupo |
| POST | `/groups/leave` | Sair do grupo |
| POST | `/groups/invite/code` | Obter código convite |
| POST | `/groups/invite/revoke` | Revogar código convite |

### Participantes
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/groups/participants/add` | Adicionar participantes |
| POST | `/groups/participants/remove` | Remover participantes |
| POST | `/groups/participants/promote` | Promover a admin |
| POST | `/groups/participants/demote` | Rebaixar admin |

### Configurações
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/groups/name/update` | Atualizar nome |
| POST | `/groups/description/update` | Atualizar descrição |
| POST | `/groups/picture/update` | Atualizar foto |
| POST | `/groups/settings/update` | Atualizar configurações |

**Exemplos:**

```json
// Criar grupo
{
  "name": "Grupo de Testes",
  "participants": [
    "5511999999999@s.whatsapp.net",
    "5511888888888@s.whatsapp.net"
  ]
}

// Adicionar participantes
{
  "jid": "123456789@g.us",
  "participants": ["5511777777777@s.whatsapp.net"]
}

// Promover admin
{
  "jid": "123456789@g.us",
  "participants": ["5511999999999@s.whatsapp.net"]
}

// Atualizar configurações
{
  "jid": "123456789@g.us",
  "settings": {
    "announcement": true,  // Só admins enviam mensagens
    "locked": true         // Só admins editam info do grupo
  }
}
```

---

## 🏷️ Labels (Etiquetas)

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/labels/create` | Criar label |
| GET | `/labels/list` | Listar labels |
| POST | `/labels/update` | Atualizar label |
| POST | `/labels/delete` | Deletar label |
| POST | `/chats/labels/add` | Adicionar label ao chat |
| POST | `/chats/labels/remove` | Remover label do chat |

**Exemplos:**

```json
// Criar label
{
  "name": "Importante",
  "color": "#FF0000"
}

// Adicionar ao chat
{
  "jid": "5511999999999@s.whatsapp.net",
  "labelId": "label_id_here"
}
```

---

## 💼 Business (WhatsApp Business)

### Catálogo
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/business/catalog/product/create` | Criar produto |
| POST | `/business/catalog/product/update` | Atualizar produto |
| POST | `/business/catalog/list` | Listar catálogo |
| POST | `/business/catalog/product/get` | Obter produto |
| POST | `/business/catalog/delete` | Deletar produto |
| POST | `/business/catalog/show` | Mostrar produto |
| POST | `/business/catalog/hide` | Ocultar produto |

### Perfil Business
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/business/profile/update` | Atualizar perfil |
| GET | `/business/profile` | Obter perfil |

**Exemplos:**

```json
// Criar produto
{
  "name": "Produto Teste",
  "description": "Descrição do produto",
  "price": "99.90",
  "currency": "BRL",
  "url": "https://example.com/image.jpg"
}

// Listar catálogo
{
  "jid": "5511999999999@s.whatsapp.net"
}

// Atualizar perfil business
{
  "description": "Empresa de tecnologia",
  "category": "TECH",
  "address": "Rua Exemplo, 123",
  "email": "contato@empresa.com",
  "website": "https://empresa.com"
}
```

---

## 📊 Status/Stories

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/status/text` | Postar status texto |
| POST | `/status/image` | Postar status imagem |
| POST | `/status/video` | Postar status vídeo |
| GET | `/status/list` | Listar status |

---

## 🔧 Utilitários

### Mídia
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/media/download` | Download de mídia |
| POST | `/media/upload` | Upload de mídia |

### Diversos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/misc/onwhatsapp` | Verificar números no WhatsApp |
| POST | `/misc/privacy` | Configurar privacidade |

---

## 📝 Formatos de JID

- **Contato**: `5511999999999@s.whatsapp.net`
- **Grupo**: `123456789@g.us`
- **Broadcast/Status**: `5511999999999@broadcast`
- **Newsletter**: `123456789@newsletter`

---

## ⚠️ Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Bad Request (payload inválido) |
| 401 | Unauthorized (token inválido) |
| 404 | Not Found (recurso não encontrado) |
| 429 | Too Many Requests (rate limit) |
| 500 | Internal Server Error |

---

## 🔔 Eventos de Webhook

| Evento | Descrição |
|--------|-----------|
| `connection` | Mudança de status de conexão |
| `messages` | Nova mensagem recebida |
| `messages_update` | Atualização de mensagem (ack) |
| `call` | Chamada recebida |
| `contacts` | Atualização de contatos |
| `presence` | Mudança de presença |
| `groups` | Eventos de grupo |
| `labels` | Eventos de labels |
| `chats` | Eventos de chat |
| `blocks` | Bloqueios/desbloqueios |
| `leads` | Leads do WhatsApp Business |

---

## 💡 Dicas Rápidas

### Rate Limiting
- Máximo 20 mensagens/minuto por número
- Intervalo de 3-5s entre mensagens para mesmo contato
- Use filas (BullMQ) para gerenciar envios

### Boas Práticas
1. Use WhatsApp Business sempre
2. Valide números antes de enviar
3. Configure webhooks para tempo real
4. Implemente retry logic
5. Monitore status da instância
6. Trate desconexões gracefully

### Filtros de Webhook
- `wasSentByApi`: Enviado pela API
- `wasNotSentByApi`: Não enviado pela API
- `fromMeYes`: Enviado por você
- `fromMeNo`: Recebido
- `isGroupYes`: Mensagem de grupo
- `isGroupNo`: Mensagem individual
