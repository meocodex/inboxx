# 📊 Status de Integração: Chatbot / Flow Builder

**Data:** 2026-01-31
**Resposta à pergunta:** "Os nós ainda não funcionam interligados com o nosso sistema atual correto?"

---

## ✅ O que ESTÁ Implementado

### 1. Interface Visual (Frontend) ✅

**Arquivos:**
- `/code/web/src/paginas/chatbot/Chatbot.tsx` - Lista de fluxos
- `/code/web/src/paginas/chatbot/EditorFluxo.tsx` - Editor visual
- `/code/web/src/componentes/chatbot/CanvasFluxo.tsx` - Canvas arrastar/soltar
- `/code/web/src/componentes/chatbot/BarraFerramentas.tsx` - Paleta de nós
- `/code/web/src/componentes/chatbot/PainelPropriedades.tsx` - Editor de propriedades

**Funcionalidades:**
- ✅ Criar, editar, excluir fluxos
- ✅ Arrastar e soltar 10 tipos de nós
- ✅ Conectar nós visualmente (React Flow)
- ✅ Configurar propriedades de cada nó
- ✅ Ativar/desativar fluxos
- ✅ Duplicar fluxos
- ✅ Visualizar lista de nós por fluxo

**Status:** ✅ **100% FUNCIONAL** (interface gráfica completa)

---

### 2. Backend CRUD (API) ✅

**Arquivos:**
- `/code/api/src/modulos/chatbot/fluxos.servico.ts` - Lógica de fluxos
- `/code/api/src/modulos/chatbot/nos.servico.ts` - Lógica de nós
- `/code/api/src/modulos/chatbot/transicoes.servico.ts` - Lógica de transições

**Endpoints:**
- ✅ `GET /api/chatbot/fluxos` - Listar fluxos
- ✅ `POST /api/chatbot/fluxos` - Criar fluxo
- ✅ `GET /api/chatbot/fluxos/:id` - Obter fluxo com nós
- ✅ `PUT /api/chatbot/fluxos/:id` - Atualizar fluxo
- ✅ `DELETE /api/chatbot/fluxos/:id` - Excluir fluxo
- ✅ `POST /api/chatbot/fluxos/:id/duplicar` - Duplicar fluxo
- ✅ `PATCH /api/chatbot/fluxos/:id/status` - Ativar/desativar
- ✅ CRUD completo de nós
- ✅ CRUD completo de transições

**Banco de Dados:**
- ✅ Tabela `fluxos_chatbot` (nome, descrição, gatilho, ativo, machine_definition)
- ✅ Tabela `nos_chatbot` (tipo, nome, configuração, posição X/Y)
- ✅ Tabela `transicoes_chatbot` (nó origem, nó destino, evento, condição, ordem)

**Status:** ✅ **100% FUNCIONAL** (CRUD completo, dados persistidos)

---

### 3. Motor de Compilação (XState) ✅

**Arquivo:** `/code/api/src/modulos/chatbot/motor-fluxo.servico.ts` (425 linhas)

**Funcionalidades:**
- ✅ `compilar(fluxoId)` - Converte fluxo (nós + transições) para máquina XState
- ✅ `validar(fluxoId)` - Valida fluxo (nó INICIO, nó FIM, transições, nós órfãos)
- ✅ `obterMachine(fluxoId)` - Retorna definição da máquina compilada
- ✅ Mapeia tipos de nós para actions XState:
  - MENSAGEM → `enviarMensagem`
  - PERGUNTA → `enviarPergunta`
  - MENU → `enviarMenu`
  - CONDICAO → `avaliarCondicao`
  - TRANSFERIR → `transferir`
  - WEBHOOK → `chamarWebhook`
  - ESPERAR → `esperar`
  - ACAO → `executarAcao`

**Exemplo de Machine Gerada:**

