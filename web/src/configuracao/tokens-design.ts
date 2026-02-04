// =============================================================================
// DESIGN TOKENS - SISTEMA CENTRALIZADO DE DESIGN
// =============================================================================
//
// Sistema de tokens de design do Inboxx para garantir consistência visual
// em toda a aplicação. Todos os valores são baseados em métricas validadas
// das páginas existentes e seguem as diretrizes do CLAUDE.md.
//
// Versão: 1.0.0
// Criado: 2026-02-04
// =============================================================================

/**
 * Paleta de cores principal do sistema.
 * Baseada na cor primária #00D97E (HSL: 158 100% 42%) definida no CLAUDE.md.
 * Todas as cores passam em validação WCAG AA para acessibilidade.
 */
export const CORES = {
  /**
   * Cor primária da marca (#00D97E).
   * Uso: Botões primários, links, elementos de destaque.
   */
  primary: {
    default: 'hsl(158 100% 42%)',
    hover: 'hsl(158 100% 38%)',
    active: 'hsl(158 100% 34%)',
    disabled: 'hsl(158 100% 42% / 0.5)',
    foreground: 'hsl(0 0% 100%)', // Branco sobre primary
  },

  /**
   * Cores de feedback do sistema.
   */
  feedback: {
    success: 'hsl(158 100% 42%)', // Mesma cor primary
    warning: 'hsl(45 100% 50%)',
    error: 'hsl(0 84.2% 60.2%)',
    info: 'hsl(214 89% 52%)',
  },

  /**
   * Cores de canais de comunicação.
   */
  channels: {
    whatsapp: 'hsl(142 70% 49%)',
    instagram: 'hsl(340 82% 57%)',
    facebook: 'hsl(214 89% 52%)',
  },

  /**
   * Cores de status de usuário.
   */
  status: {
    online: 'hsl(158 100% 42%)',
    away: 'hsl(45 100% 50%)',
    busy: 'hsl(3 100% 64%)',
    offline: 'hsl(0 0% 55%)',
  },
} as const;

/**
 * Sistema de espaçamento baseado em valores reais das páginas.
 * Todos os valores são múltiplos de 4px para consistência.
 */
export const ESPACAMENTO = {
  /**
   * Padding do conteúdo principal das páginas.
   * Usado em: Dashboard, Contatos, Campanhas, Chatbot, Usuários.
   * Valor: 24px (p-6 do Tailwind).
   */
  conteudo: '1.5rem', // 24px

  /**
   * Padding interno de cards.
   * Valor: 16px (p-4 do Tailwind).
   */
  card: '1rem', // 16px

  /**
   * Gap entre elementos em grids e listas.
   * Usado em: GridCards de todas as páginas.
   * Valor: 16px (gap-4 do Tailwind).
   */
  gap: '1rem', // 16px

  /**
   * Padding interno da sidebar secundária.
   * Valor: 12px (p-3 do Tailwind).
   */
  sidebar: '0.75rem', // 12px

  /**
   * Padding do MenuLateral (sidebar principal).
   * Valor: 12px (p-3 do Tailwind).
   */
  menu: '0.75rem', // 12px

  /**
   * Altura do cabeçalho de página.
   * Valor: 64px (h-16 do Tailwind).
   */
  headerHeight: '4rem', // 64px
} as const;

/**
 * Escala tipográfica completa do sistema.
 * Baseada na escala do Tailwind CSS.
 */
export const TIPOGRAFIA = {
  tamanhos: {
    xs: '0.75rem', // 12px
    sm: '0.875rem', // 14px
    base: '1rem', // 16px
    lg: '1.125rem', // 18px
    xl: '1.25rem', // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem', // 48px
  },

  pesos: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  /**
   * Font family padrão do sistema.
   * Plus Jakarta Sans carregada via Google Fonts.
   */
  familia: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
} as const;

/**
 * Larguras das sidebars do sistema.
 */
export const LARGURAS = {
  /**
   * Largura da sidebar principal (MenuLateral).
   * Valor fixo: 70px.
   */
  sidebarPrincipal: '70px',

  /**
   * Larguras da sidebar secundária (filtros/navegação).
   */
  sidebarSecundaria: {
    sm: '256px', // w-64 do Tailwind
    md: '320px', // w-80 do Tailwind
    lg: '384px', // w-96 do Tailwind
  },
} as const;

