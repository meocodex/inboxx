# ✅ Checklist de Migração para CRUDBase

## Análise Prévia (5 min)

### Perguntas Decisivas

- [ ] **P1:** O módulo usa CRUD padrão com `clienteId`?
- [ ] **P2:** Tem 0-3 subconsultas simples (COUNT, SUM)?
- [ ] **P3:** Lógica de negócio é simples/moderada (não complexa)?
- [ ] **P4:** Validação de nome único é suficiente?

**✅ Se SIM para todas: MIGRAR!**
**❌ Se NÃO para 2+: NÃO MIGRAR!**

---

## Preparação (5 min)

- [ ] Criar backup: `cp modulo.servico.ts modulo.servico.original.ts`
- [ ] Identificar subconsultas: Buscar por `sql<number>`
- [ ] Identificar métodos customizados a preservar
- [ ] Identificar validações especiais

---

## Implementação (15-30 min)

### 1. Estrutura Base

```typescript
import { sql } from 'drizzle-orm';
import { tabela } from '../../infraestrutura/banco/schema/index.js';
import { CRUDBase } from '../../compartilhado/servicos/crud-base.servico.js';

// Tipos
export interface NomeEntidade {
  id: string;
  clienteId: string;
  nome: string;
  // ...campos
  campoCalculado?: number; // Subconsulta
}

// Subconsultas (SE HOUVER)
const campoCalculadoSubquery = sql<number>`(
  SELECT count(*) FROM outra_tabela WHERE outra_tabela.ref_id = ${tabela.id}
)`.mapWith(Number);

// Serviço
class NomeServico extends CRUDBase<
  typeof tabela,
  NomeEntidade,
  CriarDTO,
  AtualizarDTO
> {
  constructor() {
    super(tabela, 'NomeEntidade', {
      camposBusca: ['nome'], // AJUSTAR
      subconsultas: { // OPCIONAL
        campoCalculado: () => campoCalculadoSubquery,
      },
    });
  }
}

export const nomeServico = new NomeServico();
```

- [ ] ✅ Criar interface de tipo
- [ ] ✅ Definir subconsultas (se houver)
- [ ] ✅ Criar classe estendendo CRUDBase
- [ ] ✅ Configurar `camposBusca`
- [ ] ✅ Configurar `subconsultas` (se houver)
- [ ] ✅ Exportar singleton

### 2. Sobrescritas (SE NECESSÁRIO)

**Sobrescrever `listar()` para filtros adicionais:**
```typescript
async listar(clienteId: string, query: ListarQuery) {
  const condicoesAdicionais: SQL<unknown>[] = [];

  if (query.filtroCustomizado) {
    condicoesAdicionais.push(eq(tabela.campo, query.filtroCustomizado));
  }

  return await super.listar(clienteId, query, condicoesAdicionais);
}
```

- [ ] ✅ Sobrescrever `listar()` se precisa filtros adicionais
- [ ] ✅ Sobrescrever `obterPorId()` se precisa dados extras
- [ ] ✅ Sobrescrever `criar()` se precisa lógica pré/pós-criação
- [ ] ✅ Sobrescrever `atualizar()` se precisa validações especiais
- [ ] ✅ Sobrescrever `excluir()` se precisa validações especiais

### 3. Métodos Customizados

```typescript
async metodoCustomizado(clienteId: string, params: any) {
  // Lógica específica do domínio
}
```

- [ ] ✅ Preservar todos os métodos customizados
- [ ] ✅ Usar `this.obterPorId()` quando apropriado
- [ ] ✅ Manter validações de negócio

### 4. Cache (OPCIONAL)

```typescript
constructor() {
  super(tabela, 'Nome', {
    // ... outras opções
    cache: {
      namespace: 'nome_modulo',
      ttl: 3600, // 1 hora
    },
  });
}

// Hook para cache adicional
protected async afterUpdate(id: string): Promise<void> {
  await super.afterUpdate(id);
  await this.cacheServico?.delete(`custom:${id}`);
}
```

- [ ] ✅ Adicionar `cache` se módulo se beneficia de cache
- [ ] ✅ Definir TTL apropriado (300s padrão, 3600s para dados estáveis)
- [ ] ✅ Sobrescrever hooks se precisa invalidar cache adicional

