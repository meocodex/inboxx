import { memo, useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useUsuario, useCarregandoAuth, useAutenticacaoStore, useHidratado } from '@/stores';
import { estaAutenticado } from '@/servicos/api';
import type { AuthGuardConfig } from '@/tipos/layout.tipos';

// =============================================================================
// AUTHGUARD - COMPONENTE DE PROTEÇÃO DE ROTAS
// =============================================================================
//
// Unifica a lógica de autenticação de RotaProtegida.tsx e LayoutPrincipal.tsx.
// Elimina ~70 linhas duplicadas entre os dois componentes.
//
// Funcionalidades:
// 1. Aguarda hidratação do Zustand (timeout de 2s para fallback)
// 2. Verifica token no sessionStorage via estaAutenticado()
// 3. Se tem token mas não tem usuário, carrega via carregarUsuario()
// 4. Se não tem token, redireciona para /entrar
// 5. Se tem usuário, renderiza children
//
// =============================================================================

interface AuthGuardProps {
  children: ReactNode;
  config?: AuthGuardConfig;
}

const defaultConfig: Required<AuthGuardConfig> = {
  hydrationTimeout: 2000,
  loadingMessage: 'Carregando...',
  redirectTo: '/entrar',
};

export const AuthGuard = memo(({ children, config: userConfig }: AuthGuardProps) => {
  const config = { ...defaultConfig, ...userConfig };

  const usuario = useUsuario();
  const carregando = useCarregandoAuth();
  const hidratado = useHidratado();
  const carregarUsuario = useAutenticacaoStore((s) => s.carregarUsuario);

  // ---------------------------------------------------------------------------
  // Timeout de fallback para hidratação
  // ---------------------------------------------------------------------------
  const [forcarHidratado, setForcarHidratado] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hidratado) {
        console.warn('[AuthGuard] Hidratação do Zustand timeout após 2s, forçando.');
        setForcarHidratado(true);
      }
    }, config.hydrationTimeout);

    return () => clearTimeout(timer);
  }, [hidratado, config.hydrationTimeout]);

  const estaHidratado = hidratado || forcarHidratado;

  // ---------------------------------------------------------------------------
  // Carregar usuário se tem token mas não tem dados
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!estaHidratado) return;

    // Tem token mas não tem usuário = carrega do backend
    if (estaAutenticado() && !usuario && !carregando) {
      console.info('[AuthGuard] Token válido encontrado, carregando dados do usuário...');
      carregarUsuario();
    }
  }, [estaHidratado, usuario, carregando, carregarUsuario]);

  // ---------------------------------------------------------------------------
  // ESTADOS: hidratação → redirect → loading → renderizar
  // ---------------------------------------------------------------------------

  // 1. Aguardar hidratação do Zustand
  if (!estaHidratado) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted" />
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    );
  }

  // 2. Sem token após hidratação = redirect imediato
  if (!estaAutenticado()) {
    console.info('[AuthGuard] Token não encontrado, redirecionando para login...');
    return <Navigate to={config.redirectTo} replace />;
  }

  // 3. Loading enquanto carrega usuário
  if (carregando) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted" />
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">{config.loadingMessage}</p>
        </div>
      </div>
    );
  }

  // 4. Tem token mas sem usuário = aguarda carregamento
  if (!usuario) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-4 border-muted" />
            <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
      </div>
    );
  }

  // 5. Autenticado com usuário = renderiza children
  console.debug('[AuthGuard] Usuário autenticado:', usuario.nome);
  return <>{children}</>;
});

AuthGuard.displayName = 'AuthGuard';
