// =============================================================================
// SISTEMA DE TIPOS PARA DESIGN TOKENS E COMPONENTES DE LAYOUT
// =============================================================================
//
// Este arquivo define a arquitetura de tipos TypeScript para o sistema de design
// do Inboxx, garantindo type-safety 100% e autocomplete perfeito em toda a aplicação.
//
// Versão: 1.0.0
// TypeScript: 5.7+
// =============================================================================

import type { ReactNode, ComponentPropsWithoutRef, ElementType } from 'react';

// =============================================================================
// DESIGN TOKENS - TYPE-SAFE DESIGN SYSTEM
// =============================================================================

/**
 * Escala de espaçamento do sistema de design.
 * Baseada em múltiplos de 4px para consistência visual.
 *
 * @example
 * ```tsx
 * const espacamento: Spacing = '4'; // Type-safe
 * // espacamento: Spacing = 'invalid'; // ❌ Erro de compilação
 * ```
 */
export type Spacing =
  | '0'
  | '0.5' // 2px
  | '1' // 4px
  | '1.5' // 6px
  | '2' // 8px
  | '2.5' // 10px
  | '3' // 12px
  | '3.5' // 14px
  | '4' // 16px
  | '5' // 20px
  | '6' // 24px
  | '7' // 28px
  | '8' // 32px
  | '9' // 36px
  | '10' // 40px
  | '11' // 44px
  | '12' // 48px
  | '14' // 56px
  | '16' // 64px
  | '20' // 80px
  | '24' // 96px
  | '28' // 112px
  | '32' // 128px
  | '36' // 144px
  | '40' // 160px
  | '44' // 176px
  | '48' // 192px
  | '52' // 208px
  | '56' // 224px
  | '60' // 240px
  | '64' // 256px
  | '72' // 288px
  | '80' // 320px
  | '96'; // 384px

/**
 * Tokens semânticos de cor do sistema.
 * Mapeados para CSS variables definidas em globals.css.
 *
 * @example
 * ```tsx
 * const cor: ColorToken = 'primary'; // ✅
 * const cor2: ColorToken = 'whatsapp'; // ✅
 * ```
 */
export type ColorToken =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'muted'
  | 'destructive'
  | 'foreground'
  | 'background'
  | 'card'
  | 'popover'
  | 'border'
  | 'input'
  | 'ring'
  | 'whatsapp'
  | 'instagram'
  | 'facebook'
  | 'online'
  | 'away'
  | 'busy';

/**
 * Escala tipográfica do sistema.
 * Define tamanhos de fonte consistentes.
 *
 * @example
 * ```tsx
 * const tamanho: TypographyScale = 'lg'; // ✅
 * ```
 */
export type TypographyScale = 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/**
 * Tamanhos de ícones padronizados.
 * Baseados em height/width do Tailwind.
 *
 * @example
 * ```tsx
 * <Icon className={`h-${iconSize} w-${iconSize}`} />
 * ```
 */
export type IconSize = '3' | '4' | '5' | '6' | '8' | '10' | '12' | '16';

/**
 * Border radius padrões do sistema.
 * Mapeados para configuração do Tailwind.
 */
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

/**
 * Breakpoints responsivos.
 * Alinhados com configuração do Tailwind.
 */
export type Breakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

// =============================================================================
// DISCRIMINATED UNIONS - VARIANTES DE COMPONENTES
// =============================================================================

/**
 * Variantes de tamanho de componentes.
 * Union type discriminada para type-safety em props de tamanho.
 */
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

/**
 * Variantes de estado visual.
 * Usado em componentes de feedback e estados.
 */
export type VisualVariant = 'default' | 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';

/**
 * Estados de carregamento.
 * Union type para estados assíncronos.
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Tipos de estado vazio.
 * Para componente EstadoVazio.
 */
export type EmptyStateVariant = 'padrao' | 'busca' | 'erro' | 'inbox';

// =============================================================================
// UTILITY TYPES - HELPERS PARA COMPOSIÇÃO
// =============================================================================

