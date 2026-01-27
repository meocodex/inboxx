# 📋 Especificações para Desenvolvimento - Claude Code

## 🎯 Ordem de Desenvolvimento (Sprint por Sprint)

### Sprint 1-2: Fundação (Semanas 1-4) ✅ CONCLUIDO

```
PRIORIDADE: CRÍTICO
DEPENDÊNCIAS: Nenhuma

Tarefas:
✅ 1.1 Setup do monorepo (pnpm + turborepo)
✅ 1.2 Configurar Docker Compose (PostgreSQL + Redis)
✅ 1.3 Setup Fastify com TypeScript
✅ 1.4 Configurar Prisma + criar schema base
✅ 1.5 Implementar sistema de migrations
✅ 1.6 Criar seed inicial (perfis padrão)
✅ 1.7 Configurar ESLint + Prettier
✅ 1.8 Setup de testes (Vitest)
✅ 1.9 Implementar health check /saude
✅ 1.10 Configurar variáveis de ambiente
```

### Sprint 3-4: Autenticação + Licenciamento (Semanas 5-8) ✅ CONCLUIDO

```
PRIORIDADE: CRÍTICO
DEPENDÊNCIAS: Sprint 1-2

Tarefas:
✅ 2.1 Módulo de autenticação (JWT + Refresh Token)
✅ 2.2 Rotas: entrar, sair, atualizar-token
✅ 2.3 Middleware de autenticação
✅ 2.4 Sistema de licenciamento por IP
✅ 2.5 Validação de licença na inicialização
✅ 2.6 Cache de licença (24h)
✅ 2.7 Job de revalidação periódica
✅ 2.8 CRUD de perfis e permissões
✅ 2.9 Guarda de permissões (decorator)
✅ 2.10 Testes de autenticação
```

### Sprint 5-6: Multi-Tenant (Semanas 9-12) ✅ CONCLUIDO

```
PRIORIDADE: CRÍTICO
DEPENDÊNCIAS: Sprint 3-4

Tarefas:
✅ 3.1 CRUD de Clientes
✅ 3.2 Middleware de contexto do cliente
✅ 3.3 Row-Level Security (RLS) no PostgreSQL
✅ 3.4 CRUD de Usuários por cliente
✅ 3.5 CRUD de Equipes
✅ 3.6 Atribuição de usuários a equipes
✅ 3.7 Permissões por perfil
✅ 3.8 Tela de login Super Admin
✅ 3.9 Dashboard Super Admin (lista clientes)
✅ 3.10 Testes de isolamento multi-tenant
```

### Sprint 7-8: Conexões WhatsApp (Semanas 13-16) ✅ CONCLUIDO

```
PRIORIDADE: ALTO
DEPENDÊNCIAS: Sprint 5-6

Tarefas:
✅ 4.1 Integração Meta Cloud API
✅ 4.2 Configuração de webhook receiver
✅ 4.3 Processamento de mensagens recebidas
✅ 4.4 Envio de mensagens de texto
✅ 4.5 Envio de mídia (imagem, áudio, vídeo)
✅ 4.6 Upload de arquivos para S3
✅ 4.7 Status de conexão em tempo real
✅ 4.8 Reconexão automática
✅ 4.9 Integração UaiZap (QR Code)
✅ 4.10 Testes de integração WhatsApp
```

### Sprint 9-10: Conversas Real-Time (Semanas 17-20) ✅ CONCLUIDO

```
PRIORIDADE: ALTO
DEPENDÊNCIAS: Sprint 7-8

Tarefas:
✅ 5.1 Setup Socket.io com Redis Adapter
✅ 5.2 Autenticação no WebSocket
✅ 5.3 Rooms por cliente (isolamento)
✅ 5.4 CRUD de Conversas
✅ 5.5 CRUD de Mensagens
✅ 5.6 Eventos real-time (nova mensagem)
✅ 5.7 Indicador de digitando
✅ 5.8 Status de mensagem (enviada, entregue, lida)
✅ 5.9 Notas internas (privadas)
✅ 5.10 Atribuição de conversa
```