```typescript
{
  id: 'fluxo-123',
  initial: 'no_inicio',
  context: {
    conversaId: undefined,
    contatoId: undefined,
    mensagens: [],
    variaveis: {}
  },
  states: {
    no_inicio: {
      type: 'atomic',
      meta: { noId: 'abc', tipo: 'INICIO', nome: 'Início' },
      on: {
        PROXIMO: { target: 'no_mensagem_1' }
      }
    },
    no_mensagem_1: {
      entry: [
        {
          type: 'enviarMensagem',
          params: { mensagem: 'Olá! Como posso ajudar?' }
        }
      ],
      on: {
        PROXIMO: { target: 'no_fim' }
      }
    },
    no_fim: {
      type: 'final'
    }
  }
}
```

**Status:** ✅ **100% IMPLEMENTADO** (compila fluxos para XState)

---

## ❌ O que NÃO ESTÁ Implementado

### 1. Implementação das Actions ❌

**Problema:** As actions são **definidas** no motor, mas **NÃO estão implementadas**.

**Actions que precisam ser implementadas:**

```typescript
// ❌ NÃO IMPLEMENTADO - Precisa criar!
const actions = {
  enviarMensagem: async (context, event, params) => {
    // TODO: Enviar mensagem via WhatsApp API
    // await whatsappServico.enviarMensagem(context.conversaId, params.mensagem);
  },

  enviarPergunta: async (context, event, params) => {
    // TODO: Enviar pergunta e aguardar resposta
    // await whatsappServico.enviarMensagem(context.conversaId, params.mensagem);
    // context.variaveis[params.variavel] = await aguardarResposta();
  },

  enviarMenu: async (context, event, params) => {
    // TODO: Enviar menu interativo
    // await whatsappServico.enviarMenuInterativo(context.conversaId, params.mensagem, params.opcoes);
  },

  transferir: async (context, event, params) => {
    // TODO: Transferir conversa para equipe/agente
    // await conversasServico.transferir(context.conversaId, params.equipeId, params.usuarioId);
  },

  chamarWebhook: async (context, event, params) => {
    // TODO: Fazer requisição HTTP
    // const response = await axios.post(params.url, params.body, { headers: params.headers });
    // context.variaveis[params.variavel] = response.data;
  },

  esperar: async (context, event, params) => {
    // TODO: Aguardar tempo especificado
    // await new Promise(resolve => setTimeout(resolve, params.duracao));
  },

  avaliarCondicao: async (context, event, params) => {
    // TODO: Avaliar condições lógicas
    // const resultado = avaliar(context.variaveis, params.condicoes);
    // return resultado;
  },

  executarAcao: async (context, event, params) => {
    // TODO: Executar ações customizadas
    // await acoes[params.acao](context, params.parametros);
  },
};
```

**Status:** ❌ **NÃO IMPLEMENTADO**

---

### 2. Interpretador XState ❌

**Problema:** Não há código que **execute** (interprete) as máquinas XState compiladas.

**O que falta criar:**

```typescript
// ❌ NÃO EXISTE - Precisa criar!
// Arquivo: /code/api/src/modulos/chatbot/executor-fluxo.servico.ts

import { createActor } from 'xstate';
import { motorFluxoServico } from './motor-fluxo.servico.js';

export const executorFluxoServico = {
  async executar(fluxoId: string, conversaId: string, contatoId: string) {
    // 1. Obter machine definition compilada
    const machineDefinition = await motorFluxoServico.obterMachine(clienteId, fluxoId);

    // 2. Criar actor (interpretador) com actions implementadas
    const actor = createActor(machineDefinition, {
      actions: implementedActions, // <-- PRECISA IMPLEMENTAR
      guards: implementedGuards,
      delays: implementedDelays,
    });

    // 3. Iniciar execução
    actor.subscribe(state => {
      // Salvar estado atual no banco
      // Processar transições
      // Enviar mensagens
    });

    actor.start();

    return actor;
  }
};
```

**Status:** ❌ **NÃO IMPLEMENTADO**

---

### 3. Worker de Processamento ❌

**Problema:** Não há worker que **escute mensagens recebidas** e **dispare fluxos**.