/**
 * Props base para todos os componentes de layout.
 * Fornece className e children como opcionais.
 */
export interface BaseLayoutProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Props para componentes com ações.
 * Reutilizável em múltiplos componentes.
 */
export interface WithActions {
  acoes?: ReactNode;
}

/**
 * Props para componentes com ícone.
 */
export interface WithIcon {
  icone?: ReactNode;
}

/**
 * Props para componentes com badge/contador.
 */
export interface WithBadge {
  badge?: number | string | ReactNode;
}

/**
 * Props para componentes clicáveis.
 */
export interface Clickable {
  onClick?: () => void;
}

/**
 * Props para componentes com estado ativo.
 */
export interface ActiveState {
  ativo?: boolean;
}

/**
 * Props para componentes com título e descrição.
 */
export interface WithTitleDescription {
  titulo: string;
  subtitulo?: string;
}

// =============================================================================
// LAYOUT PRINCIPAL - TYPES
// =============================================================================

/**
 * Props do LayoutPrincipal.
 * Componente raiz que gerencia autenticação e layout global.
 *
 * @example
 * ```tsx
 * <LayoutPrincipal>
 *   <Outlet />
 * </LayoutPrincipal>
 * ```
 */
export interface LayoutPrincipalProps {
  children?: ReactNode;
}

/**
 * Item de menu do MenuLateral.
 * Tipo interno usado para navegação.
 */
export interface ItemMenu {
  titulo: string;
  icone: ElementType;
  href: string;
  permissao?: string;
  badge?: number | string;
}

// =============================================================================
// SIDEBAR SECUNDÁRIA - TYPES
// =============================================================================

/**
 * Larguras disponíveis para SidebarSecundaria.
 * Union type com valores específicos.
 */
export type SidebarWidth = 'sm' | 'md' | 'lg';

/**
 * Props da SidebarSecundaria.
 * Sidebar de filtros/navegação secundária.
 *
 * @example
 * ```tsx
 * <SidebarSecundaria largura="md">
 *   <CabecalhoSidebar titulo="Filtros" />
 * </SidebarSecundaria>
 * ```
 */
export interface SidebarSecundariaProps extends BaseLayoutProps {
  /**
   * Largura da sidebar.
   * @default 'md'
   */
  largura?: SidebarWidth;
}

/**
 * Props do CabecalhoSidebar.
 * Cabeçalho fixo no topo da sidebar.
 */
export interface CabecalhoSidebarProps extends WithTitleDescription, WithActions, BaseLayoutProps {}

/**
 * Props da SecaoSidebar.
 * Agrupa itens relacionados na sidebar.
 */
export interface SecaoSidebarProps extends BaseLayoutProps {
  titulo?: string;
}

/**
 * Props do ItemSidebar.
 * Item clicável individual da sidebar.
 *
 * @example
 * ```tsx
 * <ItemSidebar
 *   icone={<Users className="h-4 w-4" />}
 *   label="Todos"
 *   badge={42}
 *   ativo={true}
 *   onClick={() => setFiltro('todos')}
 * />
 * ```
 */
export interface ItemSidebarProps extends WithIcon, WithBadge, ActiveState, Clickable, BaseLayoutProps {
  label: string;
}

/**
 * Props do BuscaSidebar.
 * Input de busca para filtros.
 */
export interface BuscaSidebarProps extends BaseLayoutProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
}

// =============================================================================
// CABEÇALHO DE PÁGINA - TYPES
// =============================================================================

/**
 * Props do CabecalhoPagina.
 * Cabeçalho fixo no topo de cada página.
 *
 * @example
 * ```tsx
 * <CabecalhoPagina
 *   titulo="Contatos"
 *   subtitulo="Gerencie seus contatos"
 *   icone={<Users className="h-5 w-5" />}
 *   acoes={<Button>Novo Contato</Button>}
 * />
 * ```
 */
export interface CabecalhoPaginaProps extends WithTitleDescription, WithIcon, WithActions, BaseLayoutProps {
  /**
   * Exibir borda inferior.
   * @default true
   */
  comBorda?: boolean;
}

