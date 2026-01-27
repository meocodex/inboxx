# 🤖 PROMPT MASTER - Claude Code
## CRM WhatsApp Omnichannel

---

# 📋 CONTEXTO DO PROJETO

Você está desenvolvendo um **CRM WhatsApp Omnichannel** completo, um sistema white-label vendido por licença mensal vinculada ao IP do servidor.

## Modelo de Negócio

```
LICENCIADOR (dono do sistema) → vende licença por IP
    └── SUPER ADMIN (comprador) → instala no servidor dele
            └── CLIENTES (cria quantos quiser)
                    └── USUÁRIOS (Admin, Supervisor, Atendente)
```

## Funcionalidades Principais

- Multi-tenant com isolamento total (RLS PostgreSQL)
- WhatsApp API Cloud Meta + UaiZap + Instagram + Facebook
- Templates HSM (Meta aprovados)
- Atendimento em tempo real (WebSocket)
- Chatbot com Flow Builder visual
- Campanhas de disparo em massa
- Sistema Kanban/Pipeline
- Relatórios e Analytics
- SLA de atendimento (habilitável por cliente)
- Pesquisa de satisfação NPS/CSAT (habilitável por cliente)
- Backup automático S3
- PWA para atendimento mobile

---

# 🚫 O QUE NÃO FAZER (PROIBIÇÕES ABSOLUTAS)

## Arquitetura

```
❌ NÃO usar Express.js (usar Fastify)
❌ NÃO usar MongoDB (usar PostgreSQL)
❌ NÃO usar Sequelize ou TypeORM (usar Prisma)
❌ NÃO usar Redux (usar Zustand)
❌ NÃO usar Next.js para o dashboard (usar Vite + React)
❌ NÃO usar BullMQ ou RabbitMQ para filas (usar pg-boss)
❌ NÃO usar REST para tempo real (usar Socket.io)
❌ NÃO usar monorepo/Turborepo (estrutura simples)
❌ NÃO criar servidor de licenças junto (será sistema separado)
```

## Código

```
❌ NÃO criar arquivos com mais de 300 linhas
❌ NÃO usar 'any' no TypeScript (tipar TUDO)
❌ NÃO usar var (usar const/let)
❌ NÃO usar callbacks (usar async/await)
❌ NÃO usar console.log em produção (usar logger estruturado)
❌ NÃO hardcodar valores (usar variáveis de ambiente)
❌ NÃO commitar .env ou secrets
❌ NÃO ignorar erros (sempre tratar com try/catch)
❌ NÃO usar SQL raw sem prepared statements
❌ NÃO armazenar senhas em texto plano (usar bcrypt)
❌ NÃO expor stack traces em produção
❌ NÃO usar imports relativos longos (usar path aliases @/)
```

## Segurança

```
❌ NÃO confiar em input do usuário (validar TUDO com Zod)
❌ NÃO retornar dados sensíveis na API (filtrar sempre)
❌ NÃO permitir SQL injection (usar Prisma)
❌ NÃO permitir XSS (sanitizar outputs)
❌ NÃO armazenar tokens no localStorage (usar httpOnly cookies ou memory)
❌ NÃO expor rotas sem autenticação (exceto /saude e /autenticacao)
❌ NÃO permitir CORS aberto em produção
❌ NÃO logar dados sensíveis (senhas, tokens, cartões)
```

## UX/Frontend

```
❌ NÃO usar alerts/confirms nativos (usar componentes UI)
❌ NÃO bloquear UI durante loading (usar estados de loading)
❌ NÃO ignorar estados de erro (sempre mostrar feedback)
❌ NÃO usar cores hardcoded (usar design tokens/Tailwind)
❌ NÃO criar componentes gigantes (máximo 150 linhas)
❌ NÃO misturar lógica de negócio com UI (separar em hooks)
```

---

# ✅ STACK OBRIGATÓRIA

## Backend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **Node.js** | 20+ LTS | Runtime |
| **Fastify** | 4.x | Framework HTTP |
| **TypeScript** | 5.x | Linguagem |
| **Prisma** | 5.x | ORM |
| **pg-boss** | 9.x | Filas (PostgreSQL) |
| **Socket.io** | 4.x | WebSocket |
| **Zod** | 3.x | Validação |
| **bcrypt** | 5.x | Hash de senhas |
| **jsonwebtoken** | 9.x | JWT |
| **pino** | 8.x | Logger |
| **dayjs** | 1.x | Datas |
| **axios** | 1.x | HTTP client |

## Banco de Dados

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **PostgreSQL** | 16+ | Banco principal + Filas |
| **Redis** | 7+ | Cache + Pub/Sub Socket.io |

