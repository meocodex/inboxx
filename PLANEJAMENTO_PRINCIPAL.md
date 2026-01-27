# 🚀 CRM WhatsApp Omnichannel - Planejamento Completo (v2)

## 📋 Visão Geral do Projeto

**Nome do Projeto:** CRM WhatsApp Omnichannel  
**Modelo de Negócio:** SaaS com licenciamento mensal por IP do servidor  
**Arquitetura:** Multi-tenant (Super Admin → Clientes → Usuários)  
**Capacidade:** 100.000+ conversas/mês por cliente  

---

## 🏢 Arquitetura Multi-Tenant

### Hierarquia de Usuários

```
SUPER ADMIN (Você - Dono da Plataforma)
│
├── Gerencia licenças e clientes
├── Define planos e limites
├── Acessa métricas globais
│
└── CLIENTES (Licenciados)
    │
    ├── CLIENTE A (Licença Starter)
    │   ├── Admin do Cliente
    │   ├── Supervisores
    │   └── Atendentes
    │
    ├── CLIENTE B (Licença Professional)
    │   ├── Admin do Cliente
    │   ├── Supervisores
    │   └── Atendentes
    │
    └── CLIENTE C (Licença Enterprise)
        ├── Admin do Cliente
        ├── Supervisores
        └── Atendentes
```

### Isolamento de Dados

Cada cliente possui dados completamente isolados via **Row-Level Security (RLS)** do PostgreSQL:

- Conversas, mensagens, contatos
- Conexões WhatsApp/Instagram/Facebook
- Equipes e usuários
- Chatbots e campanhas
- Arquivos e mídia

---

## 🛠️ Stack Tecnológica Atualizada

### Backend (API Principal)

| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **Node.js** | 20+ LTS | Runtime estável, suporte longo prazo |
| **Fastify** | 4.x | 3x mais rápido que Express, ideal para alto volume |
| **TypeScript** | 5+ | Tipagem estática, menos bugs, melhor DX |
| **Prisma** | 5+ | ORM type-safe, migrations automáticas |
| **pg-boss** | 9+ | Filas robustas usando PostgreSQL |
| **Socket.io** | 4.x | WebSocket com fallback, rooms, broadcasting |

### Banco de Dados

| Tecnologia | Uso |
|------------|-----|
| **PostgreSQL 16** | Banco principal + Filas (pg-boss) |
| **Redis 7** | Cache de sessões + Pub/Sub Socket.io |

### Frontend (Dashboard)

| Tecnologia | Justificativa |
|------------|---------------|
| **React 18** | Ecossistema maduro, performance |
| **Vite 5** | Build rápido, HMR instantâneo |
| **TypeScript** | Consistência com backend |
| **TanStack Query v5** | Cache inteligente, real-time |
| **Zustand** | Estado global leve |
| **Tailwind CSS** | Estilização rápida |
| **shadcn/ui** | Componentes acessíveis |

### Infraestrutura

| Componente | Tecnologia |
|------------|------------|
| **Deploy** | EasyPanel |
| **Containers** | Docker |
| **Proxy** | Nginx (via EasyPanel) |
| **SSL** | Let's Encrypt (via EasyPanel) |
| **Storage** | AWS S3 / MinIO |
| **CI/CD** | GitHub Actions |

---

## 🗄️ Estrutura do Banco de Dados