### Sprint 11-12: Frontend Base (Semanas 21-24) ✅ CONCLUIDO

```
PRIORIDADE: ALTO
DEPENDÊNCIAS: Sprint 9-10

Tarefas:
✅ 6.1 Setup React + Vite + TypeScript
✅ 6.2 Configurar TanStack Query
✅ 6.3 Configurar Zustand
✅ 6.4 Layout principal (menu lateral + header)
✅ 6.5 Tela de login
✅ 6.6 Proteção de rotas (auth guard)
✅ 6.7 Tela de conversas (inbox)
✅ 6.8 Componente de chat
✅ 6.9 Integração WebSocket no frontend
✅ 6.10 Notificações de nova mensagem
```

---

## 📐 Wireframes das Telas Principais

### Tela de Login

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │       LOGO          │                     │
│                    │    CRM WhatsApp     │                     │
│                    └─────────────────────┘                     │
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │ Email               │                     │
│                    │ ________________    │                     │
│                    └─────────────────────┘                     │
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │ Senha               │                     │
│                    │ ________________ 👁️ │                     │
│                    └─────────────────────┘                     │
│                                                                 │
│                    ┌─────────────────────┐                     │
│                    │      ENTRAR         │                     │
│                    └─────────────────────┘                     │
│                                                                 │
│                    Esqueci minha senha                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Layout Principal (Dashboard)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ CRM WhatsApp                     🔍 Buscar...          🔔 3    👤 João ▼  │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │                                                                 │
│ 📊 Painel  │   BEM-VINDO, JOÃO                                              │
│            │                                                                 │
│ 💬 Conver- │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│    sas     │   │     32       │  │     128      │  │    4.5min    │        │
│            │   │  Abertas     │  │  Hoje        │  │  Tempo Médio │        │
│ 👥 Conta-  │   └──────────────┘  └──────────────┘  └──────────────┘        │
│    tos     │                                                                 │
│            │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│ 🤖 Chat-   │   │     85%      │  │     12       │  │     3        │        │
│    bot     │   │  SLA OK      │  │  Na Fila     │  │  Atendentes  │        │
│            │   └──────────────┘  └──────────────┘  └──────────────┘        │
│ 📢 Campa-  │                                                                 │
│    nhas    │   ─────────────────────────────────────────────────────        │
│            │                                                                 │
│ 📋 Kanban  │   CONVERSAS RECENTES                                           │
│            │   ┌────────────────────────────────────────────────────┐       │
│ 📊 Relató- │   │ 🟢 Maria Santos    │ Preciso de ajuda...  │ 2min  │       │
│    rios    │   │ 🟡 João Silva      │ Qual o status do...  │ 5min  │       │
│            │   │ 🔴 Pedro Lima      │ Não recebi o prod... │ 15min │       │
│ 👤 Equipes │   └────────────────────────────────────────────────────┘       │
│            │                                                                 │
│ ⚙️ Config  │   ATENDENTES ONLINE                                            │
│            │   🟢 Ana (5)  🟢 Carlos (3)  🟡 Maria (8)  ⚪ Pedro (0)        │
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

