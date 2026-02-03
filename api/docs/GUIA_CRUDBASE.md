# Guia de Uso: CRUDBase

## 🎯 O Que É a CRUDBase?

A **CRUDBase** é uma classe genérica que elimina código duplicado em módulos CRUD, fornecendo:

- ✅ **Operações CRUD** completas (listar, obterPorId, criar, atualizar, excluir)
- ✅ **Paginação e busca** automáticas
- ✅ **Validação de nome único** por padrão
- ✅ **Subconsultas** para colunas calculadas (elimina N+1 queries)
- ✅ **Cache Redis** automático (opcional)
- ✅ **clienteId nullable** para entidades globais (opcional)
- ✅ **Hooks** sobrescrevíveis para lógica customizada

---

## 🤔 Quando Usar CRUDBase?

### ✅ USE em Casos IDEAIS

**Características:**
- CRUD padrão com `clienteId`
- 0-2 subconsultas simples (COUNT, SUM)
- Poucos ou nenhum método customizado
- Validação de nome único é suficiente

**Exemplos:** Etiquetas, categorias, tipos, status, prioridades

**Redução esperada:** 50-70% de código

---

### 🟡 CONSIDERE em Casos MODERADOS

**Características:**
- CRUD + lógica de negócio moderada
- 2-3 subconsultas ou relacionamentos 1:N
- Métodos customizados que podem ser isolados
- Sobrescrita de 1-2 métodos é aceitável

**Exemplos:** Equipes, fluxos, projetos, tarefas

**Redução esperada:** 15-25% de código

---

### ❌ NÃO USE em Casos COMPLEXOS

**Características:**
- Lógica de negócio muito complexa (máquinas de estado)
- Filtro principal não é `clienteId` (usa outro ID)
- Múltiplos JOINs complexos ou GROUP BY
- Workers, cache complexo, Meilisearch integrados

**Exemplos:** Mensagens, conversas, campanhas, contatos

**Mantenha código customizado!**

---

## 📖 Guia Rápido por Padrão

### Padrão 1: CRUD Puro (Caso IDEAL)

**Use quando:** Módulo sem lógica especial, apenas CRUD básico

```typescript
import { sql } from 'drizzle-orm';
import { etiquetas } from '../../infraestrutura/banco/schema/index.js';
import { CRUDBase } from '../../compartilhado/servicos/crud-base.servico.js';
import type { CriarEtiquetaDTO, AtualizarEtiquetaDTO } from './etiquetas.schema.js';

// Definir subconsulta (opcional)
const totalContatosSubquery = sql<number>`(
  SELECT count(*) FROM contatos_etiquetas
  WHERE contatos_etiquetas.etiqueta_id = ${etiquetas.id}
)`.mapWith(Number);

// Criar serviço
class EtiquetasServico extends CRUDBase<
  typeof etiquetas,
  Etiqueta,
  CriarEtiquetaDTO,
  AtualizarEtiquetaDTO
> {
  constructor() {
    super(etiquetas, 'Etiqueta', {
      camposBusca: ['nome'], // Campos para busca textual
      subconsultas: {
        totalContatos: () => totalContatosSubquery, // Opcional
      },
    });
  }

  // 100% dos métodos herdados automaticamente!
  // Nenhuma sobrescrita necessária.
}

export const etiquetasServico = new EtiquetasServico();
```

**Benefícios:**
- ✅ 100% dos métodos herdados
- ✅ Paginação automática
- ✅ Busca por campos configurados
- ✅ Validação de nome único
- ✅ Subconsulta injetada em listar() e obterPorId()

---

### Padrão 2: CRUD + Métodos Customizados

**Use quando:** Precisa preservar métodos específicos do domínio

```typescript
class EquipesServico extends CRUDBase<...> {
  constructor() {
    super(equipes, 'Equipe', {
      camposBusca: ['nome', 'descricao'],
      subconsultas: {
        totalMembros: () => totalMembrosSubquery,
        totalConversas: () => totalConversasSubquery,
      },
    });
  }

  // Sobrescrever obterPorId para incluir dados extras
  async obterPorId(clienteId: string, id: string) {
    const equipe = await super.obterPorId(clienteId, id);

    // Buscar membros separadamente
    const membros = await db.select(/* ... */)
      .from(usuarios)
      .where(eq(usuarios.equipeId, id));

    return { ...equipe, membros };
  }

  // Métodos customizados preservados
  async adicionarMembro(clienteId: string, equipeId: string, usuarioId: string) {
    // Lógica específica de negócio
    await db.update(usuarios)
      .set({ equipeId })
      .where(eq(usuarios.id, usuarioId));
  }

  async removerMembro(clienteId: string, equipeId: string, usuarioId: string) {
    // Lógica específica de negócio
    await db.update(usuarios)
      .set({ equipeId: null })
      .where(eq(usuarios.id, usuarioId));
  }
}
```