### Diagrama Entidade-Relacionamento

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           MULTI-TENANT CORE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   planos     │         │   clientes   │         │   licencas   │        │
│  │              │────────▶│              │◀────────│              │        │
│  │ • nome       │         │ • nome       │         │ • chave      │        │
│  │ • preco      │         │ • email      │         │ • ip_servidor│        │
│  │ • limites    │         │ • plano_id   │         │ • expira_em  │        │
│  │ • recursos   │         │ • ativo      │         │ • cliente_id │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                   │                                         │
│                                   │ cliente_id (FK em todas as tabelas)    │
│                                   ▼                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              POR CLIENTE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   usuarios   │         │    equipes   │         │   conexoes   │        │
│  │              │────────▶│              │         │              │        │
│  │ • nome       │         │ • nome       │         │ • canal      │        │
│  │ • email      │         │ • descricao  │         │ • credenciais│        │
│  │ • perfil     │         │              │         │ • status     │        │
│  │ • equipe_id  │         │              │         │              │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│         │                                                  │                │
│         │                                                  │                │
│         ▼                                                  ▼                │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   contatos   │◀────────│  conversas   │─────────│  mensagens   │        │
│  │              │         │              │         │              │        │
│  │ • nome       │         │ • contato_id │         │ • conversa_id│        │
│  │ • telefone   │         │ • conexao_id │         │ • tipo       │        │
│  │ • email      │         │ • usuario_id │         │ • conteudo   │        │
│  │ • campos_*   │         │ • status     │         │ • midia_url  │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│         │                        │                                          │
│         ▼                        ▼                                          │
│  ┌──────────────┐         ┌──────────────┐                                 │
│  │  etiquetas   │         │ notas_internas│                                │
│  │              │         │              │                                 │
│  │ • nome       │         │ • conversa_id│                                 │
│  │ • cor        │         │ • usuario_id │                                 │
│  │              │         │ • texto      │                                 │
│  └──────────────┘         └──────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              AUTOMAÇÃO                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │ fluxos_chatbot│────────│ nos_chatbot  │         │respostas_rapidas│     │
│  │              │         │              │         │              │        │
│  │ • nome       │         │ • fluxo_id   │         │ • titulo     │        │
│  │ • gatilho    │         │ • tipo       │         │ • atalho     │        │
│  │ • ativo      │         │ • config     │         │ • conteudo   │        │
│  │              │         │ • proximo_id │         │              │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │  campanhas   │────────▶│ campanhas_log│         │ msg_agendadas│        │
│  │              │         │              │         │              │        │
│  │ • nome       │         │ • campanha_id│         │ • contato_id │        │
│  │ • template   │         │ • contato_id │         │ • conteudo   │        │
│  │ • status     │         │ • status     │         │ • agendar_para│       │
│  │ • filtros    │         │ • enviado_em │         │              │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              CRM / KANBAN                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   quadros    │────────▶│    colunas   │────────▶│   cartoes    │        │
│  │              │         │              │         │              │        │
│  │ • nome       │         │ • quadro_id  │         │ • coluna_id  │        │
│  │ • descricao  │         │ • nome       │         │ • contato_id │        │
│  │              │         │ • ordem      │         │ • titulo     │        │
│  │              │         │              │         │ • valor      │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                                                              │
│  ┌──────────────┐         ┌──────────────┐                                 │
│  │ compromissos │         │  lembretes   │                                 │
│  │              │         │              │                                 │
│  │ • titulo     │         │ • compromisso│                                 │
│  │ • data_hora  │         │ • enviar_em  │                                 │
│  │ • contato_id │         │ • enviado    │                                 │
│  └──────────────┘         └──────────────┘                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Schema Prisma (Principais Tabelas)