## Frontend

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| **React** | 18.x | UI Library |
| **Vite** | 5.x | Build tool |
| **TypeScript** | 5.x | Linguagem |
| **TanStack Query** | 5.x | Data fetching |
| **Zustand** | 4.x | Estado global |
| **React Hook Form** | 7.x | Formulários |
| **Zod** | 3.x | Validação |
| **Tailwind CSS** | 3.x | Estilização |
| **shadcn/ui** | latest | Componentes |
| **Lucide React** | latest | Ícones |
| **Socket.io Client** | 4.x | WebSocket |
| **dayjs** | 1.x | Datas |

## Infraestrutura

| Tecnologia | Uso |
|------------|-----|
| **Docker** | Containerização |
| **Docker Compose** | Orquestração local |
| **EasyPanel** | Deploy produção |
| **Nginx** | Reverse proxy (via EasyPanel) |
| **AWS S3 / MinIO** | Armazenamento de mídia |
| **Let's Encrypt** | SSL (via EasyPanel) |

---

# 🏗️ ESTRUTURA DE PASTAS (SIMPLES, SEM MONOREPO)

```
crm-whatsapp/
│
├── docker-compose.yml          # PostgreSQL + Redis + API + Web
├── .env.exemplo                 # Template de variáveis
├── .gitignore
├── README.md
│
├── api/                         # ========== BACKEND ==========
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   ├── .env.exemplo
│   │
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   └── src/
│       ├── index.ts             # Entry point
│       ├── servidor.ts          # Fastify setup
│       │
│       ├── configuracao/
│       │   ├── ambiente.ts      # Variáveis de ambiente (Zod)
│       │   └── constantes.ts    # Constantes do sistema
│       │
│       ├── modulos/
│       │   ├── saude/
│       │   │   └── saude.rotas.ts
│       │   │
│       │   ├── autenticacao/
│       │   │   ├── autenticacao.controlador.ts
│       │   │   ├── autenticacao.servico.ts
│       │   │   ├── autenticacao.rotas.ts
│       │   │   └── autenticacao.schema.ts
│       │   │
│       │   ├── licencas/
│       │   │   ├── licencas.controlador.ts
│       │   │   ├── licencas.servico.ts
│       │   │   └── validador-licenca.ts
│       │   │
│       │   ├── clientes/
│       │   │   ├── clientes.controlador.ts
│       │   │   ├── clientes.servico.ts
│       │   │   └── clientes.schema.ts
│       │   │
│       │   ├── usuarios/
│       │   │   ├── usuarios.controlador.ts
│       │   │   ├── usuarios.servico.ts
│       │   │   └── usuarios.schema.ts
│       │   │
│       │   ├── equipes/
│       │   │
│       │   ├── conexoes/
│       │   │   ├── conexoes.controlador.ts
│       │   │   ├── conexoes.servico.ts
│       │   │   ├── provedores/
│       │   │   │   ├── meta-api.provedor.ts
│       │   │   │   ├── uaizap.provedor.ts
│       │   │   │   └── instagram.provedor.ts
│       │   │   └── webhooks/
│       │   │       ├── meta.webhook.ts
│       │   │       └── uaizap.webhook.ts
│       │   │
│       │   ├── conversas/
│       │   │   ├── conversas.controlador.ts
│       │   │   ├── conversas.servico.ts
│       │   │   └── mensagens.servico.ts
│       │   │
│       │   ├── contatos/
│       │   │
│       │   ├── chatbot/
│       │   │   ├── chatbot.controlador.ts
│       │   │   ├── chatbot.servico.ts
│       │   │   └── engine/
│       │   │       └── executor-fluxo.ts
│       │   │
│       │   ├── campanhas/
│       │   │
│       │   ├── templates-hsm/
│       │   │   ├── templates.controlador.ts
│       │   │   └── templates.servico.ts
│       │   │
│       │   ├── kanban/
│       │   │
│       │   ├── relatorios/
│       │   │
│       │   ├── sla/
│       │   │   ├── sla.servico.ts
│       │   │   └── sla.verificador.ts
│       │   │
│       │   ├── pesquisa-satisfacao/
│       │   │   ├── pesquisa.controlador.ts
│       │   │   └── pesquisa.servico.ts
│       │   │
│       │   └── configuracoes/
│       │
│       ├── compartilhado/
│       │   ├── erros/
│       │   │   ├── index.ts
│       │   │   ├── erro-base.ts
│       │   │   ├── erro-validacao.ts
│       │   │   ├── erro-nao-encontrado.ts
│       │   │   ├── erro-nao-autorizado.ts
│       │   │   └── erro-sem-permissao.ts
│       │   │
│       │   ├── middlewares/
│       │   │   ├── autenticacao.middleware.ts
│       │   │   ├── cliente-contexto.middleware.ts
│       │   │   └── tratador-erros.middleware.ts
│       │   │
│       │   ├── guardas/
│       │   │   ├── permissao.guarda.ts
│       │   │   └── licenca.guarda.ts
│       │   │
│       │   └── utilitarios/
│       │       ├── criptografia.ts
│       │       ├── formatadores.ts
│       │       └── logger.ts
│       │
│       ├── infraestrutura/
│       │   ├── banco/
│       │   │   └── prisma.servico.ts
│       │   ├── cache/
│       │   │   └── redis.servico.ts
│       │   ├── filas/
│       │   │   └── pgboss.servico.ts
│       │   └── armazenamento/
│       │       └── s3.servico.ts
│       │
│       ├── websocket/
│       │   ├── websocket.gateway.ts
│       │   └── eventos/
│       │       ├── conversa.eventos.ts
│       │       └── notificacao.eventos.ts
│       │
│       └── workers/
│           ├── index.ts
│           ├── mensagens.worker.ts
│           ├── campanhas.worker.ts
│           ├── sla.worker.ts
│           └── backups.worker.ts
│
│
├── web/                         # ========== FRONTEND ==========
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── Dockerfile
│   ├── index.html
│   │
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── rotas.tsx
│       │
│       ├── paginas/
│       │   ├── autenticacao/
│       │   │   ├── Entrar.tsx
│       │   │   └── EsqueciSenha.tsx
│       │   │
│       │   ├── painel/
│       │   │   └── Dashboard.tsx
│       │   │
│       │   ├── conversas/
│       │   │   └── Conversas.tsx
│       │   │
│       │   ├── contatos/
│       │   │   └── Contatos.tsx
│       │   │
│       │   ├── equipes/
│       │   │   └── Equipes.tsx
│       │   │
│       │   ├── chatbot/
│       │   │   ├── Fluxos.tsx
│       │   │   └── Editor.tsx
│       │   │
│       │   ├── campanhas/
│       │   │   └── Campanhas.tsx
│       │   │
│       │   ├── kanban/
│       │   │   └── Kanban.tsx
│       │   │
│       │   ├── relatorios/
│       │   │   └── Relatorios.tsx
│       │   │
│       │   ├── configuracoes/
│       │   │   └── Configuracoes.tsx
│       │   │
│       │   └── admin/
│       │       └── Clientes.tsx
│       │
│       ├── componentes/
│       │   ├── ui/                       # shadcn/ui
│       │   │   └── ...
│       │   │
│       │   ├── layout/
│       │   │   ├── LayoutPrincipal.tsx
│       │   │   ├── MenuLateral.tsx
│       │   │   └── Cabecalho.tsx
│       │   │
│       │   ├── conversas/
│       │   │   ├── ListaConversas.tsx
│       │   │   ├── ItemConversa.tsx
│       │   │   ├── AreaChat.tsx
│       │   │   └── EntradaMensagem.tsx
│       │   │
│       │   └── comum/
│       │       ├── Carregando.tsx
│       │       └── ErroMensagem.tsx
│       │
│       ├── hooks/
│       │   ├── useAutenticacao.ts
│       │   ├── useConversas.ts
│       │   └── useWebSocket.ts
│       │
│       ├── servicos/
│       │   ├── api.ts
│       │   ├── autenticacao.servico.ts
│       │   └── conversas.servico.ts
│       │
│       ├── stores/
│       │   ├── autenticacao.store.ts
│       │   └── ui.store.ts
│       │
│       ├── tipos/
│       │   ├── usuario.tipos.ts
│       │   ├── conversa.tipos.ts
│       │   └── api.tipos.ts
│       │
│       └── utilitarios/
│           ├── cn.ts
│           └── formatadores.ts
│
│
└── scripts/
    ├── backup-banco.sh
    └── deploy.sh
```