/**
 * Props da BarraAcoes.
 * Barra de ações/filtros abaixo do cabeçalho.
 */
export interface BarraAcoesProps extends BaseLayoutProps {}

// =============================================================================
// CARD ITEM - TYPES
// =============================================================================

/**
 * Ação de menu dropdown do CardItem.
 * Usado no menu de contexto do card.
 */
export interface AcaoCard {
  label: string;
  icone?: ReactNode;
  onClick: () => void;
  /**
   * Variante visual da ação.
   * @default 'default'
   */
  variante?: 'default' | 'destructive';
}

/**
 * Props do CardItem.
 * Container de card genérico com ações.
 *
 * @example
 * ```tsx
 * <CardItem
 *   acoes={[
 *     { label: 'Editar', icone: <Pencil />, onClick: handleEdit },
 *     { label: 'Excluir', icone: <Trash />, onClick: handleDelete, variante: 'destructive' }
 *   ]}
 *   selecionado={isSelected}
 *   onClick={() => setSelected(true)}
 * >
 *   <CardItemConteudo titulo="Título" subtitulo="Descrição" />
 * </CardItem>
 * ```
 */
export interface CardItemProps extends BaseLayoutProps, Clickable {
  acoes?: AcaoCard[];
  selecionado?: boolean;
}

/**
 * Props do CardItemConteudo.
 * Layout padrão de conteúdo para cards.
 */
export interface CardItemConteudoProps extends WithIcon, WithBadge, BaseLayoutProps {
  titulo: string;
  subtitulo?: string;
  meta?: ReactNode;
}

/**
 * Tamanhos de avatar disponíveis.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';

/**
 * Props do CardItemAvatar.
 * Layout de card com avatar circular.
 *
 * @example
 * ```tsx
 * <CardItemAvatar
 *   nome="João Silva"
 *   avatar="https://..."
 *   subtitulo="joao@email.com"
 *   tamanho="md"
 * />
 * ```
 */
export interface CardItemAvatarProps extends WithBadge, BaseLayoutProps {
  nome: string;
  avatar?: string;
  subtitulo?: string;
  meta?: ReactNode;
  /**
   * Tamanho do avatar.
   * @default 'md'
   */
  tamanho?: AvatarSize;
}

/**
 * Número de colunas no GridCards.
 */
export type GridColumns = 1 | 2 | 3 | 4;

/**
 * Props do GridCards.
 * Grid responsivo para cards.
 */
export interface GridCardsProps extends BaseLayoutProps {
  /**
   * Número de colunas no grid.
   * @default 3
   */
  colunas?: GridColumns;
}

/**
 * Props do ListaCards.
 * Lista vertical de cards.
 */
export interface ListaCardsProps extends BaseLayoutProps {}

// =============================================================================
// ESTADO VAZIO - TYPES
// =============================================================================

/**
 * Ação primária ou secundária do EstadoVazio.
 */
export interface AcaoEstadoVazio {
  label: string;
  onClick: () => void;
}

/**
 * Props do EstadoVazio.
 * Componente para estados vazios, busca sem resultados, etc.
 *
 * @example
 * ```tsx
 * <EstadoVazio
 *   titulo="Nenhum contato"
 *   descricao="Crie seu primeiro contato para começar"
 *   variante="padrao"
 *   icone={<Users className="h-16 w-16" />}
 *   acao={{ label: 'Novo Contato', onClick: handleNovo }}
 * />
 * ```
 */
export interface EstadoVazioProps extends WithIcon, BaseLayoutProps {
  titulo: string;
  descricao?: string;
  /**
   * Variante visual do estado vazio.
   * @default 'padrao'
   */
  variante?: EmptyStateVariant;
  acao?: AcaoEstadoVazio;
  acaoSecundaria?: AcaoEstadoVazio;
}

/**
 * Props do EstadoCarregando.
 * Spinner de carregamento.
 */
export interface EstadoCarregandoProps extends BaseLayoutProps {
  /**
   * Texto exibido abaixo do spinner.
   * @default 'Carregando...'
   */
  texto?: string;
}

