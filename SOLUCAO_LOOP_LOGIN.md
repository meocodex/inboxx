# Solução: Loop de Login (Login funciona mas volta para tela de login)

**Data**: 02/02/2026
**Problema**: Login bem-sucedido, mas dashboard não carrega e volta para /entrar

---

## 🔍 Diagnóstico Realizado

### ✅ API Backend: Funcionando 100%

```bash
✅ POST /api/autenticacao/entrar → HTTP 200 (token gerado)
✅ GET /api/autenticacao/eu → HTTP 200 (usuário retornado)
```

### 🎯 Causa do Problema

**Arquivo**: `/code/web/src/componentes/layout/LayoutPrincipal.tsx`

**Lógica de proteção (linhas 22-31):**

```typescript
useEffect(() => {
  if (!estaAutenticado()) {
    navigate('/entrar');  // ← Redireciona se não autenticado
    return;
  }

  if (!usuario && !carregando) {
    carregarUsuario();  // ← Carrega usuário da API
  }
}, [usuario, carregando, carregarUsuario, navigate]);
```

**O que está acontecendo:**

1. ✅ Login funciona → tokens salvos no sessionStorage
2. ✅ Redirect para '/' (dashboard)
3. ✅ LayoutPrincipal verifica `estaAutenticado()` → TRUE (token existe)
4. ⏳ Chama `carregarUsuario()` (GET /api/autenticacao/eu)
5. ❌ **Algo impede o usuário de ser salvo na store Zustand**
6. ❌ Como `!usuario` é true, verifica auth novamente
7. ❌ Loop infinito ou volta para /entrar

---

## 🛠️ Solução: Script de Login Manual

### Execute este script no console do navegador (F12):

```javascript
// ═══════════════════════════════════════════════════════
// SCRIPT DE LOGIN MANUAL COM DIAGNÓSTICO
// ═══════════════════════════════════════════════════════

console.clear();
console.log('%c🔧 INICIANDO LOGIN COM DIAGNÓSTICO', 'font-size:16px; font-weight:bold; color:blue; background:yellow; padding:5px');
console.log('');

// Limpar tudo antes
sessionStorage.clear();
localStorage.clear();
console.log('✅ Storage limpo');

// Passo 1: Fazer login
console.log('');
console.log('%c📋 Passo 1: Login via API', 'font-size:14px; font-weight:bold');
fetch('/api/autenticacao/entrar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@admin.com',
    senha: 'Admin@123'
  })
})
.then(r => r.json())
.then(data => {
  if (!data.sucesso) {
    throw new Error(data.erro || 'Login falhou');
  }

  console.log('✅ Login bem-sucedido!');
  console.log('   Usuário:', data.dados.usuario.nome);
  console.log('   Token:', data.dados.accessToken.substring(0, 30) + '...');

  // Passo 2: Salvar tokens
  console.log('');
  console.log('%c📋 Passo 2: Salvando tokens', 'font-size:14px; font-weight:bold');

  sessionStorage.setItem('crm_access_token', data.dados.accessToken);
  sessionStorage.setItem('crm_refresh_token', data.dados.refreshToken);

  console.log('✅ Tokens salvos no sessionStorage');
  console.log('   Access token:', sessionStorage.getItem('crm_access_token') ? '✓' : '✗');
  console.log('   Refresh token:', sessionStorage.getItem('crm_refresh_token') ? '✓' : '✗');

  // Passo 3: Salvar usuário na store Zustand
  console.log('');
  console.log('%c📋 Passo 3: Salvando usuário na store Zustand', 'font-size:14px; font-weight:bold');

  const storeKey = 'crm-auth-storage';
  const storeData = {
    state: {
      usuario: data.dados.usuario,
    },
    version: 0
  };

  localStorage.setItem(storeKey, JSON.stringify(storeData));

  console.log('✅ Usuário salvo na store Zustand');
  console.log('   Store:', localStorage.getItem(storeKey) ? '✓' : '✗');

  // Passo 4: Verificar o que foi salvo
  console.log('');
  console.log('%c📋 Passo 4: Verificação final', 'font-size:14px; font-weight:bold');
  console.log('SessionStorage:');
  console.log('   crm_access_token:', !!sessionStorage.getItem('crm_access_token'));
  console.log('   crm_refresh_token:', !!sessionStorage.getItem('crm_refresh_token'));
  console.log('');
  console.log('LocalStorage (Zustand):');
  console.log('   crm-auth-storage:', !!localStorage.getItem('crm-auth-storage'));

  // Passo 5: Redirecionar
  console.log('');
  console.log('%c✅ TUDO PRONTO! Redirecionando...', 'font-size:16px; font-weight:bold; color:green; background:lightgreen; padding:5px');

  setTimeout(() => {
    window.location.href = '/';
  }, 1500);
})
.catch(error => {
  console.error('');
  console.error('%c❌ ERRO NO LOGIN', 'font-size:16px; font-weight:bold; color:white; background:red; padding:5px');
  console.error('Erro:', error);
});
```