### Tela de Conversas (Inbox) - Principal do Operador

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ CRM WhatsApp                     🔍 Buscar...          🔔 3    👤 João ▼  │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │ CONVERSAS                                                       │
│ 📊 Painel  │ [Todas ▼] [Abertas ▼] [Minha Equipe ▼]              + Nova    │
│            ├─────────────────────┬───────────────────────────────────────────┤
│ 💬 Conver- │                     │                                           │
│  ✓ sas     │ 🔍 Filtrar...       │  👤 Maria Santos              ⋮          │
│            │                     │  📱 +55 11 99999-1234    🟢 Online       │
│ 👥 Conta-  │ ┌─────────────────┐ │  🏷️ Cliente VIP │ Suporte                │
│    tos     │ │🟢 Maria Santos  │ │  ───────────────────────────────────────  │
│            │ │ Olá, preciso... │ │                                           │
│ 🤖 Chat-   │ │ 2min │ WhatsApp │ │    ┌────────────────────────────────┐    │
│    bot     │ │ 🏷️ VIP         │ │    │ Olá, preciso de ajuda com     │    │
│            │ └─────────────────┘ │    │ meu pedido. O número é #12345 │    │
│ 📢 Campa-  │                     │    │                      14:32 ✓✓ │    │
│    nhas    │ ┌─────────────────┐ │    └────────────────────────────────┘    │
│            │ │🟡 João Silva    │ │                                           │
│ 📋 Kanban  │ │ Qual o status...│ │              ┌──────────────────────┐    │
│            │ │ 5min │ WhatsApp │ │              │ Claro! Vou verificar │    │
│ 📊 Relató- │ └─────────────────┘ │              │ para você agora.     │    │
│    rios    │                     │              │            14:33 ✓✓  │    │
│            │ ┌─────────────────┐ │              └──────────────────────┘    │
│ 👤 Equipes │ │🔴 Pedro Lima    │ │                                           │
│            │ │ Não recebi o... │ │    ┌────────────────────────────────┐    │
│ ⚙️ Config  │ │ 15min │ Insta  │ │    │ Encontrei! Seu pedido está     │    │
│            │ │ ⚠️ SLA          │ │    │ em separação e sai hoje.      │    │
│            │ └─────────────────┘ │    │                      14:35 ✓  │    │
│            │                     │    └────────────────────────────────┘    │
│            │                     │                                           │
│            │                     │  ─────────────────────────────────────── │
│            │                     │                                           │
│            │                     │  [📎] Digite uma mensagem...      /    │
│            │                     │                         [📷][🎤][➤]     │
│            │                     │                                           │
│            │                     │  Atalhos: /saudacao /horario /pix        │
└────────────┴─────────────────────┴───────────────────────────────────────────┘
```

### Painel Lateral do Contato (Abre ao clicar no nome)

```
┌──────────────────────────────────────┐
│  DADOS DO CONTATO              ✕    │
├──────────────────────────────────────┤
│                                      │
│         👤                           │
│     Maria Santos                     │
│                                      │
│  📱 +55 11 99999-1234               │
│  📧 maria@email.com                  │
│  🏢 Empresa ABC                      │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  ETIQUETAS                           │
│  [Cliente VIP] [Suporte] [+ Add]    │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  CAMPOS PERSONALIZADOS               │
│  CPF: 123.456.789-00                 │
│  Plano: Premium                      │
│  Desde: 15/01/2024                   │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  NOTAS INTERNAS                      │
│  ┌────────────────────────────────┐ │
│  │ Cliente reclamou do atraso     │ │
│  │ na última entrega. Oferecer    │ │
│  │ desconto na próxima compra.    │ │
│  │              - Ana, 18/01      │ │
│  └────────────────────────────────┘ │
│  [+ Adicionar nota]                  │
│                                      │
│  ─────────────────────────────────   │
│                                      │
│  HISTÓRICO                           │
│  • 32 conversas                      │
│  • Última: hoje 14:35               │
│  • Primeira: 15/01/2024             │
│                                      │
│  [Ver histórico completo]            │
│                                      │
└──────────────────────────────────────┘
```

### Modal de Transferir Conversa

```
┌─────────────────────────────────────────────┐
│  TRANSFERIR CONVERSA                   ✕   │
├─────────────────────────────────────────────┤
│                                             │
│  Conversa com: Maria Santos                 │
│                                             │
│  TRANSFERIR PARA:                           │
│                                             │
│  ○ Atendente específico                     │
│     ┌───────────────────────────────────┐  │
│     │ Selecione um atendente...      ▼ │  │
│     └───────────────────────────────────┘  │
│     🟢 Ana Silva (3 conversas)              │
│     🟢 Carlos Souza (5 conversas)           │
│     🟡 Pedro Lima (8 conversas)             │
│                                             │
│  ○ Equipe (fila)                            │
│     ┌───────────────────────────────────┐  │
│     │ Selecione uma equipe...        ▼ │  │
│     └───────────────────────────────────┘  │
│     Suporte Técnico (2 na fila)             │
│     Vendas (0 na fila)                      │
│     Financeiro (1 na fila)                  │
│                                             │
│  MOTIVO (opcional):                         │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│  [Cancelar]              [Transferir]       │
│                                             │
└─────────────────────────────────────────────┘
```

### Tela de Gestão de Clientes (Super Admin)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☰ CRM WhatsApp                     🔍 Buscar...          🔔     👤 Admin ▼  │
├────────────┬─────────────────────────────────────────────────────────────────┤
│            │ CLIENTES                                            + Novo     │
│ 📊 Painel  │                                                                 │
│            │ ┌────────────────────────────────────────────────────────────┐ │
│ 🏢 Clien-  │ │ Nome           │ Plano    │ Usuários │ Conversas │ Status │ │
│  ✓ tes     │ ├────────────────┼──────────┼──────────┼───────────┼────────┤ │
│            │ │ Loja ABC       │ Pro      │ 8/10     │ 12.450    │ 🟢     │ │
│ 🔑 Licen-  │ │ Clínica XYZ    │ Starter  │ 3/3      │ 3.200     │ 🟢     │ │
│    ças     │ │ Restaurante 123│ Pro      │ 5/10     │ 8.100     │ 🟡     │ │
│            │ │ Academia Fit   │ Enterprise│ 25/∞    │ 45.000    │ 🟢     │ │
│ 📊 Métri-  │ │ Imobiliária    │ Pro      │ 10/10    │ 15.800    │ 🔴     │ │
│    cas     │ └────────────────────────────────────────────────────────────┘ │
│            │                                                                 │
│ ⚙️ Config  │ 🟢 Ativo   🟡 Limite próximo   🔴 Suspenso/Bloqueado           │
│            │                                                                 │
│            │ ─────────────────────────────────────────────────────────────   │
│            │                                                                 │
│            │ RESUMO                                                          │
│            │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│            │ │     5        │  │   84.550     │  │   R$ 2.485   │          │
│            │ │  Clientes    │  │  Conversas   │  │  MRR         │          │
│            │ └──────────────┘  └──────────────┘  └──────────────┘          │
│            │                                                                 │
└────────────┴─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Regras de Negócio por Módulo

### Módulo: Autenticação

```yaml
RN-AUTH-001:
  descrição: Login deve ser por email + senha
  validações:
    - Email deve ser válido
    - Senha mínimo 8 caracteres
    - Máximo 5 tentativas, depois bloqueia 15min
  