**Workers existentes:**
- ✅ `campanhas.worker.ts` - Processa campanhas
- ✅ `mensagens-agendadas.worker.ts` - Envia mensagens agendadas
- ✅ `lembretes.worker.ts` - Envia lembretes
- ✅ `webhooks-retry.worker.ts` - Reprocessa webhooks
- ✅ `sincronizacao-busca.worker.ts` - Sincroniza Meilisearch
- ❌ **FALTA:** `chatbot.worker.ts` - Processa fluxos de chatbot

**O que falta criar:**

```typescript
// ❌ NÃO EXISTE - Precisa criar!
// Arquivo: /code/api/src/workers/chatbot.worker.ts

import { Worker, Job } from 'bullmq';
import { executorFluxoServico } from '../modulos/chatbot/executor-fluxo.servico.js';

const chatbotWorker = new Worker('chatbot', async (job: Job) => {
  const { fluxoId, conversaId, contatoId, mensagem } = job.data;

  // Executar fluxo
  await executorFluxoServico.executar(fluxoId, conversaId, contatoId);

  // Processar mensagem recebida como evento
  // actor.send({ type: 'MENSAGEM_RECEBIDA', mensagem });
});

export default chatbotWorker;
```

**Status:** ❌ **NÃO IMPLEMENTADO**

---

### 4. Integração com Webhook do WhatsApp ❌

**Problema:** Quando uma mensagem chega via webhook, **não há código** que:
1. Verifica se existe fluxo ativo para o contato
2. Dispara execução do fluxo
3. Envia mensagem do fluxo de volta para o WhatsApp

**O que falta:**

```typescript
// ❌ FALTA INTEGRAÇÃO
// Arquivo: /code/api/src/modulos/whatsapp/webhook.controlador.ts

// Ao receber mensagem do WhatsApp:
async function processarMensagemRecebida(mensagem) {
  const { contatoId, conversaId, texto } = mensagem;

  // 1. Verificar se existe fluxo ativo para este contato/conversa
  const fluxoAtivo = await verificarFluxoAtivo(conversaId);

  if (fluxoAtivo) {
    // 2. Enviar mensagem como evento para o fluxo
    await chatbotQueue.add('processar-mensagem', {
      fluxoId: fluxoAtivo.id,
      conversaId,
      contatoId,
      mensagem: texto,
    });
  } else {
    // 3. Verificar gatilhos de fluxos (palavra-chave, primeira mensagem, etc.)
    const fluxoGatilho = await verificarGatilhos(texto, contatoId);

    if (fluxoGatilho) {
      // Iniciar novo fluxo
      await chatbotQueue.add('iniciar-fluxo', {
        fluxoId: fluxoGatilho.id,
        conversaId,
        contatoId,
      });
    }
  }
}
```

**Status:** ❌ **NÃO IMPLEMENTADO**

---

### 5. Persistência de Estado ❌

**Problema:** Não há tabela/lógica para **salvar o estado atual** de execução de cada fluxo por conversa.

**O que falta criar:**

**Tabela:**
```sql
-- ❌ NÃO EXISTE - Precisa criar!
CREATE TABLE execucoes_fluxo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  fluxo_id UUID NOT NULL REFERENCES fluxos_chatbot(id),
  conversa_id UUID NOT NULL REFERENCES conversas(id),
  contato_id UUID NOT NULL REFERENCES contatos(id),
  estado_atual TEXT NOT NULL, -- nome do estado atual (ex: 'no_mensagem_1')
  contexto JSONB NOT NULL, -- variaveis, mensagens, etc.
  ativo BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  atualizado_em TIMESTAMP NOT NULL DEFAULT NOW(),
  finalizado_em TIMESTAMP
);
```

**Serviço:**
```typescript
// ❌ NÃO EXISTE - Precisa criar!
export const execucoesFluxoServico = {
  async criar(fluxoId, conversaId, contatoId) {
    // Salvar nova execução no banco
  },

  async atualizar(execucaoId, estadoAtual, contexto) {
    // Atualizar estado + contexto
  },

  async finalizar(execucaoId) {
    // Marcar execução como finalizada
  },

  async obterPorConversa(conversaId) {
    // Buscar execução ativa da conversa
  }
};
```

**Status:** ❌ **NÃO IMPLEMENTADO**

---

## 📊 Resumo: O que Funciona vs O que Falta

