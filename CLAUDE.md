# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Idioma / Language

**SEMPRE responda em Português do Brasil (PT-BR).** Todas as respostas, explicações, comentários e interações devem ser em português, independentemente do idioma da pergunta do usuário.

## Project Overview

**Inboxx** - Plataforma SaaS multi-tenant para atendimento omnichannel (WhatsApp/Instagram/Facebook).

**Arquitetura:** Software white-label vendido via licenças mensais por IP.
- Licenciador (você) → vende licenças por IP do servidor
- Super Admin (comprador) → instala no servidor, cria clientes
- Clientes → criam usuários (Admin, Supervisor, Atendente)

**Isolamento de Dados:** PostgreSQL Row-Level Security (RLS) por `cliente_id`.

**Cor Principal:** `#00D97E` (HSL: 158 100% 42%)

## Current Project Status (Sprint 19-23 Complete)

### Backend API - Fully Implemented
- **20 modules** operational in `api/src/modulos/`
- **BullMQ workers** for background jobs (campaigns, scheduled messages, reminders, webhook retry, search sync)
- **WhatsApp Integration** with Meta Cloud API + UaiZap providers
- **WebSocket** real-time messaging via Socket.io
- **Dual storage** (local filesystem + AWS S3)
- **Test infrastructure** with Vitest + Supertest + factories
- **XState Integration** for chatbot flow execution engine

### Frontend Web - Fully Implemented
- **14 pages** in `web/src/paginas/`
- **PWA support** with offline capabilities (IndexedDB + Service Worker)
- **Visual Flow Builder** using React Flow (@xyflow/react)
- **Build:** ~1800+ modules, ~500KB (~160KB gzip)

### Implemented Modules
```
api/src/modulos/
├── autenticacao/    # JWT auth + refresh tokens
├── licencas/        # IP-based licensing
├── clientes/        # Multi-tenant clients
├── usuarios/        # User management
├── equipes/         # Teams
├── perfis/          # Profiles & permissions
├── conexoes/        # WhatsApp/Instagram connections
├── contatos/        # Contacts + custom fields
├── etiquetas/       # Labels/tags
├── conversas/       # Conversations
├── mensagens/       # Messages
├── notas-internas/  # Internal notes
├── chatbot/         # Visual Flow Builder + XState Engine
├── campanhas/       # Mass messaging
├── kanban/          # Pipeline boards
├── agendamento/     # Scheduling + reminders
├── relatorios/      # Reports & metrics
├── uploads/         # File uploads
└── whatsapp/        # WhatsApp providers + webhooks
```

### Workers (BullMQ)
```
api/src/workers/
├── campanhas.worker.ts             # Campaign processing
├── mensagens-agendadas.worker.ts   # Scheduled messages
├── lembretes.worker.ts             # Reminder notifications
├── webhooks-retry.worker.ts        # Webhook retry with backoff
└── sincronizacao-busca.worker.ts   # Meilisearch sync
```

### Test Infrastructure
```
api/src/testes/
├── setup.ts                    # Global test setup
├── factories/
│   ├── cliente.factory.ts      # Client factory
│   └── usuario.factory.ts      # User factory
└── helpers/
    ├── criar-app-teste.ts      # Test Fastify instance
    └── autenticar.ts           # JWT helpers for tests
```

### PWA Features
```
web/src/pwa/
├── offline-db.ts      # IndexedDB for offline storage
└── index.ts           # SW registration + online status
```

### Chatbot Visual Flow Builder (Sprint 23)

**Backend - XState Engine:**
```
api/src/modulos/chatbot/
├── fluxos.controlador.ts        # Flow CRUD
├── fluxos.servico.ts            # Flow business logic
├── nos.controlador.ts           # Node CRUD
├── nos.servico.ts               # Node business logic
├── transicoes.controlador.ts    # Transitions CRUD + sync
├── transicoes.servico.ts        # Transition business logic
├── motor-fluxo.servico.ts       # XState machine executor
└── index.ts                     # Module exports
```

**Frontend - React Flow Components:**
```
web/src/componentes/chatbot/
├── CanvasFluxo.tsx          # Main React Flow canvas
├── NoFluxo.tsx              # 10 node type components
├── BarraFerramentas.tsx     # Draggable node toolbar
├── PainelPropriedades.tsx   # Node property editor
└── index.ts                 # Module exports

web/src/paginas/chatbot/
├── Chatbot.tsx              # Flow list page
└── EditorFluxo.tsx          # Visual flow editor page
```

