import { eq, and, or, ilike, ne, count, asc, desc, sql } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { clientes, planos, licencas, usuarios, conexoes, conversas } from '../../infraestrutura/banco/schema/index.js';
import { ErroValidacao, ErroNaoEncontrado } from '../../compartilhado/erros/index.js';
import { gerarChaveAleatoria } from '../../compartilhado/utilitarios/criptografia.js';
import type {
  CriarClienteDTO,
  AtualizarClienteDTO,
  ListarClientesQuery,
  ClienteResumo,
  ClienteDetalhado,
  ListaClientesPaginada,
} from './clientes.schema.js';

// =============================================================================
// Campos de selecao
// =============================================================================

const camposClienteBase = {
  id: clientes.id,
  nome: clientes.nome,
  email: clientes.email,
  telefone: clientes.telefone,
  documento: clientes.documento,
  ativo: clientes.ativo,
  criadoEm: clientes.criadoEm,
  planoId: planos.id,
  planoNome: planos.nome,
  totalUsuarios: sql<number>`(SELECT count(*) FROM usuarios WHERE usuarios.cliente_id = ${clientes.id})`.mapWith(Number),
  totalConexoes: sql<number>`(SELECT count(*) FROM conexoes WHERE conexoes.cliente_id = ${clientes.id})`.mapWith(Number),
};

// =============================================================================
// Helpers para formatar resultado
// =============================================================================

const formatarClienteResumo = (row: {
  id: string;
  nome: string;
  email: string;
  telefone: string | null;
  documento: string | null;
  ativo: boolean;
  criadoEm: Date;
  planoId: string | null;
  planoNome: string | null;
  totalUsuarios: number;
  totalConexoes: number;
}) => ({
  id: row.id,
  nome: row.nome,
  email: row.email,
  telefone: row.telefone,
  documento: row.documento,
  ativo: row.ativo,
  criadoEm: row.criadoEm,
  plano: row.planoId
    ? {
        id: row.planoId,
        nome: row.planoNome!,
      }
    : null,
  _count: {
    usuarios: row.totalUsuarios,
    conexoes: row.totalConexoes,
  },
});

const formatarClienteDetalhado = (
  row: {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    documento: string | null;
    ativo: boolean;
    criadoEm: Date;
    atualizadoEm: Date;
    planoId: string | null;
    planoNome: string | null;
    totalUsuarios: number;
    totalConexoes: number;
  },
  licencasAtivas: { id: string; ativa: boolean; expiraEm: Date }[],
) => ({
  ...formatarClienteResumo(row),
  atualizadoEm: row.atualizadoEm,
  licencas: licencasAtivas,
});

// =============================================================================
// Mapa de ordenacao
// =============================================================================

const mapaOrdenacao: Record<string, Parameters<typeof asc>[0]> = {
  nome: clientes.nome,
  email: clientes.email,
  criadoEm: clientes.criadoEm,
  ativo: clientes.ativo,
};

// =============================================================================
// Servico de Clientes
// =============================================================================