---

# 📏 REGRAS DE CÓDIGO (SEMPRE SEGUIR)

## 1. Limite de Linhas

```
✅ MÁXIMO 300 LINHAS por arquivo backend
✅ MÁXIMO 150 LINHAS por componente React
✅ Se passar, DIVIDIR em arquivos menores
```

## 2. Nomenclatura (Português)

```typescript
// ✅ Arquivos (kebab-case)
usuarios.controlador.ts
criar-usuario.dto.ts

// ✅ Componentes React (PascalCase)
ItemConversa.tsx
ListaConversas.tsx

// ✅ Hooks (camelCase com use)
useConversas.ts

// ✅ Variáveis e funções (camelCase)
const usuarioAtual = ...
const listarConversas = async () => ...

// ✅ Constantes (SCREAMING_SNAKE_CASE)
const MAX_TENTATIVAS_LOGIN = 5;

// ✅ Classes e Interfaces (PascalCase)
interface Usuario { ... }
class UsuariosServico { ... }

// ✅ Rotas da API (kebab-case)
POST /api/autenticacao/entrar
GET /api/conversas/:id/mensagens

// ✅ Tabelas do banco (snake_case, plural)
usuarios
conversas
mensagens_agendadas
```

## 3. Estrutura de Controller

```typescript
// usuarios.controlador.ts (máx 300 linhas)
import { FastifyInstance } from 'fastify';
import { usuariosServico } from './usuarios.servico';
import { criarUsuarioSchema } from './usuarios.schema';

export const usuariosControlador = async (app: FastifyInstance) => {
  
  app.get('/', {
    schema: listarUsuariosSchema,
    preHandler: [app.autenticar, app.verificarPermissao('usuarios:visualizar')],
  }, async (req, res) => {
    const resultado = await usuariosServico.listar(req.query);
    return res.status(200).send(resultado);
  });

  app.post('/', {
    schema: criarUsuarioSchema,
    preHandler: [app.autenticar, app.verificarPermissao('usuarios:criar')],
  }, async (req, res) => {
    const usuario = await usuariosServico.criar(req.body);
    return res.status(201).send(usuario);
  });
};
```