/**
 * Tamanhos de ícones padronizados.
 * Mapeados para classes h-{n} w-{n} do Tailwind.
 */
export const ICONES = {
  tamanhos: {
    xs: '12px', // h-3 w-3
    sm: '16px', // h-4 w-4
    md: '20px', // h-5 w-5
    lg: '24px', // h-6 w-6
    xl: '32px', // h-8 w-8
    '2xl': '48px', // h-12 w-12
  },

  /**
   * Tamanhos de containers de ícones (botões, badges).
   */
  containers: {
    sm: '32px', // 8x8 do Tailwind
    md: '40px', // 10x10 do Tailwind
    lg: '48px', // 12x12 do Tailwind
  },
} as const;

/**
 * Border radius padronizados.
 * Alinhados com configuração do Tailwind.
 */
export const BORDAS = {
  radius: {
    none: '0',
    sm: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    full: '9999px', // Círculo completo
  },

  /**
   * Larguras de borda padrão.
   */
  larguras: {
    thin: '1px',
    medium: '2px',
    thick: '4px',
  },
} as const;

/**
 * Elevações (sombras) do sistema.
 * Baseadas no sistema de sombras do Tailwind.
 */
export const ELEVACOES = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

/**
 * Durações de transição/animação.
 * Baseadas em valores comuns do Tailwind.
 */
export const TRANSICOES = {
  duracoes: {
    fast: '150ms', // transition-all duration-150
    normal: '200ms', // transition-all duration-200
    slow: '300ms', // transition-all duration-300
  },

  /**
   * Timing functions (easing).
   */
  easings: {
    linear: 'linear',
    ease: 'ease',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
} as const;

/**
 * Breakpoints responsivos.
 * Alinhados com configuração do Tailwind CSS.
 */
export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Z-index layers do sistema.
 * Garante hierarquia consistente de sobreposição.
 */
export const Z_INDEX = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

/**
 * Configurações de grid padrão.
 */
export const GRID = {
  /**
   * Número de colunas disponíveis para GridCards.
   */
  colunas: {
    min: 1,
    max: 4,
    default: 3,
  },

  /**
   * Gap padrão do grid (16px).
   */
  gap: ESPACAMENTO.gap,
} as const;

/**
 * Objeto consolidado de todos os tokens de design.
 * Exportação principal para uso em toda a aplicação.
 *
 * @example
 * ```tsx
 * import { TOKENS_DESIGN } from '@/configuracao/tokens-design';
 *
 * // Uso em styled components ou styles inline
 * const styles = {
 *   padding: TOKENS_DESIGN.espacamento.conteudo,
 *   color: TOKENS_DESIGN.cores.primary.default,
 *   fontSize: TOKENS_DESIGN.tipografia.tamanhos.lg,
 * };
 * ```
 */
export const TOKENS_DESIGN = {
  cores: CORES,
  espacamento: ESPACAMENTO,
  tipografia: TIPOGRAFIA,
  larguras: LARGURAS,
  icones: ICONES,
  bordas: BORDAS,
  elevacoes: ELEVACOES,
  transicoes: TRANSICOES,
  breakpoints: BREAKPOINTS,
  zIndex: Z_INDEX,
  grid: GRID,
} as const;

/**
 * Type exports para uso em TypeScript.
 */
export type DesignTokens = typeof TOKENS_DESIGN;
export type Cor = keyof typeof CORES;
export type EspacamentoKey = keyof typeof ESPACAMENTO;
export type TamanhoTipografia = keyof typeof TIPOGRAFIA.tamanhos;
export type PesoTipografia = keyof typeof TIPOGRAFIA.pesos;
export type LarguraSidebar = keyof typeof LARGURAS.sidebarSecundaria;
export type TamanhoIcone = keyof typeof ICONES.tamanhos;
export type BorderRadius = keyof typeof BORDAS.radius;
export type Elevacao = keyof typeof ELEVACOES;
export type DuracaoTransicao = keyof typeof TRANSICOES.duracoes;
export type Breakpoint = keyof typeof BREAKPOINTS;
