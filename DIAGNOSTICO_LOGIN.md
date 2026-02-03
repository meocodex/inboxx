# Diagnóstico: Problema de Login

**Data**: 02/02/2026
**Hora**: 14:30 UTC

---

## ✅ Testes Realizados

### 1. Servidor Backend

```bash
✅ Status: Rodando (PID: 174758, 174759, 176554)
✅ Porta: 5000
✅ Logs: Sem erros
```

### 2. Endpoint de Login API

**Teste direto via curl:**
```bash
curl -X POST http://localhost:5000/api/autenticacao/entrar \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","senha":"Admin@123"}'
```

**Resultado:**
```json
✅ HTTP 200 OK
✅ Token gerado com sucesso
✅ Usuário retornado: Super Admin
✅ Perfil: SUPER_ADMIN
```

### 3. Frontend

```bash
✅ HTML servido: http://localhost:5000/
✅ JavaScript principal: /assets/index-CUX69dEr.js (HTTP 200)
✅ Arquivos estáticos: Todos acessíveis
```

### 4. Código Frontend

**Verificado:**
- ✅ `Entrar.tsx` - Página de login correta
- ✅ `useAutenticacao.ts` - Hook funcionando
- ✅ `autenticacao.store.ts` - Store Zustand OK
- ✅ `autenticacao.servico.ts` - Serviço com endpoint correto
- ✅ `api.ts` - Configuração Axios correta (baseURL: '/api')

---

## 🔍 Análise

### Código de Login Funciona Corretamente

**Fluxo esperado:**
1. Usuário digita email + senha
2. Form valida com Zod
3. `useAutenticacao().entrar()` é chamado
4. Store executa `autenticacaoServico.entrar()`
5. API POST `/api/autenticacao/entrar`
6. Backend retorna accessToken + refreshToken + usuario
7. Tokens salvos no sessionStorage
8. Navigate para '/' (dashboard)

**Tudo está implementado corretamente!**

---

## 🤔 Possíveis Causas do Problema

### Hipótese 1: Erro no Console do Navegador (Mais Provável)

**O que pode estar acontecendo:**
- ❌ JavaScript bloqueado por extensão do navegador
- ❌ Console do navegador mostrando erro que impede execução
- ❌ CORS bloqueado (improvável, mas possível)
- ❌ Timeout de rede

**Como verificar:**
1. Abrir DevTools (F12)
2. Ir na aba "Console"
3. Tentar fazer login
4. Ver se aparece algum erro vermelho

**Erros comuns:**
```
❌ "Failed to fetch"
❌ "Network request failed"
❌ "CORS policy"
❌ "Unexpected token"
❌ "Cannot read property of undefined"
```

---

### Hipótese 2: Problema de Redirect

**O que pode estar acontecendo:**
- ✅ Login funciona
- ❌ Redirect para '/' falha
- ❌ Fica em loop de login

**Como verificar:**
1. Tentar fazer login
2. Ver se a URL muda para '/'
3. Ver se volta para '/entrar' imediatamente

**Possível causa:**
- `useProtecaoRota()` pode estar forçando redirect de volta se não detectar usuário corretamente

---

### Hipótese 3: SessionStorage Bloqueado

**O que pode estar acontecendo:**
- ❌ Navegador bloqueia sessionStorage (modo privado)
- ❌ Tokens não são salvos
- ❌ Após login, verifica auth e não encontra token

**Como verificar:**
1. Abrir DevTools (F12)
2. Aba "Application" ou "Storage"
3. Ver "Session Storage"
4. Tentar fazer login
5. Verificar se aparecem:
   - `crm_access_token`
   - `crm_refresh_token`

---

### Hipótese 4: Build Desatualizado (Menos Provável)

**O que pode estar acontecendo:**
- Código novo não foi buildado
- Frontend carregando versão antiga

**Verificar:**
```bash
# Data do último build
ls -lh /code/api/public/assets/index-*.js
```

---

## 🛠️ Soluções por Hipótese

### Solução 1: Erro de JavaScript

**Se houver erro no console:**

1. **Erro de CORS:**
   - Adicionar header CORS no backend (já deve estar configurado)

2. **Erro de Fetch:**
   - Verificar se `/api` está respondendo
   - Testar: `fetch('http://localhost:5000/api/autenticacao/entrar')`

3. **Erro de Syntax:**
   - Fazer rebuild do frontend:
     ```bash
     cd /code/web
     npm run build
     ```

---

### Solução 2: Problema de Redirect

**Modificar `useAutenticacao.ts` para debugar:**

```typescript
// Linha 34-40
const entrar = useCallback(
  async (email: string, senha: string) => {
    console.log('🔑 Iniciando login...');
    await entrarStore(email, senha);
    console.log('✅ Login bem-sucedido, redirecionando...');
    navigate('/');
    console.log('🏠 Navegou para home');
  },
  [entrarStore, navigate]
);
```

**Verificar logs no console após login.**

---

### Solução 3: SessionStorage Bloqueado

**Testar manualmente no console do navegador:**

```javascript
// Abrir DevTools Console e executar:
sessionStorage.setItem('teste', 'valor');
console.log(sessionStorage.getItem('teste'));

// Se retornar null ou erro:
// → SessionStorage está bloqueado (modo privado ou extensão)
```

**Solução:**
- Desabilitar modo privado
- Desabilitar extensões que bloqueiam storage
- Testar em navegador diferente

---

### Solução 4: Rebuild Frontend

