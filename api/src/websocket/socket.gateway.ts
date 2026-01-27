import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { verificarToken } from '../compartilhado/utilitarios/criptografia.js';
import { env } from '../configuracao/ambiente.js';
import { logger } from '../compartilhado/utilitarios/logger.js';
import { criarClientesPubSub, redisServico } from '../infraestrutura/cache/redis.servico.js';

// =============================================================================
// Tipos
// =============================================================================

interface UsuarioSocket {
  id: string;
  nome: string;
  clienteId: string;
  perfilId: string;
}

interface TokenPayload {
  sub: string;
  nome: string;
  clienteId: string;
  perfilId: string;
}

declare module 'socket.io' {
  interface Socket {
    usuario: UsuarioSocket;
  }
}

// =============================================================================
// Eventos
// =============================================================================

export const EVENTOS = {
  // Conexao
  CONECTAR: 'connect',
  DESCONECTAR: 'disconnect',
  ERRO: 'error',

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
// Socket Gateway
// =============================================================================

let io: Server | null = null;

export function criarSocketGateway(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGINS ? env.CORS_ORIGINS.split(',') : ['http://localhost:5173'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ---------------------------------------------------------------------------
  // Redis Adapter (escala horizontal - múltiplas instâncias)
  // ---------------------------------------------------------------------------
  try {
    const { pubClient, subClient } = criarClientesPubSub();
    io.adapter(createAdapter(pubClient, subClient));
    logger.info('WebSocket Redis adapter configurado');
  } catch (erro) {
    logger.warn({ erro }, 'Redis adapter nao configurado - WebSocket funcionara sem escala horizontal');
  }

  // ---------------------------------------------------------------------------
  // Middleware de Autenticacao
  // ---------------------------------------------------------------------------
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Token nao fornecido'));
      }

      const jwtPayload = await verificarToken(token);

      socket.usuario = {
        id: jwtPayload.sub,
        nome: (jwtPayload as unknown as TokenPayload).nome,
        clienteId: jwtPayload.clienteId as string,
        perfilId: jwtPayload.perfilId,
      };

      next();
    } catch (erro) {
      logger.error({ erro }, 'Erro na autenticacao do WebSocket');
      next(new Error('Token invalido'));
    }
  });

  // ---------------------------------------------------------------------------
  // Conexao
  // ---------------------------------------------------------------------------
  io.on('connection', async (socket: Socket) => {
    const { usuario } = socket;
    const roomCliente = `cliente:${usuario.clienteId}`;
    const roomUsuario = `usuario:${usuario.id}`;

    logger.info({ usuarioId: usuario.id, socketId: socket.id }, 'Usuario conectou ao WebSocket');

    // Entrar nas rooms
    socket.join(roomCliente);
    socket.join(roomUsuario);

    // Registrar presenca no Redis
    await registrarPresenca(usuario.id, usuario.clienteId, true);

    // Notificar outros usuarios do mesmo cliente
    socket.to(roomCliente).emit(EVENTOS.USUARIO_ONLINE, {
      usuarioId: usuario.id,
      nome: usuario.nome,
    });

    // -------------------------------------------------------------------------
    // Handlers de Eventos
    // -------------------------------------------------------------------------

    // Entrar em uma conversa especifica
    socket.on('entrar_conversa', (conversaId: string) => {
      socket.join(`conversa:${conversaId}`);
      logger.debug({ usuarioId: usuario.id, conversaId }, 'Usuario entrou na conversa');
    });

    // Sair de uma conversa
    socket.on('sair_conversa', (conversaId: string) => {
      socket.leave(`conversa:${conversaId}`);
      logger.debug({ usuarioId: usuario.id, conversaId }, 'Usuario saiu da conversa');
    });

    // Indicador de digitando
    socket.on(EVENTOS.DIGITANDO_INICIO, (conversaId: string) => {
      socket.to(`conversa:${conversaId}`).emit(EVENTOS.DIGITANDO_INICIO, {
        usuarioId: usuario.id,
        nome: usuario.nome,
        conversaId,
      });
    });

    socket.on(EVENTOS.DIGITANDO_FIM, (conversaId: string) => {
      socket.to(`conversa:${conversaId}`).emit(EVENTOS.DIGITANDO_FIM, {
        usuarioId: usuario.id,
        conversaId,
      });
    });

    // Marcar mensagem como lida
    socket.on('marcar_lida', (dados: { conversaId: string; mensagemId: string }) => {
      socket.to(`conversa:${dados.conversaId}`).emit(EVENTOS.MENSAGEM_LIDA, {
        ...dados,
        usuarioId: usuario.id,
      });
    });

    // -------------------------------------------------------------------------
    // Desconexao
    // -------------------------------------------------------------------------
    socket.on('disconnect', async (reason) => {
      logger.info({ usuarioId: usuario.id, socketId: socket.id, reason }, 'Usuario desconectou do WebSocket');

      // Remover presenca do Redis
      await registrarPresenca(usuario.id, usuario.clienteId, false);

      // Notificar outros usuarios
      socket.to(roomCliente).emit(EVENTOS.USUARIO_OFFLINE, {
        usuarioId: usuario.id,
      });
    });
  });

  logger.info('WebSocket Gateway inicializado');

  return io;
}

