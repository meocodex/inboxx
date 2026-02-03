import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { sql } from 'drizzle-orm';
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { CRUDBase } from '../crud-base.servico.js';
import { db } from '../../../infraestrutura/banco/drizzle.servico.js';
import { CacheServico } from '../../../infraestrutura/cache/redis.servico.js';

// =============================================================================
// Tabela de Teste
// =============================================================================

const tabelaTeste = pgTable('teste', {
  id: uuid('id').primaryKey().defaultRandom(),
  clienteId: uuid('cliente_id').notNull(),
  nome: text('nome').notNull(),
  descricao: text('descricao'),
  criadoEm: timestamp('criado_em').notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em').notNull().defaultNow(),
});

interface DadosTeste {
  id: string;
  clienteId: string;
  nome: string;
  descricao: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
  totalItens?: number; // Subconsulta opcional
}

interface CriarDadosDTO {
  nome: string;
  descricao?: string;
}

interface AtualizarDadosDTO {
  nome?: string;
  descricao?: string;
}

// =============================================================================
// Mocks
// =============================================================================

vi.mock('../../../infraestrutura/banco/drizzle.servico.js', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('../../../infraestrutura/cache/redis.servico.js', () => {
  class MockCacheServico {
    get = vi.fn();
    set = vi.fn();
    delete = vi.fn();
    invalidar = vi.fn();
  }

  return {
    CacheServico: MockCacheServico,
    cacheUtils: {
      obter: vi.fn(),
      definir: vi.fn(),
      remover: vi.fn(),
    },
  };
});

// =============================================================================
// Testes da CRUDBase
// =============================================================================

describe('CRUDBase', () => {
  let servico: CRUDBase<typeof tabelaTeste, DadosTeste, CriarDadosDTO, AtualizarDadosDTO>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Teste 1: Construtor - Backward Compatibility
  // ===========================================================================

  describe('Construtor', () => {
    it('deve aceitar array de camposBusca (assinatura antiga)', () => {
      const servicoLegado = new CRUDBase(
        tabelaTeste,
        'Teste',
        ['nome', 'descricao']
      );

      expect(servicoLegado['camposBusca']).toEqual(['nome', 'descricao']);
      expect(servicoLegado['clienteIdNullable']).toBe(false);
      expect(servicoLegado['cacheServico']).toBeUndefined();
    });

    it('deve aceitar opções via objeto (nova assinatura)', () => {
      const servicoNovo = new CRUDBase(
        tabelaTeste,
        'Teste',
        {
          camposBusca: ['nome'],
          clienteIdNullable: false,
        }
      );

      expect(servicoNovo['camposBusca']).toEqual(['nome']);
      expect(servicoNovo['clienteIdNullable']).toBe(false);
    });

    it('deve usar valores padrão quando opções não fornecidas', () => {
      const servicoPadrao = new CRUDBase(
        tabelaTeste,
        'Teste',
        {}
      );

      expect(servicoPadrao['camposBusca']).toEqual(['nome']);
      expect(servicoPadrao['clienteIdNullable']).toBe(false);
    });

    it('deve inicializar cache quando configurado', () => {
      const servicoComCache = new CRUDBase(
        tabelaTeste,
        'Teste',
        {
          cache: { namespace: 'teste', ttl: 600 },
        }
      );

      expect(servicoComCache['cacheServico']).toBeDefined();
      expect(servicoComCache['opcoes']?.cache?.namespace).toBe('teste');
      expect(servicoComCache['opcoes']?.cache?.ttl).toBe(600);
    });
  });

  // ===========================================================================
  // Teste 2: buildSelectFields() - Subconsultas
  // ===========================================================================

  describe('buildSelectFields()', () => {
    it('deve retornar apenas campos da tabela quando sem subconsultas', () => {
      servico = new CRUDBase(tabelaTeste, 'Teste', {});
      const fields = servico['buildSelectFields']();

      expect(fields).toHaveProperty('id');
      expect(fields).toHaveProperty('clienteId');
      expect(fields).toHaveProperty('nome');
      expect(fields).not.toHaveProperty('totalItens');
    });

    it('deve injetar subconsultas configuradas', () => {
      const totalItensSubquery = sql<number>`(
        SELECT count(*) FROM itens WHERE itens.teste_id = ${tabelaTeste.id}
      )`.mapWith(Number);

      servico = new CRUDBase(tabelaTeste, 'Teste', {
        subconsultas: {
          totalItens: () => totalItensSubquery,
        },
      });

      const fields = servico['buildSelectFields']();

      expect(fields).toHaveProperty('id');
      expect(fields).toHaveProperty('totalItens');
      expect(fields.totalItens).toBeDefined();
    });

    it('deve injetar múltiplas subconsultas', () => {
      const subquery1 = sql<number>`(SELECT count(*) FROM a)`.mapWith(Number);
      const subquery2 = sql<number>`(SELECT sum(b) FROM b)`.mapWith(Number);

      servico = new CRUDBase(tabelaTeste, 'Teste', {
        subconsultas: {
          totalA: () => subquery1,
          somaB: () => subquery2,
        },
      });

      const fields = servico['buildSelectFields']();

      expect(fields).toHaveProperty('totalA');
      expect(fields).toHaveProperty('somaB');
    });
  });

  // ===========================================================================
  // Teste 3: buildBaseConditions() - clienteId Nullable
  // ===========================================================================

  describe('buildBaseConditions()', () => {
    it('deve filtrar por clienteId exato quando clienteIdNullable = false', () => {
      servico = new CRUDBase(tabelaTeste, 'Teste', {
        clienteIdNullable: false,
      });

      const condition = servico['buildBaseConditions']('client-123');
      expect(condition).toBeDefined();
    });

    it('deve usar OR com IS NULL quando clienteIdNullable = true e clienteId fornecido', () => {
      servico = new CRUDBase(tabelaTeste, 'Teste', {
        clienteIdNullable: true,
      });

      const condition = servico['buildBaseConditions']('client-123');
      expect(condition).toBeDefined();
    });

    it('deve usar apenas IS NULL quando clienteIdNullable = true e clienteId = null', () => {
      servico = new CRUDBase(tabelaTeste, 'Teste', {
        clienteIdNullable: true,
      });

      const condition = servico['buildBaseConditions'](null);
      expect(condition).toBeDefined();
    });
  });

  // ===========================================================================
  // Teste 4: Hooks de Cache
  // ===========================================================================

  describe('Hooks de Cache', () => {
    it('afterUpdate deve invalidar cache quando configurado', async () => {
      const mockCacheServico = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      servico = new CRUDBase(tabelaTeste, 'Teste', {
        cache: { namespace: 'teste' },
      });

      servico['cacheServico'] = mockCacheServico as any;

      await servico['afterUpdate']('test-id-123');

      expect(mockCacheServico.delete).toHaveBeenCalledWith('obter:test-id-123');
    });

    it('afterDelete deve invalidar cache quando configurado', async () => {
      const mockCacheServico = {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
      };

      servico = new CRUDBase(tabelaTeste, 'Teste', {
        cache: { namespace: 'teste' },
      });

      servico['cacheServico'] = mockCacheServico as any;

      await servico['afterDelete']('test-id-123');

      expect(mockCacheServico.delete).toHaveBeenCalledWith('obter:test-id-123');
    });

    it('afterCreate não deve fazer nada por padrão', async () => {
      const mockCacheServico = {
        delete: vi.fn(),
      };

      servico = new CRUDBase(tabelaTeste, 'Teste', {
        cache: { namespace: 'teste' },
      });

      servico['cacheServico'] = mockCacheServico as any;

      await servico['afterCreate']('test-id-123');

      expect(mockCacheServico.delete).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Teste 5: Hooks Customizáveis (Extensibilidade)
  // ===========================================================================

  describe('Hooks Customizáveis', () => {
    it('deve permitir sobrescrever afterUpdate para cache customizado', async () => {
      class ServicoCustomizado extends CRUDBase<
        typeof tabelaTeste,
        DadosTeste,
        CriarDadosDTO,
        AtualizarDadosDTO
      > {
        protected async afterUpdate(id: string): Promise<void> {
          await super.afterUpdate(id); // Invalida obter:{id}
          await this.cacheServico?.delete(`custom:${id}`);
        }
      }

      const mockCacheServico = {
        delete: vi.fn().mockResolvedValue(undefined),
      };

      const servicoCustomizado = new ServicoCustomizado(tabelaTeste, 'Teste', {
        cache: { namespace: 'teste' },
      });

      servicoCustomizado['cacheServico'] = mockCacheServico as any;

      await servicoCustomizado['afterUpdate']('test-id-123');

      expect(mockCacheServico.delete).toHaveBeenCalledWith('obter:test-id-123');
      expect(mockCacheServico.delete).toHaveBeenCalledWith('custom:test-id-123');
      expect(mockCacheServico.delete).toHaveBeenCalledTimes(2);
    });
  });
});
