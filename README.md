# CRM WhatsApp Omnichannel

Sistema de CRM multi-tenant para atendimento omnichannel via WhatsApp e Instagram.

## Tecnologias

- **Runtime:** Node.js 20+ / TypeScript 5
- **Framework:** Fastify 4
- **ORM:** Prisma 5
- **Banco de Dados:** PostgreSQL 16
- **Cache:** Redis 7 (opcional, graceful degradation)
- **Validacao:** Zod
- **Autenticacao:** JWT + Refresh Token
- **Logs:** Pino

## Estrutura do Projeto

```
crm/
├── api/                    # Backend Fastify
│   ├── prisma/
│   │   ├── schema.prisma   # Schema do banco
│   │   └── seed.ts         # Dados iniciais
│   └── src/
│       ├── configuracao/   # Ambiente e constantes
│       ├── compartilhado/  # Erros, middlewares, guardas, utilitarios
│       ├── infraestrutura/ # Prisma e Redis
│       └── modulos/        # Modulos da aplicacao
└── web/                    # Frontend (futuro)
```

## Modulos Implementados

| Modulo | Descricao |
|--------|-----------|
| `saude` | Health check da API |
| `autenticacao` | Login, logout, refresh token |
| `licencas` | Validacao de licenca por IP |
| `clientes` | Gestao multi-tenant |
| `usuarios` | CRUD de usuarios |
| `equipes` | Agrupamento de atendentes |
| `perfis` | Permissoes por perfil |
| `conexoes` | WhatsApp/Instagram Business |
| `contatos` | CRM de contatos |
| `etiquetas` | Tags para contatos |
| `conversas` | Atendimento ao cliente |
| `mensagens` | Chat e webhooks |
| `notas-internas` | Anotacoes em conversas |
| `chatbot` | Fluxos, nos e respostas rapidas |
| `campanhas` | Marketing em massa |
| `kanban` | Pipeline de vendas |
| `agendamento` | Compromissos e lembretes |
| `relatorios` | Analytics e dashboard |

## Requisitos

- Node.js 20+
- PostgreSQL 16+
- Redis 7+ (opcional)

## Instalacao

```bash
# Clonar repositorio
git clone <url-do-repositorio>
cd crm

# Instalar dependencias
cd api
npm install

# Configurar ambiente
cp .env.exemplo .env
# Editar .env com suas configuracoes

# Gerar cliente Prisma
npm run prisma:generate

# Criar tabelas no banco
npm run prisma:push

# Popular dados iniciais
npm run prisma:seed

# Iniciar servidor
npm run dev
```

## Variaveis de Ambiente

```env
# Servidor
NODE_ENV=development
PORT=3335
HOST=0.0.0.0

# Banco de Dados
DATABASE_URL=postgresql://postgres:102030@localhost:5432/crmdb?schema=public

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=7d

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Scripts Disponiveis

```bash
npm run dev           # Inicia servidor em modo desenvolvimento
npm run build         # Compila TypeScript
npm run start         # Inicia servidor compilado
npm run prisma:generate  # Gera cliente Prisma
npm run prisma:push      # Aplica schema ao banco
npm run prisma:seed      # Popula dados iniciais
npm run prisma:studio    # Abre interface grafica do Prisma
```

## Endpoints da API

### Publicos
- `GET /api/saude` - Health check
- `POST /api/autenticacao/entrar` - Login
- `POST /api/autenticacao/renovar` - Refresh token

### Protegidos (requer Bearer Token)

#### Usuarios e Equipes
- `GET/POST /api/usuarios`
- `GET/PUT/DELETE /api/usuarios/:id`
- `GET/POST /api/equipes`
- `GET/PUT/DELETE /api/equipes/:id`

#### Contatos e Etiquetas
- `GET/POST /api/contatos`
- `GET/PUT/DELETE /api/contatos/:id`
- `GET/POST /api/etiquetas`
- `GET/PUT/DELETE /api/etiquetas/:id`

#### Conversas e Mensagens
- `GET/POST /api/conversas`
- `GET/PUT /api/conversas/:id`
- `POST /api/conversas/:id/atribuir`
- `POST /api/conversas/:id/encerrar`
- `GET/POST /api/conversas/:id/mensagens`
- `GET/POST /api/conversas/:id/notas`

#### Chatbot
- `GET/POST /api/chatbot/fluxos`
- `GET/PUT/DELETE /api/chatbot/fluxos/:id`
- `POST /api/chatbot/fluxos/:id/ativar`
- `GET/POST /api/chatbot/fluxos/:id/nos`
- `GET/POST /api/respostas-rapidas`

#### Campanhas
- `GET/POST /api/campanhas`
- `GET/PUT/DELETE /api/campanhas/:id`
- `POST /api/campanhas/:id/preparar`
- `POST /api/campanhas/:id/iniciar`
- `POST /api/campanhas/:id/pausar`
- `GET /api/campanhas/:id/logs`
- `GET/POST /api/mensagens-agendadas`

#### Kanban
- `GET/POST /api/kanban/quadros`
- `GET/PUT/DELETE /api/kanban/quadros/:id`
- `GET /api/kanban/quadros/:id/estatisticas`
- `GET/POST /api/kanban/quadros/:id/colunas`
- `PATCH /api/kanban/quadros/:id/colunas/reordenar`
- `GET/POST /api/kanban/quadros/:qid/colunas/:cid/cartoes`
- `POST /api/kanban/quadros/:qid/colunas/:cid/cartoes/:id/mover`

#### Agendamento
- `GET/POST /api/agendamento/compromissos`
- `GET /api/agendamento/compromissos/hoje`
- `GET /api/agendamento/compromissos/proximos`
- `GET /api/agendamento/compromissos/estatisticas`
- `GET/POST /api/agendamento/compromissos/:id/lembretes`

#### Relatorios e Dashboard
- `GET /api/relatorios/conversas`
- `GET /api/relatorios/campanhas`
- `GET /api/relatorios/kanban`
- `GET /api/relatorios/contatos`
- `GET /api/dashboard`
- `GET /api/dashboard/atividades`
- `GET /api/dashboard/grafico-conversas`
- `GET /api/dashboard/kanban`

## Sistema de Permissoes

Formato: `recurso:acao` ou `recurso:*` ou `*`

```
usuarios:*          # Todas as acoes em usuarios
equipes:*           # Todas as acoes em equipes
conexoes:*          # Gestao de conexoes WhatsApp/Instagram
conversas:*         # Atendimento
contatos:*          # CRM
chatbot:*           # Automacao
campanhas:*         # Marketing
kanban:*            # Pipeline
agendamento:*       # Compromissos
relatorios:*        # Analytics
configuracoes:*     # Configuracoes do sistema
respostas-rapidas:* # Respostas rapidas
```

## Usuarios Padrao (apos seed)

| Email | Senha | Perfil |
|-------|-------|--------|
| admin@sistema.com | admin123 | Super Admin |

## Arquitetura Multi-Tenant

Cada cliente (empresa) possui:
- Seus proprios usuarios, equipes e perfis
- Suas conexoes com WhatsApp/Instagram
- Seus contatos, conversas e mensagens
- Seus fluxos de chatbot e campanhas
- Seus quadros kanban e compromissos

O isolamento e garantido pelo `clienteId` em todas as queries.

## Licenca

Proprietario - Todos os direitos reservados.
