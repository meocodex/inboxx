import { memo } from 'react';
import { AppLayout } from './AppLayout';
import type { PageLayoutProps } from '@/tipos/layout.tipos';

// =============================================================================
// PAGE LAYOUT - ABSTRAÇÃO DE ALTO NÍVEL
// =============================================================================
//
// Template para páginas padrão do sistema.
// Usa AppLayout internamente mas fornece API simplificada via props.
//
// Estrutura gerada:
// - MenuLateral (70px) - opcional (hideSidebar)
// - SidebarSecundaria (filtros/navegação) - opcional (sidebar)
// - CabecalhoPagina (título + ações)
// - Conteúdo com padding p-6 (opcional noPadding)
//
// Uso:
// <PageLayout
//   titulo="Contatos"
//   subtitulo="Gerencie seus contatos"
//   icone={<Users />}
//   acoes={<Button>Novo</Button>}
//   sidebar={<SecaoSidebar>...</SecaoSidebar>}
//   sidebarWidth="sm"
// >
//   <GridCards>...</GridCards>
// </PageLayout>
//
// =============================================================================

export const PageLayout = memo(({
  children,
  className,
  titulo,
  subtitulo,
  icone,
  acoes,
  sidebar,
  sidebarWidth = 'md',
  noPadding = false,
  hideSidebar = false,
}: PageLayoutProps) => {
  return (
    <AppLayout showSidebar={!hideSidebar} className={className}>
      {/* Sidebar principal (MenuLateral) */}
      <AppLayout.Sidebar />

      {/* Sidebar secundária (opcional) */}
      {sidebar && (
        <AppLayout.SecondarySidebar width={sidebarWidth}>
          {sidebar}
        </AppLayout.SecondarySidebar>
      )}

      {/* Área de conteúdo */}
      <AppLayout.Content>
        {/* Cabeçalho */}
        <AppLayout.Header
          titulo={titulo}
          subtitulo={subtitulo}
          icone={icone}
          acoes={acoes}
        />

        {/* Corpo scrollable */}
        <AppLayout.Body noPadding={noPadding}>
          {children}
        </AppLayout.Body>
      </AppLayout.Content>
    </AppLayout>
  );
});

PageLayout.displayName = 'PageLayout';
