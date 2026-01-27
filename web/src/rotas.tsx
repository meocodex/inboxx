import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LayoutPrincipal } from '@/componentes/layout';
import { CarregandoPagina } from '@/componentes/comum/Carregando';

// =============================================================================
// Lazy Loading de Páginas
// =============================================================================

const Entrar = lazy(() => import('@/paginas/autenticacao/Entrar'));
const Dashboard = lazy(() => import('@/paginas/painel/Dashboard'));
const Conversas = lazy(() => import('@/paginas/conversas/Conversas'));
const Contatos = lazy(() => import('@/paginas/contatos/Contatos'));
const Kanban = lazy(() => import('@/paginas/kanban/Kanban'));
const Campanhas = lazy(() => import('@/paginas/campanhas/Campanhas'));
const Relatorios = lazy(() => import('@/paginas/relatorios/Relatorios'));
const Etiquetas = lazy(() => import('@/paginas/etiquetas/Etiquetas'));
const Chatbot = lazy(() => import('@/paginas/chatbot/Chatbot'));
const Agenda = lazy(() => import('@/paginas/agenda/Agenda'));
const Configuracoes = lazy(() => import('@/paginas/configuracoes/Configuracoes'));
const Conexoes = lazy(() => import('@/paginas/conexoes/Conexoes'));
const Usuarios = lazy(() => import('@/paginas/usuarios/Usuarios'));

// =============================================================================
// Wrapper de Suspense
// =============================================================================

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<CarregandoPagina />}>{children}</Suspense>;
}

// =============================================================================
// Configuração do Router
// =============================================================================

export const router = createBrowserRouter([
  // Rotas Públicas (Autenticação)
  {
    path: '/entrar',
    element: (
      <SuspenseWrapper>
        <Entrar />
      </SuspenseWrapper>
    ),
  },

  // Rotas Protegidas (Dashboard)
  {
    path: '/',
    element: <LayoutPrincipal />,
    children: [
      {
        index: true,
        element: (
          <SuspenseWrapper>
            <Dashboard />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'conversas',
        element: (
          <SuspenseWrapper>
            <Conversas />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'contatos',
        element: (
          <SuspenseWrapper>
            <Contatos />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'etiquetas',
        element: (
          <SuspenseWrapper>
            <Etiquetas />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'chatbot',
        element: (
          <SuspenseWrapper>
            <Chatbot />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'campanhas',
        element: (
          <SuspenseWrapper>
            <Campanhas />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'kanban',
        element: (
          <SuspenseWrapper>
            <Kanban />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'agenda',
        element: (
          <SuspenseWrapper>
            <Agenda />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'relatorios',
        element: (
          <SuspenseWrapper>
            <Relatorios />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'configuracoes',
        element: (
          <SuspenseWrapper>
            <Configuracoes />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'conexoes',
        element: (
          <SuspenseWrapper>
            <Conexoes />
          </SuspenseWrapper>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <SuspenseWrapper>
            <Usuarios />
          </SuspenseWrapper>
        ),
      },
    ],
  },

  // Rota 404 - Redireciona para Dashboard
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