RN-AUTH-002:
  descrição: Token JWT expira em 7 dias
  refresh_token: 30 dias
  ao_expirar: Redireciona para login

RN-AUTH-003:
  descrição: Primeiro acesso do Super Admin
  comportamento:
    - Sistema verifica licença
    - Se válida, permite criar conta
    - Se inválida, exibe erro e bloqueia

RN-AUTH-004:
  descrição: Logout deve invalidar token
  comportamento:
    - Remove token do cliente
    - Adiciona token na blacklist (Redis)
```

### Módulo: Licenciamento

```yaml
RN-LIC-001:
  descrição: Validação de licença na inicialização
  fluxo:
    1. Sistema coleta IP público do servidor
    2. Envia para API de licenças
    3. API verifica: chave válida + IP autorizado + não expirada
    4. Retorna configurações e limites
    5. Sistema cacheia por 24h

RN-LIC-002:
  descrição: Revalidação periódica
  frequência: A cada 24 horas (job pg-boss)
  se_falhar:
    - Tenta novamente em 1h
    - Após 3 falhas, entra em modo somente leitura
    - Após 7 dias, bloqueia sistema

RN-LIC-003:
  descrição: Limites por plano
  comportamento:
    - Ao atingir limite, bloqueia ação
    - Exibe mensagem de upgrade
    - Log para auditoria

RN-LIC-004:
  descrição: Mudança de IP
  comportamento:
    - Se IP mudar, sistema fica bloqueado
    - Super Admin deve solicitar atualização
    - Você (licenciador) autoriza novo IP
```

### Módulo: Multi-Tenant

```yaml
RN-MT-001:
  descrição: Isolamento total de dados
  implementação: Row-Level Security (RLS)
  regra: Toda query deve filtrar por cliente_id

