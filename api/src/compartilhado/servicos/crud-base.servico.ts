import { eq, and, ilike, ne, count, desc, asc, SQL, or, isNull } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { ErroNaoEncontrado, ErroValidacao } from '../erros/index.js';
import { CacheServico } from '../../infraestrutura/cache/redis.servico.js';
import type { CRUDBaseOpcoes } from './crud-base.tipos.js';

// =============================================================================
// Tipos
// =============================================================================

export interface QueryPaginacao {
  pagina: number;
  limite: number;
  busca?: string;
  ordenarPor?: string;
  ordem?: 'asc' | 'desc';
}

export interface ResultadoPaginado<T> {
  dados: T[];
  meta: {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
  };
}

export interface CamposTabela {
  id: any;
  clienteId: any;
  nome?: any;
  criadoEm?: any;
}

// =============================================================================
// Classe CRUD Base
// =============================================================================

/**
 * Classe base genérica para operações CRUD
 * Elimina duplicação de código entre módulos
 *
 * Benefícios:
 * - Reduz ~200 linhas de código duplicado por módulo
 * - Garante consistência nas operações CRUD
 * - Facilita manutenção e evolução
 * - Centraliza validações comuns
 *
 * Recursos configuráveis via opções:
 * - Subconsultas: Colunas calculadas injetadas no SELECT
 * - Cache: Cache Redis automático em obterPorId()
 * - clienteIdNullable: Suporte a entidades globais (clienteId = null)
 *
 * @template TTabela - Tipo da tabela Drizzle
 * @template TDados - Tipo dos dados retornados
 * @template TDadosCriacao - DTO de criação
 * @template TDadosAtualizacao - DTO de atualização
 *
 * @example CRUD Simples
 * ```typescript
 * class EtiquetasServico extends CRUDBase<
 *   typeof etiquetas,
 *   Etiqueta,
 *   CriarEtiquetaDTO,
 *   AtualizarEtiquetaDTO
 * > {
 *   constructor() {
 *     super(etiquetas, 'Etiqueta', {
 *       camposBusca: ['nome', 'descricao']
 *     });
 *   }
 * }
 * ```
 *
 * @example Com Subconsultas
 * ```typescript
 * const totalMembrosSubquery = sql<number>`(
 *   SELECT count(*) FROM usuarios WHERE usuarios.equipe_id = ${equipes.id}
 * )`.mapWith(Number);
 *
 * class EquipesServico extends CRUDBase<...> {
 *   constructor() {
 *     super(equipes, 'Equipe', {
 *       camposBusca: ['nome'],
 *       subconsultas: {
 *         totalMembros: () => totalMembrosSubquery
 *       }
 *     });
 *   }
 * }
 * ```
 *
 * @example Com Cache
 * ```typescript
 * class PerfisServico extends CRUDBase<...> {
 *   constructor() {
 *     super(perfis, 'Perfil', {
 *       cache: { namespace: 'perfis', ttl: 3600 },
 *       clienteIdNullable: true
 *     });
 *   }
 *
 *   protected async afterUpdate(id: string) {
 *     await super.afterUpdate(id);
 *     await this.cacheServico?.delete(`permissoes:${id}`);
 *   }
 * }
 * ```
 */
export class CRUDBase<
  TTabela extends PgTable,
  TDados,
  TDadosCriacao extends Record<string, any>,
  TDadosAtualizacao extends Record<string, any>