// =============================================================================
// Funcoes de Presenca
// =============================================================================

async function registrarPresenca(usuarioId: string, clienteId: string, online: boolean): Promise<void> {
  try {
    const chave = `presenca:${clienteId}`;
    if (online) {
      await redisServico.hset(chave, usuarioId, Date.now().toString());
    } else {
      await redisServico.hdel(chave, usuarioId);
    }
  } catch (erro) {
    logger.error({ erro, usuarioId }, 'Erro ao registrar presenca');
  }
}

export async function obterUsuariosOnline(clienteId: string): Promise<string[]> {
  try {
    const chave = `presenca:${clienteId}`;
    const presencas = await redisServico.hgetall(chave);
    return presencas ? Object.keys(presencas) : [];
  } catch (erro) {
    logger.error({ erro, clienteId }, 'Erro ao obter usuarios online');
    return [];
  }
}

// =============================================================================
// Funcoes de Emissao
// =============================================================================

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.io nao inicializado');
  }
  return io;
}

/** Emitir para todos os usuarios de um cliente */
export function emitirParaCliente(clienteId: string, evento: string, dados: unknown): void {
  if (!io) return;
  io.to(`cliente:${clienteId}`).emit(evento, dados);
}

/** Emitir para um usuario especifico */
export function emitirParaUsuario(usuarioId: string, evento: string, dados: unknown): void {
  if (!io) return;
  io.to(`usuario:${usuarioId}`).emit(evento, dados);
}

/** Emitir para uma conversa especifica */
export function emitirParaConversa(conversaId: string, evento: string, dados: unknown): void {
  if (!io) return;
  io.to(`conversa:${conversaId}`).emit(evento, dados);
}

/** Emitir nova mensagem */
export function emitirNovaMensagem(clienteId: string, conversaId: string, mensagem: unknown): void {
  emitirParaCliente(clienteId, EVENTOS.NOVA_MENSAGEM, { conversaId, mensagem });
  emitirParaConversa(conversaId, EVENTOS.NOVA_MENSAGEM, { mensagem });
}

/** Emitir atualizacao de conversa */
export function emitirConversaAtualizada(clienteId: string, conversa: unknown): void {
  emitirParaCliente(clienteId, EVENTOS.CONVERSA_ATUALIZADA, conversa);
}

/** Emitir notificacao */
export function emitirNotificacao(
  usuarioId: string,
  notificacao: { tipo: string; titulo: string; mensagem: string; dados?: unknown }
): void {
  emitirParaUsuario(usuarioId, EVENTOS.NOTIFICACAO, notificacao);
}