RN-MT-002:
  descrição: Super Admin vê todos os clientes
  comportamento:
    - Pode alternar entre clientes
    - Pode acessar dados de qualquer cliente
    - Ações são logadas

RN-MT-003:
  descrição: Admin do Cliente só vê dados do cliente dele
  comportamento:
    - cliente_id é injetado automaticamente
    - Não consegue acessar outros clientes
    - Tentativas são logadas como suspeitas

RN-MT-004:
  descrição: Criação de cliente
  campos_obrigatórios:
    - Nome
    - Email (único)
    - Telefone
  automático:
    - Cria perfis padrão (Admin, Supervisor, Atendente)
    - Cria primeiro usuário (Admin do Cliente)
```

### Módulo: Conversas

```yaml
RN-CONV-001:
  descrição: Nova conversa ao receber mensagem
  comportamento:
    - Se contato não existe, cria automaticamente
    - Se conversa arquivada, reabre
    - Se conversa aberta, adiciona mensagem
    - Emite evento real-time

RN-CONV-002:
  descrição: Atribuição de conversa
  regras:
    - Conversa pode ter 1 atendente OU 1 equipe (fila)
    - Ao atribuir, emite notificação
    - Histórico de atribuições é mantido

RN-CONV-003:
  descrição: Status da conversa
  fluxo:
    ABERTA → EM_ATENDIMENTO → AGUARDANDO → RESOLVIDA
                    ↓                ↓
                ARQUIVADA ←──────────┘
  regras:
    - Só resolve quem está atribuído ou supervisor
    - Arquivar só após resolver
    - Reabrir muda status para ABERTA

RN-CONV-004:
  descrição: Mensagens em tempo real
  comportamento:
    - Nova mensagem emite evento Socket.io
    - Atualiza lista de conversas
    - Toca som (se configurado)
    - Envia push notification (se PWA)
```

### Módulo: Contatos

```yaml
RN-CONT-001:
  descrição: Contato único por telefone
  regra: Não pode ter 2 contatos com mesmo telefone no mesmo cliente
  comportamento: Se tentar criar duplicado, retorna existente

RN-CONT-002:
  descrição: Mesclagem de contatos
  quando: Detecta possível duplicata
  fluxo:
    1. Usuário seleciona 2+ contatos
    2. Escolhe qual manter como principal
    3. Sistema move conversas para principal
    4. Remove duplicatas

RN-CONT-003:
  descrição: Campos personalizados
  tipos_suportados:
    - Texto
    - Número
    - Data
    - Seleção (dropdown)
    - Múltipla seleção
  limite: 20 campos por cliente
```

### Módulo: Permissões

```yaml
RN-PERM-001:
  descrição: Verificação de permissão
  implementação: Decorator @RequerPermissao('permissao:acao')
  comportamento:
    - Verifica se usuário tem permissão
    - Se não tem, retorna 403 Forbidden
    - Loga tentativa negada

RN-PERM-002:
  descrição: Wildcard de permissão
  exemplo: 'conversas:*' = todas as permissões de conversas
  hierarquia:
    - '*' = todas as permissões (Super Admin)
    - 'modulo:*' = todas do módulo
    - 'modulo:acao' = permissão específica

RN-PERM-003:
  descrição: Perfis customizados
  regras:
    - Admin pode criar perfis personalizados
    - Perfis padrão não podem ser editados
    - Perfil não pode ter mais permissões que o criador
```

---

## 🔌 Contratos de API (Principais Endpoints)

### Autenticação

```yaml
POST /api/autenticacao/entrar:
  body:
    email: string (required)
    senha: string (required)
  response_200:
    token: string
    refresh_token: string
    usuario:
      id: uuid
      nome: string
      email: string
      perfil: string
      cliente_id: uuid | null
  response_401:
    erro: "Credenciais inválidas"
  response_423:
    erro: "Conta bloqueada. Tente novamente em X minutos"

