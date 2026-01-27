import { eq, and, or, ilike, count, asc, desc, sql } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { quadrosKanban, colunasKanban, cartoesKanban, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import type {
  CriarCartaoDTO,
  AtualizarCartaoDTO,
  MoverCartaoDTO,
  ListarCartoesQuery,
} from './cartoes.schema.js';

// =============================================================================
// Servico de Cartoes Kanban
// =============================================================================

export const cartoesServico = {
  // ---------------------------------------------------------------------------
  // Listar Cartoes de uma Coluna
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, quadroId: string, colunaId: string, query: ListarCartoesQuery) {
    const { pagina, limite, busca, contatoId } = query;
    const offset = (pagina - 1) * limite;

    // Verificar acesso ao quadro
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    // Verificar se a coluna pertence ao quadro
    const colunaResult = await db
      .select()
      .from(colunasKanban)
      .where(and(eq(colunasKanban.id, colunaId), eq(colunasKanban.quadroId, quadroId)))
      .limit(1);

    if (colunaResult.length === 0) {
      throw new ErroNaoEncontrado('Coluna não encontrada');
    }

    const conditions = [eq(cartoesKanban.colunaId, colunaId)];

    if (busca) {
      conditions.push(
        or(
          ilike(cartoesKanban.titulo, `%${busca}%`),
          ilike(cartoesKanban.descricao, `%${busca}%`)
        )!
      );
    }

    if (contatoId) {
      conditions.push(eq(cartoesKanban.contatoId, contatoId));
    }

    const whereClause = and(...conditions);

    const [cartoesResult, totalResult] = await Promise.all([
      db
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
        .where(whereClause)
        .orderBy(asc(cartoesKanban.ordem))
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(cartoesKanban)
        .where(whereClause),
    ]);

    const cartoes = cartoesResult.map((c) => ({
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
    }));

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: cartoes,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Obter Cartao por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, quadroId: string, colunaId: string, id: string) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    const cartaoResult = await db
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
        contatoEmail: contatos.email,
        colunaIdJoin: colunasKanban.id,
        colunaNome: colunasKanban.nome,
        colunaCor: colunasKanban.cor,
      })
      .from(cartoesKanban)
      .leftJoin(contatos, eq(cartoesKanban.contatoId, contatos.id))
      .leftJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .where(and(eq(cartoesKanban.id, id), eq(cartoesKanban.colunaId, colunaId)))
      .limit(1);

    if (cartaoResult.length === 0) {
      throw new ErroNaoEncontrado('Cartão não encontrado');
    }

    const c = cartaoResult[0];

    return {
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
        ? { id: c.contatoIdJoin, nome: c.contatoNome, telefone: c.contatoTelefone!, email: c.contatoEmail }
        : null,
      coluna: c.colunaIdJoin
        ? { id: c.colunaIdJoin, nome: c.colunaNome!, cor: c.colunaCor! }
        : null,
    };
  },

  // ---------------------------------------------------------------------------
  // Criar Cartao
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, quadroId: string, colunaId: string, dados: CriarCartaoDTO) {
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
      .where(and(eq(colunasKanban.id, colunaId), eq(colunasKanban.quadroId, quadroId)))
      .limit(1);

    if (colunaResult.length === 0) {
      throw new ErroNaoEncontrado('Coluna não encontrada');
    }

    // Validar contato se fornecido
    if (dados.contatoId) {
      const contatoResult = await db
        .select()
        .from(contatos)
        .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
        .limit(1);

      if (contatoResult.length === 0) {
        throw new ErroNaoEncontrado('Contato não encontrado');
      }
    }

    // Obter a maior ordem atual
    const ultimoCartao = await db
      .select()
      .from(cartoesKanban)
      .where(eq(cartoesKanban.colunaId, colunaId))
      .orderBy(desc(cartoesKanban.ordem))
      .limit(1);

    const novaOrdem = dados.ordem ?? (ultimoCartao.length > 0 ? ultimoCartao[0].ordem + 1 : 0);

    const [cartaoCriado] = await db
      .insert(cartoesKanban)
      .values({
        colunaId,
        titulo: dados.titulo,
        descricao: dados.descricao,
        contatoId: dados.contatoId,
        valor: dados.valor != null ? String(dados.valor) : undefined,
        dataLimite: dados.dataLimite ? new Date(dados.dataLimite) : null,
        ordem: novaOrdem,
      })
      .returning();

    // Buscar com contato para retorno
    const result = await db
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
      .where(eq(cartoesKanban.id, cartaoCriado.id))
      .limit(1);

    const c = result[0];

    return {
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
    };
  },

  // ---------------------------------------------------------------------------
  // Atualizar Cartao
  // ---------------------------------------------------------------------------
  async atualizar(
    clienteId: string,
    quadroId: string,
    colunaId: string,
    id: string,
    dados: AtualizarCartaoDTO
  ) {
    await this.obterPorId(clienteId, quadroId, colunaId, id);

    // Validar contato se fornecido
    if (dados.contatoId) {
      const contatoResult = await db
        .select()
        .from(contatos)
        .where(and(eq(contatos.id, dados.contatoId), eq(contatos.clienteId, clienteId)))
        .limit(1);

      if (contatoResult.length === 0) {
        throw new ErroNaoEncontrado('Contato não encontrado');
      }
    }

    await db
      .update(cartoesKanban)
      .set({
        ...(dados.titulo && { titulo: dados.titulo }),
        ...(dados.descricao !== undefined && { descricao: dados.descricao }),
        ...(dados.contatoId !== undefined && { contatoId: dados.contatoId }),
        ...(dados.valor !== undefined && { valor: dados.valor != null ? String(dados.valor) : null }),
        ...(dados.dataLimite !== undefined && {
          dataLimite: dados.dataLimite ? new Date(dados.dataLimite) : null,
        }),
        ...(dados.ordem !== undefined && { ordem: dados.ordem }),
      })
      .where(eq(cartoesKanban.id, id));

    // Buscar atualizado com contato
    const result = await db
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
      .where(eq(cartoesKanban.id, id))
      .limit(1);

    const c = result[0];

    return {
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
    };
  },

  // ---------------------------------------------------------------------------
  // Mover Cartao para outra Coluna
  // ---------------------------------------------------------------------------
  async mover(
    clienteId: string,
    quadroId: string,
    colunaId: string,
    id: string,
    dados: MoverCartaoDTO
  ) {
    const quadroResult = await db
      .select()
      .from(quadrosKanban)
      .where(and(eq(quadrosKanban.id, quadroId), eq(quadrosKanban.clienteId, clienteId)))
      .limit(1);

    if (quadroResult.length === 0) {
      throw new ErroNaoEncontrado('Quadro não encontrado');
    }

    // Verificar cartao na coluna de origem
    const cartaoResult = await db
      .select()
      .from(cartoesKanban)
      .where(and(eq(cartoesKanban.id, id), eq(cartoesKanban.colunaId, colunaId)))
      .limit(1);

    if (cartaoResult.length === 0) {
      throw new ErroNaoEncontrado('Cartão não encontrado');
    }

    // Verificar coluna de destino
    const colunaDestinoResult = await db
      .select()
      .from(colunasKanban)
      .where(and(eq(colunasKanban.id, dados.colunaDestinoId), eq(colunasKanban.quadroId, quadroId)))
      .limit(1);

    if (colunaDestinoResult.length === 0) {
      throw new ErroNaoEncontrado('Coluna de destino não encontrada');
    }

    // Obter nova ordem se nao fornecida
    let novaOrdem = dados.ordem;
    if (novaOrdem === undefined) {
      const ultimoCartao = await db
        .select()
        .from(cartoesKanban)
        .where(eq(cartoesKanban.colunaId, dados.colunaDestinoId))
        .orderBy(desc(cartoesKanban.ordem))
        .limit(1);
      novaOrdem = ultimoCartao.length > 0 ? ultimoCartao[0].ordem + 1 : 0;
    }

    await db
      .update(cartoesKanban)
      .set({
        colunaId: dados.colunaDestinoId,
        ordem: novaOrdem,
      })
      .where(eq(cartoesKanban.id, id));

    // Buscar atualizado com contato e coluna
    const result = await db
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
        colunaIdJoin: colunasKanban.id,
        colunaNome: colunasKanban.nome,
        colunaCor: colunasKanban.cor,
      })
      .from(cartoesKanban)
      .leftJoin(contatos, eq(cartoesKanban.contatoId, contatos.id))
      .leftJoin(colunasKanban, eq(cartoesKanban.colunaId, colunasKanban.id))
      .where(eq(cartoesKanban.id, id))
      .limit(1);

    const c = result[0];

    return {
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
      coluna: c.colunaIdJoin
        ? { id: c.colunaIdJoin, nome: c.colunaNome!, cor: c.colunaCor! }
        : null,
    };
  },

  // ---------------------------------------------------------------------------
  // Excluir Cartao
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, quadroId: string, colunaId: string, id: string) {
    await this.obterPorId(clienteId, quadroId, colunaId, id);

    await db.delete(cartoesKanban).where(eq(cartoesKanban.id, id));
  },
};