| Componente | Status | Observação |
|------------|--------|------------|
| **Frontend - Interface Visual** | ✅ 100% | Arrastar/soltar, configurar nós, salvar fluxos |
| **Backend - CRUD API** | ✅ 100% | Criar, editar, listar, excluir fluxos/nós |
| **Banco de Dados** | ✅ 100% | Tabelas fluxos_chatbot, nos_chatbot, transicoes_chatbot |
| **Motor de Compilação** | ✅ 100% | Converte fluxo → XState machine |
| **Validação de Fluxo** | ✅ 100% | Valida nó INICIO, FIM, transições |
| **Implementação Actions** | ❌ 0% | NÃO implementado (enviarMensagem, transferir, etc.) |
| **Interpretador XState** | ❌ 0% | NÃO criado (executor de máquinas) |
| **Worker Chatbot** | ❌ 0% | NÃO criado (processamento de fluxos) |
| **Integração WhatsApp** | ❌ 0% | NÃO integrado (webhook não dispara fluxos) |
| **Persistência Estado** | ❌ 0% | NÃO existe (tabela execucoes_fluxo) |
| **Gatilhos** | ❌ 0% | NÃO implementado (palavra-chave, horário, etc.) |

**Status Geral:** 🟡 **50% IMPLEMENTADO**

- ✅ **Interface + Armazenamento:** 100% funcional
- ❌ **Execução + Integração:** 0% funcional

---

## 🎯 Resposta à Pergunta

> "Os nós ainda não funcionam interligados com o nosso sistema atual correto?"

**Resposta:** ✅ **CORRETO!**

**Os nós:**
- ✅ Podem ser **criados visualmente** no frontend
- ✅ São **salvos no banco de dados**
- ✅ São **compilados para XState** (máquina de estados)
- ❌ **NÃO são executados** (não há executor/interpretador)
- ❌ **NÃO integram** com WhatsApp (mensagens recebidas não disparam fluxos)
- ❌ **NÃO enviam mensagens** (actions não implementadas)

**Analogia:** É como ter um **carro completo** (chassis, motor, volante), mas sem **combustível e sem motorista**. Você pode sentar, girar o volante, mas o carro não anda.

---

## 🔧 O que Precisa Ser Implementado (Roadmap)

### Fase 1: Implementação de Actions (2-3 dias) 🔴 CRÍTICO

**Criar:** `/code/api/src/modulos/chatbot/actions/`

Arquivos:
- `enviar-mensagem.action.ts` - Integra com WhatsApp API
- `enviar-pergunta.action.ts` - Envia + aguarda resposta
- `enviar-menu.action.ts` - Menu interativo WhatsApp
- `transferir.action.ts` - Integra com módulo conversas
- `chamar-webhook.action.ts` - HTTP client
- `esperar.action.ts` - Delay
- `avaliar-condicao.action.ts` - Lógica condicional
- `executar-acao.action.ts` - Ações customizadas
- `index.ts` - Exporta todas actions

**Esforço:** ~2-3 dias (1 action por vez)

---

### Fase 2: Executor de Fluxo (1-2 dias) 🔴 CRÍTICO

**Criar:** `/code/api/src/modulos/chatbot/executor-fluxo.servico.ts`

**Funcionalidades:**
- Criar interpretador XState com actions implementadas
- Gerenciar ciclo de vida do fluxo (iniciar, pausar, retomar, finalizar)
- Processar eventos (mensagens recebidas, timeouts, webhooks)
- Salvar estado atual no banco

**Esforço:** ~1-2 dias

---

### Fase 3: Persistência de Estado (1 dia) 🟡 IMPORTANTE

**Criar:**
1. Migration Drizzle: `execucoes_fluxo` table
2. Schema: `execucoes-fluxo.schema.ts`
3. Serviço: `execucoes-fluxo.servico.ts`

**Esforço:** ~1 dia

---

### Fase 4: Worker de Chatbot (1 dia) 🟡 IMPORTANTE

**Criar:** `/code/api/src/workers/chatbot.worker.ts`