## 4. Estrutura de Service

```typescript
// usuarios.servico.ts (máx 300 linhas)
import { prisma } from '@/infraestrutura/banco/prisma.servico';
import { ErroValidacao } from '@/compartilhado/erros';
import { hashSenha } from '@/compartilhado/utilitarios/criptografia';

class UsuariosServico {
  
  async criar(dados: CriarUsuarioDTO) {
    await this.validarEmailUnico(dados.email, dados.clienteId);
    
    const senhaHash = await hashSenha(dados.senha);
    
    return prisma.usuario.create({
      data: { ...dados, senhaHash },
      select: this.camposPublicos,
    });
  }

  // ✅ NUNCA retornar senhaHash
  private camposPublicos = {
    id: true,
    nome: true,
    email: true,
    perfil: true,
    criadoEm: true,
  };

  private async validarEmailUnico(email: string, clienteId: string) {
    const existe = await prisma.usuario.findFirst({
      where: { email, clienteId },
    });
    if (existe) {
      throw new ErroValidacao('Email já cadastrado');
    }
  }
}

export const usuariosServico = new UsuariosServico();
```

## 5. Validação com Zod

```typescript
// usuarios.schema.ts
import { z } from 'zod';

export const criarUsuarioBodySchema = z.object({
  nome: z.string().min(2).max(100),
  email: z.string().email('Email inválido'),
  senha: z.string().min(8, 'Mínimo 8 caracteres'),
  perfilId: z.string().uuid(),
  equipeId: z.string().uuid().optional(),
});

export type CriarUsuarioDTO = z.infer<typeof criarUsuarioBodySchema>;
```

## 6. Tratamento de Erros

```typescript
// compartilhado/erros/erro-base.ts
export class ErroBase extends Error {
  constructor(
    public mensagem: string,
    public statusCode: number = 500,
    public codigo: string = 'ERRO_INTERNO',
  ) {
    super(mensagem);
  }
}

// erro-validacao.ts
export class ErroValidacao extends ErroBase {
  constructor(mensagem: string) {
    super(mensagem, 400, 'ERRO_VALIDACAO');
  }
}

// erro-nao-encontrado.ts
export class ErroNaoEncontrado extends ErroBase {
  constructor(mensagem: string) {
    super(mensagem, 404, 'NAO_ENCONTRADO');
  }
}

// erro-nao-autorizado.ts
export class ErroNaoAutorizado extends ErroBase {
  constructor(mensagem = 'Não autorizado') {
    super(mensagem, 401, 'NAO_AUTORIZADO');
  }
}

// erro-sem-permissao.ts
export class ErroSemPermissao extends ErroBase {
  constructor(mensagem = 'Sem permissão') {
    super(mensagem, 403, 'SEM_PERMISSAO');
  }
}
```

## 7. Componentes React

