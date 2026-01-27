import { describe, it, expect, vi, beforeEach } from 'vitest';
import { autenticacaoServico } from '../autenticacao.servico.js';
import { cacheUtils } from '../../../infraestrutura/cache/redis.servico.js';
import { verificarSenha, precisaRehash, hashSenha } from '../../../compartilhado/utilitarios/criptografia.js';
import { ErroNaoAutorizado, ErroNaoEncontrado, ErroValidacao } from '../../../compartilhado/erros/index.js';
import { mockDbResultQueue, resetDbMocks } from '../../../testes/setup.js';

// =============================================================================
// Dados de Teste
// =============================================================================

const usuarioMock = {
  id: 'user-123',
  nome: 'Teste Usuario',
  email: 'teste@email.com',
  senhaHash: '$2b$12$hashedpassword',
  clienteId: 'client-123',
  perfilId: 'perfil-123',
  perfil: {
    id: 'perfil-123',
    nome: 'Administrador',
    permissoes: ['*'],
  },
};

// =============================================================================
// Testes
// =============================================================================

describe('AutenticacaoServico', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  // ---------------------------------------------------------------------------
  // entrar
  // ---------------------------------------------------------------------------
  describe('entrar', () => {
    it('deve autenticar usuario com credenciais validas', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null); // sem bloqueio
      // 1: buscar usuario com perfil, 2: update ultimo acesso
      mockDbResultQueue([
        [usuarioMock],
        [usuarioMock],
      ]);

      const resultado = await autenticacaoServico.entrar({
        email: 'teste@email.com',
        senha: 'senha123',
      });

      expect(resultado).toHaveProperty('accessToken');
      expect(resultado).toHaveProperty('refreshToken');
      expect(resultado.usuario).toEqual({
        id: 'user-123',
        nome: 'Teste Usuario',
        email: 'teste@email.com',
        clienteId: 'client-123',
        perfil: {
          id: 'perfil-123',
          nome: 'Administrador',
          permissoes: ['*'],
        },
      });
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      mockDbResultQueue([[]]);

      await expect(
        autenticacaoServico.entrar({ email: 'naoexiste@email.com', senha: 'senha123' })
      ).rejects.toThrow(ErroNaoAutorizado);
    });

    it('deve lancar erro quando senha invalida', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      mockDbResultQueue([[usuarioMock]]);
      vi.mocked(verificarSenha).mockResolvedValue(false);

      await expect(
        autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senhaerrada' })
      ).rejects.toThrow(ErroNaoAutorizado);
    });

    it('deve lancar erro quando conta bloqueada', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(true); // bloqueado

      await expect(
        autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senha123' })
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve registrar tentativa de falha quando senha errada', async () => {
      vi.mocked(cacheUtils.obter)
        .mockResolvedValueOnce(null) // sem bloqueio
        .mockResolvedValueOnce(0); // 0 tentativas anteriores
      mockDbResultQueue([[usuarioMock]]);
      vi.mocked(verificarSenha).mockResolvedValue(false);

      await expect(
        autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senhaerrada' })
      ).rejects.toThrow(ErroNaoAutorizado);

      expect(cacheUtils.definir).toHaveBeenCalled();
    });

    it('deve bloquear conta apos 5 tentativas de falha', async () => {
      vi.mocked(cacheUtils.obter)
        .mockResolvedValueOnce(null) // sem bloqueio
        .mockResolvedValueOnce(4); // 4 tentativas anteriores (esta sera a 5a)
      mockDbResultQueue([[usuarioMock]]);
      vi.mocked(verificarSenha).mockResolvedValue(false);

      await expect(
        autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senhaerrada' })
      ).rejects.toThrow(ErroNaoAutorizado);

      // Deve definir bloqueio
      expect(cacheUtils.definir).toHaveBeenCalledWith(
        expect.stringContaining('bloqueio:'),
        true,
        expect.any(Number)
      );
    });

    it('deve limpar tentativas apos login bem-sucedido', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      vi.mocked(verificarSenha).mockResolvedValue(true);
      mockDbResultQueue([
        [usuarioMock],
        [usuarioMock],
      ]);

      await autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senha123' });

      expect(cacheUtils.remover).toHaveBeenCalledWith(
        expect.stringContaining('tentativas:')
      );
    });

    it('deve armazenar refresh token no cache', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      vi.mocked(verificarSenha).mockResolvedValue(true);
      mockDbResultQueue([
        [usuarioMock],
        [usuarioMock],
      ]);

      await autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senha123' });

      expect(cacheUtils.definir).toHaveBeenCalledWith(
        expect.stringContaining('refresh:user-123'),
        expect.any(String),
        expect.any(Number)
      );
    });

    it('deve re-hash senha bcrypt legado para argon2 no login', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      vi.mocked(verificarSenha).mockResolvedValue(true);
      vi.mocked(precisaRehash).mockReturnValue(true); // hash bcrypt legado
      vi.mocked(hashSenha).mockResolvedValue('$argon2id$novo-hash');
      // 1: buscar usuario, 2: update senhaHash (rehash), 3: update ultimo acesso
      mockDbResultQueue([
        [usuarioMock],
        [usuarioMock],
        [usuarioMock],
      ]);

      await autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senha123' });

      expect(hashSenha).toHaveBeenCalledWith('senha123');
    });

    it('nao deve re-hash quando senha ja e argon2', async () => {
      const usuarioArgon2 = {
        ...usuarioMock,
        senhaHash: '$argon2id$v=19$hash-moderno',
      };

      vi.mocked(cacheUtils.obter).mockResolvedValue(null);
      vi.mocked(verificarSenha).mockResolvedValue(true);
      vi.mocked(precisaRehash).mockReturnValue(false); // ja e argon2
      // 1: buscar usuario, 2: update ultimo acesso
      mockDbResultQueue([
        [usuarioArgon2],
        [usuarioArgon2],
      ]);

      await autenticacaoServico.entrar({ email: 'teste@email.com', senha: 'senha123' });

      // hashSenha nao deve ser chamado para re-hash
      expect(hashSenha).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // renovarToken
  // ---------------------------------------------------------------------------
  describe('renovarToken', () => {
    it('deve renovar token com refresh token valido', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue('valid-refresh-token');
      mockDbResultQueue([[usuarioMock]]);

      const resultado = await autenticacaoServico.renovarToken('valid-refresh-token', 'user-123');

      expect(resultado).toHaveProperty('accessToken');
      expect(resultado).toHaveProperty('refreshToken');
      expect(resultado.usuario.id).toBe('user-123');
    });

    it('deve lancar erro com refresh token invalido', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue('stored-token');

      await expect(
        autenticacaoServico.renovarToken('wrong-token', 'user-123')
      ).rejects.toThrow(ErroNaoAutorizado);
    });

    it('deve lancar erro quando refresh token nao encontrado no cache', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue(null);

      await expect(
        autenticacaoServico.renovarToken('any-token', 'user-123')
      ).rejects.toThrow(ErroNaoAutorizado);
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue('valid-refresh-token');
      mockDbResultQueue([[]]);

      await expect(
        autenticacaoServico.renovarToken('valid-refresh-token', 'user-123')
      ).rejects.toThrow(ErroNaoEncontrado);
    });

    it('deve gerar novo refresh token e armazenar no cache', async () => {
      vi.mocked(cacheUtils.obter).mockResolvedValue('old-refresh-token');
      mockDbResultQueue([[usuarioMock]]);

      await autenticacaoServico.renovarToken('old-refresh-token', 'user-123');

      expect(cacheUtils.definir).toHaveBeenCalledWith(
        expect.stringContaining('refresh:user-123'),
        expect.any(String),
        expect.any(Number)
      );
    });
  });

  // ---------------------------------------------------------------------------
  // sair
  // ---------------------------------------------------------------------------
  describe('sair', () => {
    it('deve remover refresh token e atualizar status offline', async () => {
      mockDbResultQueue([[usuarioMock]]);

      await autenticacaoServico.sair('user-123');

      expect(cacheUtils.remover).toHaveBeenCalledWith('refresh:user-123');
    });
  });

  // ---------------------------------------------------------------------------
  // obterUsuarioAtual
  // ---------------------------------------------------------------------------
  describe('obterUsuarioAtual', () => {
    it('deve retornar usuario formatado', async () => {
      mockDbResultQueue([[usuarioMock]]);

      const resultado = await autenticacaoServico.obterUsuarioAtual('user-123');

      expect(resultado).toEqual({
        id: 'user-123',
        nome: 'Teste Usuario',
        email: 'teste@email.com',
        clienteId: 'client-123',
        perfil: {
          id: 'perfil-123',
          nome: 'Administrador',
          permissoes: ['*'],
        },
      });
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        autenticacaoServico.obterUsuarioAtual('user-inexistente')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });
});
