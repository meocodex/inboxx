import type { PgTable } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

// =============================================================================
// Tipos e Interfaces para CRUDBase
// =============================================================================

/**
 * Configuração de subconsultas para enriquecer queries
 *
 * Permite injetar colunas calculadas (subqueries) nas queries de SELECT
 *
 * @example
 * ```typescript
 * const subconsultas = {
 *   totalMembros: () => sql<number>`(
 *     SELECT count(*) FROM usuarios WHERE usuarios.equipe_id = ${equipes.id}
 *   )`.mapWith(Number),
 *   totalConversas: () => sql<number>`(
 *     SELECT count(*) FROM conversas WHERE conversas.equipe_id = ${equipes.id}
 *   )`.mapWith(Number)
 * };
 * ```
 */
export interface SubconsultaConfig<TTabela extends PgTable> {
  [campo: string]: (tabela: TTabela) => SQL;
}

/**
 * Configuração de cache Redis
 *
 * @property namespace - Namespace para chaves de cache (ex: 'perfis')
 * @property ttl - Time-to-live em segundos (padrão: 300s = 5min)
 *
 * @example
 * ```typescript
 * const cache = {
 *   namespace: 'perfis',
 *   ttl: 3600 // 1 hora
 * };
 * ```
 */
export interface CacheConfig {
  /** Namespace para chaves de cache (ex: 'perfis', 'equipes') */
  namespace: string;

  /** Time-to-live em segundos (padrão: 300s = 5min) */
  ttl?: number;
}

/**
 * Opções de configuração da CRUDBase
 *
 * Permite customizar comportamento da classe base via composição:
 * - camposBusca: Campos para busca textual
 * - subconsultas: Colunas calculadas via subqueries
 * - cache: Cache Redis automático
 * - clienteIdNullable: Suporta entidades globais (clienteId = null)
 *
 * @template TTabela - Tipo da tabela Drizzle
 *
 * @example CRUD Simples
 * ```typescript
 * new CRUDBase(etiquetas, 'Etiqueta', {
 *   camposBusca: ['nome', 'descricao']
 * });
 * ```
 *
 * @example Com Subconsultas
 * ```typescript
 * new CRUDBase(equipes, 'Equipe', {
 *   camposBusca: ['nome'],
 *   subconsultas: {
 *     totalMembros: () => totalMembrosSubquery
 *   }
 * });
 * ```
 *
 * @example Com Cache
 * ```typescript
 * new CRUDBase(perfis, 'Perfil', {
 *   cache: { namespace: 'perfis', ttl: 3600 },
 *   clienteIdNullable: true
 * });
 * ```
 */
export interface CRUDBaseOpcoes<TTabela extends PgTable> {
  /**
   * Campos da tabela usados para busca textual (ILIKE)
   *
   * @default ['nome']
   *
   * @example
   * ```typescript
   * camposBusca: ['nome', 'descricao', 'email']
   * ```
   */
  camposBusca?: string[];

  /**
   * Subconsultas para enriquecer SELECT com colunas calculadas
   *
   * Injetadas automaticamente em listar() e obterPorId()
   *
   * @example
   * ```typescript
   * subconsultas: {
   *   totalMembros: () => sql<number>`(SELECT count(*)...)`.mapWith(Number),
   *   totalConversas: () => sql<number>`(SELECT count(*)...)`.mapWith(Number)
   * }
   * ```
   */
  subconsultas?: SubconsultaConfig<TTabela>;

  /**
   * Configuração de cache Redis automático
   *
   * Quando configurado:
   * - obterPorId() usa cache (chave: `{namespace}:obter:{id}`)
   * - criar(), atualizar(), excluir() invalidam cache
   * - Hooks afterCreate/afterUpdate/afterDelete para customização
   *
   * @example
   * ```typescript
   * cache: {
   *   namespace: 'perfis',
   *   ttl: 3600 // 1 hora
   * }
   * ```
   */
  cache?: CacheConfig;

  /**
   * Permite clienteId = null para entidades globais
   *
   * Quando true:
   * - Busca inclui: WHERE clienteId = ? OR clienteId IS NULL
   * - Criar/atualizar aceita clienteId: string | null
   * - Validação de nome único considera escopo (global vs cliente)
   *
   * @default false
   *
   * @example Perfis (globais + por cliente)
   * ```typescript
   * clienteIdNullable: true
   * ```
   */
  clienteIdNullable?: boolean;
}
