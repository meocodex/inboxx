# 📝 Nota Importante: Testes E2E vs Testes de Serviço

## Contexto

O arquivo `/code/api/src/__tests__/e2e/crud-base-migrated-modules.spec.ts` contém **testes E2E verdadeiros** que fazem requisições HTTP completas ao servidor Fastify.

## Diferença entre Tipos de Teste

### Testes de Serviço (Padrão do Projeto) ✅

**Localização:** `src/modulos/*/tests/*.spec.ts`

**Características:**
- Testam serviços diretamente (sem HTTP)
- Usam mocks do banco de dados (`dbMock`, `mockDbResultQueue`)
- Executam rapidamente (< 1s)
- Não precisam de servidor rodando
- Não precisam de banco de dados real

**Exemplo:**
```typescript
import { usuariosServico } from '../usuarios.servico.js';
import { mockDbResultQueue, resetDbMocks } from '../../../testes/setup.js';

describe('UsuariosServico', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  it('deve listar usuários', async () => {
    mockDbResultQueue([{ id: 'user-123', nome: 'Teste' }]);
    const resultado = await usuariosServico.listar('client-123', { pagina: 1, limite: 10 });
    expect(resultado.dados).toHaveLength(1);
  });
});
```

---

### Testes E2E (HTTP) 🌐

**Localização:** `src/__tests__/e2e/*.spec.ts`

**Características:**
- Testam fluxo completo (HTTP → Controller → Serviço → DB)
- Fazem requisições HTTP reais (`app.inject()`)
- Precisam de servidor Fastify rodando
- Precisam de banco de dados real (ou test database)
- Executam mais lentamente (vários segundos)
- Validam rotas, autenticação, middlewares

**Exemplo:**
```typescript
import { criarAppTeste } from '../../testes/helpers/criar-app-teste.js';

let app: FastifyInstance;

beforeAll(async () => {
  app = await criarAppTeste();
  await app.ready();
});

it('deve listar usuários via HTTP', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/usuarios',
    headers: { authorization: `Bearer ${token}` },
  });
  expect(response.statusCode).toBe(200);
});
```

---

## Status dos Testes E2E Criados

### ❌ Execução Local Falhou (Esperado)

**Erro:** `expected 404 to be 200`

**Causa:** Os testes E2E precisam de:

1. ✅ Servidor Fastify completo com todas as rotas registradas
2. ❌ Banco de dados de teste populado com dados iniciais
3. ❌ Migrations executadas
4. ❌ Autenticação configurada corretamente

**Solução:** Os testes E2E devem ser executados em **ambiente de staging** com banco real, NÃO localmente com mocks.

---

## Como Usar os Testes E2E Criados

### Opção 1: Executar em Staging (Recomendado) ⭐

Os testes E2E foram projetados para serem executados em **ambiente de staging** após deploy:

```bash
# 1. Deploy em staging
cd /code/api
git push origin staging

# 2. Aguardar build + migrations

# 3. Executar testes E2E contra staging
DATABASE_URL=$STAGING_DB_URL \
REDIS_URL=$STAGING_REDIS_URL \
npm test -- src/__tests__/e2e/crud-base-migrated-modules.spec.ts
```

**Pré-requisitos:**
- ✅ Staging deployado
- ✅ Migrations executadas
- ✅ Dados de seed criados (cliente, usuário, token)
- ✅ Redis funcionando

---

### Opção 2: Converter para Testes de Serviço (Alternativa)

Se quiser executar localmente SEM servidor HTTP, converter para testes de serviço:

**Exemplo de conversão:**

**Antes (E2E HTTP):**
```typescript
it('deve listar respostas rápidas', async () => {
  const response = await app.inject({
    method: 'GET',
    url: '/api/chatbot/respostas-rapidas',
    headers: { authorization: `Bearer ${token}` },
  });
  expect(response.statusCode).toBe(200);
});
```

**Depois (Teste de Serviço):**
```typescript
import { respostasRapidasServico } from '../modulos/chatbot/respostas-rapidas.servico.js';
import { mockDbResultQueue } from '../testes/setup.js';

it('deve listar respostas rápidas', async () => {
  mockDbResultQueue([
    { id: 'resp-123', nome: 'Saudação', totalUsos: 10 },
  ]);

  const resultado = await respostasRapidasServico.listar('client-123', {
    pagina: 1,
    limite: 10,
  });

  expect(resultado.dados).toHaveLength(1);
  expect(resultado.dados[0].totalUsos).toBe(10); // Subconsulta
});
```

---

### Opção 3: Smoke Tests Manuais (Validação em Staging)

Os testes E2E criados servem como **checklist de smoke tests** a serem executados manualmente na UI de staging:

**Seguir:** `/code/api/docs/VALIDACAO_STAGING_CRUDBASE.md` seção "2. Smoke Tests Manuais (UI)"

---

## Recomendação Final

Para o projeto atual, recomendo **3 abordagens combinadas**:

### 1. Testes de Serviço (Desenvolvimento) ⚡

**Para:** Desenvolvimento rápido e TDD
**Quando:** Sempre ao criar/modificar serviços
**Como:** Usar mocks do banco (`dbMock`)

```bash
npm test -- src/modulos/equipes/__tests__/equipes.servico.spec.ts
```

---

### 2. Testes E2E Automatizados (CI/CD em Staging) 🤖

**Para:** Validação automática após deploy em staging
**Quando:** Após cada deploy em staging (CI/CD)
**Como:** Executar contra banco de staging

```bash
# No pipeline CI/CD (após deploy staging)
npm test -- src/__tests__/e2e/crud-base-migrated-modules.spec.ts
```

---

### 3. Smoke Tests Manuais (Produção) 👤

**Para:** Validação final antes de aprovar deploy em produção
**Quando:** Após deploy em staging, antes de produção
**Como:** Seguir checklist manual em `VALIDACAO_STAGING_CRUDBASE.md`

---

## Decisão para Este Projeto

**Status dos Testes E2E Criados:**

✅ **Arquivos criados:** `crud-base-migrated-modules.spec.ts` (653 linhas)
✅ **Propósito:** Template de validação E2E para staging/CI-CD
⚠️ **Execução local:** NÃO executar (requer staging)

**Próximos Passos:**

1. **Manter testes E2E como estão** (template para staging)
2. **Seguir smoke tests manuais** em `VALIDACAO_STAGING_CRUDBASE.md`
3. **Opcionalmente:** Criar testes de serviço com mocks para execução local

---

## Conclusão

Os testes E2E criados são **válidos e úteis**, mas devem ser executados em **ambiente de staging** com banco real, não localmente.

Para validação local rápida, o projeto usa **testes de serviço com mocks**.

**Ambas abordagens são válidas e complementares!**

---

**Referências:**

- Testes de Serviço: `src/modulos/*/tests/*.spec.ts`
- Testes E2E: `src/__tests__/e2e/*.spec.ts`
- Smoke Tests Manuais: `/code/api/docs/VALIDACAO_STAGING_CRUDBASE.md`
- Setup de Testes: `src/testes/setup.ts`
