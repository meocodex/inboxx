// =============================================================================
// APP LAYOUT - TYPES
// =============================================================================
//
// Tipos internos do sistema AppLayout.
// Compound Components Pattern com Context API.
//
// =============================================================================

import type { ReactNode } from 'react';
import type { SidebarWidth } from '@/tipos/layout.tipos';

/**
 * Props do AppLayout raiz.
 */
export interface AppLayoutRootProps {
  children: ReactNode;
  className?: string;

  /**
   * Exibir sidebar principal (MenuLateral).
   * @default true
   */
  showSidebar?: boolean;
}

/**
 * Context compartilhado entre todos os subcomponentes do AppLayout.
 */
export interface AppLayoutContextValue {
  /**
   * Sidebar principal está visível.
   */
  showSidebar: boolean;

  /**
   * Sidebar secundária está visível.
   */
  showSecondarySidebar: boolean;

  /**
   * Largura da sidebar secundária.
   */
  secondarySidebarWidth: SidebarWidth;

  /**
   * Controlar visibilidade da sidebar secundária.
   */
  setSecondarySidebarOpen: (open: boolean) => void;

  /**
   * Controlar largura da sidebar secundária.
   */
  setSecondarySidebarWidth: (width: SidebarWidth) => void;
}

/**
 * Props do AppLayout.Sidebar.
 */
export interface AppLayoutSidebarProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Props do AppLayout.SecondarySidebar.
 */
export interface AppLayoutSecondarySidebarProps {
  children?: ReactNode;
  className?: string;

  /**
   * Largura da sidebar secundária.
   * @default 'md'
   */
  width?: SidebarWidth;
}

/**
 * Props do AppLayout.Content.
 */
export interface AppLayoutContentProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Props do AppLayout.Header.
 */
export interface AppLayoutHeaderProps {
  children?: ReactNode;
  className?: string;

  /**
   * Título do cabeçalho.
   */
  titulo?: string;

  /**
   * Subtítulo do cabeçalho.
   */
  subtitulo?: string;

  /**
   * Ícone do cabeçalho.
   */
  icone?: ReactNode;

  /**
   * Ações do cabeçalho.
   */
  acoes?: ReactNode;

  /**
   * Exibir borda inferior.
   * @default true
   */
  comBorda?: boolean;
}

/**
 * Props do AppLayout.Body.
 */
export interface AppLayoutBodyProps {
  children?: ReactNode;
  className?: string;

  /**
   * Remove padding padrão (p-6).
   * @default false
   */
  noPadding?: boolean;
}