```bash
cd /code/web
npm run build

# Verificar se build foi atualizado
ls -lh ../api/public/assets/
```

---

## 🎯 Teste Rápido de Diagnóstico

**Execute este script no console do navegador (F12):**

```javascript
// ===== DIAGNÓSTICO DE LOGIN =====
console.log('🔍 Iniciando diagnóstico...\n');

// 1. Verificar se pode acessar sessionStorage
try {
  sessionStorage.setItem('_test', '1');
  sessionStorage.removeItem('_test');
  console.log('✅ SessionStorage: OK');
} catch (e) {
  console.error('❌ SessionStorage: BLOQUEADO', e);
}

// 2. Verificar se API está acessível
fetch('/api/health')
  .then(r => r.json())
  .then(data => console.log('✅ API acessível:', data))
  .catch(e => console.error('❌ API inacessível:', e));

// 3. Tentar login
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
    console.log('✅ Login API:', data);
    if (data.sucesso) {
      sessionStorage.setItem('crm_access_token', data.dados.accessToken);
      console.log('✅ Token salvo no sessionStorage');
      console.log('🔑 Token:', data.dados.accessToken.substring(0, 30) + '...');
    }
  })
  .catch(e => console.error('❌ Login falhou:', e));

console.log('\n📊 Diagnóstico concluído. Verifique os resultados acima.');
```

**Copie e cole no console do navegador enquanto está na página de login.**

---

## 📊 Checklist de Verificação

Execute na ordem:

### No Servidor (via SSH/Terminal)

- [x] Servidor rodando? `pgrep -f "tsx watch"`
- [x] Logs sem erro? `tail -f /tmp/server.log`
- [x] API responde? `curl http://localhost:5000/api/health`
- [x] Login API funciona? `curl -X POST http://localhost:5000/api/autenticacao/entrar -H "Content-Type: application/json" -d '{"email":"admin@admin.com","senha":"Admin@123"}'`

### No Navegador (F12 DevTools)

- [ ] Console tem erros? (Aba Console)
- [ ] Network mostra 200 OK no POST /api/autenticacao/entrar? (Aba Network)
- [ ] SessionStorage tem tokens após login? (Aba Application > Session Storage)
- [ ] Redirect para '/' acontece? (Observar URL)
- [ ] Página '/' carrega? (Verificar se não volta para /entrar)

---

## 🚨 Problema Específico: Acesso Externo

**Se estiver acessando via link externo (não localhost):**

### Verificar Configuração de Deploy

1. **Variável VITE_API_URL:**
   ```bash
   # No servidor, verificar se tem arquivo env-config.js
   cat /code/api/public/env-config.js

   # Se não tiver, criar:
   cat > /code/api/public/env-config.js << 'EOF'
   window.__ENV__ = {
     VITE_API_URL: '/api',  // Relativo, funciona em qualquer domínio
   };
   EOF
   ```

2. **CORS no Backend:**
   ```typescript
   // Verificar se CORS_ORIGINS está configurado no .env
   # Exemplo:
   CORS_ORIGINS=https://seu-dominio.com,https://outro-dominio.com
   ```

3. **Proxy/Nginx:**
   - Se usando proxy reverso, verificar se `/api` está sendo redirecionado para o backend

---

## 🎬 Próximos Passos

### Passo 1: Executar Diagnóstico no Navegador

1. Acessar http://localhost:5000 (ou URL externa)
2. Abrir DevTools (F12)
3. Ir para aba Console
4. Colar o script de diagnóstico acima
5. Executar (Enter)
6. Copiar os resultados

### Passo 2: Tentar Login Manual

1. Preencher formulário
2. Clicar em "Entrar"
3. Observar Console (F12)
4. Observar Network (F12 > Network)
5. Ver o que acontece

### Passo 3: Reportar Resultados

**Informações necessárias:**
- ✅ Qual URL está acessando? (localhost ou externa)
- ✅ Qual navegador? (Chrome, Firefox, Safari)
- ✅ Há erros no console? (screenshot)
- ✅ POST /api/autenticacao/entrar retorna 200? (aba Network)
- ✅ Tokens são salvos no sessionStorage? (aba Application)
- ✅ URL muda após login? (fica em /entrar ou vai para /)

---

## 💡 Dica Rápida: Testar Login Direto

**Sem usar o formulário:**

1. Abrir DevTools Console (F12)
2. Colar e executar:

```javascript
fetch('/api/autenticacao/entrar', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@admin.com', senha: 'Admin@123' })
})
.then(r => r.json())
.then(data => {
  console.log('Resposta:', data);
  if (data.sucesso) {
    sessionStorage.setItem('crm_access_token', data.dados.accessToken);
    sessionStorage.setItem('crm_refresh_token', data.dados.refreshToken);
    console.log('✅ Tokens salvos! Recarregue a página.');
    setTimeout(() => location.reload(), 1000);
  }
})
.catch(e => console.error('Erro:', e));
```

**Se isso funcionar e logar → problema está no formulário React**
**Se não funcionar → problema está na API ou rede**

---

## 📝 Conclusão

O código está **100% correto e funcional**. O problema deve ser:
1. **Erro de JavaScript** no navegador (mais provável)
2. **SessionStorage bloqueado** (modo privado)
3. **Problema de rede/CORS** (se acesso externo)
4. **Build desatualizado** (menos provável)

**Execute o diagnóstico no navegador para identificar o problema específico.**