```prisma
// prisma/schema.prisma

// ==================== MULTI-TENANT ====================

model Plano {
  id            String    @id @default(uuid())
  nome          String    @unique
  preco_mensal  Decimal   @db.Decimal(10, 2)
  limites       Json      // { usuarios: 10, conexoes: 5, ... }
  recursos      Json      // { chatbot: true, campanhas: true, ... }
  ativo         Boolean   @default(true)
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  clientes      Cliente[]
  
  @@map("planos")
}

model Cliente {
  id            String    @id @default(uuid())
  nome          String
  email         String    @unique
  telefone      String?
  documento     String?   // CNPJ
  plano_id      String
  ativo         Boolean   @default(true)
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  plano         Plano     @relation(fields: [plano_id], references: [id])
  licencas      Licenca[]
  usuarios      Usuario[]
  equipes       Equipe[]
  conexoes      Conexao[]
  contatos      Contato[]
  conversas     Conversa[]
  etiquetas     Etiqueta[]
  fluxos_chatbot FluxoChatbot[]
  campanhas     Campanha[]
  quadros_kanban QuadroKanban[]
  
  @@map("clientes")
}

model Licenca {
  id              String    @id @default(uuid())
  cliente_id      String
  chave           String    @unique
  ip_servidor     String
  hostname        String?
  ativa           Boolean   @default(true)
  expira_em       DateTime
  ultima_verificacao DateTime?
  criado_em       DateTime  @default(now())
  atualizado_em   DateTime  @updatedAt
  
  cliente         Cliente   @relation(fields: [cliente_id], references: [id])
  
  @@map("licencas")
}

// ==================== USUÁRIOS E EQUIPES ====================

model Usuario {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  email         String
  senha_hash    String
  perfil        PerfilUsuario @default(ATENDENTE)
  equipe_id     String?
  avatar_url    String?
  online        Boolean   @default(false)
  ultimo_acesso DateTime?
  ativo         Boolean   @default(true)
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  equipe        Equipe?   @relation(fields: [equipe_id], references: [id])
  conversas_atribuidas Conversa[]
  notas_internas NotaInterna[]
  mensagens_enviadas Mensagem[]
  
  @@unique([cliente_id, email])
  @@map("usuarios")
}

enum PerfilUsuario {
  SUPER_ADMIN    // Dono da plataforma
  ADMIN_CLIENTE  // Admin do cliente
  SUPERVISOR     // Supervisor de equipe
  ATENDENTE      // Atendente comum
}

model Equipe {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  descricao     String?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  membros       Usuario[]
  conversas     Conversa[]
  
  @@unique([cliente_id, nome])
  @@map("equipes")
}

// ==================== CONEXÕES ====================

model Conexao {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  canal         CanalConexao
  provedor      ProvedorConexao
  credenciais   Json      // Criptografado
  configuracoes Json?
  status        StatusConexao @default(DESCONECTADO)
  ultimo_status DateTime?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  conversas     Conversa[]
  
  @@map("conexoes")
}

enum CanalConexao {
  WHATSAPP
  INSTAGRAM
  FACEBOOK
}

enum ProvedorConexao {
  META_API      // WhatsApp Cloud API oficial
  UAIZAP        // UaiZap
  GRAPH_API     // Instagram/Facebook
}

enum StatusConexao {
  CONECTADO
  DESCONECTADO
  RECONECTANDO
  ERRO
}

// ==================== CONTATOS ====================

model Contato {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String?
  telefone      String
  email         String?
  foto_url      String?
  campos_personalizados Json?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  etiquetas     ContatoEtiqueta[]
  conversas     Conversa[]
  cartoes_kanban CartaoKanban[]
  compromissos  Compromisso[]
  
  @@unique([cliente_id, telefone])
  @@map("contatos")
}

model Etiqueta {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  cor           String    @default("#3B82F6")
  criado_em     DateTime  @default(now())
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  contatos      ContatoEtiqueta[]
  
  @@unique([cliente_id, nome])
  @@map("etiquetas")
}

model ContatoEtiqueta {
  contato_id    String
  etiqueta_id   String
  adicionado_em DateTime  @default(now())
  
  contato       Contato   @relation(fields: [contato_id], references: [id])
  etiqueta      Etiqueta  @relation(fields: [etiqueta_id], references: [id])
  
  @@id([contato_id, etiqueta_id])
  @@map("contatos_etiquetas")
}

// ==================== CONVERSAS ====================

model Conversa {
  id            String    @id @default(uuid())
  cliente_id    String
  contato_id    String
  conexao_id    String
  usuario_id    String?   // Atendente atribuído
  equipe_id     String?   // Equipe atribuída
  status        StatusConversa @default(ABERTA)
  ultima_mensagem_em DateTime?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  contato       Contato   @relation(fields: [contato_id], references: [id])
  conexao       Conexao   @relation(fields: [conexao_id], references: [id])
  usuario       Usuario?  @relation(fields: [usuario_id], references: [id])
  equipe        Equipe?   @relation(fields: [equipe_id], references: [id])
  mensagens     Mensagem[]
  notas_internas NotaInterna[]
  
  @@index([cliente_id, status])
  @@index([cliente_id, ultima_mensagem_em])
  @@map("conversas")
}

enum StatusConversa {
  ABERTA
  EM_ATENDIMENTO
  AGUARDANDO
  RESOLVIDA
  ARQUIVADA
}

model Mensagem {
  id            String    @id @default(uuid())
  conversa_id   String
  direcao       DirecaoMensagem
  tipo          TipoMensagem
  conteudo      String?
  midia_url     String?
  midia_tipo    String?
  midia_nome    String?
  id_externo    String?   // ID da mensagem no WhatsApp/Instagram
  status        StatusMensagem @default(ENVIADA)
  enviado_por   String?   // usuario_id se enviado por atendente
  enviado_em    DateTime  @default(now())
  entregue_em   DateTime?
  lido_em       DateTime?
  
  conversa      Conversa  @relation(fields: [conversa_id], references: [id])
  usuario       Usuario?  @relation(fields: [enviado_por], references: [id])
  
  @@index([conversa_id, enviado_em])
  @@map("mensagens")
}

enum DirecaoMensagem {
  ENTRADA   // Recebida do contato
  SAIDA     // Enviada para o contato
}

enum TipoMensagem {
  TEXTO
  IMAGEM
  AUDIO
  VIDEO
  DOCUMENTO
  LOCALIZACAO
  CONTATO
  STICKER
  REACAO
}

enum StatusMensagem {
  PENDENTE
  ENVIADA
  ENTREGUE
  LIDA
  ERRO
}

model NotaInterna {
  id            String    @id @default(uuid())
  conversa_id   String
  usuario_id    String
  texto         String
  criado_em     DateTime  @default(now())
  
  conversa      Conversa  @relation(fields: [conversa_id], references: [id])
  usuario       Usuario   @relation(fields: [usuario_id], references: [id])
  
  @@map("notas_internas")
}

// ==================== CHATBOT ====================

model FluxoChatbot {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  descricao     String?
  gatilho       Json      // { tipo: 'palavra_chave', valor: ['oi', 'olá'] }
  ativo         Boolean   @default(false)
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  nos           NoChatbot[]
  
  @@map("fluxos_chatbot")
}

model NoChatbot {
  id            String    @id @default(uuid())
  fluxo_id      String
  tipo          TipoNoChatbot
  nome          String?
  configuracao  Json
  posicao_x     Int       @default(0)
  posicao_y     Int       @default(0)
  proximo_no_id String?
  
  fluxo         FluxoChatbot @relation(fields: [fluxo_id], references: [id])
  
  @@map("nos_chatbot")
}

enum TipoNoChatbot {
  INICIO
  MENSAGEM
  PERGUNTA
  CONDICAO
  DELAY
  WEBHOOK
  ATRIBUIR_TAG
  TRANSFERIR_HUMANO
  FIM
}

model RespostaRapida {
  id            String    @id @default(uuid())
  cliente_id    String
  titulo        String
  atalho        String    // /saudacao
  conteudo      String
  categoria     String?
  anexo_url     String?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  @@unique([cliente_id, atalho])
  @@map("respostas_rapidas")
}

// ==================== CAMPANHAS ====================

model Campanha {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  template      String    // Conteúdo da mensagem
  midia_url     String?
  filtros       Json?     // Filtros de contatos
  status        StatusCampanha @default(RASCUNHO)
  agendado_para DateTime?
  intervalo_ms  Int       @default(3000) // Intervalo entre mensagens
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  iniciado_em   DateTime?
  finalizado_em DateTime?
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  logs          CampanhaLog[]
  
  @@map("campanhas")
}

enum StatusCampanha {
  RASCUNHO
  AGENDADA
  EM_ANDAMENTO
  PAUSADA
  CONCLUIDA
  CANCELADA
}

model CampanhaLog {
  id            String    @id @default(uuid())
  campanha_id   String
  contato_id    String
  status        StatusEnvioCampanha @default(PENDENTE)
  erro          String?
  enviado_em    DateTime?
  
  campanha      Campanha  @relation(fields: [campanha_id], references: [id])
  
  @@index([campanha_id, status])
  @@map("campanhas_log")
}

enum StatusEnvioCampanha {
  PENDENTE
  ENVIADO
  ENTREGUE
  LIDO
  ERRO
}

model MensagemAgendada {
  id            String    @id @default(uuid())
  cliente_id    String
  contato_id    String
  conexao_id    String
  conteudo      String
  midia_url     String?
  agendar_para  DateTime
  status        StatusMensagemAgendada @default(PENDENTE)
  enviada_em    DateTime?
  criado_em     DateTime  @default(now())
  
  @@index([agendar_para, status])
  @@map("mensagens_agendadas")
}

enum StatusMensagemAgendada {
  PENDENTE
  ENVIADA
  CANCELADA
  ERRO
}

// ==================== KANBAN ====================

model QuadroKanban {
  id            String    @id @default(uuid())
  cliente_id    String
  nome          String
  descricao     String?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  cliente       Cliente   @relation(fields: [cliente_id], references: [id])
  colunas       ColunaKanban[]
  
  @@map("quadros_kanban")
}

model ColunaKanban {
  id            String    @id @default(uuid())
  quadro_id     String
  nome          String
  cor           String    @default("#3B82F6")
  ordem         Int       @default(0)
  
  quadro        QuadroKanban @relation(fields: [quadro_id], references: [id])
  cartoes       CartaoKanban[]
  
  @@map("colunas_kanban")
}

model CartaoKanban {
  id            String    @id @default(uuid())
  coluna_id     String
  contato_id    String?
  titulo        String
  descricao     String?
  valor         Decimal?  @db.Decimal(10, 2)
  ordem         Int       @default(0)
  data_limite   DateTime?
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  coluna        ColunaKanban @relation(fields: [coluna_id], references: [id])
  contato       Contato?  @relation(fields: [contato_id], references: [id])
  
  @@map("cartoes_kanban")
}

// ==================== AGENDA ====================

model Compromisso {
  id            String    @id @default(uuid())
  cliente_id    String
  contato_id    String?
  titulo        String
  descricao     String?
  data_hora     DateTime
  duracao_min   Int       @default(30)
  lembrete_min  Int?      // Minutos antes para lembrete
  criado_em     DateTime  @default(now())
  atualizado_em DateTime  @updatedAt
  
  contato       Contato?  @relation(fields: [contato_id], references: [id])
  lembretes     Lembrete[]
  
  @@index([cliente_id, data_hora])
  @@map("compromissos")
}

model Lembrete {
  id              String    @id @default(uuid())
  compromisso_id  String
  enviar_em       DateTime
  enviado         Boolean   @default(false)
  enviado_em      DateTime?
  
  compromisso     Compromisso @relation(fields: [compromisso_id], references: [id])
  
  @@index([enviar_em, enviado])
  @@map("lembretes")
}
```

