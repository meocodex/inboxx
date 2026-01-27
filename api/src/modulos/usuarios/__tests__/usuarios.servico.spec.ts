import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usuariosServico } from '../usuarios.servico.js';
import { hashSenha } from '../../../compartilhado/utilitarios/criptografia.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../../compartilhado/erros/index.js';
import { mockDbResultQueue, resetDbMocks, dbMock } from '../../../testes/setup.js';

// =============================================================================
// Dados de Teste
// =============================================================================

const clienteId = 'client-123';

const usuarioRowMock = {
  id: 'user-123',
  nome: 'Teste Usuario',
  email: 'teste@email.com',
  avatarUrl: null,
  online: false,
  ultimoAcesso: new Date(),
  ativo: true,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
  perfilId: 'perfil-123',
  perfilNome: 'Administrador',
  equipeId: null,
  equipeNome: null,
};

const perfilMock = {
  id: 'perfil-123',
  nome: 'Administrador',
};

const equipeMock = {
  id: 'equipe-123',
  nome: 'Equipe Suporte',
};

// =============================================================================
// Testes
// =============================================================================

describe('UsuariosServico', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  // ---------------------------------------------------------------------------
  // listar
  // ---------------------------------------------------------------------------
  describe('listar', () => {
    it('deve listar usuarios com paginacao', async () => {
      // 1: select usuarios com joins (Promise.all), 2: count
      mockDbResultQueue([
        [usuarioRowMock],
        [{ total: 1 }],
      ]);

      const resultado = await usuariosServico.listar(clienteId, {
        pagina: 1,
        limite: 20,
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.dados).toHaveLength(1);
      expect(resultado.meta).toEqual({
        total: 1,
        pagina: 1,
        limite: 20,
        totalPaginas: 1,
      });
    });

    it('deve calcular totalPaginas corretamente', async () => {
      mockDbResultQueue([
        [],
        [{ total: 45 }],
      ]);

      const resultado = await usuariosServico.listar(clienteId, {
        pagina: 1,
        limite: 20,
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.meta.totalPaginas).toBe(3); // Math.ceil(45/20)
    });

    it('deve retornar lista vazia quando nao ha usuarios', async () => {
      mockDbResultQueue([
        [],
        [{ total: 0 }],
      ]);

      const resultado = await usuariosServico.listar(clienteId, {
        pagina: 1,
        limite: 20,
        busca: 'admin',
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.dados).toHaveLength(0);
      expect(resultado.meta.total).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // obterPorId
  // ---------------------------------------------------------------------------
  describe('obterPorId', () => {
    it('deve retornar usuario pelo id', async () => {
      mockDbResultQueue([
        [{ ...usuarioRowMock, perfilPermissoes: ['*'] }],
      ]);

      const resultado = await usuariosServico.obterPorId(clienteId, 'user-123');

      expect(resultado.id).toBe('user-123');
      expect(resultado.perfil).toEqual({
        id: 'perfil-123',
        nome: 'Administrador',
        permissoes: ['*'],
      });
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        usuariosServico.obterPorId(clienteId, 'user-inexistente')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // criar
  // ---------------------------------------------------------------------------
  describe('criar', () => {
    const dadosCriacao = {
      nome: 'Novo Usuario',
      email: 'novo@email.com',
      senha: 'senha123',
      perfilId: 'perfil-123',
    };

    it('deve criar usuario com dados validos', async () => {
      // 1: verificar email duplicado, 2: verificar perfil, 3: insert usuario, 4: buscar usuario com joins
      mockDbResultQueue([
        [], // email nao existe
        [{ id: 'perfil-123' }], // perfil existe
        [{ id: 'user-novo', nome: 'Novo Usuario', email: 'novo@email.com', avatarUrl: null, ativo: true, criadoEm: new Date(), perfilId: 'perfil-123', equipeId: null }],
        [{ ...usuarioRowMock, id: 'user-novo', nome: 'Novo Usuario', email: 'novo@email.com' }],
      ]);

      const resultado = await usuariosServico.criar(clienteId, dadosCriacao as any);

      expect(resultado).toBeDefined();
      expect(hashSenha).toHaveBeenCalledWith('senha123');
    });

    it('deve lancar erro quando email ja existe', async () => {
      mockDbResultQueue([
        [{ id: 'user-existente' }], // email existe
      ]);

      await expect(
        usuariosServico.criar(clienteId, dadosCriacao as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve lancar erro quando perfil nao encontrado', async () => {
      mockDbResultQueue([
        [], // email ok
        [], // perfil nao existe
      ]);

      await expect(
        usuariosServico.criar(clienteId, dadosCriacao as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve lancar erro quando equipe nao encontrada', async () => {
      mockDbResultQueue([
        [], // email nao existe
        [{ id: 'perfil-123' }], // perfil ok
        [], // equipe nao existe
      ]);

      await expect(
        usuariosServico.criar(clienteId, {
          ...dadosCriacao,
          equipeId: 'equipe-invalida',
        } as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve aceitar equipe valida', async () => {
      // 1: email, 2: perfil, 3: equipe, 4: insert, 5: buscar com joins
      mockDbResultQueue([
        [], // email nao existe
        [{ id: 'perfil-123' }], // perfil ok
        [{ id: 'equipe-123' }], // equipe ok
        [{ id: 'user-novo', nome: 'Novo Usuario', email: 'novo@email.com', avatarUrl: null, ativo: true, criadoEm: new Date(), perfilId: 'perfil-123', equipeId: 'equipe-123' }],
        [{ ...usuarioRowMock, id: 'user-novo', equipeId: 'equipe-123', equipeNome: 'Equipe Suporte' }],
      ]);

      const resultado = await usuariosServico.criar(clienteId, {
        ...dadosCriacao,
        equipeId: 'equipe-123',
      } as any);

      expect(resultado).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // atualizar
  // ---------------------------------------------------------------------------
  describe('atualizar', () => {
    it('deve atualizar usuario existente', async () => {
      // 1: verificar usuario existe, 2: update, 3: buscar com joins
      mockDbResultQueue([
        [{ id: 'user-123', email: 'teste@email.com' }],
        [], // update
        [{ ...usuarioRowMock, nome: 'Nome Atualizado' }],
      ]);

      const resultado = await usuariosServico.atualizar(clienteId, 'user-123', {
        nome: 'Nome Atualizado',
      } as any);

      expect(resultado.nome).toBe('Nome Atualizado');
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        usuariosServico.atualizar(clienteId, 'inexistente', { nome: 'Teste' } as any)
      ).rejects.toThrow(ErroNaoEncontrado);
    });

    it('deve lancar erro quando novo email ja esta em uso', async () => {
      // 1: usuario existe, 2: email ja em uso
      mockDbResultQueue([
        [{ id: 'user-123', email: 'antigo@email.com' }],
        [{ id: 'outro-user' }], // email ja em uso por outro usuario
      ]);

      await expect(
        usuariosServico.atualizar(clienteId, 'user-123', { email: 'teste@email.com' } as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve fazer hash da nova senha quando fornecida', async () => {
      // 1: verificar usuario, 2: update, 3: buscar com joins
      mockDbResultQueue([
        [{ id: 'user-123', email: 'teste@email.com' }],
        [],
        [usuarioRowMock],
      ]);

      await usuariosServico.atualizar(clienteId, 'user-123', {
        senha: 'novasenha123',
      } as any);

      expect(hashSenha).toHaveBeenCalledWith('novasenha123');
    });
  });

  // ---------------------------------------------------------------------------
  // excluir
  // ---------------------------------------------------------------------------
  describe('excluir', () => {
    it('deve excluir usuario existente', async () => {
      // 1: verificar usuario, 2: delete
      mockDbResultQueue([
        [{ id: 'user-123' }],
        [],
      ]);

      await usuariosServico.excluir(clienteId, 'user-123');

      expect(dbMock.delete).toHaveBeenCalled();
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        usuariosServico.excluir(clienteId, 'inexistente')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // alterarStatus
  // ---------------------------------------------------------------------------
  describe('alterarStatus', () => {
    it('deve ativar usuario', async () => {
      // 1: verificar usuario existe, 2: update retornando
      mockDbResultQueue([
        [{ id: 'user-123' }],
        [{ id: 'user-123', nome: 'Teste', ativo: true }],
      ]);

      const resultado = await usuariosServico.alterarStatus(clienteId, 'user-123', true);

      expect(resultado.ativo).toBe(true);
    });

    it('deve desativar usuario', async () => {
      mockDbResultQueue([
        [{ id: 'user-123' }],
        [{ id: 'user-123', nome: 'Teste', ativo: false }],
      ]);

      const resultado = await usuariosServico.alterarStatus(clienteId, 'user-123', false);

      expect(resultado.ativo).toBe(false);
    });

    it('deve lancar erro quando usuario nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        usuariosServico.alterarStatus(clienteId, 'inexistente', true)
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });
});