/**
 * Props do EstadoErro.
 * Componente de erro com retry.
 */
export interface EstadoErroProps extends BaseLayoutProps {
  /**
   * Título do erro.
   * @default 'Erro ao carregar'
   */
  titulo?: string;
  /**
   * Mensagem de erro detalhada.
   * @default 'Ocorreu um erro ao carregar os dados. Tente novamente.'
   */
  mensagem?: string;
  /**
   * Callback para tentar novamente.
   */
  onTentarNovamente?: () => void;
}

/**
 * Props do EstadoBuscaVazia.
 * Estado específico para buscas sem resultado.
 */
export interface EstadoBuscaVaziaProps extends BaseLayoutProps {
  termoBusca?: string;
  onLimpar?: () => void;
}

// =============================================================================
// FILTROS RÁPIDOS - TYPES
// =============================================================================

/**
 * Opção de filtro selecionável.
 */
export interface OpcaoFiltro<T = string> {
  valor: T;
  label: string;
  icone?: ReactNode;
  contador?: number;
}

/**
 * Props do ChipFiltro.
 * Chip clicável para filtros.
 */
export interface ChipFiltroProps<T = string> extends BaseLayoutProps {
  label: string;
  icone?: ReactNode;
  ativo?: boolean;
  contador?: number;
  valor: T;
  onClick: (valor: T) => void;
  removivel?: boolean;
}

/**
 * Props do CampoBusca.
 * Input de busca com clear.
 */
export interface CampoBuscaProps extends BaseLayoutProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder?: string;
  /**
   * Exibir ícone de busca.
   * @default true
   */
  comIcone?: boolean;
}

/**
 * Props do FiltroSelect.
 * Dropdown de filtro.
 */
export interface FiltroSelectProps<T = string> extends BaseLayoutProps {
  label: string;
  valor: T | null;
  opcoes: OpcaoFiltro<T>[];
  onChange: (valor: T | null) => void;
  placeholder?: string;
}

// =============================================================================
// COMPOUND COMPONENTS - PATTERN AVANÇADO
// =============================================================================

/**
 * Namespace para compound components de Layout.
 * Permite uso como: <AppLayout.Sidebar>, <AppLayout.Content>, etc.
 *
 * @example
 * ```tsx
 * <AppLayout>
 *   <AppLayout.Sidebar largura="sm">
 *     <AppLayout.SidebarHeader titulo="Filtros" />
 *     <AppLayout.SidebarSection titulo="Categoria">
 *       <AppLayout.SidebarItem label="Todos" ativo />
 *     </AppLayout.SidebarSection>
 *   </AppLayout.Sidebar>
 *   <AppLayout.Content>
 *     <AppLayout.Header titulo="Página" />
 *     <AppLayout.Body>
 *       {conteudo}
 *     </AppLayout.Body>
 *   </AppLayout.Content>
 * </AppLayout>
 * ```
 */
export namespace AppLayoutComponents {
  export type RootProps = BaseLayoutProps;
  export type SidebarProps = SidebarSecundariaProps;
  export type SidebarHeaderProps = CabecalhoSidebarProps;
  export type SidebarSectionProps = SecaoSidebarProps;
  export type SidebarItemProps = ItemSidebarProps;
  export type ContentProps = BaseLayoutProps;
  export type HeaderProps = CabecalhoPaginaProps;
  export type BodyProps = BaseLayoutProps;
}

// =============================================================================
// TYPE GUARDS - RUNTIME TYPE CHECKING
// =============================================================================

/**
 * Type guard para verificar se um valor é um ColorToken válido.
 *
 * @example
 * ```tsx
 * if (isColorToken(cor)) {
 *   // TypeScript sabe que cor é ColorToken
 * }
 * ```
 */
export function isColorToken(valor: unknown): valor is ColorToken {
  const tokens: ColorToken[] = [
    'primary',
    'secondary',
    'accent',
    'muted',
    'destructive',
    'foreground',
    'background',
    'card',
    'popover',
    'border',
    'input',
    'ring',
    'whatsapp',
    'instagram',
    'facebook',
    'online',
    'away',
    'busy',
  ];
  return typeof valor === 'string' && tokens.includes(valor as ColorToken);
}