POST /api/autenticacao/atualizar-token:
  body:
    refresh_token: string (required)
  response_200:
    token: string
    refresh_token: string
  response_401:
    erro: "Token inválido ou expirado"
```

### Conversas

```yaml
GET /api/conversas:
  query:
    status: enum (ABERTA, EM_ATENDIMENTO, AGUARDANDO, RESOLVIDA, ARQUIVADA)
    equipe_id: uuid (opcional)
    usuario_id: uuid (opcional)
    pagina: number (default: 1)
    limite: number (default: 20, max: 100)
  response_200:
    dados:
      - id: uuid
        contato:
          id: uuid
          nome: string
          telefone: string
          foto_url: string | null
        conexao:
          id: uuid
          canal: enum (WHATSAPP, INSTAGRAM, FACEBOOK)
        status: enum
        ultima_mensagem:
          conteudo: string
          enviado_em: datetime
          direcao: enum (ENTRADA, SAIDA)
        nao_lidas: number
        usuario_atribuido:
          id: uuid
          nome: string
        equipe:
          id: uuid
          nome: string
    paginacao:
      total: number
      paginas: number
      pagina_atual: number

GET /api/conversas/:id/mensagens:
  params:
    id: uuid (conversa_id)
  query:
    antes_de: datetime (cursor para paginação)
    limite: number (default: 50)
  response_200:
    dados:
      - id: uuid
        direcao: enum (ENTRADA, SAIDA)
        tipo: enum (TEXTO, IMAGEM, AUDIO, VIDEO, DOCUMENTO)
        conteudo: string | null
        midia_url: string | null
        status: enum (PENDENTE, ENVIADA, ENTREGUE, LIDA, ERRO)
        enviado_em: datetime
        enviado_por:
          id: uuid
          nome: string
    tem_mais: boolean

POST /api/conversas/:id/mensagens:
  params:
    id: uuid (conversa_id)
  body:
    tipo: enum (TEXTO, IMAGEM, AUDIO, VIDEO, DOCUMENTO)
    conteudo: string (required se tipo = TEXTO)
    midia_url: string (required se tipo != TEXTO)
  response_201:
    id: uuid
    status: PENDENTE
  response_400:
    erro: "Conteúdo é obrigatório para mensagens de texto"

PUT /api/conversas/:id/atribuir:
  params:
    id: uuid (conversa_id)
  body:
    usuario_id: uuid | null
    equipe_id: uuid | null
  response_200:
    mensagem: "Conversa atribuída com sucesso"
  response_400:
    erro: "Informe usuario_id ou equipe_id"
```

---

## ✅ Checklist de Aceite por Módulo

### Autenticação

```
□ Usuário consegue fazer login com email e senha
□ Token JWT é gerado e retornado
□ Refresh token funciona corretamente
□ Logout invalida o token
□ Tentativas de login são limitadas (5x)
□ Conta é bloqueada após exceder tentativas
□ Senha incorreta retorna erro genérico (segurança)
□ Email não encontrado retorna erro genérico (segurança)
```

### Multi-Tenant

```
□ Super Admin consegue criar clientes
□ Super Admin consegue listar todos os clientes
□ Admin do Cliente só vê dados do cliente dele
□ Tentativa de acesso a outro cliente retorna 403
□ RLS está funcionando no banco (testar com query direta)
□ Criação de cliente cria perfis padrão automaticamente
□ Primeiro usuário do cliente é criado como Admin
```

### Conversas

```
□ Lista de conversas carrega corretamente
□ Filtros funcionam (status, equipe, atribuição)
□ Clicar em conversa abre o chat
□ Mensagens carregam em ordem cronológica
□ Scroll infinito carrega mensagens antigas
□ Enviar mensagem de texto funciona
□ Mensagem aparece em tempo real para ambos
□ Status da mensagem atualiza (enviada → entregue → lida)
□ Indicador de "digitando" funciona
□ Atribuir conversa funciona
□ Transferir conversa funciona
□ Resolver conversa funciona
□ Arquivar conversa funciona
```

---

## 📁 Arquivos que Claude Code Deve Criar (Sprint 1-2)

```
crm-whatsapp/
├── package.json                          # Workspace root
├── pnpm-workspace.yaml                   # pnpm workspaces
├── turbo.json                            # Turborepo config
├── .env.exemplo                          # Template de variáveis
├── docker-compose.yml                    # PostgreSQL + Redis
│
├── aplicacoes/
│   └── api/
│       ├── package.json
│       ├── tsconfig.json
│       ├── .env.exemplo
│       ├── Dockerfile
│       │
│       ├── prisma/
│       │   ├── schema.prisma             # Schema completo
│       │   └── seed.ts                   # Dados iniciais
│       │
│       └── src/
│           ├── index.ts                  # Entry point
│           ├── servidor.ts               # Fastify setup
│           │
│           ├── configuracao/
│           │   ├── ambiente.ts           # Variáveis de ambiente
│           │   └── constantes.ts         # Constantes do sistema
│           │
│           ├── modulos/
│           │   └── saude/
│           │       ├── saude.rotas.ts    # GET /saude
│           │       └── saude.controlador.ts
│           │
│           └── infraestrutura/
│               ├── banco/
│               │   └── prisma.servico.ts
│               └── cache/
│                   └── redis.servico.ts
```

---

## 📋 Sprints Adicionais Implementados

### Sprint 13-14: Chatbot + Automacao ✅ CONCLUIDO

```
PRIORIDADE: MEDIO
DEPENDÊNCIAS: Sprint 11-12

