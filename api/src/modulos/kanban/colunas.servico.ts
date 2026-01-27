import { eq, and, count, asc, desc } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { quadrosKanban, colunasKanban, cartoesKanban, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type { CriarColunaDTO, AtualizarColunaDTO, ReordenarColunasDTO } from './colunas.schema.js';
import { sql } from 'drizzle-orm';

// =============================================================================
// Servico de Colunas Kanban
// =============================================================================

export const colunasServico = {
  // ---------------------------------------------------------------------------
  // Listar Colunas de um Quadro
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, quadroId: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    const cartoesCountSub = db
      .select({ total: count() })
      .from(cartoesKanban)
      .where(eq(cartoesKanban.colunaId, colunasKanban.id));

    const colunas = await db
      .select({
        id: colunasKanban.id,
        quadroId: colunasKanban.quadroId,
        nome: colunasKanban.nome,
        cor: colunasKanban.cor,
        ordem: colunasKanban.ordem,
        totalCartoes: sql<number>`(${cartoesCountSub})`.as('total_cartoes'),
      })
      .from(colunasKanban)
      .where(eq(colunasKanban.quadroId, quadroId))
      .orderBy(asc(colunasKanban.ordem));

    return colunas;
  },

  // ---------------------------------------------------------------------------
  // Obter Coluna por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, quadroId: string, id: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    const colunaResult = await db
      .select()
      .from(colunasKanban)
      .where(and(eq(colunasKanban.id, id), eq(colunasKanban.quadroId, quadroId)))
      .limit(1);

    if (colunaResult.length === 0) {
      throw new ErroNaoEncontrado('Coluna não encontrada');
    }

    const coluna = colunaResult[0];

    // Buscar cartoes da coluna com contato
    const cartoesResult = await db
      .select({
        id: cartoesKanban.id,
        colunaId: cartoesKanban.colunaId,
        contatoId: cartoesKanban.contatoId,
        titulo: cartoesKanban.titulo,
        descricao: cartoesKanban.descricao,
        valor: cartoesKanban.valor,
        ordem: cartoesKanban.ordem,
        dataLimite: cartoesKanban.dataLimite,
        criadoEm: cartoesKanban.criadoEm,
        atualizadoEm: cartoesKanban.atualizadoEm,
        contatoIdJoin: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(cartoesKanban)
      .leftJoin(contatos, eq(cartoesKanban.contatoId, contatos.id))
      .where(eq(cartoesKanban.colunaId, id))
      .orderBy(asc(cartoesKanban.ordem));

    return {
      ...coluna,
      cartoes: cartoesResult.map((c) => ({
        id: c.id,
        colunaId: c.colunaId,
        contatoId: c.contatoId,
        titulo: c.titulo,
        descricao: c.descricao,
        valor: c.valor,
        ordem: c.ordem,
        dataLimite: c.dataLimite,
        criadoEm: c.criadoEm,
        atualizadoEm: c.atualizadoEm,
        contato: c.contatoIdJoin
          ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone! }
          : null,
      })),
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Coluna
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, quadroId: string, dados: CriarColunaDTO) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    // Obter a maior ordem atual
    const ultimaColuna = await db
      .select()
      .from(colunasKanban)
      .where(eq(colunasKanban.quadroId, quadroId))
      .orderBy(desc(colunasKanban.ordem))
      .limit(1);

    const novaOrdem = dados.ordem ?? (ultimaColuna.length > 0 ? ultimaColuna[0].ordem + 1 : 0);

    const [coluna] = await db
      .insert(colunasKanban)
      .values({
        quadroId,
        nome: dados.nome,
        cor: dados.cor,
        ordem: novaOrdem,
      })
      .returning();

    return coluna;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Coluna
  // ---------------------------------------------------------------------------
  async atualizar(clienteId: string, quadroId: string, id: string, dados: AtualizarColunaDTO) {
    await this.obterPorId(clienteId, quadroId, id);

    const [coluna] = await db
      .update(colunasKanban)
      .set({
        ...(dados.nome && { nome: dados.nome }),
        ...(dados.cor && { cor: dados.cor }),
        ...(dados.ordem !== undefined && { ordem: dados.ordem }),
      })
      .where(eq(colunasKanban.id, id))
      .returning();

    return coluna;
  },

  // ---------------------------------------------------------------------------
  // Excluir Coluna
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, quadroId: string, id: string) {
    await this.obterPorId(clienteId, quadroId, id);

    // Verificar se ha cartoes na coluna
    const totalResult = await db
      .select({ total: count() })
      .from(cartoesKanban)
      .where(eq(cartoesKanban.colunaId, id));

    const totalCartoes = totalResult[0]?.total ?? 0;

    if (totalCartoes > 0) {
      throw new ErroValidacao('Não é possível excluir coluna com cartões. Mova ou exclua os cartões primeiro.');
    }

    await db.delete(colunasKanban).where(eq(colunasKanban.id, id));
  },

  // ---------------------------------------------------------------------------
  // Reordenar Colunas
  // ---------------------------------------------------------------------------
  async reordenar(clienteId: string, quadroId: string, dados: ReordenarColunasDTO) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    // Atualizar ordem de cada coluna
    await Promise.all(
      dados.colunas.map((item) =>
        db
          .update(colunasKanban)
          .set({ ordem: item.ordem })
          .where(and(eq(colunasKanban.id, item.id), eq(colunasKanban.quadroId, quadroId)))
      )
    );

    return { reordenado: true };
  },
};