**Node Types (TipoNo):**
- `INICIO` - Flow start point (Play icon, emerald)
- `MENSAGEM` - Send text message (MessageCircle, blue)
- `PERGUNTA` - Ask question & store response (HelpCircle, purple)
- `MENU` - Multiple choice with branching (ListOrdered, amber)
- `CONDICAO` - Conditional branching (GitBranch, orange)
- `TRANSFERIR` - Transfer to team/agent (ArrowRightLeft, cyan)
- `WEBHOOK` - HTTP request (Webhook, rose)
- `ESPERAR` - Wait/delay (Clock, slate)
- `ACAO` - Execute action (Zap, violet)
- `FIM` - Flow end point (Square, red)

**API Routes - Transitions:**
```
GET  /api/chatbot/fluxos/:fluxoId/transicoes          # List transitions
POST /api/chatbot/fluxos/:fluxoId/transicoes          # Create transition
POST /api/chatbot/fluxos/:fluxoId/transicoes/sincronizar  # Sync all
POST /api/chatbot/fluxos/:fluxoId/compilar            # Compile to XState
GET  /api/chatbot/fluxos/:fluxoId/machine             # Get XState machine
POST /api/chatbot/fluxos/:fluxoId/validar             # Validate flow
```

## Tech Stack (Mandatory)

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Fastify 5.7.x (NOT Express)
- **Language:** TypeScript 5.7+
- **ORM:** Drizzle ORM 0.45.x (NOT Prisma/TypeORM/Sequelize)
- **Queues:** BullMQ 5.x using Redis (NOT pg-boss/RabbitMQ)
- **WebSocket:** Socket.io 4.x
- **Validation:** Zod 3.x
- **JWT:** jose 6.x (NOT jsonwebtoken)
- **Hashing:** argon2 / bcrypt

### Frontend
- **Framework:** React 19 + Vite 6 (NOT Next.js)
- **State:** Zustand 5.x (NOT Redux)
- **Data Fetching:** TanStack Query v5
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod
- **Flow Builder:** React Flow (@xyflow/react) + XState
- **i18n:** i18next (PT-BR + EN)
- **Monitoring:** Sentry 10.x

### Infrastructure
- **Database:** PostgreSQL 16
- **Cache:** Redis 7 (sessions + Socket.io pub/sub + BullMQ queues)
- **Search:** Meilisearch (optional)
- **Storage:** AWS S3 / MinIO / Local filesystem
- **Deploy:** EasyPanel + Docker
- **Observability:** Prometheus + Grafana + Loki
- **Package Manager:** npm (NOT pnpm/yarn)

## Code Conventions

### File Naming (Portuguese, kebab-case)
```
usuarios.controlador.ts    # Controllers
usuarios.servico.ts        # Services
usuarios.rotas.ts          # Routes
criar-usuario.dto.ts       # DTOs
usuario.tipos.ts           # Types
ItemConversa.tsx           # Components (PascalCase)
useConversas.ts            # Hooks (camelCase)
```

### API Routes (Portuguese, kebab-case)
```
POST /api/autenticacao/entrar
GET /api/conversas/:id/mensagens
PUT /api/usuarios/:id/redefinir-senha
POST /api/chatbot/fluxos/:fluxoId/transicoes/sincronizar
POST /api/chatbot/fluxos/:fluxoId/compilar
```

### Database Tables (Portuguese, snake_case, plural)
```
usuarios, conversas, mensagens_agendadas, contatos_etiquetas, contatos_conexoes
```

### Key Architecture: contatos_conexoes (ContactInbox Pattern)
A tabela `contatos_conexoes` implementa o padrão ContactInbox do Chatwoot:
- Preserva histórico de conversas quando conexão é excluída
- Permite que um contato tenha múltiplos identificadores em diferentes canais
- `conversas.conexaoId` é nullable (SET NULL on delete)
- `conversas.contatoConexaoId` referencia a tabela pivot

