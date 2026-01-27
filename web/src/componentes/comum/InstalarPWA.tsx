import { X, Download, Smartphone } from 'lucide-react';

import { usePWA } from '@/hooks/usePWA';
import { Button } from '@/componentes/ui/button';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Props
// =============================================================================

interface InstalarPWAProps {
  className?: string;
}

// =============================================================================
// Componente Banner de Instalacao
// =============================================================================

export function InstalarPWABanner({ className }: InstalarPWAProps) {
  const { shouldShowPrompt, install, dismiss, isStandalone } = usePWA();

  // Nao mostrar se ja esta instalado ou rodando como PWA
  if (!shouldShowPrompt || isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    const result = await install();
    if (!result.success) {
      console.log('Instalacao nao completada:', result.reason);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-install-dismissed-at', Date.now().toString());
    dismiss();
  };

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96',
        'bg-white dark:bg-gray-800 rounded-lg shadow-lg border',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        className
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Instalar CRM WhatsApp
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Instale o app para acesso rapido e funcionar offline
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="flex-1"
          >
            Depois
          </Button>
          <Button
            size="sm"
            onClick={handleInstall}
            className="flex-1 gap-2"
          >
            <Download className="h-4 w-4" />
            Instalar
          </Button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Botao de Instalacao para Menu
// =============================================================================

export function InstalarPWAButton({ className }: InstalarPWAProps) {
  const { canInstall, install, isStandalone } = usePWA();

  if (!canInstall || isStandalone) {
    return null;
  }

  const handleInstall = async () => {
    await install();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleInstall}
      className={cn('gap-2', className)}
    >
      <Download className="h-4 w-4" />
      Instalar App
    </Button>
  );
}

export default InstalarPWABanner;