Tarefas:
✅ Modulo chatbot (fluxos, nos, gatilhos)
✅ Editor visual de fluxos
✅ Engine de processamento
✅ Condicoes e ramificacoes
✅ Integracao com conversas
```

### Sprint 15-16: Campanhas + Kanban ✅ CONCLUIDO

```
PRIORIDADE: MEDIO
DEPENDÊNCIAS: Sprint 13-14

Tarefas:
✅ CRUD de campanhas
✅ Agendamento de envio
✅ Processamento via workers
✅ Quadros Kanban
✅ Colunas e cartoes
✅ Drag and drop
```

### Sprint 17-18: Relatorios + Agenda ✅ CONCLUIDO

```
PRIORIDADE: MEDIO
DEPENDÊNCIAS: Sprint 15-16

Tarefas:
✅ Dashboard de metricas
✅ Relatorios de atendimento
✅ Compromissos e lembretes
✅ Notificacoes de agenda
✅ Integracao com contatos
```

### Sprint 19-22: Workers + WhatsApp Real + Testes + PWA ✅ CONCLUIDO

```
PRIORIDADE: ALTO
DEPENDÊNCIAS: Sprint 17-18

Tarefas:
✅ Workers pg-boss (campanhas, mensagens, lembretes, webhooks)
✅ Integracao Meta Cloud API real
✅ Integracao UaiZap real
✅ Webhook receiver com validacao HMAC
✅ Infraestrutura de testes (Vitest + Supertest)
✅ Factories e helpers de teste
✅ PWA com Service Worker
✅ Offline storage com IndexedDB
✅ Manifest e icones
```

---

## 🎯 Proximos Passos (Sprint 23+)

### Deploy e Producao

```
PRIORIDADE: CRITICO
DEPENDÊNCIAS: Sprint 19-22

Tarefas:
□ Configurar docker-compose para producao
□ Deploy em EasyPanel
□ SSL/TLS com Let's Encrypt
□ Configurar variaveis de ambiente de producao
□ Testar integracao WhatsApp end-to-end
□ Monitoramento e alertas
```

### Testes de Integracao

```
PRIORIDADE: ALTO
DEPENDÊNCIAS: Deploy

Tarefas:
□ Testes de rotas de autenticacao
□ Testes de rotas de conversas
□ Testes de validacao HMAC
□ Testes de workers
□ Cobertura minima 70%
```

### Documentacao

```
PRIORIDADE: MEDIO

Tarefas:
□ Swagger/OpenAPI para API
□ Guia de instalacao
□ Guia de integracao WhatsApp
□ Documentacao de webhooks
```

---

*Especificações detalhadas para Claude Code - Ultima atualizacao: Janeiro 2026*
