# 📊 Fluxogramas do Sistema - CRM WhatsApp Omnichannel

## 1. Fluxo de Desenvolvimento (Fases)

```mermaid
flowchart TB
    subgraph FASE1["🔧 FASE 1 - Fundação (3-4 sem)"]
        A1[Setup Monorepo<br/>pnpm + Turborepo] --> A2[Configurar EasyPanel<br/>Docker Compose]
        A2 --> A3[Schema Prisma<br/>Multi-tenant]
        A3 --> A4[Módulo Autenticação<br/>JWT + Perfis]
        A4 --> A5[Módulo Licenças<br/>Validação IP]
        A5 --> A6[Módulo Clientes<br/>CRUD + Planos]
    end

    subgraph FASE2["📡 FASE 2 - Conexões (3-4 sem)"]
        B1[Meta API Cloud<br/>WhatsApp Oficial] --> B2[UaiZap<br/>WebSocket + REST]
        B2 --> B3[Instagram<br/>Graph API]
        B3 --> B4[Facebook<br/>Messenger API]
        B4 --> B5[Webhooks<br/>Recebimento]
    end

    subgraph FASE3["💬 FASE 3 - Conversas (4-5 sem)"]
        C1[Módulo Conversas<br/>CRUD] --> C2[Módulo Mensagens<br/>Envio/Recebimento]
        C2 --> C3[Socket.io<br/>Real-Time]
        C3 --> C4[Upload Mídia<br/>S3]
        C4 --> C5[Módulo Contatos<br/>Etiquetas]
    end

    subgraph FASE4["🖥️ FASE 4 - Frontend (4-5 sem)"]
        D1[Layout Principal<br/>Menu + Cabecalho] --> D2[Tela Login<br/>Autenticação]
        D2 --> D3[Dashboard<br/>Métricas]
        D3 --> D4[Inbox<br/>Lista Conversas]
        D4 --> D5[Chat<br/>Interface Completa]
    end

    subgraph FASE5["🤖 FASE 5 - Automação (4-5 sem)"]
        E1[Flow Builder<br/>Editor Visual] --> E2[Engine Chatbot<br/>Processamento]
        E2 --> E3[Respostas Rápidas<br/>Atalhos]
    end

    subgraph FASE6["📢 FASE 6 - Marketing (3-4 sem)"]
        F1[Campanhas<br/>Disparo em Massa] --> F2[Agendamentos<br/>Individual/Grupo]
        F2 --> F3[Mensagens Recorrentes]
    end

    subgraph FASE7["👥 FASE 7 - Equipes (3-4 sem)"]
        G1[Gestão Equipes<br/>Membros] --> G2[Perfis e Permissões]
        G2 --> G3[Relatórios<br/>Analytics]
    end

    subgraph FASE8["📋 FASE 8 - CRM (3-4 sem)"]
        H1[Kanban<br/>Quadros] --> H2[Pipeline<br/>Vendas]
        H2 --> H3[Agenda<br/>Compromissos]
    end

    subgraph FASE9["📱 FASE 9 - Deploy (3-4 sem)"]
        I1[PWA<br/>Atendimento Mobile] --> I2[Backups<br/>Automáticos]
        I2 --> I3[Deploy EasyPanel<br/>Produção]
    end

    FASE1 --> FASE2
    FASE2 --> FASE3
    FASE3 --> FASE4
    FASE4 --> FASE5
    FASE5 --> FASE6
    FASE6 --> FASE7
    FASE7 --> FASE8
    FASE8 --> FASE9

    style FASE1 fill:#e8f5e9,stroke:#4caf50
    style FASE2 fill:#e3f2fd,stroke:#2196f3
    style FASE3 fill:#fff3e0,stroke:#ff9800
    style FASE4 fill:#f3e5f5,stroke:#9c27b0
    style FASE5 fill:#e0f2f1,stroke:#009688
    style FASE6 fill:#fce4ec,stroke:#e91e63
    style FASE7 fill:#ede7f6,stroke:#673ab7
    style FASE8 fill:#fff8e1,stroke:#ffc107
    style FASE9 fill:#eceff1,stroke:#607d8b
```

---

## 2. Arquitetura Multi-Tenant

