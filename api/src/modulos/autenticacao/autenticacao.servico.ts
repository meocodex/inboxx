import { eq, and } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { usuarios, perfis } from '../../infraestrutura/banco/schema/index.js';
import { cacheUtils } from '../../infraestrutura/cache/redis.servico.js';
import {
  hashSenha,
  verificarSenha,
  precisaRehash,
  gerarAccessToken,
  gerarRefreshToken,
} from '../../compartilhado/utilitarios/criptografia.js';
import {
  ErroNaoAutorizado,
  ErroNaoEncontrado,
  ErroValidacao,
} from '../../compartilhado/erros/index.js';
import { CACHE_TTL, MAX_TENTATIVAS_LOGIN, TEMPO_BLOQUEIO_LOGIN_MINUTOS } from '../../configuracao/constantes.js';
import type { EntrarDTO, RespostaAutenticacao, UsuarioAutenticado } from './autenticacao.schema.js';

// =============================================================================
// Constantes
// =============================================================================

const PREFIXO_REFRESH = 'refresh:';
const PREFIXO_BLOQUEIO = 'bloqueio:';
const PREFIXO_TENTATIVAS = 'tentativas:';

// =============================================================================
// Servico de Autenticacao
// =============================================================================

class AutenticacaoServico {
  // ---------------------------------------------------------------------------
  // Login
  // ---------------------------------------------------------------------------
  async entrar(dados: EntrarDTO): Promise<RespostaAutenticacao> {
    const { email, senha } = dados;

    // Verificar bloqueio
    await this.verificarBloqueio(email);

    // Buscar usuario com perfil via leftJoin
    const resultado = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        senhaHash: usuarios.senhaHash,
        clienteId: usuarios.clienteId,
        perfilId: usuarios.perfilId,
        perfil: {
          id: perfis.id,
          nome: perfis.nome,
          permissoes: perfis.permissoes,
        },
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .where(and(eq(usuarios.email, email), eq(usuarios.ativo, true)))
      .limit(1);

    const usuario = resultado[0];

    if (!usuario || !usuario.perfil?.id) {
      await this.registrarTentativaFalha(email);
      throw new ErroNaoAutorizado('Credenciais invalidas');
    }

    // Verificar senha
    const senhaValida = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaValida) {
      await this.registrarTentativaFalha(email);
      throw new ErroNaoAutorizado('Credenciais invalidas');
    }

    // Re-hash bcrypt legado para argon2 de forma transparente
    if (precisaRehash(usuario.senhaHash)) {
      const novoHash = await hashSenha(senha);
      await db
        .update(usuarios)
        .set({ senhaHash: novoHash })
        .where(eq(usuarios.id, usuario.id));
    }

    // Limpar tentativas de login
    await this.limparTentativas(email);

    // Atualizar ultimo acesso
    await db
      .update(usuarios)
      .set({ ultimoAcesso: new Date(), online: true })
      .where(eq(usuarios.id, usuario.id));

    // Gerar tokens
    const usuarioComPerfil = usuario as typeof usuario & { perfil: NonNullable<typeof usuario.perfil> };
    const accessToken = await gerarAccessToken({
      sub: usuarioComPerfil.id,
      clienteId: usuarioComPerfil.clienteId,
      perfilId: usuarioComPerfil.perfilId,
    });

    const refreshToken = gerarRefreshToken();

    // Armazenar refresh token no cache
    await cacheUtils.definir(
      `${PREFIXO_REFRESH}${usuarioComPerfil.id}`,
      refreshToken,
      CACHE_TTL.SESSAO
    );

