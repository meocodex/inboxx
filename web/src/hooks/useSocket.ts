import { useEffect, useRef, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { obterToken } from '@/servicos/api';
import { useEstaAutenticado } from '@/stores';
import { WS_URL } from '@/configuracao/env';

// =============================================================================
// Tipos
// =============================================================================

export interface MensagemEvento {
  id: string;
  tipo: string;
  conteudo?: string;
  midiaUrl?: string;
  origem: string;
  conversaId: string;
  remetenteId?: string;
  remetente?: {
    id: string;
    nome: string;
  };
  enviadoEm: string;
}

export interface ConversaEvento {
  id: string;
  status: string;
  contatoId: string;
  contato: {
    id: string;
    nome: string;
    telefone?: string;
    avatarUrl?: string;
  };
  atendenteId?: string;
  atendente?: {
    id: string;
    nome: string;
  };
  ultimaMensagem?: MensagemEvento;
  naoLidas: number;
  atualizadoEm: string;
}

export interface NotificacaoEvento {
  tipo: 'info' | 'sucesso' | 'aviso' | 'erro';
  titulo: string;
  mensagem: string;
  dados?: Record<string, unknown>;
  acao?: {
    label: string;
    url?: string;
  };
}

export interface DigitandoEvento {
  usuarioId: string;
  nome: string;
  conversaId: string;
}

export interface UsuarioPresencaEvento {
  usuarioId: string;
  nome?: string;
}

// =============================================================================
// Eventos
// =============================================================================

export const EVENTOS = {
  // Mensagens
  NOVA_MENSAGEM: 'nova_mensagem',
  MENSAGEM_ENVIADA: 'mensagem_enviada',
  MENSAGEM_LIDA: 'mensagem_lida',
  MENSAGEM_ERRO: 'mensagem_erro',

  // Conversa
  CONVERSA_ATUALIZADA: 'conversa_atualizada',
  CONVERSA_ATRIBUIDA: 'conversa_atribuida',
  CONVERSA_FINALIZADA: 'conversa_finalizada',

  // Digitando
  DIGITANDO_INICIO: 'digitando_inicio',
  DIGITANDO_FIM: 'digitando_fim',

  // Notificacoes
  NOTIFICACAO: 'notificacao',

  // Presenca
  USUARIO_ONLINE: 'usuario_online',
  USUARIO_OFFLINE: 'usuario_offline',
} as const;

// =============================================================================
// Hook Principal
// =============================================================================

interface UseSocketOptions {
  autoConnect?: boolean;
}

export function useSocket(options: UseSocketOptions = {}) {
  const { autoConnect = true } = options;
  const socketRef = useRef<Socket | null>(null);
  const [conectado, setConectado] = useState(false);
  const [reconectando, setReconectando] = useState(false);

  const autenticado = useEstaAutenticado();

  // ---------------------------------------------------------------------------
  // Conectar
  // ---------------------------------------------------------------------------
  const conectar = useCallback(() => {
    const token = obterToken();
    if (socketRef.current?.connected || !token) return;

    const url = WS_URL;

    socketRef.current = io(url, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current.on('connect', () => {
      setConectado(true);
      setReconectando(false);
      console.log('[Socket] Conectado');
    });

    socketRef.current.on('disconnect', (reason) => {
      setConectado(false);
      console.log('[Socket] Desconectado:', reason);
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('[Socket] Erro de conexao:', error.message);
      setConectado(false);
    });

    socketRef.current.on('reconnect_attempt', (attempt) => {
      setReconectando(true);
      console.log('[Socket] Tentativa de reconexao:', attempt);
    });

    socketRef.current.on('reconnect', () => {
      setReconectando(false);
      console.log('[Socket] Reconectado');
    });
  }, []);

  // ---------------------------------------------------------------------------
  // Desconectar
  // ---------------------------------------------------------------------------
  const desconectar = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setConectado(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Entrar/Sair de conversa
  // ---------------------------------------------------------------------------
  const entrarConversa = useCallback((conversaId: string) => {
    socketRef.current?.emit('entrar_conversa', conversaId);
  }, []);

  const sairConversa = useCallback((conversaId: string) => {
    socketRef.current?.emit('sair_conversa', conversaId);
  }, []);

  // ---------------------------------------------------------------------------
  // Digitando
  // ---------------------------------------------------------------------------
  const iniciarDigitando = useCallback((conversaId: string) => {
    socketRef.current?.emit(EVENTOS.DIGITANDO_INICIO, conversaId);
  }, []);

  const pararDigitando = useCallback((conversaId: string) => {
    socketRef.current?.emit(EVENTOS.DIGITANDO_FIM, conversaId);
  }, []);

  // ---------------------------------------------------------------------------
  // Marcar como lida
  // ---------------------------------------------------------------------------
  const marcarLida = useCallback((conversaId: string, mensagemId: string) => {
    socketRef.current?.emit('marcar_lida', { conversaId, mensagemId });
  }, []);

  // ---------------------------------------------------------------------------
  // Listeners
  // ---------------------------------------------------------------------------
  const on = useCallback(<T = unknown>(evento: string, callback: (dados: T) => void) => {
    socketRef.current?.on(evento, callback);
    return () => {
      socketRef.current?.off(evento, callback);
    };
  }, []);

  const off = useCallback((evento: string, callback?: (...args: unknown[]) => void) => {
    if (callback) {
      socketRef.current?.off(evento, callback);
    } else {
      socketRef.current?.off(evento);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (autoConnect && autenticado) {
      conectar();
    }

    return () => {
      desconectar();
    };
  }, [autoConnect, autenticado, conectar, desconectar]);

  return {
    socket: socketRef.current,
    conectado,
    reconectando,
    conectar,
    desconectar,
    entrarConversa,
    sairConversa,
    iniciarDigitando,
    pararDigitando,
    marcarLida,
    on,
    off,
  };
}

// =============================================================================
// Hooks Especializados
// =============================================================================

/**
 * Hook para ouvir novas mensagens
 */
export function useNovaMensagem(callback: (dados: { conversaId: string; mensagem: MensagemEvento }) => void) {
  const { on } = useSocket({ autoConnect: false });

  useEffect(() => {
    return on(EVENTOS.NOVA_MENSAGEM, callback);
  }, [on, callback]);
}

/**
 * Hook para ouvir atualizacoes de conversa
 */
export function useConversaAtualizada(callback: (conversa: ConversaEvento) => void) {
  const { on } = useSocket({ autoConnect: false });

  useEffect(() => {
    return on(EVENTOS.CONVERSA_ATUALIZADA, callback);
  }, [on, callback]);
}

/**
 * Hook para ouvir notificacoes
 */
export function useNotificacao(callback: (notificacao: NotificacaoEvento) => void) {
  const { on } = useSocket({ autoConnect: false });

  useEffect(() => {
    return on(EVENTOS.NOTIFICACAO, callback);
  }, [on, callback]);
}

/**
 * Hook para ouvir indicador de digitando
 */
export function useDigitando(conversaId: string) {
  const { on } = useSocket({ autoConnect: false });
  const [digitando, setDigitando] = useState<DigitandoEvento | null>(null);

  useEffect(() => {
    const unsubInicio = on<DigitandoEvento>(EVENTOS.DIGITANDO_INICIO, (dados) => {
      if (dados.conversaId === conversaId) {
        setDigitando(dados);
      }
    });

    const unsubFim = on<DigitandoEvento>(EVENTOS.DIGITANDO_FIM, (dados) => {
      if (dados.conversaId === conversaId) {
        setDigitando(null);
      }
    });

    return () => {
      unsubInicio();
      unsubFim();
    };
  }, [on, conversaId]);

  // Auto-limpar apos 5 segundos sem atividade
  useEffect(() => {
    if (!digitando) return;

    const timeout = setTimeout(() => {
      setDigitando(null);
    }, 5000);

    return () => clearTimeout(timeout);
  }, [digitando]);

  return digitando;
}

/**
 * Hook para ouvir presenca de usuarios
 */
export function usePresenca() {
  const { on } = useSocket({ autoConnect: false });
  const [usuariosOnline, setUsuariosOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    const unsubOnline = on<UsuarioPresencaEvento>(EVENTOS.USUARIO_ONLINE, (dados) => {
      setUsuariosOnline((prev) => new Set(prev).add(dados.usuarioId));
    });

    const unsubOffline = on<UsuarioPresencaEvento>(EVENTOS.USUARIO_OFFLINE, (dados) => {
      setUsuariosOnline((prev) => {
        const next = new Set(prev);
        next.delete(dados.usuarioId);
        return next;
      });
    });

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [on]);

  return {
    usuariosOnline: Array.from(usuariosOnline),
    estaOnline: (usuarioId: string) => usuariosOnline.has(usuarioId),
  };
}