```mermaid
flowchart TB
    subgraph SUPER_ADMIN["👑 SUPER ADMIN (Você)"]
        SA[Painel Super Admin]
        SA --> |Gerencia| CLIENTES
        SA --> |Gerencia| PLANOS
        SA --> |Gerencia| LICENCAS
        SA --> |Visualiza| METRICAS_GLOBAIS
    end

    subgraph PLANOS["📦 Planos"]
        P1[Starter<br/>R$ 197/mês]
        P2[Professional<br/>R$ 497/mês]
        P3[Enterprise<br/>R$ 997/mês]
    end

    subgraph LICENCAS["🔑 Licenças"]
        L1[Validação por IP]
        L2[Limites por Plano]
        L3[Expiração Mensal]
    end

    subgraph CLIENTES["🏢 Clientes"]
        direction TB
        C1[Cliente A<br/>Starter]
        C2[Cliente B<br/>Professional]
        C3[Cliente C<br/>Enterprise]
    end

    subgraph CLIENTE_DADOS["📊 Dados Isolados (RLS)"]
        D1[Usuários]
        D2[Equipes]
        D3[Conexões]
        D4[Conversas]
        D5[Contatos]
        D6[Campanhas]
    end

    CLIENTES --> CLIENTE_DADOS

    style SUPER_ADMIN fill:#ffd700,stroke:#b8860b
    style PLANOS fill:#e3f2fd,stroke:#2196f3
    style LICENCAS fill:#fff3e0,stroke:#ff9800
    style CLIENTES fill:#e8f5e9,stroke:#4caf50
    style CLIENTE_DADOS fill:#f3e5f5,stroke:#9c27b0
```

---

## 3. Fluxo de Validação de Licença

```mermaid
flowchart TB
    subgraph SERVIDOR_CLIENTE["🖥️ Servidor do Cliente"]
        INICIO[Aplicação Inicia] --> COLETA[Coleta IP do Servidor]
        COLETA --> CACHE{Cache de<br/>Licença Válido?}
        CACHE -->|Sim e < 24h| BOOT[✅ Iniciar Sistema]
        CACHE -->|Não ou Expirado| VALIDA[Validar com API]
    end

    subgraph API_LICENCAS["🔐 API de Licenças"]
        VALIDA --> RECEBE[Recebe Request]
        RECEBE --> VERIFICA_CHAVE{Chave<br/>Válida?}
        VERIFICA_CHAVE -->|Não| REJEITA[❌ Rejeitar]
        VERIFICA_CHAVE -->|Sim| VERIFICA_IP{IP<br/>Autorizado?}
        VERIFICA_IP -->|Não| REJEITA
        VERIFICA_IP -->|Sim| VERIFICA_EXPIRACAO{Licença<br/>Expirada?}
        VERIFICA_EXPIRACAO -->|Sim| REJEITA
        VERIFICA_EXPIRACAO -->|Não| VERIFICA_LIMITES{Dentro dos<br/>Limites?}
        VERIFICA_LIMITES -->|Não| MODO_LIMITADO[⚠️ Modo Limitado]
        VERIFICA_LIMITES -->|Sim| APROVA[✅ Aprovar]
    end

    subgraph RESPOSTA["📤 Resposta"]
        APROVA --> RETORNA[Retorna Config + Limites]
        RETORNA --> CACHEIA[Cacheia por 24h]
        CACHEIA --> BOOT
        REJEITA --> BLOQUEIA[🚫 Bloquear Sistema]
        MODO_LIMITADO --> AVISO[Exibir Aviso<br/>no Dashboard]
    end

    subgraph CRON["⏰ Verificação Periódica"]
        JOB[Job 24h] --> VALIDA
    end

    style SERVIDOR_CLIENTE fill:#e8f5e9,stroke:#4caf50
    style API_LICENCAS fill:#fff3e0,stroke:#ff9800
    style RESPOSTA fill:#e3f2fd,stroke:#2196f3
    style CRON fill:#f3e5f5,stroke:#9c27b0
```

---

## 4. Fluxo de Atendimento Real-Time

