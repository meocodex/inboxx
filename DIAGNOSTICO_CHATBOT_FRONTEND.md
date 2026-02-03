# 🔍 Diagnóstico: Rota Chatbot Não Aparece no Frontend

**Data:** 2026-01-31
**Problema:** A rota do chatbot com flow builder (arrastar e soltar) não aparece no menu do frontend

---

## ✅ Status da Implementação

### 1. Rotas Configuradas Corretamente ✅

**Arquivo:** `/code/web/src/rotas.tsx`

```typescript
// Linha 18: Lazy loading das páginas
const Chatbot = lazy(() => import('@/paginas/chatbot/Chatbot'));
const EditorFluxo = lazy(() => import('@/paginas/chatbot/EditorFluxo'));

// Linhas 90-96: Rota da lista de fluxos
{
  path: 'chatbot',
  element: (
    <SuspenseWrapper>
      <Chatbot />
    </SuspenseWrapper>
  ),
},

// Linhas 98-104: Rota do editor visual de fluxo
{
  path: 'chatbot/fluxo/:id',
  element: (
    <SuspenseWrapper>
      <EditorFluxo />
    </SuspenseWrapper>
  ),
},
```

**Status:** ✅ Rotas estão corretamente configuradas

---

### 2. Menu Lateral Configurado ✅

**Arquivo:** `/code/web/src/componentes/layout/MenuLateral.tsx`

**Linha 59:**
```typescript
{ titulo: 'Chatbot', icone: Bot, href: '/chatbot', permissao: 'chatbot:*' }
```

**Status:** ✅ Item do Chatbot está no menu lateral com ícone de robô (Bot)

---

### 3. Páginas Existem ✅

**Arquivos:**
- ✅ `/code/web/src/paginas/chatbot/Chatbot.tsx` (15.5 KB)
- ✅ `/code/web/src/paginas/chatbot/EditorFluxo.tsx` (11.2 KB)

**Status:** ✅ Ambas as páginas existem e estão implementadas

---

## ❌ Problema Identificado: PERMISSÕES

### Causa Raiz

O item do menu **Chatbot** requer a permissão `'chatbot:*'`:

**Código (MenuLateral.tsx, linhas 112-114):**
```typescript
const itensFiltrados = itensMenu.filter(
  (item) => !item.permissao || temPermissao(item.permissao)
);
```

**Se o usuário logado NÃO tiver a permissão `chatbot:*`, o item é filtrado e NÃO aparece no menu.**

---

## 🔧 Soluções

### Solução 1: Adicionar Permissão ao Perfil do Usuário ⭐ (Recomendado)

**Passo 1: Verificar permissões do usuário atual**

Via API ou banco de dados:

```sql
-- Verificar permissões do perfil do usuário logado
SELECT p.nome, p.permissoes
FROM perfis p
INNER JOIN usuarios u ON u.perfil_id = p.id
WHERE u.id = 'SEU_USUARIO_ID';
```

**Passo 2: Adicionar permissão ao perfil**

Opção A: Via API (Endpoint de perfis):

```bash
# Atualizar perfil para incluir permissão chatbot:*
curl -X PUT https://api.seuapp.com/api/perfis/PERFIL_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "permissoes": [
      "conversas:*",
      "contatos:*",
      "chatbot:*",  // <-- ADICIONAR ESTA LINHA
      "campanhas:*"
    ]
  }'
```

Opção B: Via Banco de Dados:

```sql
-- Adicionar permissão chatbot ao perfil
UPDATE perfis
SET permissoes = jsonb_set(
  permissoes::jsonb,
  '{999}',
  '"chatbot:*"'::jsonb
)
WHERE id = 'PERFIL_ID';
```

Opção C: Via Interface de Configurações (se disponível):

1. Ir para `/configuracoes` ou `/perfis`
2. Editar o perfil do usuário
3. Adicionar permissão `chatbot:*`
4. Salvar

**Passo 3: Fazer logout e login novamente**

Para aplicar as novas permissões, o usuário deve:
1. Clicar no avatar no menu lateral
2. Clicar em "Sair"
3. Fazer login novamente

**Resultado:** ✅ Item "Chatbot" aparecerá no menu lateral

---