---

## 📁 Estrutura de Pastas do Projeto

```
crm-whatsapp/
│
├── aplicacoes/
│   │
│   ├── api/                          # Backend Fastify
│   │   ├── src/
│   │   │   ├── modulos/
│   │   │   │   ├── autenticacao/
│   │   │   │   │   ├── autenticacao.controlador.ts
│   │   │   │   │   ├── autenticacao.servico.ts
│   │   │   │   │   ├── autenticacao.rotas.ts
│   │   │   │   │   └── dto/
│   │   │   │   │       ├── entrar.dto.ts
│   │   │   │   │       └── registrar.dto.ts
│   │   │   │   │
│   │   │   │   ├── clientes/         # Multi-tenant
│   │   │   │   │   ├── clientes.controlador.ts
│   │   │   │   │   ├── clientes.servico.ts
│   │   │   │   │   └── clientes.rotas.ts
│   │   │   │   │
│   │   │   │   ├── licencas/
│   │   │   │   │   ├── licencas.controlador.ts
│   │   │   │   │   ├── licencas.servico.ts
│   │   │   │   │   └── validador-licenca.ts
│   │   │   │   │
│   │   │   │   ├── conexoes/
│   │   │   │   │   ├── conexoes.controlador.ts
│   │   │   │   │   ├── conexoes.servico.ts
│   │   │   │   │   ├── provedores/
│   │   │   │   │   │   ├── meta-api.provedor.ts
│   │   │   │   │   │   ├── uaizap.provedor.ts
│   │   │   │   │   │   └── instagram.provedor.ts
│   │   │   │   │   └── webhooks/
│   │   │   │   │       ├── meta.webhook.ts
│   │   │   │   │       └── uaizap.webhook.ts
│   │   │   │   │
│   │   │   │   ├── conversas/
│   │   │   │   │   ├── conversas.controlador.ts
│   │   │   │   │   ├── conversas.servico.ts
│   │   │   │   │   └── mensagens.servico.ts
│   │   │   │   │
│   │   │   │   ├── contatos/
│   │   │   │   │   ├── contatos.controlador.ts
│   │   │   │   │   ├── contatos.servico.ts
│   │   │   │   │   └── etiquetas.servico.ts
│   │   │   │   │
│   │   │   │   ├── equipes/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── campanhas/
│   │   │   │   ├── kanban/
│   │   │   │   ├── agenda/
│   │   │   │   ├── relatorios/
│   │   │   │   └── configuracoes/
│   │   │   │
│   │   │   ├── compartilhado/
│   │   │   │   ├── utilitarios/
│   │   │   │   │   ├── criptografia.ts
│   │   │   │   │   ├── validadores.ts
│   │   │   │   │   └── formatadores.ts
│   │   │   │   ├── middlewares/
│   │   │   │   │   ├── autenticacao.middleware.ts
│   │   │   │   │   ├── cliente-contexto.middleware.ts
│   │   │   │   │   └── limite-taxa.middleware.ts
│   │   │   │   ├── guardas/
│   │   │   │   │   ├── perfil.guarda.ts
│   │   │   │   │   └── licenca.guarda.ts
│   │   │   │   └── decoradores/
│   │   │   │       └── cliente-atual.decorador.ts
│   │   │   │
│   │   │   ├── infraestrutura/
│   │   │   │   ├── banco/
│   │   │   │   │   └── prisma.servico.ts
│   │   │   │   ├── cache/
│   │   │   │   │   └── redis.servico.ts
│   │   │   │   ├── armazenamento/
│   │   │   │   │   └── s3.servico.ts
│   │   │   │   └── filas/
│   │   │   │       └── pgboss.servico.ts
│   │   │   │
│   │   │   ├── websocket/
│   │   │   │   ├── websocket.gateway.ts
│   │   │   │   └── eventos/
│   │   │   │       ├── conversa.eventos.ts
│   │   │   │       └── notificacao.eventos.ts
│   │   │   │
│   │   │   └── workers/
│   │   │       ├── mensagens.worker.ts
│   │   │       ├── campanhas.worker.ts
│   │   │       ├── agendamentos.worker.ts
│   │   │       └── backups.worker.ts
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   │
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── web/                          # Frontend React (Dashboard)
│   │   ├── src/
│   │   │   ├── paginas/
│   │   │   │   ├── autenticacao/
│   │   │   │   │   ├── Entrar.tsx
│   │   │   │   │   └── EsqueciSenha.tsx
│   │   │   │   ├── painel/
│   │   │   │   │   └── Dashboard.tsx
│   │   │   │   ├── conversas/
│   │   │   │   │   ├── ListaConversas.tsx
│   │   │   │   │   └── Chat.tsx
│   │   │   │   ├── contatos/
│   │   │   │   ├── equipes/
│   │   │   │   ├── chatbot/
│   │   │   │   ├── campanhas/
│   │   │   │   ├── kanban/
│   │   │   │   ├── relatorios/
│   │   │   │   └── configuracoes/
│   │   │   │
│   │   │   ├── componentes/
│   │   │   │   ├── comum/
│   │   │   │   │   ├── Botao.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── Modal.tsx
│   │   │   │   │   └── Tabela.tsx
│   │   │   │   ├── layout/
│   │   │   │   │   ├── LayoutPrincipal.tsx
│   │   │   │   │   ├── MenuLateral.tsx
│   │   │   │   │   └── Cabecalho.tsx
│   │   │   │   └── conversas/
│   │   │   │       ├── ItemConversa.tsx
│   │   │   │       ├── BolhaMensagem.tsx
│   │   │   │       └── EntradaMensagem.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAutenticacao.ts
│   │   │   │   ├── useConversas.ts
│   │   │   │   └── useWebSocket.ts
│   │   │   │
│   │   │   ├── servicos/
│   │   │   │   ├── api.ts
│   │   │   │   ├── autenticacao.servico.ts
│   │   │   │   └── conversas.servico.ts
│   │   │   │
│   │   │   ├── stores/
│   │   │   │   ├── autenticacao.store.ts
│   │   │   │   └── conversas.store.ts
│   │   │   │
│   │   │   └── tipos/
│   │   │       ├── cliente.tipos.ts
│   │   │       ├── conversa.tipos.ts
│   │   │       └── usuario.tipos.ts
│   │   │
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── pwa/                          # PWA Atendimento (Simplificado)
│       └── ...
│
├── pacotes/                          # Pacotes compartilhados
│   ├── tipos/                        # TypeScript types
│   └── utilitarios/                  # Funções utilitárias
│
├── easypanel/
│   └── docker-compose.yml            # Configuração para EasyPanel
│
├── scripts/
│   ├── backup-banco.sh
│   ├── backup-midias.sh
│   └── deploy.sh
│
├── documentacao/
│   ├── api/
│   └── arquitetura/
│
├── turbo.json
├── pnpm-workspace.yaml
└── README.md
```