**Benefícios:**
- ✅ Herda listar(), criar(), atualizar(), excluir()
- ✅ Sobrescreve apenas o necessário
- ✅ Preserva métodos de domínio

---

### Padrão 3: CRUD Avançado (Cache + Nullable + Hooks)

**Use quando:** Precisa de todos os recursos (cache, entidades globais, hooks)

```typescript
class PerfisServico extends CRUDBase<...> {
  constructor() {
    super(perfis, 'Perfil', {
      camposBusca: ['nome', 'descricao'],
      subconsultas: {
        totalUsuarios: () => totalUsuariosSubquery,
      },
      cache: {
        namespace: 'perfis', // Namespace do Redis
        ttl: 3600, // 1 hora (em segundos)
      },
      clienteIdNullable: true, // Suporta perfis globais (clienteId = null)
    });
  }

  // Sobrescrever para validações especiais
  async atualizar(clienteId: string | null, id: string, dados: AtualizarPerfilDTO) {
    // Validações customizadas
    const perfil = await db.select()
      .from(perfis)
      .where(eq(perfis.id, id))
      .limit(1);

    if (perfil[0].clienteId === null) {
      throw new ErroValidacao('Perfis globais não podem ser editados');
    }

    // Chamar método da base (valida nome único automaticamente)
    return await super.atualizar(clienteId, id, dados);
  }

  // Hook customizado para invalidar cache adicional
  protected async afterUpdate(id: string): Promise<void> {
    await super.afterUpdate(id); // Invalida cache padrão (obter:{id})

    // Invalidar cache customizado (permissões)
    if (this.cacheServico) {
      await this.cacheServico.delete(`permissoes:${id}`);
    }
  }

  // Hook customizado após exclusão
  protected async afterDelete(id: string): Promise<void> {
    await super.afterDelete(id);

    // Lógica adicional após excluir
    if (this.cacheServico) {
      await this.cacheServico.delete(`permissoes:${id}`);
    }
  }
}
```

**Benefícios:**
- ✅ Cache automático em obterPorId()
- ✅ Invalidação automática em criar/atualizar/excluir
- ✅ Hooks para cache customizado
- ✅ clienteId nullable (WHERE clienteId = ? OR clienteId IS NULL)

---

## 🔧 Referência de Configuração

### Opções do Construtor

```typescript
interface CRUDBaseOpcoes<TTabela> {
  // Campos para busca textual (ILIKE)
  camposBusca?: string[]; // Padrão: ['nome']

  // Subconsultas (colunas calculadas)
  subconsultas?: {
    [campo: string]: (tabela: TTabela) => SQL;
  };

  // Cache Redis
  cache?: {
    namespace: string; // Ex: 'perfis', 'equipes'
    ttl?: number; // Tempo de vida em segundos (padrão: 300)
  };

  // Suporte a entidades globais
  clienteIdNullable?: boolean; // Padrão: false
}
```

---

### Métodos Herdados

Todos os serviços CRUDBase herdam automaticamente:

#### `listar(clienteId, query, condicoesAdicionais?)`
```typescript
const resultado = await servico.listar(clienteId, {
  pagina: 1,
  limite: 20,
  busca: 'termo', // Busca nos camposBusca configurados
  ordenarPor: 'nome', // Campo para ordenação
  ordem: 'asc', // 'asc' ou 'desc'
});

// Retorna:
{
  dados: [...], // Array de registros (com subconsultas injetadas)
  meta: {
    pagina: 1,
    limite: 20,
    total: 100,
    totalPaginas: 5
  }
}
```

#### `obterPorId(clienteId, id)`
```typescript
const registro = await servico.obterPorId(clienteId, 'uuid-123');
// Retorna o registro (com subconsultas injetadas)
// Usa cache se configurado
```

#### `criar(clienteId, dados)`
```typescript
const novo = await servico.criar(clienteId, {
  nome: 'Novo Item',
  // ... outros campos
});
// Valida nome único automaticamente
// Chama hook afterCreate()
```

#### `atualizar(clienteId, id, dados)`
```typescript
const atualizado = await servico.atualizar(clienteId, 'uuid-123', {
  nome: 'Nome Atualizado',
});
// Verifica existência
// Valida nome único (se mudando)
// Invalida cache automaticamente
// Chama hook afterUpdate()
```