```mermaid
flowchart LR
    subgraph CANAIS["📱 Canais de Entrada"]
        WA_META[WhatsApp<br/>API Meta]
        WA_UAIZAP[WhatsApp<br/>UaiZap]
        IG[Instagram<br/>Direct]
        FB[Facebook<br/>Messenger]
    end

    subgraph WEBHOOKS["🔗 Webhooks"]
        WH[Fastify<br/>Webhook Handler]
    end

    subgraph PROCESSAMENTO["⚙️ Processamento"]
        FILA[pg-boss<br/>Fila PostgreSQL]
        WORKER[Worker<br/>Processa Mensagem]
        CHATBOT[Engine<br/>Chatbot]
    end

    subgraph ARMAZENAMENTO["💾 Armazenamento"]
        PG[(PostgreSQL<br/>Conversas + Filas)]
        RD[(Redis<br/>Cache + Pub/Sub)]
        S3[(S3<br/>Mídia)]
    end

    subgraph REALTIME["⚡ Real-Time"]
        SOCKET[Socket.io<br/>Server]
        PUBSUB[Redis<br/>Pub/Sub]
    end

    subgraph CLIENTES_UI["👥 Interfaces"]
        WEB[Dashboard<br/>React]
        PWA[PWA<br/>Mobile]
    end

    WA_META --> WH
    WA_UAIZAP --> WH
    IG --> WH
    FB --> WH

    WH --> FILA
    FILA --> WORKER
    WORKER --> CHATBOT
    WORKER --> PG
    WORKER --> S3
    WORKER --> PUBSUB

    PUBSUB --> SOCKET
    PG --> RD

    SOCKET --> WEB
    SOCKET --> PWA
    RD --> WEB
    RD --> PWA

    style CANAIS fill:#e3f2fd,stroke:#2196f3
    style WEBHOOKS fill:#fff3e0,stroke:#ff9800
    style PROCESSAMENTO fill:#f3e5f5,stroke:#9c27b0
    style ARMAZENAMENTO fill:#e8f5e9,stroke:#4caf50
    style REALTIME fill:#fce4ec,stroke:#e91e63
    style CLIENTES_UI fill:#e0f2f1,stroke:#009688
```

---

## 5. Fluxo do Engine de Chatbot

```mermaid
flowchart TB
    subgraph ENTRADA["📥 Entrada"]
        MSG[Mensagem<br/>Recebida]
    end

    subgraph ANALISE["🔍 Análise"]
        MSG --> BOT_ATIVO{Chatbot<br/>Ativo?}
        BOT_ATIVO -->|Não| FILA_HUMANO[→ Fila Atendimento<br/>Humano]
        BOT_ATIVO -->|Sim| EM_FLUXO{Conversa em<br/>Fluxo Ativo?}
        EM_FLUXO -->|Sim| CONTINUA[Continuar<br/>Fluxo Atual]
        EM_FLUXO -->|Não| BUSCA_GATILHO[Buscar<br/>Gatilho Match]
    end

    subgraph ENGINE["⚙️ Engine de Fluxo"]
        BUSCA_GATILHO --> MATCH{Match<br/>Encontrado?}
        MATCH -->|Não| FLUXO_PADRAO[Fluxo<br/>Padrão]
        MATCH -->|Sim| INICIA_FLUXO[Iniciar<br/>Fluxo]
        FLUXO_PADRAO --> EXECUTA
        INICIA_FLUXO --> EXECUTA
        CONTINUA --> EXECUTA[Executar<br/>Nó Atual]
    end

    subgraph TIPOS_NOS["📦 Tipos de Nós"]
        EXECUTA --> TIPO{Tipo do<br/>Nó?}
        TIPO -->|Mensagem| ENVIA[Enviar<br/>Mensagem]
        TIPO -->|Pergunta| AGUARDA[Aguardar<br/>Resposta]
        TIPO -->|Condição| AVALIA[Avaliar<br/>Condição]
        TIPO -->|Webhook| CHAMA_API[Chamar<br/>API Externa]
        TIPO -->|Transferir| TRANSFERE[Transferir<br/>p/ Humano]
        TIPO -->|Delay| ESPERA[Aguardar<br/>Tempo]
        TIPO -->|Tag| APLICA_TAG[Aplicar<br/>Etiqueta]
    end

    subgraph PROXIMO["➡️ Próximo Passo"]
        ENVIA --> TEM_PROXIMO{Tem<br/>Próximo?}
        AGUARDA --> SALVA[Salvar Estado<br/>da Conversa]
        AVALIA --> BRANCH[Seguir<br/>Branch]
        CHAMA_API --> TEM_PROXIMO
        ESPERA --> TEM_PROXIMO
        APLICA_TAG --> TEM_PROXIMO
        BRANCH --> EXECUTA
        TEM_PROXIMO -->|Sim| EXECUTA
        TEM_PROXIMO -->|Não| FIM[Fim do<br/>Fluxo]
        TRANSFERE --> FILA_HUMANO
    end

    style ENTRADA fill:#e3f2fd,stroke:#2196f3
    style ANALISE fill:#fff3e0,stroke:#ff9800
    style ENGINE fill:#e8f5e9,stroke:#4caf50
    style TIPOS_NOS fill:#f3e5f5,stroke:#9c27b0
    style PROXIMO fill:#fce4ec,stroke:#e91e63
```

