import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FiltroSidebar, TipoCanal } from '@/tipos';

// =============================================================================
// Interface do Estado
// =============================================================================

interface EstadoUI {
  // Sidebar
  sidebarAberta: boolean;
  sidebarColapsada: boolean;

  // Tema
  tema: 'light' | 'dark' | 'system';

  // Conversas
  conversaSelecionadaId: string | null;
  painelInfoAberto: boolean;

  // Conversas - Filtros (novo)
  filtroSidebarConversas: FiltroSidebar;
  canalAtivoConversas: TipoCanal | null;
  filtrosAvancadosAbertos: boolean;

  // Ações
  toggleSidebar: () => void;
  toggleSidebarColapsada: () => void;
  setTema: (tema: 'light' | 'dark' | 'system') => void;
  selecionarConversa: (id: string | null) => void;
  togglePainelInfo: () => void;
  setPainelInfoAberto: (aberto: boolean) => void;

  // Conversas - Filtros Ações (novo)
  setFiltroSidebarConversas: (filtro: FiltroSidebar) => void;
  setCanalAtivoConversas: (canal: TipoCanal | null) => void;
  toggleFiltrosAvancados: () => void;
}

// =============================================================================
// Store de UI
// =============================================================================

export const useUIStore = create<EstadoUI>()(
  persist(
    (set) => ({
      // Estado inicial
      sidebarAberta: true,
      sidebarColapsada: false,
      tema: 'light',
      conversaSelecionadaId: null,
      painelInfoAberto: false,
      filtroSidebarConversas: 'inbox',
      canalAtivoConversas: null,
      filtrosAvancadosAbertos: false,

      // -------------------------------------------------------------------------
      // Sidebar
      // -------------------------------------------------------------------------
      toggleSidebar: () =>
        set((state) => ({ sidebarAberta: !state.sidebarAberta })),

      toggleSidebarColapsada: () =>
        set((state) => ({ sidebarColapsada: !state.sidebarColapsada })),

      // -------------------------------------------------------------------------
      // Tema
      // -------------------------------------------------------------------------
      setTema: (tema) => {
        set({ tema });

        // Aplicar tema no documento
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');

        if (tema === 'system') {
          const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
            .matches
            ? 'dark'
            : 'light';
          root.classList.add(systemTheme);
        } else {
          root.classList.add(tema);
        }
      },

      // -------------------------------------------------------------------------
      // Conversas
      // -------------------------------------------------------------------------
      selecionarConversa: (id) =>
        set({ conversaSelecionadaId: id }),

      togglePainelInfo: () =>
        set((state) => ({ painelInfoAberto: !state.painelInfoAberto })),

      setPainelInfoAberto: (aberto) =>
        set({ painelInfoAberto: aberto }),

      // -------------------------------------------------------------------------
      // Conversas - Filtros
      // -------------------------------------------------------------------------
      setFiltroSidebarConversas: (filtro) =>
        set({ filtroSidebarConversas: filtro }),

      setCanalAtivoConversas: (canal) =>
        set({ canalAtivoConversas: canal }),

      toggleFiltrosAvancados: () =>
        set((state) => ({ filtrosAvancadosAbertos: !state.filtrosAvancadosAbertos })),
    }),
    {
      name: 'crm-ui-storage',
      partialize: (state) => ({
        tema: state.tema,
        sidebarColapsada: state.sidebarColapsada,
      }),
    }
  )
);

// =============================================================================
// Seletores
// =============================================================================

export const useSidebarAberta = () => useUIStore((state) => state.sidebarAberta);
export const useSidebarColapsada = () => useUIStore((state) => state.sidebarColapsada);
export const useTema = () => useUIStore((state) => state.tema);
export const useConversaSelecionadaId = () =>
  useUIStore((state) => state.conversaSelecionadaId);
export const usePainelInfoAberto = () => useUIStore((state) => state.painelInfoAberto);