/**
 * Type guard para verificar se um valor é um ComponentSize válido.
 */
export function isComponentSize(valor: unknown): valor is ComponentSize {
  return typeof valor === 'string' && ['xs', 'sm', 'md', 'lg', 'xl'].includes(valor);
}

/**
 * Type guard para verificar se um valor é um SidebarWidth válido.
 */
export function isSidebarWidth(valor: unknown): valor is SidebarWidth {
  return typeof valor === 'string' && ['sm', 'md', 'lg'].includes(valor);
}

// =============================================================================
// MAPPED TYPES - TRANSFORMAÇÕES
// =============================================================================

/**
 * Torna todas as props de um tipo opcionais exceto as especificadas.
 *
 * @example
 * ```tsx
 * type ContatoForm = PartialExcept<Contato, 'nome' | 'telefone'>;
 * // { nome: string, telefone: string, email?: string, ... }
 * ```
 */
export type PartialExcept<T, K extends keyof T> = Partial<Omit<T, K>> & Pick<T, K>;

/**
 * Torna todas as props de um tipo obrigatórias exceto as especificadas.
 *
 * @example
 * ```tsx
 * type ContatoCompleto = RequiredExcept<ContatoDTO, 'email' | 'avatar'>;
 * ```
 */
export type RequiredExcept<T, K extends keyof T> = Required<Omit<T, K>> & Pick<T, K>;

/**
 * Extrai props de um componente React.
 * Útil para reexportar tipos de bibliotecas.
 */
export type PropsOf<T extends ElementType> = ComponentPropsWithoutRef<T>;

/**
 * Props polimórficas para componentes que podem renderizar como diferentes elementos.
 *
 * @example
 * ```tsx
 * function Botao<T extends ElementType = 'button'>({
 *   as,
 *   ...props
 * }: PolymorphicComponentProps<T, BotaoProps>) {
 *   const Component = as || 'button';
 *   return <Component {...props} />;
 * }
 *
 * // Uso:
 * <Botao as="a" href="/contatos">Link</Botao> // ✅ href é válido
 * <Botao as="button" type="submit">Submit</Botao> // ✅ type é válido
 * ```
 */
export type PolymorphicComponentProps<T extends ElementType, P = object> = P &
  Omit<ComponentPropsWithoutRef<T>, keyof P> & {
    as?: T;
  };

// =============================================================================
// CONDITIONAL TYPES - LÓGICA DE TIPOS
// =============================================================================

/**
 * Extrai o tipo de resposta de uma Promise.
 *
 * @example
 * ```tsx
 * type Usuario = Awaited<ReturnType<typeof usuariosServico.obter>>;
 * ```
 */
export type Unwrap<T> = T extends Promise<infer U> ? U : T;

/**
 * Remove null e undefined de um tipo.
 */
export type NonNullable<T> = T extends null | undefined ? never : T;

/**
 * Tipos de props baseado em variante.
 * Union type discriminada por 'variante'.
 *
 * @example
 * ```tsx
 * type BotaoVariante =
 *   | { variante: 'primary'; cor: ColorToken }
 *   | { variante: 'link'; href: string };
 *
 * // TypeScript sabe que se variante='link', href está disponível
 * ```
 */
export type VariantProps<T extends { variante: string }> = T;

// =============================================================================
// TEMPLATE LITERAL TYPES - STRINGS TIPADAS
// =============================================================================

/**
 * Classes Tailwind CSS para spacing.
 * Gera autocomplete para: 'p-4', 'mt-8', 'gap-2', etc.
 *
 * @example
 * ```tsx
 * const classe: SpacingClass = 'p-4'; // ✅
 * const classe2: SpacingClass = 'mt-8'; // ✅
 * const classe3: SpacingClass = 'p-invalid'; // ❌
 * ```
 */