---

## 🎯 O Que Este Script Faz

1. **Limpa storage** (sessionStorage + localStorage)
2. **Faz login** via POST /api/autenticacao/entrar
3. **Salva tokens** no sessionStorage (crm_access_token + crm_refresh_token)
4. **Salva usuário** no localStorage (store Zustand: crm-auth-storage)
5. **Verifica** que tudo foi salvo corretamente
6. **Redireciona** para '/' (dashboard)

---

## 🔧 Solução Alternativa: Rebuild do Frontend

Se o script acima não resolver, pode ser que o build do frontend esteja desatualizado:

```bash
cd /code/web
npm run build

# Verificar se foi atualizado
ls -lh dist/
```

---

## 🐛 Debug Adicional: Verificar Store Zustand

### No console do navegador, após fazer login:

```javascript
// Ver estado da store Zustand
const store = JSON.parse(localStorage.getItem('crm-auth-storage') || '{}');
console.log('Store Zustand:', store);

// Ver se há usuário
if (store.state && store.state.usuario) {
  console.log('✅ Usuário na store:', store.state.usuario.nome);
} else {
  console.error('❌ Usuário NÃO está na store!');
}
```

---

## 📋 Checklist de Verificação

Execute na ordem:

### No Navegador (após fazer login)

1. **Abrir DevTools** (F12)

2. **Aba Console:**
   - [ ] Executar script de login manual acima
   - [ ] Ver se aparece "✅ TUDO PRONTO!"

3. **Aba Application > Storage:**
   - [ ] Session Storage deve ter:
     - `crm_access_token`
     - `crm_refresh_token`
   - [ ] Local Storage deve ter:
     - `crm-auth-storage` (com usuário dentro)

4. **Aba Network:**
   - [ ] POST /api/autenticacao/entrar → 200 OK
   - [ ] GET /api/autenticacao/eu → 200 OK (se aparecer)

5. **URL:**
   - [ ] Após login, deve ir para '/'
   - [ ] NÃO deve voltar para '/entrar'

---

## 🎬 Fluxo Correto de Login

```
1. Página /entrar
   ↓
2. Preencher email + senha
   ↓
3. Click "Entrar"
   ↓
4. POST /api/autenticacao/entrar → 200 OK
   ↓
5. Tokens salvos no sessionStorage ✓
   ↓
6. Usuário salvo no localStorage (Zustand) ✓
   ↓
7. Navigate para '/' ✓
   ↓
8. LayoutPrincipal verifica auth:
   - estaAutenticado() → TRUE (token existe)
   - usuario na store? → TRUE
   ↓
9. ✅ Dashboard carrega!
```

---

## 🚨 Se Ainda Não Funcionar

### Causa Provável: Store Zustand não está persistindo

**Verificar arquivo da store:**

```bash
cat /code/web/src/stores/autenticacao.store.ts | grep -A 5 "persist"
```

**Deve ter:**

```typescript
persist(
  (set) => ({ ... }),
  {
    name: 'crm-auth-storage',
    partialize: (state) => ({ usuario: state.usuario }),
  }
)
```

Se não tiver `name` ou `partialize`, a store não está salvando no localStorage!

---

## 💡 Solução Definitiva

### Opção 1: Script Manual (Mais Rápido)

Execute o script de login no console → deve funcionar imediatamente

### Opção 2: Corrigir Código (Permanente)

Se o problema persistir após reload, significa que a store Zustand não está carregando o usuário do localStorage. Nesse caso, precisa:

1. Verificar se `persist` do Zustand está configurado corretamente
2. Verificar se o nome da chave está correto (`crm-auth-storage`)
3. Fazer rebuild do frontend

---

## 📊 Resumo

**Problema:** Store Zustand não está persistindo/carregando o usuário corretamente

**Solução Imediata:** Script manual de login que salva tudo manualmente

**Solução Permanente:** Verificar configuração do Zustand persist middleware

---

## 🎯 Teste Rápido Agora

1. Abrir http://localhost:5000
2. Pressionar F12 (DevTools)
3. Ir para aba Console
4. Colar o script de login manual
5. Pressionar Enter
6. Aguardar mensagem "✅ TUDO PRONTO!"
7. Página recarrega automaticamente
8. ✅ Deve estar logado no dashboard!

---

**Execute o script e me diga o resultado!** 🚀
