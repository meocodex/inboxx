import { WifiOff, RefreshCw } from 'lucide-react';

import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { cn } from '@/utilitarios/cn';

// =============================================================================
// Props
// =============================================================================

interface OfflineIndicadorProps {
  className?: string;
  showReconnecting?: boolean;
}

// =============================================================================
// Componente
// =============================================================================

export function OfflineIndicador({
  className,
  showReconnecting = true,
}: OfflineIndicadorProps) {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 left-1/2 -translate-x-1/2 z-50',
        'flex items-center gap-2 px-4 py-2 rounded-full',
        'bg-yellow-500 text-white shadow-lg',
        'animate-in slide-in-from-bottom-4 fade-in duration-300',
        className
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span className="text-sm font-medium">Voce esta offline</span>
      {showReconnecting && (
        <RefreshCw className="h-4 w-4 animate-spin" />
      )}
    </div>
  );
}

// =============================================================================
// Versao Banner
// =============================================================================

export function OfflineBanner({ className }: { className?: string }) {
  const { isOffline } = useOnlineStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full py-2 px-4 bg-yellow-500 text-white text-center text-sm',
        className
      )}
    >
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        <span>Voce esta sem conexao. Algumas funcoes podem estar limitadas.</span>
      </div>
    </div>
  );
}

export default OfflineIndicador;