---

## 6. Fluxo de Filas com pg-boss

```mermaid
flowchart TB
    subgraph PRODUTORES["📤 Produtores de Jobs"]
        P1[Webhook<br/>Mensagem Recebida]
        P2[API<br/>Enviar Mensagem]
        P3[Campanha<br/>Disparo]
        P4[Agendador<br/>Mensagem Agendada]
        P5[Sistema<br/>Backup]
    end

    subgraph PGBOSS["🐘 pg-boss (PostgreSQL)"]
        direction TB
        Q1[(Fila: enviar-mensagem)]
        Q2[(Fila: processar-webhook)]
        Q3[(Fila: executar-campanha)]
        Q4[(Fila: backup-banco)]
        Q5[(Fila: validar-licenca)]
        
        SCHEDULER[Scheduler<br/>Jobs Agendados]
    end

    subgraph WORKERS["⚙️ Workers"]
        W1[Worker<br/>Mensagens]
        W2[Worker<br/>Webhooks]
        W3[Worker<br/>Campanhas]
        W4[Worker<br/>Sistema]
    end

    subgraph RESULTADO["📊 Resultado"]
        OK[✅ Sucesso]
        ERRO[❌ Erro]
        RETRY[🔄 Retry<br/>Backoff Exponencial]
    end

    P1 --> Q2
    P2 --> Q1
    P3 --> Q3
    P4 --> SCHEDULER
    P5 --> Q4

    Q1 --> W1
    Q2 --> W2
    Q3 --> W3
    Q4 --> W4
    Q5 --> W4

    W1 --> OK
    W1 --> ERRO
    ERRO --> RETRY
    RETRY --> Q1

    style PRODUTORES fill:#e3f2fd,stroke:#2196f3
    style PGBOSS fill:#e8f5e9,stroke:#4caf50
    style WORKERS fill:#fff3e0,stroke:#ff9800
    style RESULTADO fill:#f3e5f5,stroke:#9c27b0
```

---

## 7. Fluxo de Backup Automático