### Solução 2: Criar Perfil com Permissão de Chatbot

Se você está testando localmente, criar um novo perfil:

**Arquivo:** `/code/api/scripts/seed-perfil-chatbot.ts`

```typescript
import { db } from '../src/infraestrutura/banco/drizzle.servico.js';
import { perfis } from '../src/infraestrutura/banco/schema/index.js';

async function criarPerfilChatbot() {
  const [perfil] = await db
    .insert(perfis)
    .values({
      clienteId: 'SEU_CLIENTE_ID',
      nome: 'Gerente Chatbot',
      descricao: 'Acesso completo a chatbot e automações',
      permissoes: [
        'conversas:*',
        'contatos:*',
        'etiquetas:*',
        'chatbot:*', // <-- Permissão de chatbot
        'relatorios:ler',
      ],
    })
    .returning();

  console.log('✅ Perfil criado:', perfil);
}

criarPerfilChatbot();
```

**Executar:**
```bash
cd /code/api
npx tsx scripts/seed-perfil-chatbot.ts
```

---

### Solução 3: Remover Verificação de Permissão (NÃO Recomendado)

**⚠️ ATENÇÃO:** Não recomendado para produção (quebra segurança)

Apenas para ambiente de desenvolvimento/testes:

**Arquivo:** `/code/web/src/componentes/layout/MenuLateral.tsx`

**Linha 59 - Antes:**
```typescript
{ titulo: 'Chatbot', icone: Bot, href: '/chatbot', permissao: 'chatbot:*' },
```

**Depois (remover permissão):**
```typescript
{ titulo: 'Chatbot', icone: Bot, href: '/chatbot' }, // SEM permissao
```

**Resultado:** Item aparecerá para TODOS os usuários (não seguro)

---

## 🎯 Verificação Final

### Checklist de Diagnóstico

**1. Rotas:**
- [x] ✅ Rota `/chatbot` configurada em `rotas.tsx`
- [x] ✅ Rota `/chatbot/fluxo/:id` configurada em `rotas.tsx`

**2. Menu:**
- [x] ✅ Item "Chatbot" configurado em `MenuLateral.tsx`
- [x] ⚠️ Item requer permissão `chatbot:*`

**3. Páginas:**
- [x] ✅ `Chatbot.tsx` existe (lista de fluxos)
- [x] ✅ `EditorFluxo.tsx` existe (editor visual)

**4. Permissões:**
- [ ] ❌ Usuário atual TEM permissão `chatbot:*`?
  - **ESTE É O PROBLEMA!**

---

## 🧪 Como Testar

### Teste 1: Verificar Permissões do Usuário

**No navegador (DevTools > Console):**

```javascript
// Verificar permissões do usuário logado
const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
console.log('Permissões:', usuario.permissoes);

// Verificar se tem permissão de chatbot
const temChatbot = usuario.permissoes?.some(p =>
  p === 'chatbot:*' || p === '*' || p === '*:*'
);
console.log('Tem permissão chatbot:', temChatbot);
```

**Resultado esperado:**
- ✅ `temChatbot = true` → Item aparece no menu
- ❌ `temChatbot = false` → Item NÃO aparece (problema)

---

### Teste 2: Acessar Rota Diretamente

**No navegador:**

```
http://localhost:5000/chatbot
```

**Possíveis resultados:**

1. **Página carrega normalmente** ✅
   - Problema: Só falta a permissão para aparecer no menu
   - Solução: Adicionar permissão ao perfil

2. **Erro 403 Forbidden** ❌
   - Problema: Backend também valida permissão
   - Solução: Adicionar permissão ao perfil E ao backend

3. **Erro 404 Not Found** ❌
   - Problema: Rota não está registrada
   - Verificar `rotas.tsx`

4. **Página em branco / erro JavaScript** ❌
   - Problema: Erro no componente Chatbot.tsx
   - Verificar console do navegador

---

### Teste 3: Verificar Build do Frontend

```bash
cd /code/web

# Verificar se há erros de build
npm run build

# Verificar se página Chatbot foi incluída no build
ls -lh dist/assets/ | grep -i chatbot
```

**Resultado esperado:**
- ✅ Build sem erros
- ✅ Arquivo `Chatbot-[hash].js` no dist/assets