#### `excluir(clienteId, id)`
```typescript
await servico.excluir(clienteId, 'uuid-123');
// Verifica existência
// Invalida cache automaticamente
// Chama hook afterDelete()
```

---

### Hooks Sobrescrevíveis

```typescript
// Executado após criar
protected async afterCreate(id: string): Promise<void> {
  // Hook vazio por padrão - sobrescreva se necessário
}

// Executado após atualizar
protected async afterUpdate(id: string): Promise<void> {
  if (this.cacheServico) {
    await this.cacheServico.delete(`obter:${id}`);
  }
  // Sobrescreva para invalidar cache adicional
}

// Executado após excluir
protected async afterDelete(id: string): Promise<void> {
  if (this.cacheServico) {
    await this.cacheServico.delete(`obter:${id}`);
  }
  // Sobrescreva para invalidar cache adicional
}
```

---

## 📝 Checklist de Migração

Use esta checklist ao migrar um módulo existente para CRUDBase:

### 1. Análise Prévia
- [ ] Módulo usa CRUD padrão com `clienteId`?
- [ ] Tem 0-3 subconsultas simples?
- [ ] Lógica de negócio é moderada (não complexa)?
- [ ] Validação de nome único é suficiente?

**Se todas as respostas são SIM, continue. Se não, reconsidere.**

### 2. Preparação
- [ ] Criar backup: `cp modulo.servico.ts modulo.servico.original.ts`
- [ ] Identificar subconsultas existentes (buscar por `sql<number>`)
- [ ] Identificar métodos customizados que devem ser preservados
- [ ] Identificar validações especiais

### 3. Implementação
- [ ] Criar interface de tipo para os dados
- [ ] Definir subconsultas fora da classe
- [ ] Criar classe estendendo CRUDBase
- [ ] Configurar opções no construtor (camposBusca, subconsultas, cache, nullable)
- [ ] Sobrescrever métodos se necessário (validações especiais)
- [ ] Implementar métodos customizados preservados
- [ ] Exportar instância singleton

### 4. Validação
- [ ] Executar `npx tsc --noEmit` (zero erros)
- [ ] Executar testes do módulo (100% passando)
- [ ] Verificar cobertura de código (manter ou melhorar)
- [ ] Testar manualmente em staging (smoke tests)

### 5. Documentação
- [ ] Adicionar JSDoc na classe
- [ ] Adicionar bloco de comparação antes/depois no final do arquivo
- [ ] Atualizar imports se necessário

---

## 🎯 Exemplos Práticos

### Exemplo 1: Módulo Simples (Categorias)

```typescript
import { sql } from 'drizzle-orm';
import { categorias } from '../../infraestrutura/banco/schema/index.js';
import { CRUDBase } from '../../compartilhado/servicos/crud-base.servico.js';

const totalProdutosSubquery = sql<number>`(
  SELECT count(*) FROM produtos WHERE produtos.categoria_id = ${categorias.id}
)`.mapWith(Number);

class CategoriasServico extends CRUDBase<
  typeof categorias,
  Categoria,
  CriarCategoriaDTO,
  AtualizarCategoriaDTO
> {
  constructor() {
    super(categorias, 'Categoria', {
      camposBusca: ['nome', 'descricao'],
      subconsultas: {
        totalProdutos: () => totalProdutosSubquery,
      },
    });
  }
}

export const categoriasServico = new CategoriasServico();
```

**Redução esperada:** ~60%

---

### Exemplo 2: Módulo com Filtros Customizados

```typescript
class ProdutosServico extends CRUDBase<...> {
  constructor() {
    super(produtos, 'Produto', {
      camposBusca: ['nome', 'descricao', 'sku'],
      subconsultas: {
        totalVendas: () => totalVendasSubquery,
      },
    });
  }

  // Sobrescrever listar para adicionar filtros customizados
  async listar(clienteId: string, query: ListarProdutosQuery) {
    const condicoesAdicionais: SQL<unknown>[] = [];

    // Filtro: categoria
    if (query.categoriaId) {
      condicoesAdicionais.push(eq(produtos.categoriaId, query.categoriaId));
    }

    // Filtro: ativo
    if (query.ativo !== undefined) {
      condicoesAdicionais.push(eq(produtos.ativo, query.ativo));
    }

    // Filtro: faixa de preço
    if (query.precoMin) {
      condicoesAdicionais.push(gte(produtos.preco, query.precoMin));
    }
    if (query.precoMax) {
      condicoesAdicionais.push(lte(produtos.preco, query.precoMax));
    }

    return await super.listar(clienteId, query, condicoesAdicionais);
  }
}
```