### Code Style
- Max 300 lines per file (split if larger)
- Max 150 lines per React component
- NO `any` types - type everything
- Always use `const` for functions
- Use path aliases `@/` instead of relative imports
- Validate ALL inputs with Zod schemas
- Use structured logging with Pino (NO console.log in production)
- Environment variables via Zod-validated config

## Project Structure

```
inboxx/
├── api/                        # Fastify backend
│   ├── src/
│   │   ├── configuracao/       # Environment, constants
│   │   ├── modulos/            # Feature modules (20 modules)
│   │   ├── compartilhado/      # Shared (errors, middlewares, guards)
│   │   ├── infraestrutura/     # DB (Drizzle), cache, storage, queues
│   │   │   └── banco/schema/   # Drizzle schema definitions
│   │   ├── websocket/          # Socket.io gateway
│   │   └── workers/            # BullMQ background job processors
│   ├── scripts/                # Seed & utility scripts
│   └── drizzle.config.ts       # Drizzle Kit configuration
│
├── web/                        # React dashboard
│   └── src/
│       ├── paginas/            # 14 page components
│       ├── componentes/        # UI components
│       │   └── chatbot/        # Visual flow builder components
│       ├── hooks/              # Custom hooks
│       ├── servicos/           # API service layer (axios)
│       ├── stores/             # Zustand state stores
│       ├── tipos/              # TypeScript type definitions
│       ├── configuracao/       # Runtime env config
│       └── pwa/                # PWA offline support
│
└── docs/                       # Planning & specification documents
```

## Module Structure Pattern

Each module in `api/src/modulos/` follows:
```
modulos/usuarios/
├── usuarios.controlador.ts   # Route handlers
├── usuarios.servico.ts       # Business logic
├── usuarios.rotas.ts         # Route definitions
├── usuarios.schema.ts        # Zod validation
├── dto/
│   └── criar-usuario.dto.ts
└── tipos/
    └── usuario.tipos.ts
```

## Key Patterns

### Multi-Tenant Filtering
Always filter by `clienteId` - injected via middleware:
```typescript
const conversas = await db.select()
  .from(conversasTable)
  .where(eq(conversasTable.clienteId, req.usuario.clienteId)); // MANDATORY
```

### Custom Errors
```typescript
throw new ErroValidacao('Email já cadastrado');
throw new ErroNaoEncontrado('Usuário não encontrado');
throw new ErroNaoAutorizado('Credenciais inválidas');
throw new ErroSemPermissao('Sem permissão');
```

### Permission Check
```typescript
preHandler: [app.autenticar, app.verificarPermissao('usuarios:criar')]
```

### Chatbot XState Machine Pattern
```typescript
// Flow compilation: nodes + transitions → XState machine
interface FluxoMachine {
  id: string;
  initial: string;
  context: {
    conversaId: string;
    contatoId: string;
    variaveis: Record<string, unknown>;
  };
  states: Record<string, StateConfig>;
}

// Transitions support: target, guards, actions
interface TransicaoFluxo {
  noOrigemId: string;
  noDestinoId: string;
  evento: string;        // 'PROXIMO', 'OPCAO_1', 'TIMEOUT'
  condicao?: object;     // Guard condition (optional)
}
```

## User Profiles & Permissions

- **SUPER_ADMIN:** Platform owner (license buyer), full access
- **ADMIN_CLIENTE:** Client admin, manages their tenant
- **SUPERVISOR:** Team supervisor, manages team conversations
- **ATENDENTE:** Agent, handles assigned conversations only

## Development Phases

1. ✅ Foundation: Docker + Drizzle + Health check
2. ✅ Auth + Licensing: JWT + IP validation + Profiles
3. ✅ Multi-Tenant: Clients CRUD + RLS + Teams
4. ✅ WhatsApp Connections: Meta Cloud API + UaiZap
5. ✅ Real-Time Conversations: Socket.io + Messages
6. ✅ Frontend Dashboard: React + Chat interface
7. ✅ Chatbot: Flow builder + Engine
8. ✅ Campaigns: Mass messaging
9. ✅ Teams + Reports
10. ✅ Kanban + Calendar
11. ✅ PWA + Workers + Tests (Sprint 19-22)
12. ✅ XState Chatbot + Visual Flow Builder (Sprint 23)

## Remaining Tasks

