# Design Tokens - Sistema Inboxx

> Documentação do sistema de design tokens centralizado do Inboxx.
>
> **Versão:** 1.0
> **Data:** 2026-02-04
> **Localização:** `/code/web/src/configuracao/tokens-design.ts`

---

## 📋 Índice

- [Cores](#cores)
- [Espaçamento](#espaçamento)
- [Tipografia](#tipografia)
- [Larguras](#larguras)
- [Ícones](#ícones)
- [Bordas e Sombras](#bordas-e-sombras)
- [Transições](#transições)
- [Grid e Breakpoints](#grid-e-breakpoints)
- [Acessibilidade](#acessibilidade)

---

## 🎨 Cores

### Cor Principal (Primary)

**Primary:** `#00D97E` (HSL: 158° 100% 42%)
- Verde vibrante, energético
- Usada em botões principais, links, estados ativos
- **Não usar para texto sobre branco** (contraste insuficiente)

**Variantes:**
- **Hover:** `#00C370` (-10% lightness) - Estado hover de botões
- **Active:** `#00AD62` (-20% lightness) - Estado pressed/active
- **Disabled:** `#80ECB0` (50% opacity) - Elementos desabilitados

### Uso das Cores

```tsx
import { TOKENS_DESIGN } from '@/configuracao/tokens-design';

// Botão primário
<Button className="bg-primary hover:bg-primary-hover" />

// Badge ativo
<Badge style={{ backgroundColor: TOKENS_DESIGN.cores.primary }} />
```

### Cores do Sistema (shadcn/ui)

Baseadas no tema Zinc (definidas em `index.css`):
- **Background:** `#FFFFFF` (light) / `#09090B` (dark)
- **Foreground:** `#18181B` (light) / `#FAFAFA` (dark)
- **Muted:** `#F4F4F5` (light) / `#27272A` (dark)
- **Border:** `#E4E4E7` (light) / `#27272A` (dark)

---

## 📏 Espaçamento

Sistema baseado em múltiplos de 4px (Tailwind padrão).

### Tokens de Espaçamento

| Token | Valor | Uso | Exemplo |
|-------|-------|-----|---------|
| `conteudo` | 24px (p-6) | Padding de conteúdo principal | PageLayout body |
| `card` | 16px (p-4) | Padding interno de cards | Card, Dialog |
| `gap` | 16px (gap-4) | Espaçamento entre elementos | GridCards, flex gap |
| `sidebar` | 12px (p-3) | Padding de sidebar secundária | SidebarSecundaria |

### Aplicação

```tsx
// Conteúdo principal
<div className="p-6">{/* conteudo: 24px */}</div>

// Card interno
<Card className="p-4">{/* card: 16px */}</Card>

// Grid com espaçamento
<div className="grid gap-4">{/* gap: 16px */}</div>
```

### Justificativa

- **p-6 (24px):** Usado em Dashboard, Contatos, Campanhas, Chatbot, Usuários
- **gap-4 (16px):** Padrão em GridCards de todas as páginas principais
- **Consistência:** Todos os componentes seguem o mesmo sistema

---

## ✍️ Tipografia

### Escala Tipográfica

Baseada na escala harmônica de tipografia:

| Classe | Tamanho | Line Height | Uso |
|--------|---------|-------------|-----|
| `xs` | 12px | 16px | Legendas, metadados |
| `sm` | 14px | 20px | Texto secundário, labels |
| `base` | 16px | 24px | Texto body padrão |
| `lg` | 18px | 28px | Subtítulos |
| `xl` | 20px | 28px | Títulos de cards |
| `2xl` | 24px | 32px | Títulos de seções |
| `3xl` | 30px | 36px | Títulos de páginas |
| `4xl` | 36px | 40px | Hero titles |
| `5xl` | 48px | 1 | Display titles |

### Pesos de Fonte

| Peso | Valor | Uso |
|------|-------|-----|
| `normal` | 400 | Texto body |
| `medium` | 500 | Labels, subtítulos |
| `semibold` | 600 | Títulos de cards |
| `bold` | 700 | Títulos principais |

### Aplicação

```tsx
// Título de página
<h1 className="text-3xl font-bold">Contatos</h1>

// Subtítulo
<p className="text-sm text-muted-foreground">Gerencie seus contatos</p>

// Metadado
<span className="text-xs text-muted-foreground">Criado em 04/02</span>
```

---

## 📐 Larguras

### Sidebar Principal (MenuLateral)

**Largura:** `70px` (fixo)
- Ícones verticais de navegação
- Sempre visível (exceto em Conversas)

### Sidebar Secundária

Três tamanhos disponíveis:

| Tamanho | Largura | Uso |
|---------|---------|-----|
| `sm` | 256px | Filtros simples (Kanban, Configurações) |
| `md` | 320px | Navegação padrão (Contatos, Usuários) |
| `lg` | 384px | Navegação complexa (Agenda) |

### Header

**Altura:** `64px` (h-16)
- CabecalhoPagina padrão
- Título + ações

### Aplicação

```tsx
// PageLayout com sidebar média
<PageLayout sidebarWidth="md">...</PageLayout>

// Largura fixa customizada
<div className="w-80">{/* 320px - Lista de conversas */}</div>
```

---

## 🎯 Ícones

### Tamanhos de Ícones

| Tamanho | Valor | Uso |
|---------|-------|-----|
| `xs` | 12px (h-3 w-3) | Badges, metadados |
| `sm` | 16px (h-4 w-4) | Sidebar items, botões secundários |
| `md` | 20px (h-5 w-5) | Header, botões principais |
| `lg` | 24px (h-6 w-6) | Cards destacados |
| `xl` | 32px (h-8 w-8) | Empty states, placeholders |

### Container de Ícones

Para ícones dentro de círculos/quadrados:

```tsx
// Badge circular
<div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
  <Icon className="h-4 w-4 text-white" />
</div>

// Avatar placeholder
<div className="h-10 w-10 rounded-full bg-muted">
  <User className="h-5 w-5" />
</div>
```

---

## 🎨 Bordas e Sombras

### Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `sm` | 4px | Badges, chips |
| `md` | 6px | Botões, inputs (padrão) |
| `lg` | 8px | Cards, dialogs |
| `xl` | 12px | Imagens destacadas |
| `full` | 9999px | Avatares, badges circulares |

### Elevações (Box Shadows)

| Nível | Uso | CSS |
|-------|-----|-----|
| `sm` | Hover sutil | `0 1px 2px rgba(0,0,0,0.05)` |
| `md` | Cards padrão | `0 4px 6px rgba(0,0,0,0.1)` |
| `lg` | Dropdowns, modals | `0 10px 15px rgba(0,0,0,0.1)` |
| `xl` | Dialogs importantes | `0 20px 25px rgba(0,0,0,0.1)` |

### Aplicação

```tsx
// Card com hover
<Card className="hover:shadow-md transition-shadow" />

// Modal
<Dialog className="rounded-lg shadow-xl" />
```

---

## ⏱️ Transições

### Durações

| Duração | Valor | Uso |
|---------|-------|-----|
| `fast` | 150ms | Hover, focus |
| `normal` | 200ms | Animações padrão |
| `slow` | 300ms | Transições complexas |

### Easing

- **Default:** `cubic-bezier(0.4, 0, 0.2, 1)` - Ease-in-out padrão
- **Bounce:** `cubic-bezier(0.68, -0.55, 0.265, 1.55)` - Animações com bounce

### Aplicação

```tsx
// Transição de hover
<Button className="transition-colors duration-200 hover:bg-primary-hover" />

// Slide transition
<div className="transition-transform duration-300 ease-in-out" />
```

---

## 📱 Grid e Breakpoints

### Breakpoints (Tailwind)

| Nome | Min Width | Uso |
|------|-----------|-----|
| `sm` | 640px | Tablets portrait |
| `md` | 768px | Tablets landscape |
| `lg` | 1024px | Desktops pequenos |
| `xl` | 1280px | Desktops médios |
| `2xl` | 1536px | Desktops grandes |

### Sistema de Grid

**GridCards:** Sistema responsivo de cards
- Mobile (< 640px): 1 coluna
- Tablet (≥ 640px): 2 colunas
- Desktop (≥ 1024px): 3 colunas (padrão)

```tsx
// Grid responsivo
<GridCards colunas={3}>
  <CardItem>...</CardItem>
</GridCards>

// Custom breakpoints
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" />
```

---

## ♿ Acessibilidade

### Contraste de Cores (WCAG AA)

| Combinação | Contraste | Status | Uso |
|------------|-----------|--------|-----|
| Muted Foreground / Branco | 4.83:1 | ✅ PASS AA | Texto secundário |
| Foreground / Background | >7:1 | ✅ PASS AAA | Texto principal |
| Primary / Branco | 1.87:1 | ⚠️ FAIL | Não usar para texto |
| Branco / Primary | 1.87:1 | ⚠️ FAIL | Evitar (baixo contraste) |

### Recomendações

**✅ Correto:**
```tsx
// Texto sobre fundo branco
<p className="text-foreground">Texto principal</p>
<p className="text-muted-foreground">Texto secundário</p>

// Botão primário (contraste interno OK)
<Button className="bg-primary text-primary-foreground">Ação</Button>
```

**❌ Evitar:**
```tsx
// Primary usado como cor de texto
<p className="text-primary">Texto</p>

// Branco sobre primary (baixo contraste)
<div className="bg-primary text-white">Evitar</div>
```

### Focus States

Todos os elementos interativos devem ter estado de foco visível:

```tsx
// Ring focus padrão
<Button className="focus:ring-2 focus:ring-primary focus:ring-offset-2" />

// Custom focus
<input className="focus:border-primary focus:outline-none" />
```

### Navegação por Teclado

- **Tab:** Navegar entre elementos
- **Enter/Space:** Ativar botões
- **Esc:** Fechar modals/dropdowns
- **Arrow keys:** Navegar em listas

---

## 🔧 Uso dos Tokens

### Import

```typescript
import { TOKENS_DESIGN } from '@/configuracao/tokens-design';
```

### Acesso

```typescript
// Cores
TOKENS_DESIGN.cores.primary // '#00D97E'
TOKENS_DESIGN.cores.primaryHover // '#00C370'

// Espaçamento
TOKENS_DESIGN.espacamento.conteudo // '24px'
TOKENS_DESIGN.espacamento.gap // '16px'

// Tipografia
TOKENS_DESIGN.tipografia.tamanhos.xl // '20px'
TOKENS_DESIGN.tipografia.pesos.semibold // 600

// Larguras
TOKENS_DESIGN.larguras.sidebarPrincipal // '70px'
TOKENS_DESIGN.larguras.sidebarSecundaria.md // '320px'
```

### Aplicação em Componentes

```tsx
// Inline styles (quando Tailwind não é suficiente)
<div style={{
  backgroundColor: TOKENS_DESIGN.cores.primary,
  padding: TOKENS_DESIGN.espacamento.card
}} />

// CSS variables (já definidas em index.css)
<div className="bg-primary p-6 gap-4" />
```

---

## 📚 Referências

- **Tailwind CSS:** https://tailwindcss.com/docs
- **shadcn/ui:** https://ui.shadcn.com
- **WCAG 2.1 Guidelines:** https://www.w3.org/WAI/WCAG21/quickref/
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/

---

## 📝 Changelog

### v1.0 - 2026-02-04
- ✅ Sistema de tokens centralizado criado
- ✅ Migração completa de 12 páginas para novo layout
- ✅ Validação de acessibilidade WCAG AA
- ✅ Documentação completa dos tokens

---

**Última atualização:** 2026-02-04
**Mantido por:** Equipe de Desenvolvimento Inboxx