---

## Validação (10 min)

### Compilação

```bash
npx tsc --noEmit
```

- [ ] ✅ Zero erros TypeScript

### Testes

```bash
npm test -- nome-modulo
```

- [ ] ✅ Todos os testes passando (100%)
- [ ] ✅ Cobertura mantida ou melhorada

### Smoke Tests Manuais (Staging)

- [ ] ✅ Listar com paginação (pagina=1, limite=10)
- [ ] ✅ Buscar por termo (busca="teste")
- [ ] ✅ Criar novo registro
- [ ] ✅ Obter por ID
- [ ] ✅ Atualizar registro existente
- [ ] ✅ Validar nome único (tentar criar duplicado)
- [ ] ✅ Excluir registro
- [ ] ✅ Métodos customizados (se houver)
- [ ] ✅ Subconsultas retornam valores corretos
- [ ] ✅ Cache funciona (se configurado): HIT/MISS

---

## Documentação (5 min)

### JSDoc na Classe

```typescript
/**
 * Serviço de gestão de [entidade]
 *
 * Herda operações CRUD básicas da classe CRUDBase:
 * - Subconsulta: [campo] injetada automaticamente
 * - [Outros recursos utilizados]
 *
 * @example Antes (XXX linhas) → Depois (YYY linhas) = ZZ% redução
 */
class NomeServico extends CRUDBase<...> {
```

- [ ] ✅ Adicionar JSDoc na classe
- [ ] ✅ Documentar recursos utilizados
- [ ] ✅ Indicar redução de código

### Bloco de Comparação (Final do Arquivo)

```typescript
/*
ANTES (modulo.servico.original.ts): XXX linhas
- 5 métodos CRUD implementados manualmente
- Subconsultas injetadas manualmente
- [Outras características]

DEPOIS (modulo.servico.ts): YYY linhas
- Herda [métodos] da classe base
- Sobrescreve [métodos] para [razão]
- Subconsultas injetadas automaticamente
- [Outras melhorias]

BENEFÍCIOS:
1. ZZ% menos código
2. [Outros benefícios]

RECURSOS UTILIZADOS:
✅ [Recurso 1]
✅ [Recurso 2]
*/
```

- [ ] ✅ Adicionar bloco de comparação no final
- [ ] ✅ Calcular redução de linhas
- [ ] ✅ Listar benefícios

---

## Finalização

- [ ] ✅ Commit: `git add . && git commit -m "refactor: migrar [modulo] para CRUDBase"`
- [ ] ✅ Code review (se em equipe)
- [ ] ✅ Merge para main
- [ ] ✅ Deploy em staging
- [ ] ✅ Monitorar logs por 24h

---

## 📊 Métricas Esperadas

### Por Complexidade

| Padrão | Redução Esperada | Exemplo |
|--------|------------------|---------|
| **Simples** (100% herdado) | 50-70% | etiquetas (63%) |
| **Moderado** (sobrescritas) | 15-25% | equipes (22%), fluxos (17%) |
| **Avançado** (todos recursos) | 30-40% | perfis (34%) |

### Tempo de Migração

| Complexidade | Tempo Estimado |
|--------------|----------------|
| **Simples** | 20-30 min |
| **Moderado** | 30-60 min |
| **Avançado** | 1-2 horas |

---

## 🆘 Problemas Comuns

### "Erro: Property 'totalX' does not exist"

**Causa:** Subconsulta não definida ou sem `.mapWith()`

**Solução:**
```typescript
const totalSubquery = sql<number>`(...)`.mapWith(Number); // ✅ .mapWith()
```

### "Erro: Já existe X com este nome" não funciona

**Causa:** Tabela não tem coluna `nome` ou validação customizada necessária

**Solução:** Sobrescrever `criar()` e `atualizar()` com validação customizada

### Cache não funciona

**Causa:** Redis não está rodando ou não conectado

**Solução:**
```bash
# Verificar Redis
redis-cli ping
# Deve retornar: PONG
```

### Testes falhando após migração

**Causa:** Assinatura de métodos mudou ou comportamento diferente

**Solução:** Ajustar testes para nova assinatura (pode aceitar `clienteId: string | null`)

---

**Última atualização:** 2026-01-31