```mermaid
flowchart TB
    subgraph AGENDAMENTOS["⏰ Agendamentos"]
        CRON_DIARIO[Cron Diário<br/>02:00]
        CRON_SEMANAL[Cron Semanal<br/>Domingo 03:00]
        MANUAL[Manual<br/>via Dashboard]
    end

    subgraph BACKUP_BANCO["🗄️ Backup PostgreSQL"]
        CRON_DIARIO --> PGDUMP[pg_dump<br/>Database]
        CRON_SEMANAL --> PGDUMP
        MANUAL --> PGDUMP
        PGDUMP --> COMPRIME[Comprimir<br/>gzip]
        COMPRIME --> CRIPTOGRAFA[Criptografar<br/>AES-256]
    end

    subgraph BACKUP_MIDIA["📁 Backup Mídia"]
        CRON_DIARIO --> SYNC[Sync Incremental<br/>S3]
        SYNC --> VERSIONA[Versionamento]
    end

    subgraph DESTINO["☁️ Destino S3"]
        CRIPTOGRAFA --> S3_DB[S3: /backups/banco/]
        VERSIONA --> S3_MIDIA[S3: /backups/midia/]
    end

    subgraph RETENCAO["🗑️ Política de Retenção"]
        S3_DB --> REGRAS[Lifecycle Rules]
        S3_MIDIA --> REGRAS
        REGRAS --> MANTER_7D[Manter 7 dias<br/>Diários]
        REGRAS --> MANTER_4S[Manter 4 semanas<br/>Semanais]
        REGRAS --> MANTER_12M[Manter 12 meses<br/>Mensais]
    end

    subgraph NOTIFICACAO["📢 Notificação"]
        S3_DB --> LOG[Log no Sistema]
        S3_MIDIA --> LOG
        LOG --> ALERTA{Erro?}
        ALERTA -->|Sim| EMAIL[Email Admin]
        ALERTA -->|Não| OK[✅ Sucesso]
    end

    style AGENDAMENTOS fill:#fff3e0,stroke:#ff9800
    style BACKUP_BANCO fill:#e8f5e9,stroke:#4caf50
    style BACKUP_MIDIA fill:#e3f2fd,stroke:#2196f3
    style DESTINO fill:#f3e5f5,stroke:#9c27b0
    style RETENCAO fill:#fce4ec,stroke:#e91e63
    style NOTIFICACAO fill:#e0f2f1,stroke:#009688
```

---

## 8. Estrutura de Dados - Relacionamentos

```mermaid
erDiagram
    PLANO ||--o{ CLIENTE : "possui"
    CLIENTE ||--o{ LICENCA : "possui"
    CLIENTE ||--o{ USUARIO : "possui"
    CLIENTE ||--o{ EQUIPE : "possui"
    CLIENTE ||--o{ CONEXAO : "possui"
    CLIENTE ||--o{ CONTATO : "possui"
    CLIENTE ||--o{ ETIQUETA : "possui"
    CLIENTE ||--o{ FLUXO_CHATBOT : "possui"
    CLIENTE ||--o{ CAMPANHA : "possui"
    CLIENTE ||--o{ QUADRO_KANBAN : "possui"

    EQUIPE ||--o{ USUARIO : "contém"
    EQUIPE ||--o{ CONVERSA : "atribuída"

    CONEXAO ||--o{ CONVERSA : "recebe"

    CONTATO ||--o{ CONVERSA : "possui"
    CONTATO ||--o{ CONTATO_ETIQUETA : "possui"
    ETIQUETA ||--o{ CONTATO_ETIQUETA : "possui"

    CONVERSA ||--o{ MENSAGEM : "contém"
    CONVERSA ||--o{ NOTA_INTERNA : "possui"
    USUARIO ||--o{ CONVERSA : "atende"
    USUARIO ||--o{ NOTA_INTERNA : "cria"
    USUARIO ||--o{ MENSAGEM : "envia"

    FLUXO_CHATBOT ||--o{ NO_CHATBOT : "contém"

    CAMPANHA ||--o{ CAMPANHA_LOG : "gera"

    QUADRO_KANBAN ||--o{ COLUNA_KANBAN : "contém"
    COLUNA_KANBAN ||--o{ CARTAO_KANBAN : "contém"
    CONTATO ||--o{ CARTAO_KANBAN : "vinculado"

    PLANO {
        uuid id PK
        string nome
        decimal preco_mensal
        json limites
        json recursos
    }

    CLIENTE {
        uuid id PK
        string nome
        string email
        uuid plano_id FK
        boolean ativo
    }

    LICENCA {
        uuid id PK
        uuid cliente_id FK
        string chave UK
        string ip_servidor
        datetime expira_em
    }

    USUARIO {
        uuid id PK
        uuid cliente_id FK
        string nome
        string email
        enum perfil
        uuid equipe_id FK
    }

    CONVERSA {
        uuid id PK
        uuid cliente_id FK
        uuid contato_id FK
        uuid conexao_id FK
        uuid usuario_id FK
        enum status
    }

    MENSAGEM {
        uuid id PK
        uuid conversa_id FK
        enum direcao
        enum tipo
        text conteudo
        string midia_url
    }
```

---

*Fluxogramas atualizados com nomenclatura em português e arquitetura multi-tenant*
