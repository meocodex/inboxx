# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CRM WhatsApp Omnichannel - A multi-tenant SaaS platform for WhatsApp/Instagram/Facebook customer service.

**Architecture:** White-label software sold via monthly IP-based licenses.
- Licensor (you) → sells licenses by server IP
- Super Admin (buyer) → installs on their server, creates clients
- Clients → create users (Admin, Supervisor, Atendente)

**Data Isolation:** PostgreSQL Row-Level Security (RLS) per `cliente_id`.

## Current Project Status (Sprint 19-22 Complete)

### Backend API - Fully Implemented
- **19 modules** operational in `api/src/modulos/`
- **pg-boss workers** for background jobs (campaigns, scheduled messages, reminders, webhook retry)
- **WhatsApp Integration** with Meta Cloud API + UaiZap providers
- **WebSocket** real-time messaging via Socket.io
- **Dual storage** (local filesystem + AWS S3)
- **Test infrastructure** with Vitest + Supertest + factories

### Frontend Web - Fully Implemented
- **13 pages** in `web/src/paginas/`
- **PWA support** with offline capabilities (IndexedDB + Service Worker)
- **Build:** ~1781 modules, ~480KB (~156KB gzip)

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
├── chatbot/         # Flow builder + engine
├── campanhas/       # Mass messaging
├── kanban/          # Pipeline boards
├── agendamento/     # Scheduling + reminders
├── relatorios/      # Reports & metrics
├── uploads/         # File uploads
└── whatsapp/        # WhatsApp providers + webhooks
```

### Workers (pg-boss)
```
api/src/workers/
├── campanhas.worker.ts         # Campaign processing
├── mensagens-agendadas.worker.ts # Scheduled messages
├── lembretes.worker.ts         # Reminder notifications
└── webhooks-retry.worker.ts    # Webhook retry with backoff
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

## Tech Stack (Mandatory)

### Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Fastify 4.x (NOT Express)
- **Language:** TypeScript 5+
- **ORM:** Prisma 5+ (NOT TypeORM/Sequelize)
- **Queues:** pg-boss 9+ using PostgreSQL (NOT BullMQ/RabbitMQ)
- **WebSocket:** Socket.io 4.x
- **Validation:** Zod 3.x

### Frontend
- **Framework:** React 18 + Vite 5 (NOT Next.js)
- **State:** Zustand 4.x (NOT Redux)
- **Data Fetching:** TanStack Query v5
- **UI:** Tailwind CSS + shadcn/ui
- **Forms:** React Hook Form + Zod

### Infrastructure
- **Database:** PostgreSQL 16 (main + queues)
- **Cache:** Redis 7 (sessions + Socket.io pub/sub)
- **Storage:** AWS S3 / MinIO
- **Deploy:** EasyPanel + Docker
- **Monorepo:** pnpm + Turborepo

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
```

### Database Tables (Portuguese, snake_case, plural)
```
usuarios, conversas, mensagens_agendadas, contatos_etiquetas
```

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
crm-whatsapp/
├── aplicacoes/
│   ├── api/                    # Fastify backend
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── src/
│   │       ├── configuracao/   # Environment, constants
│   │       ├── modulos/        # Feature modules
│   │       │   ├── autenticacao/
│   │       │   ├── clientes/
│   │       │   ├── usuarios/
│   │       │   ├── conexoes/
│   │       │   ├── conversas/
│   │       │   ├── contatos/
│   │       │   ├── chatbot/
│   │       │   └── campanhas/
│   │       ├── compartilhado/  # Shared (errors, middlewares, guards)
│   │       ├── infraestrutura/ # DB, cache, storage, queues
│   │       ├── websocket/      # Socket.io gateway
│   │       └── workers/        # Background job processors
│   │
│   ├── web/                    # React dashboard
│   │   └── src/
│   │       ├── paginas/
│   │       ├── componentes/
│   │       ├── hooks/
│   │       ├── servicos/
│   │       └── stores/
│   │
│   └── pwa/                    # Mobile PWA (simplified)
│
└── pacotes/                    # Shared packages
    ├── tipos/
    └── utilitarios/
```

## Module Structure Pattern

Each module in `aplicacoes/api/src/modulos/` follows:
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
const conversas = await prisma.conversa.findMany({
  where: {
    clienteId: req.usuario.clienteId, // MANDATORY
    // other filters...
  },
});
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

## User Profiles & Permissions

- **SUPER_ADMIN:** Platform owner (license buyer), full access
- **ADMIN_CLIENTE:** Client admin, manages their tenant
- **SUPERVISOR:** Team supervisor, manages team conversations
- **ATENDENTE:** Agent, handles assigned conversations only

## Development Phases

1. ✅ Foundation: Monorepo + Docker + Prisma + Health check
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

## Remaining Tasks

- [ ] Production deployment (EasyPanel + Docker)
- [ ] End-to-end testing with real WhatsApp credentials
- [ ] Performance optimization & load testing
- [ ] Documentation for API consumers

## Security Rules

- Hash passwords with bcrypt (cost 12)
- JWT tokens with minimal payload (`sub`, `clienteId`, `perfilId`)
- Never return sensitive data (passwords, tokens) in API responses
- Validate all inputs with Zod before processing
- Use httpOnly cookies for tokens (NOT localStorage)
- Sanitize HTML with DOMPurify
- Generic error messages for auth failures (prevents enumeration)

## Key Dependencies

### Backend (api/package.json)
- **fastify** ^4.26.0 - Web framework
- **@prisma/client** ^5.10.0 - Database ORM
- **pg-boss** ^12.5.4 - PostgreSQL job queue
- **socket.io** ^4.8.3 - WebSocket
- **ioredis** ^5.3.2 - Redis client
- **axios** ^1.13.2 - HTTP client (WhatsApp API)
- **vitest** ^4.0.18 - Test framework

### Frontend (web/package.json)
- **react** ^18.2.0 - UI library
- **vite** ^5.1.5 - Build tool
- **@tanstack/react-query** ^5.28.0 - Data fetching
- **zustand** ^4.5.2 - State management
- **socket.io-client** ^4.8.3 - WebSocket
- **workbox-window** ^7.4.0 - PWA/Service Worker
- **idb** ^8.0.3 - IndexedDB wrapper
- **vite-plugin-pwa** ^1.2.0 - PWA build plugin
- **vitest** ^4.0.18 - Test framework

## Running the Project

```bash
# Backend
cd api
pnpm install
pnpm prisma:generate
pnpm dev                    # Development server on :3333

# Frontend
cd web
pnpm install
pnpm dev                    # Development server on :5173

# Tests
cd api && pnpm test         # Backend tests
cd web && pnpm test         # Frontend tests
```

## Environment Variables

See `api/.env.example` for required variables:
- `DATABASE_URL` - PostgreSQL connection
- `REDIS_URL` - Redis connection
- `JWT_SECRET` - Token signing key
- `META_ACCESS_TOKEN` - WhatsApp Cloud API
- `META_PHONE_NUMBER_ID` - WhatsApp number ID
- `META_APP_SECRET` - Webhook validation
- `UAIZAP_API_URL` / `UAIZAP_API_KEY` - Alternative provider