> {
  protected camposBusca: string[];
  protected clienteIdNullable: boolean;
  protected cacheServico?: CacheServico;
  protected opcoes?: CRUDBaseOpcoes<TTabela>;

  constructor(
    protected tabela: TTabela,
    protected nomeEntidade: string,
    opcoesOuCamposBusca?: CRUDBaseOpcoes<TTabela> | string[]
  ) {
    // Suportar assinatura antiga (backward compatible)
    if (Array.isArray(opcoesOuCamposBusca)) {
      this.camposBusca = opcoesOuCamposBusca;
      this.clienteIdNullable = false;
    } else {
      this.opcoes = opcoesOuCamposBusca;
      this.camposBusca = opcoesOuCamposBusca?.camposBusca ?? ['nome'];
      this.clienteIdNullable = opcoesOuCamposBusca?.clienteIdNullable ?? false;

      // Inicializar cache se configurado
      if (opcoesOuCamposBusca?.cache) {
        this.cacheServico = new CacheServico(opcoesOuCamposBusca.cache.namespace);
      }
    }
  }

  // ===========================================================================
  // Métodos Auxiliares Internos
  // ===========================================================================

  /**
   * Constrói objeto de SELECT com subconsultas injetadas
   *
   * @returns Objeto para .select() com todos os campos + subconsultas
   */
  protected buildSelectFields(): Record<string, any> {
    // Começar com todos os campos da tabela
    const fields: Record<string, any> = { ...this.tabela };

    // Injetar subconsultas se configuradas
    if (this.opcoes?.subconsultas) {
      for (const [campo, factory] of Object.entries(this.opcoes.subconsultas)) {
        fields[campo] = factory(this.tabela);
      }
    }

    return fields;
  }

  /**
   * Constrói condições base para WHERE (clienteId com suporte a nullable)
   *
   * @param clienteId - ID do cliente (pode ser null se clienteIdNullable = true)
   * @returns SQL condition para filtro de clienteId
   */
  protected buildBaseConditions(clienteId: string | null): SQL<unknown> | undefined {
    if (this.clienteIdNullable && clienteId) {
      // Perfis do cliente + perfis globais (clienteId = null)
      return or(
        eq((this.tabela as any).clienteId, clienteId),
        isNull((this.tabela as any).clienteId)
      );
    } else if (this.clienteIdNullable && !clienteId) {
      // Somente perfis globais
      return isNull((this.tabela as any).clienteId);
    } else {
      // Comportamento padrão: filtrar por clienteId exato
      return eq((this.tabela as any).clienteId, clienteId as string);
    }
  }

  // ===========================================================================
  // Hooks de Ciclo de Vida (para cache customizado)
  // ===========================================================================

  /**
   * Hook executado após criar um registro
   * Sobrescreva para invalidar cache customizado
   *
   * @param id - ID do registro criado
   */
  protected async afterCreate(id: string): Promise<void> {
    // Hook vazio - subclasses podem sobrescrever
  }

  /**
   * Hook executado após atualizar um registro
   * Sobrescreva para invalidar cache customizado
   *
   * @param id - ID do registro atualizado
   */
  protected async afterUpdate(id: string): Promise<void> {
    if (this.cacheServico) {
      await this.cacheServico.delete(`obter:${id}`);
    }
  }

  /**
   * Hook executado após excluir um registro
   * Sobrescreva para invalidar cache customizado
   *
   * @param id - ID do registro excluído
   */
  protected async afterDelete(id: string): Promise<void> {
    if (this.cacheServico) {
      await this.cacheServico.delete(`obter:${id}`);
    }
  }

  // ===========================================================================
  // Listar (com paginação e busca)
  // ===========================================================================

  /**
   * Lista registros com paginação e busca
   *
   * @param clienteId - ID do cliente (multi-tenant, pode ser null se clienteIdNullable = true)
   * @param query - Parâmetros de paginação e busca
   * @param condicoesAdicionais - Condições WHERE adicionais
   * @returns Lista paginada de registros
   *
   * @example
   * ```typescript
   * const resultado = await servico.listar(clienteId, {
   *   pagina: 1,
   *   limite: 20,
   *   busca: 'João',
   *   ordenarPor: 'nome',
   *   ordem: 'asc'
   * });
   * ```
   */
  async listar(
    clienteId: string | null,
    query: QueryPaginacao,
    condicoesAdicionais: SQL<unknown>[] = []
  ): Promise<ResultadoPaginado<TDados>> {
    const { pagina, limite, busca, ordenarPor = 'criadoEm', ordem = 'desc' } = query;
    const offset = (pagina - 1) * limite;

    // Condições base: filtrar por clienteId (com suporte a nullable)
    const conditions: any[] = [];

    const baseCondition = this.buildBaseConditions(clienteId);
    if (baseCondition) {
      conditions.push(baseCondition);
    }

    conditions.push(...condicoesAdicionais);

    // Busca por campos configurados
    if (busca && this.camposBusca.length > 0) {
      const buscaConditions = this.camposBusca
        .filter((campo) => campo in this.tabela)
        .map((campo) =>
          ilike(
            (this.tabela as any)[campo],
            `%${busca}%`
          )
        );

      // Se tem múltiplos campos, usa OR
      if (buscaConditions.length > 1) {
        conditions.push(or(...buscaConditions));
      } else if (buscaConditions.length === 1) {
        conditions.push(buscaConditions[0]);
      }
    }

    const where = and(...conditions);

    // Determinar campo de ordenação
    const campoOrdenacao = ordenarPor in this.tabela
      ? (this.tabela as any)[ordenarPor]
      : (this.tabela as any).criadoEm;

    // Construir SELECT com subconsultas (se configuradas)
    const selectFields = this.buildSelectFields();

    // Query paralela: dados + contagem
    const [dados, totalResult] = await Promise.all([
      db
        .select(selectFields)
        .from(this.tabela as any)
        .where(where)
        .orderBy(ordem === 'desc' ? desc(campoOrdenacao) : asc(campoOrdenacao))
        .limit(limite)
        .offset(offset),
      db.select({ total: count() }).from(this.tabela as any).where(where),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: dados as TDados[],
      meta: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  // ===========================================================================
  // Obter por ID
  // ===========================================================================

  /**
   * Obtém um registro por ID
   *
   * @param clienteId - ID do cliente (multi-tenant, pode ser null se clienteIdNullable = true)
   * @param id - ID do registro
   * @returns Registro encontrado
   * @throws {ErroNaoEncontrado} Se o registro não existir
   *
   * @example
   * ```typescript
   * const etiqueta = await servico.obterPorId(clienteId, 'uuid-123');
   * ```
   */
  async obterPorId(clienteId: string | null, id: string): Promise<TDados> {
    // Tentar buscar do cache (se configurado)
    if (this.cacheServico) {
      const chaveCache = `obter:${id}`;
      const cached = await this.cacheServico.get<TDados>(chaveCache);
      if (cached) {
        return cached;
      }
    }

    // Construir condições WHERE
    const conditions: SQL<unknown>[] = [eq((this.tabela as any).id, id)];

    const baseCondition = this.buildBaseConditions(clienteId);
    if (baseCondition) {
      conditions.push(baseCondition);
    }

    // Construir SELECT com subconsultas (se configuradas)
    const selectFields = this.buildSelectFields();

    const resultado = await db
      .select(selectFields)
      .from(this.tabela as any)
      .where(and(...conditions))
      .limit(1);

    if (resultado.length === 0) {
      throw new ErroNaoEncontrado(`${this.nomeEntidade} não encontrado(a)`);
    }

    const registro = resultado[0] as TDados;

    // Armazenar no cache (se configurado)
    if (this.cacheServico) {
      const ttl = this.opcoes?.cache?.ttl ?? 300; // 5 minutos padrão
      await this.cacheServico.set(`obter:${id}`, registro, ttl);
    }

    return registro;
  }

  // ===========================================================================
  // Criar
  // ===========================================================================

  /**
   * Cria um novo registro
   *
   * @param clienteId - ID do cliente (multi-tenant, pode ser null se clienteIdNullable = true)
   * @param dados - Dados para criação
   * @returns Registro criado
   * @throws {ErroValidacao} Se houver duplicidade de nome
   *
   * @example
   * ```typescript
   * const etiqueta = await servico.criar(clienteId, {
   *   nome: 'Importante',
   *   cor: '#FF0000'
   * });
   * ```
   */
  async criar(clienteId: string | null, dados: TDadosCriacao): Promise<TDados> {
    // Validar duplicidade por nome (se aplicável)
    if ('nome' in dados && 'nome' in this.tabela) {
      await this.validarNomeUnico(clienteId, dados.nome as string);
    }

    const [registro] = await db
      .insert(this.tabela as any)
      .values({
        ...dados,
        clienteId,
      } as any)
      .returning();

    // Hook pós-criação (para cache customizado)
    await this.afterCreate((registro as any).id);

    return registro as TDados;
  }

  // ===========================================================================
  // Atualizar
  // ===========================================================================

  /**
   * Atualiza um registro existente
   *
   * @param clienteId - ID do cliente (multi-tenant, pode ser null se clienteIdNullable = true)
   * @param id - ID do registro
   * @param dados - Dados para atualização
   * @returns Registro atualizado
   * @throws {ErroNaoEncontrado} Se o registro não existir
   * @throws {ErroValidacao} Se houver duplicidade de nome
   *
   * @example
   * ```typescript
   * const etiqueta = await servico.atualizar(clienteId, 'uuid-123', {
   *   nome: 'Muito Importante'
   * });
   * ```
   */
  async atualizar(
    clienteId: string | null,
    id: string,
    dados: TDadosAtualizacao
  ): Promise<TDados> {
    // Verificar se existe
    await this.obterPorId(clienteId, id);

    // Validar duplicidade de nome (se estiver mudando)
    if ('nome' in dados && 'nome' in this.tabela) {
      await this.validarNomeUnico(clienteId, dados.nome as string, id);
    }

    const [registro] = await db
      .update(this.tabela as any)
      .set(dados as any)
      .where(eq((this.tabela as any).id, id))
      .returning();

    // Hook pós-atualização (invalida cache automaticamente)
    await this.afterUpdate(id);

    return registro as TDados;
  }

  // ===========================================================================
  // Excluir
  // ===========================================================================

  /**
   * Exclui um registro
   *
   * @param clienteId - ID do cliente (multi-tenant, pode ser null se clienteIdNullable = true)
   * @param id - ID do registro
   * @throws {ErroNaoEncontrado} Se o registro não existir
   *
   * @example
   * ```typescript
   * await servico.excluir(clienteId, 'uuid-123');
   * ```
   */
  async excluir(clienteId: string | null, id: string): Promise<void> {
    // Verificar se existe
    await this.obterPorId(clienteId, id);

    await db.delete(this.tabela as any).where(eq((this.tabela as any).id, id));

    // Hook pós-exclusão (invalida cache automaticamente)
    await this.afterDelete(id);
  }

  // ===========================================================================
  // Helpers Privados
  // ===========================================================================

  /**
   * Valida se o nome é único dentro do escopo do cliente
   *
   * Considera escopo:
   * - Se clienteIdNullable = true: valida separadamente global vs cliente
   * - Se clienteIdNullable = false: valida apenas no escopo do cliente
   *
   * @param clienteId - ID do cliente (pode ser null se clienteIdNullable = true)
   * @param nome - Nome a validar
   * @param idExcluir - ID a excluir da validação (para updates)
   * @throws {ErroValidacao} Se o nome já existir
   */
  private async validarNomeUnico(
    clienteId: string | null,
    nome: string,
    idExcluir?: string
  ): Promise<void> {
    const conditions: any[] = [eq((this.tabela as any).nome, nome)];

    // Aplicar filtro de clienteId considerando nullable
    if (this.clienteIdNullable) {
      // Validar apenas no escopo (global OU do cliente)
      if (clienteId === null) {
        conditions.push(isNull((this.tabela as any).clienteId));
      } else {
        conditions.push(eq((this.tabela as any).clienteId, clienteId));
      }
    } else {
      // Validar apenas no escopo do cliente (comportamento padrão)
      conditions.push(eq((this.tabela as any).clienteId, clienteId));
    }

    if (idExcluir) {
      conditions.push(ne((this.tabela as any).id, idExcluir));
    }

    const existe = await db
      .select({ id: (this.tabela as any).id })
      .from(this.tabela as any)
      .where(and(...conditions))
      .limit(1);

    if (existe.length > 0) {
      throw new ErroValidacao(`Já existe ${this.nomeEntidade} com este nome`);
    }
  }
}
