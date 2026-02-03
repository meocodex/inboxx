import { eq, and, or, ilike, isNotNull, asc, ne } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { respostasRapidas } from '../../infraestrutura/banco/schema/index.js';
import { CRUDBase } from '../../compartilhado/servicos/crud-base.servico.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarRespostaRapidaDTO,
  AtualizarRespostaRapidaDTO,
  ListarRespostasRapidasQuery,
} from './respostas-rapidas.schema.js';

// =============================================================================
// Tipo de Resposta Rápida
// =============================================================================

export interface RespostaRapida {
  id: string;
  clienteId: string;
  titulo: string;
  atalho: string;
  conteudo: string;
  categoria: string | null;
  anexoUrl: string | null;
  criadoEm: Date;
  atualizadoEm: Date;
}

// =============================================================================
// Serviço de Respostas Rápidas (Refatorado com CRUD Base)
// =============================================================================

/**
 * Serviço de gestão de respostas rápidas
 *
 * Herda operações CRUD básicas da classe CRUDBase e adiciona:
 * - Validação de atalho único (ao invés de nome)
 * - buscarPorAtalho() - Busca por atalho específico
 * - listarCategorias() - Lista categorias distintas
 */
class RespostasRapidasServico extends CRUDBase<
  typeof respostasRapidas,
  RespostaRapida,
  CriarRespostaRapidaDTO,
  AtualizarRespostaRapidaDTO
