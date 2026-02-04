# Guia de Migração TypeScript - Inboxx

**Objetivo:** Migrar componentes de layout para usar o novo sistema de tipos type-safe.

---

## 📋 Pré-requisitos

1. ✅ Arquivo `/web/src/tipos/layout.tipos.ts` criado
2. ✅ TypeScript 5.7+ instalado
3. ✅ VSCode ou IDE com suporte a TypeScript

---

## 🚀 Migração Componente por Componente

### 1. SidebarSecundaria.tsx

#### Estado Atual (ANTES):

```typescript
// web/src/componentes/layout/SidebarSecundaria.tsx

interface SidebarSecundariaProps {
  children: ReactNode;
  className?: string;
  largura?: 'sm' | 'md' | 'lg';
}

interface SecaoSidebarProps {
  titulo?: string;
  children: ReactNode;
  className?: string;
}

interface ItemSidebarProps {
  icone?: ReactNode;
  label: string;
  badge?: number | string;
  ativo?: boolean;
  onClick?: () => void;
  className?: string;
}

interface CabecalhoSidebarProps {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  className?: string;
}

interface BuscaSidebarProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  className?: string;
}
```

#### Estado Alvo (DEPOIS):

```typescript
// web/src/componentes/layout/SidebarSecundaria.tsx

import type {
  SidebarSecundariaProps,
  SecaoSidebarProps,
  ItemSidebarProps,
  CabecalhoSidebarProps,
  BuscaSidebarProps,
} from '@/tipos/layout.tipos';

// Remover todas as interfaces locais
// Usar tipos importados diretamente
```

#### Comandos de Migração:

```bash
# 1. Backup do arquivo original
cp web/src/componentes/layout/SidebarSecundaria.tsx web/src/componentes/layout/SidebarSecundaria.tsx.bak

# 2. Editar arquivo (usar o comando Edit abaixo)
```

#### Edição do Arquivo:

**Substituir linhas 8-27 por:**

```typescript
import type {
  SidebarSecundariaProps,
  SecaoSidebarProps,
  ItemSidebarProps,
  CabecalhoSidebarProps,
  BuscaSidebarProps,
} from '@/tipos/layout.tipos';
```

#### Validação:

```bash
# Verificar erros de TypeScript
cd /code/web
npx tsc --noEmit

# Deve retornar 0 erros
```

---

### 2. MenuLateral.tsx

#### Estado Atual (ANTES):

```typescript
// web/src/componentes/layout/MenuLateral.tsx (linha 43-48)

interface ItemMenu {
  titulo: string;
  icone: React.ElementType;
  href: string;
  permissao?: string;
}
```

#### Estado Alvo (DEPOIS):

```typescript
// web/src/componentes/layout/MenuLateral.tsx

import type { ItemMenu } from '@/tipos/layout.tipos';

// Remover interface local
```

#### Edição do Arquivo:

**Substituir linhas 43-48 por:**

```typescript
import type { ItemMenu } from '@/tipos/layout.tipos';
```

**Atualizar importações no topo do arquivo:**

```typescript
import { memo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { ElementType } from 'react'; // Remover (não usado mais)
```

---

### 3. CardItem.tsx

#### Estado Atual (ANTES):

```typescript
// web/src/componentes/layout/CardItem.tsx (linha 16-29)

interface AcaoCard {
  label: string;
  icone?: ReactNode;
  onClick: () => void;
  variante?: 'default' | 'destructive';
}

interface CardItemProps {
  children: ReactNode;
  acoes?: AcaoCard[];
  onClick?: () => void;
  selecionado?: boolean;
  className?: string;
}
// ... mais interfaces
```

#### Estado Alvo (DEPOIS):

```typescript
import type {
  AcaoCard,
  CardItemProps,
  CardItemConteudoProps,
  CardItemAvatarProps,
  GridCardsProps,
  ListaCardsProps,
} from '@/tipos/layout.tipos';
```

#### Edição do Arquivo:

**Substituir linhas 16-255 (todas as interfaces) por:**

```typescript
import type {
  AcaoCard,
  CardItemProps,
  CardItemConteudoProps,
  CardItemAvatarProps,
  AvatarSize,
  GridColumns,
  GridCardsProps,
  ListaCardsProps,
} from '@/tipos/layout.tipos';
```

**Atualizar mapa de tamanhos de avatar:**

```typescript
// Linha 148 - Manter implementação mas usar tipo importado
const tamanhoAvatar: Record<AvatarSize, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

const colunasGrid: Record<GridColumns, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
};
```

---

### 4. EstadoVazio.tsx

#### Estado Atual (ANTES):

```typescript
// web/src/componentes/layout/EstadoVazio.tsx (linha 10)

type VarianteEstadoVazio = 'padrao' | 'busca' | 'erro' | 'inbox';

interface EstadoVazioProps {
  titulo: string;
  descricao?: string;
  icone?: ReactNode;
  variante?: VarianteEstadoVazio;
  acao?: {
    label: string;
    onClick: () => void;
  };
  acaoSecundaria?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}
```

