// =============================================================================
// APP LAYOUT - COMPOUND COMPONENTS EXPORTS
// =============================================================================
//
// Sistema de layout flexível usando Compound Components Pattern.
//
// Uso:
// import { AppLayout } from '@/componentes/layout/AppLayout';
//
// <AppLayout>
//   <AppLayout.Sidebar />
//   <AppLayout.SecondarySidebar width="sm">...</AppLayout.SecondarySidebar>
//   <AppLayout.Content>
//     <AppLayout.Header titulo="Página" icone={<Icon />} acoes={<Button />} />
//     <AppLayout.Body>
//       {conteudo}
//     </AppLayout.Body>
//   </AppLayout.Content>
// </AppLayout>
//
// =============================================================================

import { AppLayoutRoot } from './AppLayout';
import { AppLayoutSidebar } from './AppLayoutSidebar';
import { AppLayoutSecondarySidebar } from './AppLayoutSecondarySidebar';
import { AppLayoutContent } from './AppLayoutContent';
import { AppLayoutHeader } from './AppLayoutHeader';
import { AppLayoutBody } from './AppLayoutBody';

/**
 * AppLayout - Sistema de layout com Compound Components.
 *
 * Permite composição flexível de layouts com sintaxe declarativa:
 * - AppLayout: Container raiz com Context
 * - AppLayout.Sidebar: MenuLateral (70px fixo)
 * - AppLayout.SecondarySidebar: Sidebar secundária (sm/md/lg)
 * - AppLayout.Content: Área de conteúdo principal
 * - AppLayout.Header: Cabeçalho da página
 * - AppLayout.Body: Corpo scrollable com padding
 */
export const AppLayout = Object.assign(AppLayoutRoot, {
  Sidebar: AppLayoutSidebar,
  SecondarySidebar: AppLayoutSecondarySidebar,
  Content: AppLayoutContent,
  Header: AppLayoutHeader,
  Body: AppLayoutBody,
});

// Export de tipos
export type { AppLayoutRootProps, AppLayoutContextValue } from './types';
export { useAppLayoutContext } from './AppLayout';