---

### Exemplo 3: Módulo com Cache

```typescript
class ConfiguracoesServico extends CRUDBase<...> {
  constructor() {
    super(configuracoes, 'Configuração', {
      camposBusca: ['chave', 'descricao'],
      cache: {
        namespace: 'configuracoes',
        ttl: 7200, // 2 horas (configurações mudam raramente)
      },
    });
  }

  // Método customizado que também usa cache
  async obterPorChave(clienteId: string, chave: string) {
    const chaveCache = `chave:${chave}`;

    if (this.cacheServico) {
      const cached = await this.cacheServico.get(chaveCache);
      if (cached) return cached;
    }

    const resultado = await db.select()
      .from(configuracoes)
      .where(and(
        eq(configuracoes.clienteId, clienteId),
        eq(configuracoes.chave, chave)
      ))
      .limit(1);

    if (resultado.length === 0) {
      throw new ErroNaoEncontrado('Configuração não encontrada');
    }

    if (this.cacheServico) {
      await this.cacheServico.set(chaveCache, resultado[0], 7200);
    }

    return resultado[0];
  }

  // Invalidar cache customizado após atualizar
  protected async afterUpdate(id: string): Promise<void> {
    await super.afterUpdate(id);

    // Invalidar todos os caches de configurações
    if (this.cacheServico) {
      await this.cacheServico.invalidar('chave:*');
    }
  }
}
```

---

## ⚠️ Armadilhas Comuns

### 1. Subconsultas sem `.mapWith()`

❌ **Errado:**
```typescript
const totalSubquery = sql<number>`(SELECT count(*) FROM ...)`;
```

✅ **Correto:**
```typescript
const totalSubquery = sql<number>`(SELECT count(*) FROM ...)`.mapWith(Number);
```

---

### 2. Validação Customizada sem Chamar `super`

❌ **Errado:**
```typescript
async criar(clienteId: string, dados: CriarDTO) {
  // Validação customizada
  if (dados.especial) {
    throw new ErroValidacao('Campo especial inválido');
  }

  // Reescreve tudo manualmente (perde validação de nome único!)
  return await db.insert(tabela).values({...});
}
```

✅ **Correto:**
```typescript
async criar(clienteId: string, dados: CriarDTO) {
  // Validação customizada ANTES
  if (dados.especial) {
    throw new ErroValidacao('Campo especial inválido');
  }

  // Chamar super para manter validações da base
  return await super.criar(clienteId, dados);
}
```

---

### 3. Esquecer de Invalidar Cache nos Hooks

❌ **Errado:**
```typescript
protected async afterUpdate(id: string): Promise<void> {
  // Esqueceu de chamar super.afterUpdate()!
  await this.cacheServico?.delete(`custom:${id}`);
}
```

✅ **Correto:**
```typescript
protected async afterUpdate(id: string): Promise<void> {
  await super.afterUpdate(id); // Invalida cache padrão
  await this.cacheServico?.delete(`custom:${id}`); // Adiciona invalidação customizada
}
```

---

## 📚 Recursos Adicionais

### Arquivos de Referência no Projeto

- **Caso IDEAL:** `api/src/modulos/etiquetas/etiquetas.servico.ts`
- **Caso MODERADO:** `api/src/modulos/equipes/equipes.servico.ts`
- **Caso AVANÇADO:** `api/src/modulos/perfis/perfis.servico.ts`
- **Testes:** `api/src/compartilhado/servicos/__tests__/crud-base.spec.ts`

### Documentação Adicional

- `/code/IMPLEMENTACAO_CRUD_BASE.md` - Fundação e arquitetura
- `/code/FASE_2_MIGRACOES_CONCLUIDAS.md` - Migrações detalhadas
- `/code/RESUMO_FINAL_MIGRACOES.md` - Visão geral completa

---

## 🆘 Precisa de Ajuda?

1. **Não sabe se deve usar CRUDBase?** → Veja a seção "Quando Usar CRUDBase?"
2. **Erro de tipo TypeScript?** → Verifique os generics na declaração da classe
3. **Subconsulta não aparece?** → Verifique se adicionou `.mapWith(Number)`
4. **Cache não funciona?** → Confirme que Redis está rodando e conectado
5. **Validação de nome único não funciona?** → Confirme que a tabela tem coluna `nome`

---

**Última atualização:** 2026-01-31
**Versão:** 1.0