**Funcionalidades:**
- Processar job "iniciar-fluxo"
- Processar job "processar-mensagem"
- Processar job "timeout-fluxo"

**Esforço:** ~1 dia

---

### Fase 5: Integração com Webhook WhatsApp (1-2 dias) 🟡 IMPORTANTE

**Modificar:** `/code/api/src/modulos/whatsapp/webhook.controlador.ts`

**Adicionar:**
1. Verificar fluxo ativo ao receber mensagem
2. Enviar mensagem como evento para fluxo
3. Verificar gatilhos (palavra-chave, primeira mensagem)
4. Iniciar novo fluxo se gatilho match

**Esforço:** ~1-2 dias

---

### Fase 6: Implementação de Gatilhos (1 dia) 🟢 OPCIONAL

**Criar:** `/code/api/src/modulos/chatbot/gatilhos.servico.ts`

**Tipos de Gatilho:**
- PALAVRA_CHAVE - Match em texto da mensagem
- PRIMEIRA_MENSAGEM - Primeira mensagem do contato
- HORARIO - Horário específico (cron)
- ETIQUETA - Quando contato recebe etiqueta

**Esforço:** ~1 dia

---

### Fase 7: Testes End-to-End (2 dias) 🟢 RECOMENDADO

**Testar:**
1. Criar fluxo no frontend
2. Ativar fluxo
3. Enviar mensagem via WhatsApp
4. Verificar fluxo executa
5. Verificar mensagem é enviada de volta
6. Testar todos os tipos de nós

**Esforço:** ~2 dias

---

## ⏱️ Esforço Total Estimado

| Fase | Esforço | Prioridade |
|------|---------|------------|
| 1. Actions | 2-3 dias | 🔴 CRÍTICO |
| 2. Executor | 1-2 dias | 🔴 CRÍTICO |
| 3. Persistência | 1 dia | 🟡 IMPORTANTE |
| 4. Worker | 1 dia | 🟡 IMPORTANTE |
| 5. Integração WhatsApp | 1-2 dias | 🟡 IMPORTANTE |
| 6. Gatilhos | 1 dia | 🟢 OPCIONAL |
| 7. Testes E2E | 2 dias | 🟢 RECOMENDADO |
| **TOTAL** | **9-12 dias** | **~2 semanas** |

---

## 🚀 Próximos Passos Recomendados

### Opção 1: Implementação Completa (Recomendado)

Implementar todas as fases em **2 semanas** para ter chatbot 100% funcional.

---

### Opção 2: MVP Básico (Rápido)

Implementar apenas fases **críticas** (1 + 2 + 5) em **5-7 dias** para ter:
- ✅ Envio de mensagens simples
- ✅ Menus básicos
- ✅ Fluxos lineares funcionando

**Deixar para depois:**
- ⏸️ Persistência de estado (usar memória temporariamente)
- ⏸️ Gatilhos complexos
- ⏸️ Workers (processar síncronamente por enquanto)

---

### Opção 3: Prova de Conceito (Teste)

Criar um **protótipo isolado** em **2-3 dias** apenas para validar:
- ✅ XState funciona com suas actions
- ✅ Mensagens são enviadas via WhatsApp
- ✅ Fluxo básico (INICIO → MENSAGEM → FIM) funciona

**Código descartável, apenas para validar conceito.**

---

## 📝 Conclusão

**Estado Atual:**
- 🟢 Interface Visual: **Excelente** (100% funcional)
- 🟢 Armazenamento: **Excelente** (CRUD completo)
- 🟢 Compilação: **Excelente** (XState machine gerada)
- 🔴 Execução: **Não Implementada** (0%)
- 🔴 Integração: **Não Implementada** (0%)

**Para tornar funcional:**
1. Implementar actions (enviarMensagem, etc.)
2. Criar executor XState
3. Integrar com webhook WhatsApp
4. Testar end-to-end

**Tempo estimado:** 9-12 dias (~2 semanas)

---

**Quer que eu te ajude a implementar alguma dessas fases?** Posso começar pela **Fase 1 (Actions)** ou criar um **MVP rápido** para você testar! 🚀

---

**Última atualização:** 2026-01-31