---

## 🚀 Configuração EasyPanel

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: crm_whatsapp
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./aplicacoes/api
      dockerfile: Dockerfile
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/crm_whatsapp
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      S3_ENDPOINT: ${S3_ENDPOINT}
      S3_BUCKET: ${S3_BUCKET}
      S3_ACCESS_KEY: ${S3_ACCESS_KEY}
      S3_SECRET_KEY: ${S3_SECRET_KEY}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/saude"]
      interval: 30s
      timeout: 10s
      retries: 3

  workers:
    build:
      context: ./aplicacoes/api
      dockerfile: Dockerfile.workers
    restart: always
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/crm_whatsapp
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy

  web:
    build:
      context: ./aplicacoes/web
      dockerfile: Dockerfile
    restart: always
    depends_on:
      - api

volumes:
  postgres_data:
  redis_data:
```

---

## 📊 Cronograma Atualizado

| Fase | Módulos | Duração |
|------|---------|---------|
| **1** | Setup + Multi-tenant + Auth + Licenças | 3-4 sem |
| **2** | Conexões (Meta API + UaiZap) | 3-4 sem |
| **3** | Conversas Real-Time + Contatos | 4-5 sem |
| **4** | Frontend Dashboard | 4-5 sem |
| **5** | Chatbot + Automação | 4-5 sem |
| **6** | Campanhas + Agendamentos | 3-4 sem |
| **7** | Equipes + Relatórios | 3-4 sem |
| **8** | Kanban + Agenda | 3-4 sem |
| **9** | PWA + Deploy EasyPanel | 3-4 sem |

**Total Estimado:** 30-40 semanas (7-10 meses)

---

*Documento atualizado com especificações multi-tenant, nomenclatura em português e EasyPanel*
