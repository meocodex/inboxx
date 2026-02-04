// =============================================================================
// Exportacoes dos Componentes de Layout
// =============================================================================

// Layout Principal
export { LayoutPrincipal } from './LayoutPrincipal';
export { MenuLateral } from './MenuLateral';
export { ErrorBoundary } from './ErrorBoundary';

// Autenticação
export { AuthGuard } from './AuthGuard';

// Novo Sistema de Layout (Compound Components)
export { AppLayout, useAppLayoutContext } from './AppLayout';
export { PageLayout } from './PageLayout';

// Sidebar Secundaria
export {
  SidebarSecundaria,
  SecaoSidebar,
  ItemSidebar,
  CabecalhoSidebar,
  SeparadorSidebar,
  BuscaSidebar,
} from './SidebarSecundaria';

// Cabecalho de Pagina
export { CabecalhoPagina, BarraAcoes } from './CabecalhoPagina';

// Filtros Rapidos
export {
  FiltrosRapidos,
  ChipFiltro,
  CampoBusca,
  BarraFiltros,
  FiltroSelect,
  BotaoLimparFiltros,
} from './FiltrosRapidos';

// Card Item
export {
  CardItem,
  CardItemConteudo,
  CardItemAvatar,
  GridCards,
  ListaCards,
} from './CardItem';

// Estados de Loading (Novo Sistema)
export {
  LoadingState,
  CarregandoPagina, // @deprecated
  CarregandoInline, // @deprecated
  EstadoCarregando, // @deprecated
} from './LoadingState';

// Estados Vazios (Novo Sistema)
export {
  EmptyState,
  EstadoVazio, // @deprecated
  EstadoErro, // @deprecated
  EstadoBuscaVazia, // @deprecated
} from './EmptyState';