#### Estado Alvo (DEPOIS):

```typescript
import type {
  EmptyStateVariant,
  EstadoVazioProps,
  EstadoCarregandoProps,
  EstadoErroProps,
  EstadoBuscaVaziaProps,
} from '@/tipos/layout.tipos';
```

#### Edição do Arquivo:

**Substituir linhas 10-26 por:**

```typescript
import type {
  EmptyStateVariant,
  EstadoVazioProps,
  EstadoCarregandoProps,
  EstadoErroProps,
  EstadoBuscaVaziaProps,
} from '@/tipos/layout.tipos';
```

**Atualizar mapas de ícones e cores:**

```typescript
// Linha 32 - Usar tipo importado
const iconesPorVariante: Record<EmptyStateVariant, ReactNode> = {
  padrao: <PackageOpen className="h-16 w-16" />,
  busca: <Search className="h-16 w-16" />,
  erro: <AlertCircle className="h-16 w-16" />,
  inbox: <Inbox className="h-16 w-16" />,
};

const coresPorVariante: Record<EmptyStateVariant, string> = {
  padrao: 'text-muted-foreground/50',
  busca: 'text-muted-foreground/50',
  erro: 'text-destructive/50',
  inbox: 'text-primary/50',
};
```

---

### 5. CabecalhoPagina.tsx

#### Estado Atual (ANTES):

```typescript
// web/src/componentes/layout/CabecalhoPagina.tsx (linha 8-15)

interface CabecalhoPaginaProps {
  titulo: string;
  subtitulo?: string;
  icone?: ReactNode;
  acoes?: ReactNode;
  className?: string;
  comBorda?: boolean;
}

interface BarraAcoesProps {
  children: ReactNode;
  className?: string;
}
```

#### Estado Alvo (DEPOIS):

```typescript
import type {
  CabecalhoPaginaProps,
  BarraAcoesProps,
} from '@/tipos/layout.tipos';
```

---

### 6. FiltrosRapidos.tsx (Opcional - verificar se existe)

Se o arquivo `FiltrosRapidos.tsx` existe:

#### Importar tipos:

```typescript
import type {
  OpcaoFiltro,
  ChipFiltroProps,
  CampoBuscaProps,
  FiltroSelectProps,
} from '@/tipos/layout.tipos';
```

---

## 🔧 Script de Migração Automatizada

### Script Bash para Migração em Lote

Crie o arquivo `/code/scripts/migrate-layout-types.sh`:

```bash
#!/bin/bash

# Script de migração de tipos de layout
# Uso: ./scripts/migrate-layout-types.sh

set -e

LAYOUT_DIR="/code/web/src/componentes/layout"
BACKUP_DIR="/code/web/src/componentes/layout/.backup-$(date +%Y%m%d-%H%M%S)"

echo "🚀 Iniciando migração de tipos de layout..."

# 1. Criar backup
echo "📦 Criando backup em $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r "$LAYOUT_DIR"/*.tsx "$BACKUP_DIR/"

# 2. Adicionar exportação em tipos/index.ts
echo "📝 Atualizando tipos/index.ts..."
if ! grep -q "layout.tipos" /code/web/src/tipos/index.ts; then
  echo "export * from './layout.tipos';" >> /code/web/src/tipos/index.ts
fi

# 3. Validar TypeScript
echo "✅ Validando TypeScript..."
cd /code/web
npx tsc --noEmit

if [ $? -eq 0 ]; then
  echo "✅ Migração concluída com sucesso!"
  echo "📂 Backup salvo em: $BACKUP_DIR"
else
  echo "❌ Erros de TypeScript encontrados. Reverta o backup se necessário."
  exit 1
fi
```

### Executar Script:

```bash
chmod +x /code/scripts/migrate-layout-types.sh
./code/scripts/migrate-layout-types.sh
```

---

## 📊 Validação Pós-Migração

### Checklist de Validação:

```bash
# 1. Zero erros de TypeScript
cd /code/web
npx tsc --noEmit
# Output esperado: "0 errors"

# 2. Build de produção
npm run build
# Output esperado: Build bem-sucedido

# 3. Testes (se existirem)
npm test
# Output esperado: Todos os testes passando

# 4. Lint
npx eslint src/componentes/layout/*.tsx
# Output esperado: 0 erros
```

### Validação Manual de Autocomplete:

Abra cada arquivo no VSCode e verifique:

1. **SidebarSecundaria.tsx:**
   ```typescript
   <SidebarSecundaria largura="..." />
   //                        ^ Autocomplete: sm, md, lg
   ```

2. **CardItem.tsx:**
   ```typescript
   <CardItemAvatar tamanho="..." />
   //                      ^ Autocomplete: sm, md, lg
   ```

3. **EstadoVazio.tsx:**
   ```typescript
   <EstadoVazio variante="..." />
   //                    ^ Autocomplete: padrao, busca, erro, inbox
   ```

