import { eq, and, count, asc, lte } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { compromissos, lembretes, contatos } from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  CriarLembreteDTO,
  AtualizarLembreteDTO,
  ListarLembretesQuery,
} from './lembretes.schema.js';

// =============================================================================
// Servico de Lembretes
// =============================================================================

export const lembretesServico = {
  // ---------------------------------------------------------------------------
  // Listar Lembretes de um Compromisso
  // ---------------------------------------------------------------------------
  async listar(clienteId: string, compromissoId: string, query: ListarLembretesQuery) {
    const { pagina, limite, pendentes } = query;
    const offset = (pagina - 1) * limite;

    // Verificar acesso ao compromisso
    const compromissoResult = await db
      .select()
      .from(compromissos)
      .where(and(eq(compromissos.id, compromissoId), eq(compromissos.clienteId, clienteId)))
      .limit(1);

    if (compromissoResult.length === 0) {
      throw new ErroNaoEncontrado('Compromisso não encontrado');
    }

    const conditions = [eq(lembretes.compromissoId, compromissoId)];

    if (pendentes !== undefined) {
      conditions.push(eq(lembretes.enviado, !pendentes));
    }

    const whereClause = and(...conditions);

    const [lembretesResult, totalResult] = await Promise.all([
      db
        .select()
        .from(lembretes)
        .where(whereClause)
        .orderBy(asc(lembretes.enviarEm))
        .limit(limite)
        .offset(offset),
      db
        .select({ total: count() })
        .from(lembretes)
        .where(whereClause),
    ]);

    const total = totalResult[0]?.total ?? 0;

    return {
      dados: lembretesResult,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  // ---------------------------------------------------------------------------
  // Listar Lembretes Pendentes (para processamento)
  // ---------------------------------------------------------------------------
  async listarPendentes(limite: number = 100) {
    const agora = new Date();

    const lembretesResult = await db
      .select({
        id: lembretes.id,
        compromissoId: lembretes.compromissoId,
        enviarEm: lembretes.enviarEm,
        enviado: lembretes.enviado,
        enviadoEm: lembretes.enviadoEm,
        compId: compromissos.id,
        compClienteId: compromissos.clienteId,
        compContatoId: compromissos.contatoId,
        compTitulo: compromissos.titulo,
        compDescricao: compromissos.descricao,
        compDataHora: compromissos.dataHora,
        compDuracaoMin: compromissos.duracaoMin,
        compLembreteMin: compromissos.lembreteMin,
        compCriadoEm: compromissos.criadoEm,
        compAtualizadoEm: compromissos.atualizadoEm,
        contatoIdJoin: contatos.id,
        contatoNome: contatos.nome,
        contatoTelefone: contatos.telefone,
      })
      .from(lembretes)
      .innerJoin(compromissos, eq(lembretes.compromissoId, compromissos.id))
      .leftJoin(contatos, eq(compromissos.contatoId, contatos.id))
      .where(
        and(
          eq(lembretes.enviado, false),
          lte(lembretes.enviarEm, agora)
        )
      )
      .orderBy(asc(lembretes.enviarEm))
      .limit(limite);

    return lembretesResult.map((r) => ({
      id: r.id,
      compromissoId: r.compromissoId,
      enviarEm: r.enviarEm,
      enviado: r.enviado,
      enviadoEm: r.enviadoEm,
      compromisso: {
        id: r.compId,
        clienteId: r.compClienteId,
        contatoId: r.compContatoId,
        titulo: r.compTitulo,
        descricao: r.compDescricao,
        dataHora: r.compDataHora,
        duracaoMin: r.compDuracaoMin,
        lembreteMin: r.compLembreteMin,
        criadoEm: r.compCriadoEm,
        atualizadoEm: r.compAtualizadoEm,
        contato: r.contatoIdJoin
          ? { id: r.contatoIdJoin, nome: r.contatoNome, telefone: r.contatoTelefone! }
          : null,
      },
    }));
  },

  // ---------------------------------------------------------------------------
  // Obter Lembrete por ID
  // ---------------------------------------------------------------------------
  async obterPorId(clienteId: string, compromissoId: string, id: string) {
    const compromissoResult = await db
      .select()
      .from(compromissos)
      .where(and(eq(compromissos.id, compromissoId), eq(compromissos.clienteId, clienteId)))
      .limit(1);

    if (compromissoResult.length === 0) {
      throw new ErroNaoEncontrado('Compromisso não encontrado');
    }

    const lembreteResult = await db
      .select()
      .from(lembretes)
      .where(and(eq(lembretes.id, id), eq(lembretes.compromissoId, compromissoId)))
      .limit(1);

    if (lembreteResult.length === 0) {
      throw new ErroNaoEncontrado('Lembrete não encontrado');
    }

    return lembreteResult[0];
  },

  // ---------------------------------------------------------------------------
  // Criar Lembrete
  // ---------------------------------------------------------------------------
  async criar(clienteId: string, compromissoId: string, dados: CriarLembreteDTO) {
    const compromissoResult = await db
      .select()
      .from(compromissos)
      .where(and(eq(compromissos.id, compromissoId), eq(compromissos.clienteId, clienteId)))
      .limit(1);

    if (compromissoResult.length === 0) {
      throw new ErroNaoEncontrado('Compromisso não encontrado');
    }

    const enviarEm = new Date(dados.enviarEm);

    // Validar que o lembrete e antes do compromisso
    if (enviarEm >= compromissoResult[0].dataHora) {
      throw new ErroValidacao('Lembrete deve ser agendado antes do compromisso');
    }

    const [lembrete] = await db
      .insert(lembretes)
      .values({
        compromissoId,
        enviarEm,
      })
      .returning();

    return lembrete;
  },

  // ---------------------------------------------------------------------------
  // Atualizar Lembrete
  // ---------------------------------------------------------------------------
  async atualizar(
    clienteId: string,
    compromissoId: string,
    id: string,
    dados: AtualizarLembreteDTO
  ) {
    await this.obterPorId(clienteId, compromissoId, id);

    const [lembrete] = await db
      .update(lembretes)
      .set({
        ...(dados.enviarEm && { enviarEm: new Date(dados.enviarEm) }),
        ...(dados.enviado !== undefined && {
          enviado: dados.enviado,
          enviadoEm: dados.enviado ? new Date() : null,
        }),
      })
      .where(eq(lembretes.id, id))
      .returning();

    return lembrete;
  },

  // ---------------------------------------------------------------------------
  // Marcar como Enviado
  // ---------------------------------------------------------------------------
  async marcarComoEnviado(id: string) {
    const [lembrete] = await db
      .update(lembretes)
      .set({
        enviado: true,
        enviadoEm: new Date(),
      })
      .where(eq(lembretes.id, id))
      .returning();

    return lembrete;
  },

  // ---------------------------------------------------------------------------
  // Excluir Lembrete
  // ---------------------------------------------------------------------------
  async excluir(clienteId: string, compromissoId: string, id: string) {
    await this.obterPorId(clienteId, compromissoId, id);
    await db.delete(lembretes).where(eq(lembretes.id, id));
  },
};