    return {
      accessToken,
      refreshToken,
      usuario: this.formatarUsuario(usuarioComPerfil),
    };
  }

  // ---------------------------------------------------------------------------
  // Renovar Token
  // ---------------------------------------------------------------------------
  async renovarToken(refreshToken: string, usuarioId: string): Promise<RespostaAutenticacao> {
    // Verificar refresh token no cache
    const tokenArmazenado = await cacheUtils.obter<string>(`${PREFIXO_REFRESH}${usuarioId}`);

    if (!tokenArmazenado || tokenArmazenado !== refreshToken) {
      throw new ErroNaoAutorizado('Refresh token invalido');
    }

    // Buscar usuario com perfil via leftJoin
    const resultado = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        clienteId: usuarios.clienteId,
        perfilId: usuarios.perfilId,
        perfil: {
          id: perfis.id,
          nome: perfis.nome,
          permissoes: perfis.permissoes,
        },
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .where(and(eq(usuarios.id, usuarioId), eq(usuarios.ativo, true)))
      .limit(1);

    const usuario = resultado[0];

    if (!usuario || !usuario.perfil?.id) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    // Gerar novos tokens
    const usuarioComPerfil = usuario as typeof usuario & { perfil: NonNullable<typeof usuario.perfil> };
    const novoAccessToken = await gerarAccessToken({
      sub: usuarioComPerfil.id,
      clienteId: usuarioComPerfil.clienteId,
      perfilId: usuarioComPerfil.perfilId,
    });

    const novoRefreshToken = gerarRefreshToken();

    // Atualizar refresh token no cache
    await cacheUtils.definir(
      `${PREFIXO_REFRESH}${usuarioComPerfil.id}`,
      novoRefreshToken,
      CACHE_TTL.SESSAO
    );

    return {
      accessToken: novoAccessToken,
      refreshToken: novoRefreshToken,
      usuario: this.formatarUsuario(usuarioComPerfil),
    };
  }

  // ---------------------------------------------------------------------------
  // Logout
  // ---------------------------------------------------------------------------
  async sair(usuarioId: string): Promise<void> {
    // Remover refresh token do cache
    await cacheUtils.remover(`${PREFIXO_REFRESH}${usuarioId}`);

    // Atualizar status online
    await db
      .update(usuarios)
      .set({ online: false })
      .where(eq(usuarios.id, usuarioId));
  }

  // ---------------------------------------------------------------------------
  // Obter Usuario Atual
  // ---------------------------------------------------------------------------
  async obterUsuarioAtual(usuarioId: string): Promise<UsuarioAutenticado> {
    const resultado = await db
      .select({
        id: usuarios.id,
        nome: usuarios.nome,
        email: usuarios.email,
        clienteId: usuarios.clienteId,
        perfilId: usuarios.perfilId,
        perfil: {
          id: perfis.id,
          nome: perfis.nome,
          permissoes: perfis.permissoes,
        },
      })
      .from(usuarios)
      .leftJoin(perfis, eq(usuarios.perfilId, perfis.id))
      .where(and(eq(usuarios.id, usuarioId), eq(usuarios.ativo, true)))
      .limit(1);

    const usuario = resultado[0];

    if (!usuario || !usuario.perfil?.id) {
      throw new ErroNaoEncontrado('Usuario nao encontrado');
    }

    return this.formatarUsuario(usuario as typeof usuario & { perfil: NonNullable<typeof usuario.perfil> });
  }

  // ---------------------------------------------------------------------------
  // Metodos Privados
  // ---------------------------------------------------------------------------
  private formatarUsuario(usuario: {
    id: string;
    nome: string;
    email: string;
    clienteId: string | null;
    perfil: { id: string; nome: string; permissoes: string[] };
  }): UsuarioAutenticado {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      clienteId: usuario.clienteId,
      perfil: {
        id: usuario.perfil.id,
        nome: usuario.perfil.nome,
        permissoes: usuario.perfil.permissoes,
      },
    };
  }

  private async verificarBloqueio(email: string): Promise<void> {
    const bloqueado = await cacheUtils.obter<boolean>(`${PREFIXO_BLOQUEIO}${email}`);
    if (bloqueado) {
      throw new ErroValidacao(
        `Conta bloqueada. Tente novamente em ${TEMPO_BLOQUEIO_LOGIN_MINUTOS} minutos.`
      );
    }
  }

  private async registrarTentativaFalha(email: string): Promise<void> {
    const chave = `${PREFIXO_TENTATIVAS}${email}`;
    const tentativas = (await cacheUtils.obter<number>(chave)) || 0;
    const novasTentativas = tentativas + 1;

    if (novasTentativas >= MAX_TENTATIVAS_LOGIN) {
      // Bloquear conta
      await cacheUtils.definir(
        `${PREFIXO_BLOQUEIO}${email}`,
        true,
        TEMPO_BLOQUEIO_LOGIN_MINUTOS * 60
      );
      await cacheUtils.remover(chave);
    } else {
      // Incrementar tentativas
      await cacheUtils.definir(chave, novasTentativas, TEMPO_BLOQUEIO_LOGIN_MINUTOS * 60);
    }
  }

  private async limparTentativas(email: string): Promise<void> {
    await cacheUtils.remover(`${PREFIXO_TENTATIVAS}${email}`);
    await cacheUtils.remover(`${PREFIXO_BLOQUEIO}${email}`);
  }

  // ---------------------------------------------------------------------------
  // Desbloquear Conta (Admin)
  // ---------------------------------------------------------------------------
  async desbloquearConta(email: string): Promise<void> {
    await cacheUtils.remover(`${PREFIXO_TENTATIVAS}${email}`);
    await cacheUtils.remover(`${PREFIXO_BLOQUEIO}${email}`);
  }
}

export const autenticacaoServico = new AutenticacaoServico();
