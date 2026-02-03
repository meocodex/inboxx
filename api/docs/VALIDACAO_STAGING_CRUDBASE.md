# ✅ Validação em Staging - CRUDBase Migrado

## Pré-requisitos

- [ ] Código mergeado na branch `main`
- [ ] Build bem-sucedido (sem erros TypeScript)
- [ ] Suite de testes passando (100%)
- [ ] Deploy em staging concluído
- [ ] Redis conectado e funcionando
- [ ] PostgreSQL conectado e funcionando

---

## 1. Validação Automática (Testes E2E)

### Executar Suite Completa

```bash
cd /code/api
npm test -- src/__tests__/e2e/crud-base-migrated-modules.spec.ts
```

**Resultado esperado:**
```
✓ Respostas Rápidas - CRUD Base Simples (7 testes)
✓ Equipes - CRUD Base com Subconsultas (7 testes)
✓ Etiquetas - CRUD Base Ideal (5 testes)
✓ Perfis - CRUD Base Completo (6 testes)
✓ Fluxos - CRUD Base com Lógica Customizada (6 testes)
✓ Performance - Subconsultas (2 testes)

Total: 33 testes | 33 passaram | 0 falharam
Tempo: ~5-10 segundos
```

**Critério de Sucesso:** ✅ 100% dos testes passando

---

## 2. Smoke Tests Manuais (UI)

### 2.1. Respostas Rápidas

**URL:** `https://staging.seuapp.com/chatbot`

- [ ] **Listar:** Visualizar lista de respostas rápidas
  - Verificar coluna "Total de Usos" visível
  - Verificar paginação funciona (10 por página)

- [ ] **Buscar:** Digitar termo no campo de busca
  - Resultados filtrados em tempo real

- [ ] **Criar:** Clicar em "Nova Resposta Rápida"
  - Preencher: Nome, Mensagem, Atalho
  - Salvar e verificar aparece na lista
  - **Subconsulta:** Verificar "Total de Usos" = 0 para nova resposta

- [ ] **Validação:** Tentar criar resposta duplicada
  - Deve exibir erro: "Já existe uma Resposta Rápida com este nome"

- [ ] **Editar:** Clicar em editar, alterar mensagem, salvar
  - Mudanças refletidas na lista

- [ ] **Excluir:** Excluir resposta criada
  - Confirmar exclusão
  - Verificar sumiu da lista

---

### 2.2. Equipes

**URL:** `https://staging.seuapp.com/equipes`

- [ ] **Listar:** Visualizar lista de equipes
  - **Subconsulta 1:** Coluna "Membros" (número)
  - **Subconsulta 2:** Coluna "Conversas" (número)
  - Verificar valores corretos

- [ ] **Criar:** Nova equipe "Vendas Teste"
  - Verificar Membros = 0, Conversas = 0

- [ ] **Detalhes:** Clicar em equipe
  - **Sobrescrita obterPorId():** Lista de membros visível
  - Seção "Membros" vazia inicialmente

- [ ] **Adicionar Membro:** Adicionar usuário à equipe
  - **Método customizado:** `adicionarMembro()`
  - Verificar aparece na lista de membros
  - Verificar contador "Membros" incrementou (1)

- [ ] **Remover Membro:** Remover usuário
  - **Método customizado:** `removerMembro()`
  - Verificar sumiu da lista
  - Verificar contador "Membros" decrementou (0)

- [ ] **Validação:** Tentar criar equipe duplicada
  - Erro: "Já existe uma Equipe com este nome"

- [ ] **Excluir:** Excluir equipe teste

---

### 2.3. Etiquetas

**URL:** `https://staging.seuapp.com/etiquetas`

- [ ] **Listar:** Visualizar etiquetas
  - **Subconsulta:** Coluna "Total de Contatos"
  - Verificar valores numéricos

