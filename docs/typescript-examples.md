# Exemplos Práticos TypeScript - Inboxx

**Guia de referência rápida com exemplos de uso dos tipos e patterns.**

---

## 📋 Índice

1. [Design Tokens](#design-tokens)
2. [Componentes de Layout](#componentes-de-layout)
3. [Type Guards](#type-guards)
4. [Discriminated Unions](#discriminated-unions)
5. [Branded Types](#branded-types)
6. [Utility Types](#utility-types)
7. [Template Literal Types](#template-literal-types)
8. [Compound Components](#compound-components)

---

## 🎨 Design Tokens

### Spacing Type-Safe

```typescript
import type { Spacing, SpacingClass } from '@/tipos/layout.tipos';

// ✅ BOM - Type-safe
const espacamento: Spacing = '4';
const margem: Spacing = '8';

// ❌ ERRO - Valor inválido
const invalido: Spacing = '5px'; // Erro de compilação

// ✅ BOM - Classes CSS type-safe
const classe: SpacingClass = 'p-4';
const classe2: SpacingClass = 'mt-8';
const classe3: SpacingClass = 'gap-2';

// ❌ ERRO - Classe inválida
const invalida: SpacingClass = 'p-invalid'; // Erro de compilação

// Helper function type-safe
import { createSpacingClass } from '@/tipos/layout.tipos';

const classePadding = createSpacingClass('p', '4'); // 'p-4'
const classeMargem = createSpacingClass('mt', '8'); // 'mt-8'
```

### Color Tokens

```typescript
import type { ColorToken } from '@/tipos/layout.tipos';
import { isColorToken } from '@/tipos/layout.tipos';

// ✅ BOM - Cores semânticas
const corPrimaria: ColorToken = 'primary';
const corDestrutiva: ColorToken = 'destructive';
const corWhatsApp: ColorToken = 'whatsapp';

// ❌ ERRO - Cor inválida
const corInvalida: ColorToken = 'red'; // Erro: use design tokens

// Runtime validation
function aplicarCor(cor: unknown) {
  if (isColorToken(cor)) {
    // TypeScript sabe que cor é ColorToken
    return `text-${cor}`;
  }
  return 'text-foreground'; // fallback
}
```

### Typography Scale

```typescript
import type { TypographyScale, TextSizeClass } from '@/tipos/layout.tipos';

// ✅ BOM - Tamanhos de texto
const tamanho: TypographyScale = 'lg';
const tituloSize: TypographyScale = '2xl';

// Classes CSS type-safe
const classeTexto: TextSizeClass = 'text-lg';
const classeTitulo: TextSizeClass = 'text-2xl';

// Componente type-safe
interface TituloProps {
  tamanho?: TypographyScale;
  children: ReactNode;
}

function Titulo({ tamanho = 'xl', children }: TituloProps) {
  return <h1 className={`text-${tamanho} font-bold`}>{children}</h1>;
}

// USO:
<Titulo tamanho="2xl">Meu Título</Titulo> // ✅
<Titulo tamanho="invalid">Erro</Titulo> // ❌ Erro de compilação
```

---

## 🧩 Componentes de Layout

### SidebarSecundaria - Exemplo Completo

```typescript
import {
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  SeparadorSidebar,
  BuscaSidebar,
} from '@/componentes/layout';
import type { SidebarWidth } from '@/tipos/layout.tipos';
import { Users, Star, Clock } from 'lucide-react';
import { useState } from 'react';

function FiltrosContatos() {
  const [busca, setBusca] = useState('');
  const [filtroAtivo, setFiltroAtivo] = useState<'todos' | 'favoritos' | 'recentes'>('todos');

  const largura: SidebarWidth = 'sm'; // ✅ Autocomplete: sm, md, lg

  return (
    <SidebarSecundaria largura={largura}>
      {/* Cabeçalho */}
      <CabecalhoSidebar
        titulo="Contatos"
        subtitulo="250 contatos"
        acoes={
          <Button size="icon" variant="ghost">
            <Plus className="h-4 w-4" />
          </Button>
        }
      />

      {/* Busca */}
      <BuscaSidebar
        valor={busca}
        onChange={setBusca}
        placeholder="Buscar contatos..."
      />

      {/* Seção de Filtros */}
      <SecaoSidebar titulo="Filtros">
        <ItemSidebar
          icone={<Users className="h-4 w-4" />}
          label="Todos"
          badge={250}
          ativo={filtroAtivo === 'todos'}
          onClick={() => setFiltroAtivo('todos')}
        />
        <ItemSidebar
          icone={<Star className="h-4 w-4" />}
          label="Favoritos"
          badge={12}
          ativo={filtroAtivo === 'favoritos'}
          onClick={() => setFiltroAtivo('favoritos')}
        />
        <ItemSidebar
          icone={<Clock className="h-4 w-4" />}
          label="Recentes"
          badge={8}
          ativo={filtroAtivo === 'recentes'}
          onClick={() => setFiltroAtivo('recentes')}
        />
      </SecaoSidebar>

      <SeparadorSidebar />

      {/* Seção de Etiquetas */}
      <SecaoSidebar titulo="Etiquetas">
        {etiquetas.map((etiqueta) => (
          <ItemSidebar
            key={etiqueta.id}
            icone={<div className="h-3 w-3 rounded-full" style={{ backgroundColor: etiqueta.cor }} />}
            label={etiqueta.nome}
            badge={etiqueta.total}
            onClick={() => {}}
          />
        ))}
      </SecaoSidebar>
    </SidebarSecundaria>
  );
}
```

### CabecalhoPagina - Exemplo Completo

```typescript
import { CabecalhoPagina, BarraAcoes } from '@/componentes/layout';
import { Button } from '@/componentes/ui/button';
import { Plus, Download, Filter } from 'lucide-react';

function PaginaContatos() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Cabeçalho da Página */}
      <CabecalhoPagina
        titulo="Contatos"
        subtitulo="Gerencie seus contatos e leads"
        icone={<Users className="h-5 w-5" />}
        acoes={
          <>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contato
            </Button>
          </>
        }
        comBorda={true}
      />

      {/* Barra de Ações/Filtros (Opcional) */}
      <BarraAcoes>
        <Button variant="ghost" size="sm">
          <Filter className="mr-2 h-4 w-4" />
          Filtros
        </Button>
        <Input placeholder="Buscar..." className="max-w-xs" />
      </BarraAcoes>

      {/* Conteúdo da Página */}
      <div className="flex-1 overflow-auto p-6">
        {/* ... conteúdo ... */}
      </div>
    </div>
  );
}
```

### CardItem - Exemplo com Ações

```typescript
import { CardItem, CardItemAvatar, GridCards } from '@/componentes/layout';
import type { AcaoCard, GridColumns } from '@/tipos/layout.tipos';
import { Pencil, Trash2, Star } from 'lucide-react';

interface Contato {
  id: string;
  nome: string;
  email: string;
  favorito: boolean;
}

function ListaContatos({ contatos }: { contatos: Contato[] }) {
  const acoesPadrao: AcaoCard[] = [
    {
      label: 'Editar',
      icone: <Pencil className="h-4 w-4" />,
      onClick: () => {},
      variante: 'default',
    },
    {
      label: 'Excluir',
      icone: <Trash2 className="h-4 w-4" />,
      onClick: () => {},
      variante: 'destructive',
    },
  ];

  const colunas: GridColumns = 3; // ✅ Autocomplete: 1, 2, 3, 4

  return (
    <GridCards colunas={colunas}>
      {contatos.map((contato) => (
        <CardItem
          key={contato.id}
          acoes={acoesPadrao}
          onClick={() => console.log('Clicou no card')}
        >
          <CardItemAvatar
            nome={contato.nome}
            subtitulo={contato.email}
            tamanho="md" // ✅ Autocomplete: sm, md, lg
            badge={contato.favorito ? <Star className="h-4 w-4 fill-yellow-400" /> : undefined}
          />
        </CardItem>
      ))}
    </GridCards>
  );
}
```

### EstadoVazio - Variantes

```typescript
import { EstadoVazio, EstadoBuscaVazia, EstadoErro } from '@/componentes/layout';
import type { EmptyStateVariant } from '@/tipos/layout.tipos';
import { Users } from 'lucide-react';

// Exemplo 1: Estado vazio padrão
function ListaContatosVazia() {
  const variante: EmptyStateVariant = 'padrao'; // ✅ Autocomplete

  return (
    <EstadoVazio
      titulo="Nenhum contato"
      descricao="Crie seu primeiro contato para começar a usar o sistema"
      variante={variante}
      icone={<Users className="h-16 w-16" />}
      acao={{
        label: 'Novo Contato',
        onClick: () => {},
      }}
      acaoSecundaria={{
        label: 'Importar Contatos',
        onClick: () => {},
      }}
    />
  );
}

// Exemplo 2: Busca vazia
function ResultadosBuscaVazia({ termoBusca }: { termoBusca: string }) {
  return (
    <EstadoBuscaVazia
      termoBusca={termoBusca}
      onLimpar={() => {}}
    />
  );
}

// Exemplo 3: Estado de erro
function ErroCarregamento() {
  return (
    <EstadoErro
      titulo="Erro ao carregar contatos"
      mensagem="Não foi possível carregar a lista. Tente novamente."
      onTentarNovamente={() => {}}
    />
  );
}
```

---

## 🔒 Type Guards

### Validação de Design Tokens

```typescript
import { isColorToken, isSidebarWidth, isComponentSize } from '@/tipos/layout.tipos';

// Exemplo 1: Validar input do usuário
function aplicarCorPersonalizada(cor: unknown) {
  if (isColorToken(cor)) {
    // TypeScript sabe que cor é ColorToken
    return `bg-${cor}`;
  }
  // Fallback para cor padrão
  return 'bg-muted';
}

// Exemplo 2: Validar configuração
interface ConfiguracaoUsuario {
  larguraSidebar?: unknown;
  tamanhoComponentes?: unknown;
}

function validarConfiguracao(config: ConfiguracaoUsuario) {
  const erros: string[] = [];

  if (config.larguraSidebar && !isSidebarWidth(config.larguraSidebar)) {
    erros.push('Largura de sidebar inválida');
  }

  if (config.tamanhoComponentes && !isComponentSize(config.tamanhoComponentes)) {
    erros.push('Tamanho de componentes inválido');
  }

  return erros;
}

// Exemplo 3: Type guard customizado
function isValidEmail(valor: unknown): valor is string {
  return typeof valor === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}

function processarEmail(email: unknown) {
  if (isValidEmail(email)) {
    // TypeScript sabe que email é string
    return email.toLowerCase();
  }
  throw new Error('Email inválido');
}
```

---

## 🎭 Discriminated Unions

### Exemplo 1: Status de Conversa

```typescript
// Union type discriminada por 'status'
type StatusConversa =
  | { status: 'aberta'; atendente: { id: string; nome: string } }
  | { status: 'pendente'; prioridade: 'baixa' | 'media' | 'alta' }
  | { status: 'fechada'; motivo: string; dataFechamento: Date };

function renderizarStatus(conversa: StatusConversa) {
  switch (conversa.status) {
    case 'aberta':
      // TypeScript sabe que 'atendente' está disponível
      return <Badge>Atendendo: {conversa.atendente.nome}</Badge>;

    case 'pendente':
      // TypeScript sabe que 'prioridade' está disponível
      return <Badge variant={conversa.prioridade === 'alta' ? 'destructive' : 'default'}>
        Pendente
      </Badge>;

    case 'fechada':
      // TypeScript sabe que 'motivo' está disponível
      return <Badge variant="outline">
        Fechada: {conversa.motivo}
      </Badge>;

    default:
      // Exhaustive check
      const _exhaustive: never = conversa;
      return _exhaustive;
  }
}
```

### Exemplo 2: Tipos de Mensagem

```typescript
type TipoMensagem =
  | { tipo: 'texto'; conteudo: string }
  | { tipo: 'imagem'; url: string; legenda?: string }
  | { tipo: 'audio'; url: string; duracao: number }
  | { tipo: 'documento'; url: string; nomeArquivo: string; tamanho: number };

function renderizarMensagem(mensagem: TipoMensagem) {
  switch (mensagem.tipo) {
    case 'texto':
      return <p>{mensagem.conteudo}</p>;

    case 'imagem':
      return (
        <figure>
          <img src={mensagem.url} alt="Imagem" />
          {mensagem.legenda && <figcaption>{mensagem.legenda}</figcaption>}
        </figure>
      );

    case 'audio':
      return <audio src={mensagem.url} controls />;

    case 'documento':
      return (
        <a href={mensagem.url} download={mensagem.nomeArquivo}>
          {mensagem.nomeArquivo} ({mensagem.tamanho} bytes)
        </a>
      );
  }
}
```

---

## 🏷️ Branded Types

### Exemplo 1: IDs Type-Safe

```typescript
import type { UsuarioId, ContatoId, ConversaId } from '@/tipos/layout.tipos';

// Funções com IDs type-safe
async function obterUsuario(id: UsuarioId): Promise<Usuario> {
  return api.get(`/usuarios/${id}`);
}

async function obterContato(id: ContatoId): Promise<Contato> {
  return api.get(`/contatos/${id}`);
}

// USO:
const userId = '123' as UsuarioId;
const contatoId = '456' as ContatoId;

obterUsuario(userId); // ✅
obterContato(contatoId); // ✅

obterUsuario(contatoId); // ❌ ERRO: ContatoId não é UsuarioId
obterContato(userId); // ❌ ERRO: UsuarioId não é ContatoId

// Factory functions type-safe
function criarUsuarioId(id: string): UsuarioId {
  if (!id || id.length < 10) {
    throw new Error('ID de usuário inválido');
  }
  return id as UsuarioId;
}

function criarContatoId(id: string): ContatoId {
  if (!id || id.length < 10) {
    throw new Error('ID de contato inválido');
  }
  return id as ContatoId;
}

// USO:
const validUserId = criarUsuarioId('abc123...'); // ✅
const invalidUserId = criarUsuarioId('123'); // ❌ Lança erro
```

### Exemplo 2: Branded Types Customizados

```typescript
// Email validado
declare const __emailBrand: unique symbol;
type Email = string & { readonly [__emailBrand]: 'Email' };

function criarEmail(valor: string): Email {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!regex.test(valor)) {
    throw new Error('Email inválido');
  }
  return valor as Email;
}

// Telefone validado
declare const __telefoneBrand: unique symbol;
type Telefone = string & { readonly [__telefoneBrand]: 'Telefone' };

function criarTelefone(valor: string): Telefone {
  const regex = /^\+?[1-9]\d{1,14}$/;
  if (!regex.test(valor.replace(/\s/g, ''))) {
    throw new Error('Telefone inválido');
  }
  return valor as Telefone;
}

// Interface com branded types
interface ContatoFormData {
  nome: string;
  email: Email;
  telefone: Telefone;
}

function salvarContato(dados: ContatoFormData) {
  // Garantia de que email e telefone são válidos
  api.post('/contatos', dados);
}

// USO:
const email = criarEmail('joao@example.com'); // ✅
const telefone = criarTelefone('+5511999999999'); // ✅

salvarContato({
  nome: 'João',
  email,
  telefone,
}); // ✅

salvarContato({
  nome: 'João',
  email: 'joao@example.com', // ❌ ERRO: string não é Email
  telefone: '11999999999', // ❌ ERRO: string não é Telefone
});
```

---

## 🔧 Utility Types

### PartialExcept - Campos Obrigatórios Seletivos

```typescript
import type { PartialExcept } from '@/tipos/layout.tipos';

interface Contato {
  id: string;
  nome: string;
  telefone: string;
  email: string;
  ativo: boolean;
  observacoes: string;
}

// Formulário de edição: apenas 'nome' obrigatório
type EditarContatoForm = PartialExcept<Contato, 'nome'>;

const formData: EditarContatoForm = {
  nome: 'João Silva', // ✅ Obrigatório
  telefone: '11999999999', // ✅ Opcional
  // email, ativo, observacoes são opcionais
};

// Validação de formulário
function validarFormularioEdicao(dados: EditarContatoForm): boolean {
  // 'nome' sempre existe (obrigatório)
  if (dados.nome.length < 2) {
    return false;
  }

  // Outros campos podem não existir
  if (dados.email && !dados.email.includes('@')) {
    return false;
  }

  return true;
}
```

### RequiredExcept - Tornar Tudo Obrigatório Exceto Alguns

```typescript
import type { RequiredExcept } from '@/tipos/layout.tipos';

// DTO de criação: tudo obrigatório exceto 'id' e 'observacoes'
type CriarContatoDTO = RequiredExcept<Contato, 'id' | 'observacoes'>;

const novoContato: CriarContatoDTO = {
  nome: 'João Silva', // ✅ Obrigatório
  telefone: '11999999999', // ✅ Obrigatório
  email: 'joao@email.com', // ✅ Obrigatório
  ativo: true, // ✅ Obrigatório
  // id e observacoes são opcionais
};
```

### Unwrap - Extrair Tipo de Promise

```typescript
import type { Unwrap } from '@/tipos/layout.tipos';

async function obterContatosAPI(): Promise<Contato[]> {
  return api.get('/contatos');
}

// Extrair tipo da Promise
type ContatosArray = Unwrap<ReturnType<typeof obterContatosAPI>>;
// ContatosArray = Contato[]

type ContatoUnico = ContatosArray[number];
// ContatoUnico = Contato
```

---

## 📝 Template Literal Types

### Classes CSS Type-Safe

```typescript
import type { SpacingClass, ColorClass, TextSizeClass } from '@/tipos/layout.tipos';

// Spacing classes
const padding: SpacingClass = 'p-4'; // ✅ Autocomplete: p-0, p-1, p-2, ...
const margem: SpacingClass = 'mt-8'; // ✅ Autocomplete: m-0, mt-1, mb-2, ...
const gap: SpacingClass = 'gap-2'; // ✅ Autocomplete: gap-0, gap-1, ...

// Color classes
const textoCor: ColorClass = 'text-primary'; // ✅ Autocomplete: text-primary, text-destructive, ...
const fundoCor: ColorClass = 'bg-accent'; // ✅ Autocomplete: bg-primary, bg-muted, ...

// Text size classes
const tamanhoTexto: TextSizeClass = 'text-lg'; // ✅ Autocomplete: text-xs, text-sm, text-base, ...

// Função helper
import { createSpacingClass } from '@/tipos/layout.tipos';

function Card({ espacamento = '4' as const }: { espacamento?: Spacing }) {
  const classe = createSpacingClass('p', espacamento);
  return <div className={classe}>...</div>;
}
```

### API Paths Type-Safe

```typescript
import type { ApiPath } from '@/tipos/layout.tipos';

// Type-safe API paths
const endpoint: ApiPath = '/api/contatos'; // ✅
const endpoint2: ApiPath = '/api/usuarios/123'; // ✅

const invalido: ApiPath = '/contatos'; // ❌ ERRO: deve começar com /api/
const invalido2: ApiPath = 'api/contatos'; // ❌ ERRO: deve começar com /

// Função type-safe
function api<T>(path: ApiPath): Promise<T> {
  return fetch(path).then(r => r.json());
}

// USO:
api<Contato[]>('/api/contatos'); // ✅
api<Usuario>('/api/usuarios/123'); // ✅
api('/contatos'); // ❌ ERRO: não é ApiPath válido
```

---

## 🧱 Compound Components

### AppLayout - Exemplo Completo

```typescript
// Definição do compound component
const AppLayout = {
  Root: ({ children }: { children: ReactNode }) => (
    <div className="flex h-full">{children}</div>
  ),

  Sidebar: SidebarSecundaria,
  SidebarHeader: CabecalhoSidebar,
  SidebarSection: SecaoSidebar,
  SidebarItem: ItemSidebar,

  Content: ({ children }: { children: ReactNode }) => (
    <div className="flex-1 flex flex-col overflow-hidden">{children}</div>
  ),

  Header: CabecalhoPagina,

  Body: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div className={cn('flex-1 overflow-auto p-6', className)}>{children}</div>
  ),
};

// USO:
function PaginaContatos() {
  return (
    <AppLayout.Root>
      {/* Sidebar de Filtros */}
      <AppLayout.Sidebar largura="sm">
        <AppLayout.SidebarHeader titulo="Filtros" subtitulo="250 contatos" />
        <AppLayout.SidebarSection titulo="Categoria">
          <AppLayout.SidebarItem label="Todos" badge={250} ativo />
          <AppLayout.SidebarItem label="Favoritos" badge={12} />
        </AppLayout.SidebarSection>
      </AppLayout.Sidebar>

      {/* Conteúdo Principal */}
      <AppLayout.Content>
        <AppLayout.Header
          titulo="Contatos"
          subtitulo="Gerencie seus contatos"
          acoes={<Button>Novo Contato</Button>}
        />
        <AppLayout.Body>
          {/* Conteúdo da página */}
          <GridCards colunas={3}>
            {/* Cards de contatos */}
          </GridCards>
        </AppLayout.Body>
      </AppLayout.Content>
    </AppLayout.Root>
  );
}
```

---

## 🎯 Patterns Avançados

### Polimorphic Components

```typescript
import type { PolymorphicComponentProps } from '@/tipos/layout.tipos';

interface BotaoBaseProps {
  variante?: 'primary' | 'secondary' | 'outline';
  tamanho?: 'sm' | 'md' | 'lg';
}

function Botao<T extends ElementType = 'button'>({
  as,
  variante = 'primary',
  tamanho = 'md',
  children,
  ...props
}: PolymorphicComponentProps<T, BotaoBaseProps>) {
  const Component = as || 'button';

  return (
    <Component
      className={cn(
        'rounded-md font-medium',
        variante === 'primary' && 'bg-primary text-white',
        tamanho === 'md' && 'px-4 py-2',
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

// USO:
<Botao>Click</Botao> // Renderiza <button>
<Botao as="a" href="/contatos">Link</Botao> // Renderiza <a> com href type-safe
<Botao as="div" onClick={() => {}}>Div</Botao> // Renderiza <div> com onClick
```

---

## 📚 Referências Rápidas

### Cheat Sheet - Design Tokens

```typescript
// Spacing: '0' | '1' | '2' | '4' | '8' | '12' | '16' | '24' | '32' | '48' | '64' | ...
// ColorToken: 'primary' | 'secondary' | 'accent' | 'muted' | 'destructive' | ...
// TypographyScale: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | ...
// IconSize: '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16'
// SidebarWidth: 'sm' | 'md' | 'lg'
// GridColumns: 1 | 2 | 3 | 4
// AvatarSize: 'sm' | 'md' | 'lg'
// EmptyStateVariant: 'padrao' | 'busca' | 'erro' | 'inbox'
```

### Cheat Sheet - Imports

```typescript
// Layout Components
import {
  SidebarSecundaria,
  CabecalhoSidebar,
  SecaoSidebar,
  ItemSidebar,
  CabecalhoPagina,
  CardItem,
  CardItemAvatar,
  GridCards,
  EstadoVazio,
} from '@/componentes/layout';

// Types
import type {
  SidebarWidth,
  GridColumns,
  AvatarSize,
  EmptyStateVariant,
  ColorToken,
  Spacing,
} from '@/tipos/layout.tipos';

// Type Guards
import { isColorToken, isSidebarWidth } from '@/tipos/layout.tipos';
```

---

**Autor:** TypeScript Pro Agent
**Versão:** 1.0.0
**Última Atualização:** 04 de Fevereiro de 2026
