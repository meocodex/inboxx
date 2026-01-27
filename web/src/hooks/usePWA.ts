import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Tipos
// =============================================================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface PWAState {
  isInstallable: boolean;
  isInstalled: boolean;
  isStandalone: boolean;
  canInstall: boolean;
}

// =============================================================================
// Hook para PWA
// =============================================================================

export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isStandalone: false,
    canInstall: false,
  });

  // Verificar se esta rodando como PWA standalone
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

  // Verificar se ja foi instalado (localStorage)
  const checkIfInstalled = useCallback(() => {
    const installed = localStorage.getItem('pwa-installed') === 'true';
    return installed || isStandalone;
  }, [isStandalone]);

  // Capturar evento beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setState((prev) => ({
        ...prev,
        isInstallable: true,
        canInstall: true,
      }));
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detectar instalacao
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('pwa-installed', 'true');
      setInstallPrompt(null);
      setState((prev) => ({
        ...prev,
        isInstalled: true,
        canInstall: false,
      }));
    });

    // Verificar estado inicial
    setState({
      isInstallable: false,
      isInstalled: checkIfInstalled(),
      isStandalone,
      canInstall: false,
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [checkIfInstalled, isStandalone]);

  // Funcao para instalar
  const install = useCallback(async () => {
    if (!installPrompt) {
      return { success: false, reason: 'prompt-not-available' };
    }

    try {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;

      if (outcome === 'accepted') {
        localStorage.setItem('pwa-installed', 'true');
        setInstallPrompt(null);
        setState((prev) => ({
          ...prev,
          isInstalled: true,
          canInstall: false,
        }));
        return { success: true };
      }

      return { success: false, reason: 'user-dismissed' };
    } catch (error) {
      return { success: false, reason: 'error', error };
    }
  }, [installPrompt]);

  // Dispensar prompt
  const dismiss = useCallback(() => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setInstallPrompt(null);
    setState((prev) => ({
      ...prev,
      canInstall: false,
    }));
  }, []);

  // Verificar se deve mostrar prompt
  const shouldShowPrompt = useCallback(() => {
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedAt = localStorage.getItem('pwa-install-dismissed-at');

    // Se nunca dispensou, mostrar
    if (!dismissed) return true;

    // Se dispensou mas foi ha mais de 7 dias, mostrar novamente
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (days > 7) {
        localStorage.removeItem('pwa-install-dismissed');
        localStorage.removeItem('pwa-install-dismissed-at');
        return true;
      }
    }

    return false;
  }, []);

  return {
    ...state,
    install,
    dismiss,
    shouldShowPrompt: shouldShowPrompt() && state.canInstall,
  };
}

export default usePWA;