- [ ] **Criar:** Nova etiqueta "VIP Staging"
  - Escolher cor (ex: #FF5733)
  - Salvar
  - **Subconsulta:** Verificar Total de Contatos = 0

- [ ] **Validação:** Criar etiqueta duplicada
  - Erro: "Já existe uma Etiqueta com este nome"

- [ ] **Editar:** Alterar cor da etiqueta
  - Verificar mudança refletida

- [ ] **Buscar:** Buscar por "VIP"
  - Resultados filtrados

- [ ] **Excluir:** Remover etiqueta

**🎯 Este é o módulo IDEAL (100% herdado) - deve funcionar perfeitamente!**

---

### 2.4. Perfis (COM CACHE)

**URL:** `https://staging.seuapp.com/perfis`

**⚠️ IMPORTANTE:** Este módulo usa cache Redis. Monitorar logs!

- [ ] **Listar:** Visualizar perfis
  - **Subconsulta:** Coluna "Total de Usuários"

- [ ] **Criar:** Novo perfil "Gerente Staging"
  - Definir permissões
  - Salvar
  - **Subconsulta:** Total de Usuários = 0

- [ ] **Cache - Primeira Busca (MISS):** Abrir detalhes do perfil
  - **Logs esperados:** `[Cache] MISS obter:${perfilId}`
  - Tempo de resposta: ~50-100ms

- [ ] **Cache - Segunda Busca (HIT):** Recarregar página de detalhes
  - **Logs esperados:** `[Cache] HIT obter:${perfilId}`
  - Tempo de resposta: < 10ms (🚀 90% mais rápido!)

- [ ] **Cache - Invalidação:** Editar perfil (ex: alterar descrição)
  - **Logs esperados:**
    - `[Cache] DELETE obter:${perfilId}` (hook afterUpdate)
    - `[Cache] DELETE permissoes:${perfilId}` (hook customizado)
  - Salvar e recarregar
  - Primeira busca = MISS (cache invalidado)
  - Segunda busca = HIT (cache populado novamente)

- [ ] **clienteId Nullable:** Criar perfil global (se UI permitir)
  - Perfil sem clienteId (disponível para todos)

- [ ] **Excluir:** Remover perfil
  - **Logs esperados:** Cache invalidado

**📊 Verificar Redis:**
```bash
redis-cli
> KEYS perfis:*
# Deve listar chaves: obter:{id}, permissoes:{id}
> TTL perfis:obter:{id}
# Deve retornar ~3600 (1 hora)
```

---

### 2.5. Fluxos de Chatbot

**URL:** `https://staging.seuapp.com/chatbot`

- [ ] **Listar:** Visualizar fluxos
  - **Subconsulta:** Coluna "Total de Nós"
  - Filtro "Ativos" e "Inativos" funciona

- [ ] **Criar:** Novo fluxo "Atendimento Staging"
  - Definir gatilho (ex: palavra-chave "oi")
  - Salvar
  - **Lógica customizada:** Verificar nó INICIO criado automaticamente
  - **Subconsulta:** Total de Nós = 1

- [ ] **Detalhes:** Abrir fluxo
  - **Sobrescrita obterPorId():** Lista de nós visível
  - Deve ter 1 nó do tipo "INICIO"

- [ ] **Duplicar Fluxo:** Clicar em "Duplicar"
  - **Método customizado:** `duplicar()`
  - Definir novo nome "Atendimento Staging Cópia"
  - Verificar:
    - Fluxo duplicado criado
    - Status = Inativo (sempre ao duplicar)
    - Nós copiados (Total de Nós = 1)
    - Conexões preservadas (se houver)

- [ ] **Ativar Fluxo:** Alternar status para "Ativo"
  - **Método customizado:** `alterarStatus()`
  - **Validação:** Deve aceitar (tem nó INICIO)
  - Verificar badge "Ativo" aparece

- [ ] **Validação de Ativação:** Criar fluxo sem nós e tentar ativar
  - Deve bloquear: "Fluxo deve ter um nó de início"

- [ ] **Desativar:** Voltar para inativo

- [ ] **Excluir:** Remover fluxos de teste

---

## 3. Validação de Performance

### 3.1. Subconsultas (Anti N+1)

**Objetivo:** Verificar que subconsultas usam query única (não N+1)

**Teste:**
1. Criar 50 equipes no banco
2. Listar equipes com `limite=50`
3. **Monitorar logs SQL** (ativar `DEBUG=drizzle:*`)

**Resultado esperado:**
```sql
-- CORRETO: 2 queries apenas
SELECT ... FROM equipes WHERE cliente_id = ... (subconsultas injetadas)
SELECT count(*) FROM equipes WHERE cliente_id = ...

-- ERRADO: 1 + 50 queries (N+1)
SELECT ... FROM equipes WHERE cliente_id = ...
SELECT count(*) FROM usuarios WHERE equipe_id = ... (50x)
SELECT count(*) FROM conversas WHERE equipe_id = ... (50x)
```

**Critério:** ✅ Máximo 2 queries para listar 50 registros

---

### 3.2. Cache Redis (Perfis)

**Objetivo:** Validar hit rate do cache

**Teste:**
1. Criar perfil
2. Buscar por ID 10 vezes consecutivas
3. Monitorar logs Redis

**Resultado esperado:**
```
[Cache] MISS obter:${id}  (1ª vez)
[Cache] HIT obter:${id}   (2ª-10ª vez)
```

**Hit Rate:** 90% (9/10)

**Latência:**
- MISS: ~50-100ms (busca DB)
- HIT: < 10ms (busca Redis)

**Critério:** ✅ 90% hit rate, latência < 10ms no HIT

---

### 3.3. Benchmark Comparativo

**Antes vs Depois da Migração:**

| Operação | Antes (manual) | Depois (CRUDBase) | Melhoria |
|----------|----------------|-------------------|----------|
| **Listar equipes (50)** | ~150ms | ~120ms | 20% mais rápido |
| **Obter perfil (MISS)** | ~50ms | ~50ms | Similar |
| **Obter perfil (HIT)** | N/A | ~5ms | **90% redução** |
| **Criar + validar nome** | ~80ms | ~75ms | Ligeiramente melhor |

**Critério:** ✅ Performance mantida ou melhorada

---

## 4. Validação de Logs

### 4.1. Logs Estruturados (Pino)

**Verificar logs em staging:**

```bash
# Exemplo de log correto (Pino JSON)
{"level":30,"time":1706745600000,"msg":"[Equipes] Listando com subconsultas","clienteId":"abc123","total":15}
{"level":30,"time":1706745601000,"msg":"[Cache] HIT obter:xyz789","namespace":"perfis"}
{"level":30,"time":1706745602000,"msg":"[Fluxos] Nó INICIO criado automaticamente","fluxoId":"def456"}
```

**Critério:** ✅ Logs estruturados, sem `console.log`

---

### 4.2. Erros Esperados

**Testar cenários de erro:**

```bash
# Validação de nome único
{"level":40,"err":"ErroValidacao: Já existe uma Equipe com este nome"}

# Entidade não encontrada
{"level":40,"err":"ErroNaoEncontrado: Perfil não encontrado"}

# Ativação de fluxo inválida
{"level":40,"err":"ErroValidacao: Fluxo deve ter um nó de início"}
```

**Critério:** ✅ Erros com mensagens claras e tipos corretos

---

## 5. Validação de Segurança

### 5.1. Multi-Tenant Isolation

**Teste de isolamento por clienteId:**

1. Criar 2 clientes distintos (Cliente A, Cliente B)
2. Cliente A cria equipe "Vendas A"
3. Cliente B tenta listar equipes
4. **Resultado esperado:** Cliente B não vê "Vendas A"

**Critério:** ✅ Zero vazamento entre clientes

---

### 5.2. Validações Zod

**Teste de inputs inválidos:**

```bash
# Nome vazio
POST /api/equipes { nome: "" }
# Esperado: 400 Bad Request

# Campo obrigatório faltando
POST /api/etiquetas { cor: "#FF0000" }
# Esperado: 400 Bad Request (falta nome)

# Tipo errado
POST /api/perfis { permissoes: "invalid" }
# Esperado: 400 Bad Request (deve ser array)
```

**Critério:** ✅ Todas validações funcionando

---

## 6. Checklist de Aprovação Final

### Funcionalidade

- [ ] ✅ Todos os 33 testes E2E passando
- [ ] ✅ Smoke tests manuais completos (5 módulos)
- [ ] ✅ Subconsultas funcionando corretamente
- [ ] ✅ Cache Redis com 90% hit rate
- [ ] ✅ Métodos customizados preservados
- [ ] ✅ Validações de nome único funcionando

### Performance

- [ ] ✅ Queries SQL otimizadas (anti N+1)
- [ ] ✅ Cache HIT < 10ms
- [ ] ✅ Listar 50 registros < 200ms
- [ ] ✅ Sem degradação de performance

### Segurança

- [ ] ✅ Multi-tenant isolation funcionando
- [ ] ✅ Validações Zod ativas
- [ ] ✅ Permissões CASL funcionando
- [ ] ✅ Logs sem dados sensíveis

### Qualidade

- [ ] ✅ Zero erros TypeScript
- [ ] ✅ Logs estruturados (Pino)
- [ ] ✅ Erros com tipos corretos
- [ ] ✅ Cobertura de testes mantida/melhorada

---

## 7. Próximos Passos

### Se TODOS os critérios forem ✅:

1. **Documentar Resultados:**
   - Capturar screenshots dos smoke tests
   - Salvar logs de performance
   - Exportar métricas do Redis

2. **Preparar Deploy Produção:**
   - Criar tag de release: `v1.5.0-crudbase-migration`
   - Atualizar CHANGELOG.md
   - Notificar equipe

3. **Deploy Gradual:**
   - Horário: Fora do pico (2h-6h da manhã)
   - Monitoramento: Primeiras 24h
   - Rollback preparado (backup DB + código anterior)

### Se ALGUM critério falhar ❌:

1. **Investigar Causa Raiz:**
   - Revisar logs de erro
   - Comparar com versão anterior
   - Identificar módulo problemático

2. **Corrigir e Re-testar:**
   - Aplicar fix
   - Re-executar teste que falhou
   - Re-executar suite completa

3. **Não Deploy até 100% ✅**

---

## 8. Contatos de Suporte

**Em caso de problemas em staging:**

- **Backend:** [Seu nome/equipe]
- **DevOps:** [Equipe de infra]
- **Redis:** [Admin Redis]

**Logs de Monitoramento:**
- Sentry: `https://sentry.io/seu-projeto/staging`
- Grafana: `https://grafana.seuapp.com`
- Loki: `https://loki.seuapp.com`

---

**Data:** 2026-01-31
**Versão:** 1.0
**Responsável:** [Seu nome]
