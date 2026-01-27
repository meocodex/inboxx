import { describe, it, expect, vi, beforeEach } from 'vitest';
import { contatosServico } from '../contatos.servico.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../../compartilhado/erros/index.js';
import { mockDbResultQueue, resetDbMocks, dbMock } from '../../../testes/setup.js';

// =============================================================================
// Dados de Teste
// =============================================================================

const clienteId = 'client-123';

const contatoMock = {
  id: 'contato-123',
  nome: 'Joao Silva',
  telefone: '+5511999990000',
  email: 'joao@email.com',
  fotoUrl: null,
  camposPersonalizados: null,
  clienteId,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
};

// =============================================================================
// Testes
// =============================================================================

describe('ContatosServico', () => {
  beforeEach(() => {
    resetDbMocks();
  });

  // ---------------------------------------------------------------------------
  // listar
  // ---------------------------------------------------------------------------
  describe('listar', () => {
    it('deve listar contatos com paginacao', async () => {
      // 1: select contatos, 2: count total (Promise.all), 3: buscar etiquetas
      mockDbResultQueue([
        [contatoMock],
        [{ total: 1 }],
        [],
      ]);

      const resultado = await contatosServico.listar(clienteId, {
        pagina: 1,
        limite: 20,
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.dados).toHaveLength(1);
      expect(resultado.meta.total).toBe(1);
      expect(resultado.meta.totalPaginas).toBe(1);
    });

    it('deve retornar lista vazia quando nao ha contatos', async () => {
      mockDbResultQueue([
        [],
        [{ total: 0 }],
      ]);

      const resultado = await contatosServico.listar(clienteId, {
        pagina: 1,
        limite: 20,
        busca: 'Joao',
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.dados).toHaveLength(0);
      expect(resultado.meta.total).toBe(0);
    });

    it('deve calcular totalPaginas corretamente', async () => {
      mockDbResultQueue([
        [],
        [{ total: 50 }],
      ]);

      const resultado = await contatosServico.listar(clienteId, {
        pagina: 3,
        limite: 10,
        ordenarPor: 'criadoEm',
        ordem: 'desc',
      } as any);

      expect(resultado.meta.totalPaginas).toBe(5); // Math.ceil(50/10)
    });
  });

  // ---------------------------------------------------------------------------
  // obterPorId
  // ---------------------------------------------------------------------------
  describe('obterPorId', () => {
    it('deve retornar contato com contadores', async () => {
      // 1: select contato com subqueries, 2: buscar etiquetas
      mockDbResultQueue([
        [{
          ...contatoMock,
          totalConversas: 2,
          totalCartoes: 1,
          totalCompromissos: 0,
        }],
        [],
      ]);

      const resultado = await contatosServico.obterPorId(clienteId, 'contato-123');

      expect(resultado.id).toBe('contato-123');
      expect(resultado.totalConversas).toBe(2);
      expect(resultado.totalCartoes).toBe(1);
      expect(resultado.totalCompromissos).toBe(0);
    });

    it('deve lancar erro quando contato nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        contatosServico.obterPorId(clienteId, 'contato-inexistente')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // criar
  // ---------------------------------------------------------------------------
  describe('criar', () => {
    const dadosCriacao = {
      nome: 'Novo Contato',
      telefone: '+5511888880000',
    };

    it('deve criar contato com dados validos', async () => {
      // 1: verificar telefone duplicado, 2: insert contato
      mockDbResultQueue([
        [], // telefone nao existe
        [{
          id: 'novo-contato-id',
          nome: 'Novo Contato',
          telefone: '+5511888880000',
          email: null,
          criadoEm: new Date(),
        }],
      ]);

      const resultado = await contatosServico.criar(clienteId, dadosCriacao as any);

      expect(resultado).toBeDefined();
      expect(resultado.etiquetas).toEqual([]);
    });

    it('deve lancar erro quando telefone ja existe', async () => {
      // telefone ja existe
      mockDbResultQueue([[{ id: 'existente' }]]);

      await expect(
        contatosServico.criar(clienteId, dadosCriacao as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve validar etiquetas quando fornecidas', async () => {
      // 1: verificar telefone, 2: contar etiquetas validas
      mockDbResultQueue([
        [], // telefone nao existe
        [{ total: 1 }], // so 1 de 2 valida
      ]);

      await expect(
        contatosServico.criar(clienteId, {
          ...dadosCriacao,
          etiquetaIds: ['etiqueta-1', 'etiqueta-2'],
        } as any)
      ).rejects.toThrow(ErroValidacao);
    });

    it('deve aceitar etiquetas validas', async () => {
      // 1: verificar telefone, 2: contar etiquetas, 3: insert contato, 4: insert etiquetas, 5: buscar etiquetas
      mockDbResultQueue([
        [], // telefone nao existe
        [{ total: 2 }], // 2 de 2 validas
        [{ id: 'novo-contato-id', nome: 'Novo Contato', telefone: '+5511888880000', email: null, criadoEm: new Date() }],
        [], // insert etiquetas
        [{ id: 'etiqueta-1', nome: 'VIP', cor: '#ff0000' }],
      ]);

      const resultado = await contatosServico.criar(clienteId, {
        ...dadosCriacao,
        etiquetaIds: ['etiqueta-1', 'etiqueta-2'],
      } as any);

      expect(resultado).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // atualizar
  // ---------------------------------------------------------------------------
  describe('atualizar', () => {
    it('deve atualizar contato existente', async () => {
      // 1: verificar existencia, 2: update contato, 3: buscar etiquetas
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [{ ...contatoMock, nome: 'Nome Atualizado' }],
        [],
      ]);

      const resultado = await contatosServico.atualizar(clienteId, 'contato-123', {
        nome: 'Nome Atualizado',
      } as any);

      expect(resultado).toBeDefined();
    });

    it('deve lancar erro quando contato nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        contatosServico.atualizar(clienteId, 'inexistente', { nome: 'Teste' } as any)
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // excluir
  // ---------------------------------------------------------------------------
  describe('excluir', () => {
    it('deve excluir contato existente', async () => {
      // 1: verificar existencia, 2: delete
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [],
      ]);

      await contatosServico.excluir(clienteId, 'contato-123');

      expect(dbMock.delete).toHaveBeenCalled();
    });

    it('deve lancar erro quando contato nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        contatosServico.excluir(clienteId, 'inexistente')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // adicionarEtiqueta
  // ---------------------------------------------------------------------------
  describe('adicionarEtiqueta', () => {
    it('deve adicionar etiqueta ao contato', async () => {
      // 1: contato existe, 2: etiqueta existe, 3: verificar vinculo existente, 4: insert vinculo
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [{ id: 'etiqueta-1' }],
        [], // nao tem vinculo ainda
        [], // insert
      ]);

      const resultado = await contatosServico.adicionarEtiqueta(clienteId, 'contato-123', 'etiqueta-1');

      expect(resultado.mensagem).toBe('Etiqueta adicionada com sucesso');
    });

    it('deve lancar erro quando contato nao encontrado', async () => {
      mockDbResultQueue([[]]);

      await expect(
        contatosServico.adicionarEtiqueta(clienteId, 'inexistente', 'etiqueta-1')
      ).rejects.toThrow(ErroNaoEncontrado);
    });

    it('deve lancar erro quando etiqueta nao encontrada', async () => {
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [], // etiqueta nao existe
      ]);

      await expect(
        contatosServico.adicionarEtiqueta(clienteId, 'contato-123', 'etiqueta-invalida')
      ).rejects.toThrow(ErroNaoEncontrado);
    });

    it('deve lancar erro quando contato ja possui etiqueta', async () => {
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [{ id: 'etiqueta-1' }],
        [{ contatoId: 'contato-123' }], // ja tem vinculo
      ]);

      await expect(
        contatosServico.adicionarEtiqueta(clienteId, 'contato-123', 'etiqueta-1')
      ).rejects.toThrow(ErroValidacao);
    });
  });

  // ---------------------------------------------------------------------------
  // removerEtiqueta
  // ---------------------------------------------------------------------------
  describe('removerEtiqueta', () => {
    it('deve remover etiqueta do contato', async () => {
      // 1: contato existe, 2: vinculo existe, 3: delete vinculo
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [{ contatoId: 'contato-123' }],
        [],
      ]);

      const resultado = await contatosServico.removerEtiqueta(clienteId, 'contato-123', 'etiqueta-1');

      expect(resultado.mensagem).toBe('Etiqueta removida com sucesso');
    });

    it('deve lancar erro quando contato nao possui etiqueta', async () => {
      mockDbResultQueue([
        [{ id: 'contato-123' }],
        [], // vinculo nao existe
      ]);

      await expect(
        contatosServico.removerEtiqueta(clienteId, 'contato-123', 'etiqueta-1')
      ).rejects.toThrow(ErroNaoEncontrado);
    });
  });

  // ---------------------------------------------------------------------------
  // importar
  // ---------------------------------------------------------------------------
  describe('importar', () => {
    it('deve importar contatos novos', async () => {
      // Para cada contato: 1 verificar duplicado + 1 insert = 2 queries cada
      mockDbResultQueue([
        [], // contato 1 nao existe
        [{ id: 'novo-1' }], // insert contato 1
        [], // contato 2 nao existe
        [{ id: 'novo-2' }], // insert contato 2
      ]);

      const resultado = await contatosServico.importar(clienteId, {
        contatos: [
          { nome: 'Contato 1', telefone: '+5511111111111' },
          { nome: 'Contato 2', telefone: '+5511222222222' },
        ],
      } as any);

      expect(resultado.criados).toBe(2);
      expect(resultado.duplicados).toBe(0);
      expect(resultado.erros).toHaveLength(0);
    });

    it('deve contar duplicados na importacao', async () => {
      mockDbResultQueue([
        [{ id: 'existente' }], // primeiro ja existe
        [], // segundo nao existe
        [{ id: 'novo-2' }], // insert segundo
      ]);

      const resultado = await contatosServico.importar(clienteId, {
        contatos: [
          { nome: 'Duplicado', telefone: '+5511999990000' },
          { nome: 'Novo', telefone: '+5511111111111' },
        ],
      } as any);

      expect(resultado.criados).toBe(1);
      expect(resultado.duplicados).toBe(1);
    });
  });
});