- [ ] Production deployment (EasyPanel + Docker)
- [ ] Database migration - executar `npm run drizzle:push` para criar tabela `contatos_conexoes`
- [ ] Script de migração de dados existentes para `contatos_conexoes`
- [ ] End-to-end testing with real WhatsApp credentials
- [ ] Performance optimization & load testing
- [ ] Documentation for API consumers

## Frontend Routes

```
/              → Dashboard (com MenuLateral)
/conversas     → Conversas (SEM MenuLateral - layout próprio)
/contatos      → Contatos (com MenuLateral)
/canais        → Canais/Conexões (com MenuLateral) [renomeado de /conexoes]
/chatbot       → Chatbot (com MenuLateral)
/campanhas     → Campanhas (com MenuLateral)
/kanban        → Kanban (com MenuLateral)
/agenda        → Agenda (com MenuLateral)
/relatorios    → Relatórios (com MenuLateral)
/usuarios      → Usuários (com MenuLateral)
/configuracoes → Configurações (com MenuLateral)
```

## Security Rules

- Hash passwords with argon2 (bcrypt also available)
- JWT tokens via `jose` library with minimal payload (`sub`, `clienteId`, `perfilId`)
- Never return sensitive data (passwords, tokens) in API responses
- Validate all inputs with Zod before processing
- Token storage in sessionStorage (frontend)
- CASL-based permission system for fine-grained access control
- Helmet security headers + rate limiting (100 req/min)
- Generic error messages for auth failures (prevents enumeration)

## Key Dependencies

### Backend (api/package.json)
- **fastify** ^5.7.1 - Web framework
- **drizzle-orm** ^0.45.1 - Database ORM
- **bullmq** ^5.67.1 - Redis job queue
- **socket.io** ^4.8.3 - WebSocket
- **ioredis** ^5.3.2 - Redis client
- **jose** ^6.1.3 - JWT signing/verification
- **axios** ^1.13.2 - HTTP client (WhatsApp API)
- **xstate** ^5.x - Chatbot flow state machine engine
- **@sentry/node** ^10.37.0 - Error tracking
- **prom-client** ^15.1.3 - Prometheus metrics
- **vitest** ^4.0.18 - Test framework

### Frontend (web/package.json)
- **react** ^19.2.4 - UI library
- **vite** ^6.4.1 - Build tool
- **@tanstack/react-query** ^5.28.0 - Data fetching
- **zustand** ^5.0.10 - State management
- **socket.io-client** ^4.8.3 - WebSocket
- **@xyflow/react** ^12.x - Visual flow builder (React Flow)
- **xstate** ^5.x - State machine library
- **@xstate/react** ^5.x - XState React bindings
- **i18next** ^25.8.0 - Internationalization
- **@sentry/react** ^10.37.0 - Error tracking
- **workbox-window** ^7.4.0 - PWA/Service Worker
- **vitest** ^4.0.18 - Test framework

## Running the Project

Everything runs on port 5000 (Fastify serves both API and frontend).

**Production (EasyPanel):** Just push to Git - EasyPanel builds using the Dockerfile automatically.

```bash
# Install dependencies
cd api && npm install
cd web && npm install

# Development (build frontend + run API on port 5000)
cd web && npm run build          # Build frontend
cp -r dist/* ../api/public/      # Copy to API public folder
cd api && npm run dev            # Everything on :5000

# Or use the unified build script:
cd api && npm run build:full     # Builds web + API
cd api && npm run dev            # Port 5000

# Seed Database
cd api
npx tsx scripts/seed.ts          # Create super admin
npx tsx scripts/seed-cliente.ts  # Create demo client

# Tests
cd api && npm test               # Backend tests
cd web && npm test               # Frontend tests
```

## Environment Variables

See `api/.env.exemplo` for required variables:
- `DATABASE_URL` - PostgreSQL connection (mandatory)
- `REDIS_URL` - Redis connection (mandatory)
- `JWT_SECRET` - Token signing key (min 32 chars, mandatory)
- `COOKIE_SECRET` - Cookie signing key (min 32 chars, mandatory)
- `META_WEBHOOK_VERIFY_TOKEN` - WhatsApp webhook validation
- `MEILI_URL` / `MEILI_MASTER_KEY` - Meilisearch (optional)
- `SENTRY_DSN` - Error monitoring (optional)