class ClientesServico {
  // ---------------------------------------------------------------------------
  // Listar Clientes
  // ---------------------------------------------------------------------------
  async listar(query: ListarClientesQuery): Promise<ListaClientesPaginada> {
    const { pagina, limite, busca, ativo, planoId, ordenarPor, ordem } = query;

    // Construir condicoes de filtro
    const condicoes = [];

    // Filtro de busca
    if (busca) {
      condicoes.push(
        or(
          ilike(clientes.nome, `%${busca}%`),
          ilike(clientes.email, `%${busca}%`),
          ilike(clientes.documento, `%${busca}%`),
        )!,
      );
    }

    // Filtro de status
    if (ativo !== 'todos') {
      condicoes.push(eq(clientes.ativo, ativo === 'true'));
    }

    // Filtro de plano
    if (planoId) {
      condicoes.push(eq(clientes.planoId, planoId));
    }

    const where = condicoes.length > 0 ? and(...condicoes) : undefined;

    // Contagem total
    const [totalResult] = await db
      .select({ total: count() })
      .from(clientes)
      .where(where);

    const total = totalResult?.total ?? 0;

    // Determinar coluna e direcao de ordenacao
    const coluna = mapaOrdenacao[ordenarPor] ?? clientes.criadoEm;
    const direcao = ordem === 'asc' ? asc(coluna) : desc(coluna);

    // Buscar dados paginados
    const dados = await db
      .select(camposClienteBase)
      .from(clientes)
      .leftJoin(planos, eq(clientes.planoId, planos.id))
      .where(where)
      .orderBy(direcao)
      .limit(limite)
      .offset((pagina - 1) * limite);

    return {
      dados: dados.map(formatarClienteResumo) as ClienteResumo[],
      paginacao: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Obter por ID
  // ---------------------------------------------------------------------------
  async obterPorId(id: string): Promise<ClienteDetalhado> {
    const result = await db
      .select({
        ...camposClienteBase,
        atualizadoEm: clientes.atualizadoEm,
      })
      .from(clientes)
      .leftJoin(planos, eq(clientes.planoId, planos.id))
      .where(eq(clientes.id, id))
      .limit(1);

    if (result.length === 0) {
      throw new ErroNaoEncontrado('Cliente nao encontrado');
    }

    // Buscar licencas ativas
    const licencasAtivas = await db
      .select({
        id: licencas.id,
        ativa: licencas.ativa,
        expiraEm: licencas.expiraEm,
      })
      .from(licencas)
      .where(and(eq(licencas.clienteId, id), eq(licencas.ativa, true)));

    return formatarClienteDetalhado(result[0], licencasAtivas) as ClienteDetalhado;
  }

  // ---------------------------------------------------------------------------
  // Criar Cliente
  // ---------------------------------------------------------------------------
  async criar(dados: CriarClienteDTO): Promise<ClienteDetalhado> {
    // Verificar email unico
    await this.validarEmailUnico(dados.email);

    // Verificar se plano existe
    const planoResult = await db
      .select({ id: planos.id })
      .from(planos)
      .where(eq(planos.id, dados.planoId))
      .limit(1);

    if (planoResult.length === 0) {
      throw new ErroValidacao('Plano nao encontrado');
    }

    // Criar cliente
    const [novoCliente] = await db
      .insert(clientes)
      .values({
        nome: dados.nome,
        email: dados.email,
        telefone: dados.telefone,
        documento: dados.documento,
        planoId: dados.planoId,
      })
      .returning({
        id: clientes.id,
      });

    // Criar licenca inicial (30 dias trial)
    await db
      .insert(licencas)
      .values({
        clienteId: novoCliente.id,
        chave: gerarChaveAleatoria(32),
        ipServidor: '0.0.0.0', // Sera configurado depois
        expiraEm: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      });

    // Retornar cliente completo
    return this.obterPorId(novoCliente.id);
  }

  // ---------------------------------------------------------------------------
  // Atualizar Cliente
  // ---------------------------------------------------------------------------
  async atualizar(id: string, dados: AtualizarClienteDTO): Promise<ClienteDetalhado> {
    // Verificar se cliente existe
    const clienteExisteResult = await db
      .select({ id: clientes.id, email: clientes.email })
      .from(clientes)
      .where(eq(clientes.id, id))
      .limit(1);

    if (clienteExisteResult.length === 0) {
      throw new ErroNaoEncontrado('Cliente nao encontrado');
    }

    const clienteExistente = clienteExisteResult[0];

    // Verificar email unico (se alterado)
    if (dados.email && dados.email !== clienteExistente.email) {
      await this.validarEmailUnico(dados.email, id);
    }

    // Verificar plano (se alterado)
    if (dados.planoId) {
      const planoResult = await db
        .select({ id: planos.id })
        .from(planos)
        .where(eq(planos.id, dados.planoId))
        .limit(1);

      if (planoResult.length === 0) {
        throw new ErroValidacao('Plano nao encontrado');
      }
    }

    // Construir objeto de atualizacao removendo campos undefined
    const dadosAtualizacao: Record<string, unknown> = { ...dados };
    Object.keys(dadosAtualizacao).forEach((key) => {
      if (dadosAtualizacao[key] === undefined) {
        delete dadosAtualizacao[key];
      }
    });

    await db
      .update(clientes)
      .set(dadosAtualizacao)
      .where(eq(clientes.id, id));

    // Retornar cliente atualizado completo
    return this.obterPorId(id);
  }

  // ---------------------------------------------------------------------------
  // Excluir Cliente
  // ---------------------------------------------------------------------------
  async excluir(id: string): Promise<void> {
    const clienteResult = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(eq(clientes.id, id))
      .limit(1);

    if (clienteResult.length === 0) {
      throw new ErroNaoEncontrado('Cliente nao encontrado');
    }

    // Verificar se tem dados associados
    const [countUsuarios] = await db
      .select({ total: count() })
      .from(usuarios)
      .where(eq(usuarios.clienteId, id));

    const [countConversas] = await db
      .select({ total: count() })
      .from(conversas)
      .where(eq(conversas.clienteId, id));

    if ((countUsuarios?.total ?? 0) > 0 || (countConversas?.total ?? 0) > 0) {
      throw new ErroValidacao(
        'Cliente possui dados associados. Desative-o ao inves de excluir.'
      );
    }

    await db.delete(clientes).where(eq(clientes.id, id));
  }

  // ---------------------------------------------------------------------------
  // Metodos Privados
  // ---------------------------------------------------------------------------
  private async validarEmailUnico(email: string, excluirId?: string): Promise<void> {
    const condicoes = [eq(clientes.email, email)];

    if (excluirId) {
      condicoes.push(ne(clientes.id, excluirId));
    }

    const existente = await db
      .select({ id: clientes.id })
      .from(clientes)
      .where(and(...condicoes))
      .limit(1);

    if (existente.length > 0) {
      throw new ErroValidacao('Ja existe um cliente com este email');
    }
  }
}

export const clientesServico = new ClientesServico();