---

## 🐛 Troubleshooting

### Problema 1: "Cannot find module '@/tipos/layout.tipos'"

**Causa:** Path alias não configurado ou cache do TypeScript.

**Solução:**
```bash
# 1. Verificar tsconfig.json
cat /code/web/tsconfig.json | grep -A 3 "paths"

# Deve conter:
# "paths": {
#   "@/*": ["./src/*"]
# }

# 2. Limpar cache do TypeScript (VSCode)
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 3. Verificar se o arquivo existe
ls -la /code/web/src/tipos/layout.tipos.ts
```

---

### Problema 2: "Type 'X' is not assignable to type 'Y'"

**Causa:** Props incompatíveis após migração.

**Solução:**
```bash
# 1. Verificar se todas as interfaces foram removidas
grep -n "interface.*Props" /code/web/src/componentes/layout/SidebarSecundaria.tsx

# Não deve retornar nada (todas devem ser importadas)

# 2. Verificar importações duplicadas
grep -n "import.*layout.tipos" /code/web/src/componentes/layout/*.tsx
```

---

### Problema 3: Autocomplete não funciona

**Causa:** Cache do VSCode ou extensão TypeScript desatualizada.

**Solução:**
```bash
# 1. Reiniciar TypeScript Server
# VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 2. Recarregar janela
# VSCode: Ctrl+Shift+P → "Developer: Reload Window"

# 3. Verificar versão do TypeScript
npx tsc --version
# Deve ser >= 5.7.0

# 4. Atualizar se necessário
npm install -D typescript@latest
```

---

## 📚 Exemplos de Uso Pós-Migração

### Exemplo 1: SidebarSecundaria com Type-Safety

```typescript
import { SidebarSecundaria, CabecalhoSidebar, ItemSidebar } from '@/componentes/layout';
import type { SidebarWidth } from '@/tipos/layout.tipos';

function MinhaPagina() {
  const largura: SidebarWidth = 'md'; // ✅ Autocomplete

  return (
    <SidebarSecundaria largura={largura}>
      <CabecalhoSidebar
        titulo="Filtros"
        subtitulo="Gerencie seus filtros"
      />
      <ItemSidebar
        icone={<Users className="h-4 w-4" />}
        label="Todos"
        badge={42}
        ativo={true}
        onClick={() => {}}
      />
    </SidebarSecundaria>
  );
}
```

### Exemplo 2: CardItem com Actions Type-Safe

```typescript
import { CardItem, CardItemAvatar } from '@/componentes/layout';
import type { AcaoCard } from '@/tipos/layout.tipos';

function ListaContatos() {
  const acoes: AcaoCard[] = [
    {
      label: 'Editar',
      icone: <Pencil className="h-4 w-4" />,
      onClick: () => {},
      variante: 'default', // ✅ Autocomplete: default, destructive
    },
    {
      label: 'Excluir',
      icone: <Trash2 className="h-4 w-4" />,
      onClick: () => {},
      variante: 'destructive',
    },
  ];

  return (
    <CardItem acoes={acoes}>
      <CardItemAvatar
        nome="João Silva"
        subtitulo="joao@email.com"
        tamanho="md" // ✅ Autocomplete: sm, md, lg
      />
    </CardItem>
  );
}
```

### Exemplo 3: EstadoVazio com Variantes

```typescript
import { EstadoVazio } from '@/componentes/layout';
import type { EmptyStateVariant } from '@/tipos/layout.tipos';

function MeuComponente() {
  const variante: EmptyStateVariant = 'busca'; // ✅ Autocomplete

  return (
    <EstadoVazio
      titulo="Nenhum resultado"
      descricao="Tente ajustar seus filtros"
      variante={variante}
      acao={{
        label: 'Limpar filtros',
        onClick: () => {},
      }}
    />
  );
}
```

---

## 🎯 Próximos Passos

### Após migração dos componentes de layout:

1. **Migrar Páginas:**
   - Atualizar `Contatos.tsx`, `Dashboard.tsx`, etc.
   - Substituir union types inline por tipos importados

2. **Criar Novos Componentes:**
   - Implementar `AppLayout.tsx` (compound component)
   - Criar `BarraFiltros.tsx` com type-safety

3. **Documentação:**
   - Adicionar exemplos em CLAUDE.md
   - Criar Storybook (opcional)

4. **Testes:**
   - Criar testes unitários para componentes
   - Adicionar testes de tipo (type-level tests)

---

## ✅ Conclusão

Após seguir este guia:

- ✅ Todos os componentes de layout usam tipos centralizados
- ✅ Autocomplete perfeito em todas as props
- ✅ Zero erros de TypeScript
- ✅ Código mais limpo e manutenível
- ✅ Fácil adicionar novos componentes com type-safety

**Tempo estimado:** 2-3 horas para migração completa de todos os componentes de layout.

---

**Autor:** TypeScript Pro Agent
**Versão:** 1.0.0
**Data:** 04 de Fevereiro de 2026