export type SpacingPrefix = 'p' | 'px' | 'py' | 'pt' | 'pb' | 'pl' | 'pr' | 'm' | 'mx' | 'my' | 'mt' | 'mb' | 'ml' | 'mr' | 'gap' | 'space-x' | 'space-y';
export type SpacingClass = `${SpacingPrefix}-${Spacing}`;

/**
 * Classes Tailwind CSS para cores.
 * Gera autocomplete para: 'text-primary', 'bg-destructive', etc.
 */
export type ColorPrefix = 'text' | 'bg' | 'border' | 'ring' | 'hover:text' | 'hover:bg' | 'focus:ring';
export type ColorClass = `${ColorPrefix}-${ColorToken}`;

/**
 * Classes Tailwind CSS para tamanhos de texto.
 */
export type TextSizeClass = `text-${TypographyScale}`;

/**
 * Path absoluto para recursos estáticos.
 * Força uso de paths absolutos iniciando com '/'.
 *
 * @example
 * ```tsx
 * const path: AbsolutePath = '/images/logo.png'; // ✅
 * const path2: AbsolutePath = './images/logo.png'; // ❌
 * ```
 */
export type AbsolutePath = `/${string}`;

/**
 * URL de API tipada.
 * Força uso de paths iniciando com '/api/'.
 */
export type ApiPath = `/api/${string}`;

// =============================================================================
// BRANDED TYPES - DOMAIN MODELING
// =============================================================================

/**
 * Tipo marca (branded type) para garantir segurança em tipos primitivos.
 * Evita misturar IDs de diferentes entidades.
 */
declare const __brand: unique symbol;
type Brand<T, TBrand> = T & { readonly [__brand]: TBrand };

/**
 * ID único de usuário.
 * Evita passar ID de contato onde espera-se ID de usuário.
 *
 * @example
 * ```tsx
 * type UsuarioId = Brand<string, 'UsuarioId'>;
 * type ContatoId = Brand<string, 'ContatoId'>;
 *
 * function obterUsuario(id: UsuarioId) { ... }
 *
 * const userId: UsuarioId = '123' as UsuarioId;
 * const contatoId: ContatoId = '456' as ContatoId;
 *
 * obterUsuario(userId); // ✅
 * obterUsuario(contatoId); // ❌ Erro de compilação
 * ```
 */
export type UsuarioId = Brand<string, 'UsuarioId'>;
export type ContatoId = Brand<string, 'ContatoId'>;
export type ConversaId = Brand<string, 'ConversaId'>;
export type ClienteId = Brand<string, 'ClienteId'>;
export type EquipeId = Brand<string, 'EquipeId'>;
export type EtiquetaId = Brand<string, 'EtiquetaId'>;

// =============================================================================
// UTILITY FUNCTIONS - TYPE-SAFE HELPERS
// =============================================================================

/**
 * Cria classe Tailwind CSS com type-safety.
 * Usa template literal types para validação.
 *
 * @example
 * ```tsx
 * const classe = createSpacingClass('p', '4'); // 'p-4'
 * const classe2 = createSpacingClass('mt', 'invalid'); // ❌ Erro
 * ```
 */
export function createSpacingClass(prefix: SpacingPrefix, value: Spacing): SpacingClass {
  return `${prefix}-${value}` as SpacingClass;
}

/**
 * Type-safe object keys.
 * Garante que as chaves retornadas têm o tipo correto.
 */
export function typedKeys<T extends object>(obj: T): Array<keyof T> {
  return Object.keys(obj) as Array<keyof T>;
}

/**
 * Type-safe object entries.
 */
export function typedEntries<T extends object>(obj: T): Array<[keyof T, T[keyof T]]> {
  return Object.entries(obj) as Array<[keyof T, T[keyof T]]>;
}

// =============================================================================
// SATISFIES OPERATOR - VALIDAÇÃO SEM WIDENING
// =============================================================================