> {
  constructor() {
    // Configurar campos de busca: titulo, atalho e conteudo
    super(respostasRapidas, 'Resposta rápida', ['titulo', 'atalho', 'conteudo']);
  }

  // ===========================================================================
  // MÉTODOS CRUD SOBRESCRITOS (validação customizada por atalho)
  // ===========================================================================

  /**
   * Cria uma nova resposta rápida com validação de atalho único
   *
   * @param clienteId - ID do cliente
   * @param dados - Dados da resposta rápida
   * @returns Resposta rápida criada
   * @throws {ErroValidacao} Se o atalho já existir
   */
  async criar(clienteId: string, dados: CriarRespostaRapidaDTO): Promise<RespostaRapida> {
    // Validar atalho único
    await this.validarAtalhoUnico(clienteId, dados.atalho);

    // Criar registro com atalho em lowercase
    const [resposta] = await db
      .insert(respostasRapidas)
      .values({
        clienteId,
        titulo: dados.titulo,
        atalho: dados.atalho.toLowerCase(),
        conteudo: dados.conteudo,
        categoria: dados.categoria,
        anexoUrl: dados.anexoUrl,
      })
      .returning();

    return resposta as RespostaRapida;
  }

  /**
   * Atualiza uma resposta rápida existente
   *
   * @param clienteId - ID do cliente
   * @param id - ID da resposta
   * @param dados - Dados para atualização
   * @returns Resposta rápida atualizada
   * @throws {ErroNaoEncontrado} Se a resposta não existir
   * @throws {ErroValidacao} Se o novo atalho já existir
   */
  async atualizar(
    clienteId: string,
    id: string,
    dados: AtualizarRespostaRapidaDTO
  ): Promise<RespostaRapida> {
    // Verificar se existe
    const respostaExistente = await this.obterPorId(clienteId, id);

    // Validar novo atalho (se estiver mudando)
    if (dados.atalho && dados.atalho !== respostaExistente.atalho) {
      await this.validarAtalhoUnico(clienteId, dados.atalho, id);
    }

    // Atualizar registro
    const [resposta] = await db
      .update(respostasRapidas)
      .set({
        ...(dados.titulo && { titulo: dados.titulo }),
        ...(dados.atalho && { atalho: dados.atalho.toLowerCase() }),
        ...(dados.conteudo && { conteudo: dados.conteudo }),
        ...(dados.categoria !== undefined && { categoria: dados.categoria }),
        ...(dados.anexoUrl !== undefined && { anexoUrl: dados.anexoUrl }),
      })
      .where(eq(respostasRapidas.id, id))
      .returning();

    return resposta as RespostaRapida;
  }

  // ===========================================================================
  // Métodos Customizados
  // ===========================================================================

  /**
   * Busca resposta rápida por atalho
   *
   * @param clienteId - ID do cliente
   * @param atalho - Atalho da resposta (case-insensitive)
   * @returns Resposta rápida encontrada
   * @throws {ErroNaoEncontrado} Se não encontrar
   *
   * @example
   * ```typescript
   * const resposta = await respostasRapidasServico.buscarPorAtalho(clienteId, '/oi');
   * ```
   */
  async buscarPorAtalho(clienteId: string, atalho: string): Promise<RespostaRapida> {
    const result = await db
      .select()
      .from(respostasRapidas)
      .where(
        and(
          eq(respostasRapidas.clienteId, clienteId),
          ilike(respostasRapidas.atalho, atalho)
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Resposta rápida não encontrada');
    }

    return result[0] as RespostaRapida;
  }

  /**
   * Lista todas as categorias distintas de respostas rápidas
   *
   * @param clienteId - ID do cliente
   * @returns Array de categorias
   *
   * @example
   * ```typescript
   * const categorias = await respostasRapidasServico.listarCategorias(clienteId);
   * // ['Saudações', 'Despedidas', 'FAQ']
   * ```
   */
  async listarCategorias(clienteId: string): Promise<string[]> {
    const categorias = await db
      .selectDistinct({
        categoria: respostasRapidas.categoria,
      })
      .from(respostasRapidas)
      .where(
        and(
          eq(respostasRapidas.clienteId, clienteId),
          isNotNull(respostasRapidas.categoria)
        )
      )
      .orderBy(asc(respostasRapidas.categoria));

    return categorias.map((c) => c.categoria).filter(Boolean) as string[];
  }

  // ===========================================================================
  // Helpers Privados
  // ===========================================================================

  /**
   * Valida se o atalho é único dentro do escopo do cliente
   *
   * @param clienteId - ID do cliente
   * @param atalho - Atalho a validar
   * @param idExcluir - ID a excluir da validação (para updates)
   * @throws {ErroValidacao} Se o atalho já existir
   */
  private async validarAtalhoUnico(
    clienteId: string,
    atalho: string,
    idExcluir?: string
  ): Promise<void> {
    const conditions = [
      eq(respostasRapidas.clienteId, clienteId),
      ilike(respostasRapidas.atalho, atalho),
    ];

    if (idExcluir) {
      conditions.push(ne(respostasRapidas.id, idExcluir));
    }

    const existe = await db
      .select({ id: respostasRapidas.id })
      .from(respostasRapidas)
      .where(and(...conditions))
      .limit(1);

    if (existe.length > 0) {
      throw new ErroValidacao('Atalho já existe');
    }
  }
}

// Exportar instância singleton
export const respostasRapidasServico = new RespostasRapidasServico();

// =============================================================================
// COMPARAÇÃO: Antes vs Depois
// =============================================================================

/*
ANTES (respostas-rapidas.servico.original.ts): ~242 linhas
- 5 métodos CRUD duplicados manualmente
- Validações de existência repetidas
- Paginação implementada manualmente
- 2 métodos customizados (buscarPorAtalho, listarCategorias)

DEPOIS (respostas-rapidas.servico.ts): ~230 linhas (com JSDoc)
- Herda listar() e obterPorId() da classe base
- Sobrescreve criar() e atualizar() para validação customizada por atalho
- Herda excluir() da classe base
- Mantém 2 métodos customizados
- Validação de atalho único centralizada em helper privado

BENEFÍCIOS:
1. Menos código boilerplate (~15% redução)
2. Paginação e busca automáticas
3. Type-safety com generics
4. Consistência garantida pela classe base
5. Foco em lógica de negócio (atalho único, categorias)

PARTICULARIDADES:
- Validação por "atalho" ao invés de "nome" (padrão da base)
- Atalho sempre convertido para lowercase
- Busca case-insensitive por atalho
*/