```tsx
// ItemConversa.tsx (máx 150 linhas)
import { memo } from 'react';
import { cn } from '@/utilitarios/cn';
import type { ConversaResumo } from '@/tipos/conversa.tipos';

interface ItemConversaProps {
  conversa: ConversaResumo;
  selecionada: boolean;
  onClick: () => void;
}

export const ItemConversa = memo(({ conversa, selecionada, onClick }: ItemConversaProps) => {
  const { contato, ultimaMensagem, naoLidas } = conversa;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full p-3 flex gap-3 hover:bg-muted/50',
        selecionada && 'bg-muted',
      )}
    >
      <div className="flex-1 min-w-0">
        <span className="font-medium truncate">{contato.nome}</span>
        <p className="text-sm text-muted-foreground truncate">
          {ultimaMensagem.conteudo}
        </p>
      </div>
      {naoLidas > 0 && (
        <span className="bg-primary text-white rounded-full px-2">{naoLidas}</span>
      )}
    </button>
  );
});

ItemConversa.displayName = 'ItemConversa';
```

## 8. Hooks Customizados

```typescript
// useConversas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { conversasServico } from '@/servicos/conversas.servico';

export const useConversas = (filtros: FiltrosConversa) => {
  return useQuery({
    queryKey: ['conversas', filtros],
    queryFn: () => conversasServico.listar(filtros),
    staleTime: 30 * 1000,
  });
};

export const useEnviarMensagem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: conversasServico.enviarMensagem,
    onSuccess: (_, { conversaId }) => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
    },
  });
};
```

## 9. Variáveis de Ambiente

```typescript
// configuracao/ambiente.ts
import { z } from 'zod';

const ambienteSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  S3_ENDPOINT: z.string().url(),
  S3_BUCKET: z.string(),
  S3_ACCESS_KEY: z.string(),
  S3_SECRET_KEY: z.string(),
  META_APP_ID: z.string(),
  META_APP_SECRET: z.string(),
  LICENSE_API_URL: z.string().url(),
  LICENSE_KEY: z.string(),
});

const resultado = ambienteSchema.safeParse(process.env);

if (!resultado.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  process.exit(1);
}

export const env = resultado.data;
```

---

# 🔒 REGRAS DE SEGURANÇA

```typescript
// ✅ bcrypt com custo 12
const CUSTO_BCRYPT = 12;
const senhaHash = await bcrypt.hash(senha, CUSTO_BCRYPT);

// ✅ Mensagem genérica para login
throw new ErroNaoAutorizado('Credenciais inválidas');

// ✅ JWT com payload mínimo
const payload = {
  sub: usuario.id,
  clienteId: usuario.clienteId,
  perfilId: usuario.perfilId,
};

// ✅ SEMPRE filtrar por clienteId
const conversas = await prisma.conversa.findMany({
  where: { clienteId: req.usuario.clienteId },
});

// ✅ SEMPRE validar com Zod
const dados = schema.parse(req.body);
```

---

# 📊 ORDEM DE DESENVOLVIMENTO

| Sprint | Semanas | Foco |
|--------|---------|------|
| 1-2 | 1-4 | Fundação (API + Web setup, Docker, Prisma) |
| 3-4 | 5-8 | Auth + Licenciamento + Permissões |
| 5-6 | 9-12 | Multi-tenant (Clientes, Usuários, Equipes) |
| 7-8 | 13-16 | Conexões WhatsApp + Templates HSM |
| 9-10 | 17-20 | Conversas Real-Time + WebSocket |
| 11-12 | 21-24 | Frontend (Layout, Inbox, Chat) |
| 13-14 | 25-28 | Chatbot + Automação |
| 15-16 | 29-32 | Campanhas + SLA + NPS |
| 17-18 | 33-36 | Kanban + PWA + Deploy |

---

# ✅ CHECKLIST ANTES DE CADA COMMIT

```
□ Arquivo tem menos de 300 linhas?
□ Componente React tem menos de 150 linhas?
□ Todos os tipos definidos (sem 'any')?
□ Validação Zod em todos os inputs?
□ Erros tratados com try/catch?
□ Sem console.log (usar logger)?
□ Sem valores hardcoded?
□ Multi-tenant respeitado (clienteId)?
□ ESLint sem erros?
```

---

# 🎯 DECISÕES TÉCNICAS FINAIS

| Decisão | Escolha |
|---------|---------|
| Estrutura | Simples (sem monorepo) |
| Filas | pg-boss (PostgreSQL) |
| Templates HSM | Sim |
| SLA | Habilitável por cliente |
| NPS/CSAT | Habilitável por cliente |
| Max linhas | 300 backend / 150 React |
| Deploy | EasyPanel |

---

*Use este prompt como referência durante todo o desenvolvimento.*