/**
 * Exemplo de uso do operador 'satisfies' (TS 4.9+).
 * Valida tipo sem perder literais específicos.
 *
 * @example
 * ```tsx
 * const config = {
 *   sidebar: 'md',
 *   colunas: 3,
 *   tema: 'dark'
 * } satisfies {
 *   sidebar: SidebarWidth;
 *   colunas: GridColumns;
 *   tema: string;
 * };
 *
 * // config.sidebar ainda é 'md', não SidebarWidth
 * // mas TypeScript validou que 'md' é um SidebarWidth válido
 * ```
 */
export type LayoutConfig = {
  sidebar: SidebarWidth;
  colunas: GridColumns;
  spacing: Spacing;
  borderRadius: BorderRadius;
};

// =============================================================================
// AUTH GUARD - TYPES
// =============================================================================

/**
 * Configuração do AuthGuard.
 * Define comportamento de timeout e mensagens customizadas.
 */
export interface AuthGuardConfig {
  /**
   * Timeout de hidratação do Zustand (ms).
   * @default 2000
   */
  hydrationTimeout?: number;

  /**
   * Mensagem de loading durante hidratação.
   * @default 'Carregando...'
   */
  loadingMessage?: string;

  /**
   * Rota de redirecionamento se não autenticado.
   * @default '/entrar'
   */
  redirectTo?: string;
}

/**
 * Props do AuthGuard.
 */
export interface AuthGuardProps {
  children: ReactNode;
  config?: AuthGuardConfig;
}

// =============================================================================
// APP LAYOUT - COMPOUND COMPONENTS TYPES
// =============================================================================

/**
 * Props do AppLayout raiz.
 */
export interface AppLayoutProps extends BaseLayoutProps {
  /**
   * Exibir sidebar principal (MenuLateral).
   * @default true
   */
  showSidebar?: boolean;

  /**
   * Exibir sidebar secundária.
   * @default false
   */
  showSecondarySidebar?: boolean;
}

/**
 * Context do AppLayout.
 * Compartilhado entre todos os subcomponentes.
 */
export interface AppLayoutContextValue {
  showSidebar: boolean;
  showSecondarySidebar: boolean;
  secondarySidebarWidth: SidebarWidth;
  setSecondarySidebarOpen: (open: boolean) => void;
  setSecondarySidebarWidth: (width: SidebarWidth) => void;
}

/**
 * Props do AppLayout.Sidebar.
 */
export interface AppLayoutSidebarProps extends BaseLayoutProps {}

/**
 * Props do AppLayout.SecondarySidebar.
 */
export interface AppLayoutSecondarySidebarProps extends BaseLayoutProps {
  /**
   * Largura da sidebar secundária.
   * @default 'md'
   */
  width?: SidebarWidth;
}

/**
 * Props do AppLayout.Content.
 */
export interface AppLayoutContentProps extends BaseLayoutProps {}

/**
 * Props do AppLayout.Header.
 */
export interface AppLayoutHeaderProps extends CabecalhoPaginaProps {}

/**
 * Props do AppLayout.Body.
 */
export interface AppLayoutBodyProps extends BaseLayoutProps {
  /**
   * Remove padding padrão (p-6).
   * @default false
   */
  noPadding?: boolean;
}

// =============================================================================
// PAGE LAYOUT - HIGH-LEVEL ABSTRACTION TYPES
// =============================================================================

/**
 * Props do PageLayout.
 * Abstração de alto nível para páginas padrão.
 *
 * @example
 * ```tsx
 * <PageLayout
 *   titulo="Contatos"
 *   subtitulo="Gerencie seus contatos"
 *   icone={<Users />}
 *   acoes={<Button>Novo</Button>}
 *   sidebar={<SecaoSidebar>...</SecaoSidebar>}
 *   sidebarWidth="sm"
 * >
 *   <GridCards>...</GridCards>
 * </PageLayout>
 * ```
 */
export interface PageLayoutProps extends BaseLayoutProps {
  /**
   * Título da página.
   */
  titulo: string;

  /**
   * Subtítulo/descrição da página.
   */
  subtitulo?: string;

  /**
   * Ícone da página.
   */
  icone?: ReactNode;

  /**
   * Ações do cabeçalho (botões, menus).
   */
  acoes?: ReactNode;