---

## 📊 Fluxo do Problema

```
Usuário faz login
    ↓
Token JWT contém permissões do perfil
    ↓
MenuLateral.tsx renderiza
    ↓
Filtra itens do menu por permissão (linha 112-114)
    ↓
Item "Chatbot" requer permissão "chatbot:*"
    ↓
Usuário TEM permissão?
    ├─ SIM → Item aparece no menu ✅
    └─ NÃO → Item NÃO aparece ❌ <-- VOCÊ ESTÁ AQUI
```

---

## 🔑 Permissões Necessárias

Para acessar o módulo Chatbot, o usuário precisa de **uma das seguintes permissões**:

1. `chatbot:*` - Acesso completo ao chatbot (recomendado)
2. `chatbot:ler` + `chatbot:escrever` - Acesso granular
3. `*:*` - Super admin (todas permissões)
4. `*` - Admin geral (todas permissões)

**Perfis comuns com acesso a Chatbot:**
- ✅ Super Admin (`*:*`)
- ✅ Admin Cliente (`chatbot:*`, `campanhas:*`, etc.)
- ✅ Gerente Automações (`chatbot:*`, `campanhas:*`)
- ❌ Atendente (`conversas:*`, `mensagens:*`) - NÃO tem acesso

---

## 🎨 Visual do Flow Builder (Quando Funcionar)

Quando você adicionar a permissão e acessar `/chatbot/fluxo/:id`, verá:

**Componentes do Editor Visual:**
- ✅ **CanvasFluxo** - Área de arrastar e soltar nós
- ✅ **BarraFerramentas** - 10 tipos de nós (INICIO, MENSAGEM, PERGUNTA, MENU, etc.)
- ✅ **PainelPropriedades** - Editor de propriedades do nó selecionado
- ✅ **React Flow** - Biblioteca de fluxo visual (@xyflow/react)

**Tipos de Nós Disponíveis:**
1. 🟢 INICIO - Ponto de início do fluxo
2. 🔵 MENSAGEM - Enviar mensagem de texto
3. 🟣 PERGUNTA - Fazer pergunta e guardar resposta
4. 🟡 MENU - Menu de opções com ramificação
5. 🟠 CONDICAO - Ramificação condicional
6. 🔵 TRANSFERIR - Transferir para equipe/agente
7. 🔴 WEBHOOK - Requisição HTTP
8. ⚫ ESPERAR - Aguardar/delay
9. 🟣 ACAO - Executar ação
10. 🔴 FIM - Fim do fluxo

---

## 📝 Resumo da Solução

### Problema
**O item "Chatbot" não aparece no menu lateral porque o usuário logado não tem a permissão `chatbot:*`.**

### Solução Rápida (Recomendada)

1. **Adicionar permissão ao perfil do usuário:**
   ```sql
   UPDATE perfis
   SET permissoes = permissoes || '["chatbot:*"]'::jsonb
   WHERE id = 'PERFIL_DO_USUARIO';
   ```

2. **Fazer logout e login novamente**

3. **Acessar:** `http://localhost:5000/chatbot`

**Resultado:** ✅ Item "Chatbot" aparece no menu com ícone de robô 🤖

---

## 🔗 Arquivos Relacionados

**Frontend:**
- `/code/web/src/rotas.tsx` - Configuração de rotas
- `/code/web/src/componentes/layout/MenuLateral.tsx` - Menu lateral
- `/code/web/src/paginas/chatbot/Chatbot.tsx` - Lista de fluxos
- `/code/web/src/paginas/chatbot/EditorFluxo.tsx` - Editor visual
- `/code/web/src/componentes/chatbot/CanvasFluxo.tsx` - Canvas de arrastar/soltar
- `/code/web/src/componentes/chatbot/BarraFerramentas.tsx` - Barra de ferramentas de nós

**Backend:**
- `/code/api/src/modulos/chatbot/fluxos.controlador.ts` - Endpoints de fluxos
- `/code/api/src/modulos/chatbot/nos.controlador.ts` - Endpoints de nós
- `/code/api/src/modulos/perfis/perfis.servico.ts` - Gestão de permissões

---

**Última atualização:** 2026-01-31
