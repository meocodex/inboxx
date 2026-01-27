import { useState, useEffect, useCallback } from 'react';

// =============================================================================
// Hook para Detectar Status Online/Offline
// =============================================================================

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineAt, setLastOnlineAt] = useState<Date | null>(
    navigator.onLine ? new Date() : null
  );

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    setLastOnlineAt(new Date());
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return {
    isOnline,
    isOffline: !isOnline,
    lastOnlineAt,
  };
}

// =============================================================================
// Hook para Verificar Conexao Real (ping ao servidor)
// =============================================================================

export function useConnectionCheck(checkInterval = 30000) {
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheckAt, setLastCheckAt] = useState<Date | null>(null);

  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/saude', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsConnected(response.ok);
      setLastCheckAt(new Date());
    } catch {
      setIsConnected(false);
      setLastCheckAt(new Date());
    }
  }, []);

  useEffect(() => {
    // Verificar imediatamente
    checkConnection();

    // Configurar intervalo
    const intervalId = setInterval(checkConnection, checkInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [checkConnection, checkInterval]);

  return {
    isConnected,
    lastCheckAt,
    checkNow: checkConnection,
  };
}

export default useOnlineStatus;