  /**
   * Conteúdo da sidebar secundária.
   */
  sidebar?: ReactNode;

  /**
   * Largura da sidebar secundária.
   * @default 'md'
   */
  sidebarWidth?: SidebarWidth;

  /**
   * Remove padding do body (p-6).
   * @default false
   */
  noPadding?: boolean;

  /**
   * Oculta MenuLateral (sidebar principal).
   * @default false
   */
  hideSidebar?: boolean;
}

// =============================================================================
// LOADING STATE - TYPES
// =============================================================================

/**
 * Variantes do LoadingState.
 */
export type LoadingStateVariant = 'fullscreen' | 'page' | 'inline' | 'spinner' | 'skeleton';

/**
 * Tamanhos do LoadingState.
 */
export type LoadingStateSize = 'sm' | 'md' | 'lg';

/**
 * Props do LoadingState.
 * Componente unificado de loading que consolida múltiplos componentes.
 *
 * @example
 * ```tsx
 * <LoadingState variant="fullscreen" text="Carregando..." />
 * <LoadingState variant="page" text="Carregando dados..." size="lg" />
 * <LoadingState variant="inline" text="Salvando..." size="sm" />
 * <LoadingState variant="spinner" size="md" />
 * ```
 */
export interface LoadingStateProps extends BaseLayoutProps {
  /**
   * Variante visual do loading.
   * @default 'page'
   */
  variant?: LoadingStateVariant;

  /**
   * Texto exibido (não usado em variant="spinner").
   */
  text?: string;

  /**
   * Tamanho do spinner.
   * @default 'md'
   */
  size?: LoadingStateSize;
}

// =============================================================================
// EMPTY STATE - TYPES
// =============================================================================

/**
 * Variantes do EmptyState.
 */
export type EmptyStateVariantType = 'default' | 'search' | 'error' | 'inbox';

/**
 * Ação do EmptyState.
 */
export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link';
}

/**
 * Props do EmptyState.
 * Componente unificado que consolida EstadoVazio, EstadoErro, EstadoBuscaVazia.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   variant="default"
 *   title="Nenhum contato"
 *   description="Crie seu primeiro contato para começar"
 *   icon={<Users />}
 *   primaryAction={{ label: 'Novo Contato', onClick: handleNovo }}
 * />
 *
 * <EmptyState
 *   variant="search"
 *   title="Sem resultados"
 *   description="Tente buscar com outros termos"
 *   secondaryAction={{ label: 'Limpar busca', onClick: handleLimpar }}
 * />
 *
 * <EmptyState
 *   variant="error"
 *   title="Erro ao carregar"
 *   description="Ocorreu um erro. Tente novamente."
 *   primaryAction={{ label: 'Tentar novamente', onClick: handleRetry }}
 * />
 * ```
 */
export interface EmptyStatePropsNew extends BaseLayoutProps {
  /**
   * Variante visual do estado vazio.
   * @default 'default'
   */
  variant?: EmptyStateVariantType;

  /**
   * Título principal.
   */
  title: string;

  /**
   * Descrição detalhada (opcional).
   */
  description?: string;

  /**
   * Ícone customizado (sobrescreve ícone padrão da variante).
   */
  icon?: ReactNode;

  /**
   * Ação primária (botão destacado).
   */
  primaryAction?: EmptyStateAction;

  /**
   * Ação secundária (botão outline).
   */
  secondaryAction?: EmptyStateAction;
}

// =============================================================================
// BRANDED TYPES - DOMAIN IDS
// =============================================================================

/**
 * IDs únicos para páginas, componentes e layouts.
 * Branded types para segurança de tipos em runtime.
 */
export type PaginaId = Brand<string, 'PaginaId'>;
export type ComponenteId = Brand<string, 'ComponenteId'>;
export type LayoutId = Brand<string, 'LayoutId'>;

// =============================================================================
// NOTA: Todos os tipos são exportados inline com 'export type' ou 'export interface'
// Importar via: import type { ... } from '@/tipos/layout.tipos';
// =============================================================================
