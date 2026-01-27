import { useState, useCallback } from 'react';

// =============================================================================
// Tipos
// =============================================================================

export interface Toast {
  id: string;
  titulo?: string;
  descricao?: string;
  variante?: 'default' | 'destructive' | 'success';
}

interface ToastState {
  toasts: Toast[];
}

// =============================================================================
// Hook de Toast
// =============================================================================

let toastCount = 0;

function gerarId(): string {
  toastCount += 1;
  return `toast-${toastCount}`;
}

const listeners: Array<(state: ToastState) => void> = [];
let memoryState: ToastState = { toasts: [] };

function dispatch(toast: Toast) {
  memoryState = {
    toasts: [...memoryState.toasts, toast],
  };

  listeners.forEach((listener) => listener(memoryState));

  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== toast.id),
    };
    listeners.forEach((listener) => listener(memoryState));
  }, 5000);
}

export function useToast() {
  const [state, setState] = useState<ToastState>(memoryState);

  // Registrar listener
  useState(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  });

  const toast = useCallback(
    (props: Omit<Toast, 'id'>) => {
      const id = gerarId();
      dispatch({ ...props, id });
      return id;
    },
    []
  );

  const sucesso = useCallback(
    (titulo: string, descricao?: string) => {
      return toast({ titulo, descricao, variante: 'success' });
    },
    [toast]
  );

  const erro = useCallback(
    (titulo: string, descricao?: string) => {
      return toast({ titulo, descricao, variante: 'destructive' });
    },
    [toast]
  );

  const info = useCallback(
    (titulo: string, descricao?: string) => {
      return toast({ titulo, descricao, variante: 'default' });
    },
    [toast]
  );

  const remover = useCallback((id: string) => {
    memoryState = {
      toasts: memoryState.toasts.filter((t) => t.id !== id),
    };
    listeners.forEach((listener) => listener(memoryState));
  }, []);

  return {
    toasts: state.toasts,
    toast,
    sucesso,
    erro,
    info,
    remover,
  };
}
