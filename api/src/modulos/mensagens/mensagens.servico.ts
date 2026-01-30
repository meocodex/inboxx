import { eq, and, count, desc, asc, notInArray } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import {
  conversas,
  contatos,
  conexoes,
  usuarios,
  mensagens,
} from '../../infraestrutura/banco/schema/index.js';
import { ErroNaoEncontrado, ErroValidacao } from '../../compartilhado/erros/index.js';
import type {
  EnviarMensagemDTO,
  ListarMensagensQuery,
  AtualizarStatusMensagemDTO,
  ReceberMensagemWebhookDTO,
} from './mensagens.schema.js';

// =============================================================================
// Servico de Mensagens
// =============================================================================

export const mensagensServico = {
  async listarPorConversa(clienteId: string, conversaId: string, query: ListarMensagensQuery) {
    const { pagina, limite, ordem } = query;
    const skip = (pagina - 1) * limite;

    // Verificar se conversa existe e pertence ao cliente
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const orderDirection = ordem === 'asc' ? asc(mensagens.enviadoEm) : desc(mensagens.enviadoEm);

    const [rows, totalResult] = await Promise.all([
      db
        .select({
          id: mensagens.id,
          direcao: mensagens.direcao,
          tipo: mensagens.tipo,
          conteudo: mensagens.conteudo,
          midiaUrl: mensagens.midiaUrl,
          midiaTipo: mensagens.midiaTipo,
          midiaNome: mensagens.midiaNome,
          idExterno: mensagens.idExterno,
          status: mensagens.status,
          enviadoEm: mensagens.enviadoEm,
          entregueEm: mensagens.entregueEm,
          lidoEm: mensagens.lidoEm,
          usuarioId: usuarios.id,
          usuarioNome: usuarios.nome,
          usuarioAvatarUrl: usuarios.avatarUrl,
        })
        .from(mensagens)
        .leftJoin(usuarios, eq(mensagens.enviadoPor, usuarios.id))
        .where(eq(mensagens.conversaId, conversaId))
        .orderBy(orderDirection)
        .limit(limite)
        .offset(skip),
      db.select({ total: count() }).from(mensagens).where(eq(mensagens.conversaId, conversaId)),
    ]);

    const total = totalResult[0]?.total ?? 0;

    const dados = rows.map((row) => ({
      id: row.id,
      direcao: row.direcao,
      tipo: row.tipo,
      conteudo: row.conteudo,
      midiaUrl: row.midiaUrl,
      midiaTipo: row.midiaTipo,
      midiaNome: row.midiaNome,
      idExterno: row.idExterno,
      status: row.status,
      enviadoEm: row.enviadoEm,
      entregueEm: row.entregueEm,
      lidoEm: row.lidoEm,
      usuario: row.usuarioId
        ? {
            id: row.usuarioId,
            nome: row.usuarioNome,
            avatarUrl: row.usuarioAvatarUrl,
          }
        : null,
    }));

    return {
      dados,
      meta: {
        total,
        pagina,
        limite,
        totalPaginas: Math.ceil(total / limite),
      },
    };
  },

  async enviar(clienteId: string, usuarioId: string, dados: EnviarMensagemDTO) {
    // Verificar se conversa existe
    const conversaRows = await db
      .select({
        id: conversas.id,
        status: conversas.status,
        usuarioId: conversas.usuarioId,
        conexaoStatus: conexoes.status,
      })
      .from(conversas)
      .leftJoin(conexoes, eq(conversas.conexaoId, conexoes.id))
      .where(and(eq(conversas.id, dados.conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaRows.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const conversa = conversaRows[0];

    // Verificar se conexao esta ativa
    if (conversa.conexaoStatus !== 'CONECTADO') {
      throw new ErroValidacao('Conexao nao esta ativa. Nao e possivel enviar mensagens.');
    }

    // Validar conteudo para mensagem de texto
    if (dados.tipo === 'TEXTO' && !dados.conteudo) {
      throw new ErroValidacao('Conteudo obrigatorio para mensagens de texto');
    }

    // Validar midia para outros tipos
    if (dados.tipo !== 'TEXTO' && !dados.midiaUrl) {
      throw new ErroValidacao('URL de midia obrigatoria para este tipo de mensagem');
    }

    // Criar mensagem
    const [mensagemCriada] = await db
      .insert(mensagens)
      .values({
        clienteId,
        conversaId: dados.conversaId,
        direcao: 'SAIDA',
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        midiaUrl: dados.midiaUrl,
        midiaTipo: dados.midiaTipo,
        midiaNome: dados.midiaNome,
        status: 'PENDENTE',
        enviadoPor: usuarioId,
      })
      .returning({
        id: mensagens.id,
        direcao: mensagens.direcao,
        tipo: mensagens.tipo,
        conteudo: mensagens.conteudo,
        midiaUrl: mensagens.midiaUrl,
        status: mensagens.status,
        enviadoEm: mensagens.enviadoEm,
      });

    // Fetch usuario info for the response
    const [usuarioInfo] = await db
      .select({ id: usuarios.id, nome: usuarios.nome })
      .from(usuarios)
      .where(eq(usuarios.id, usuarioId))
      .limit(1);

    // Atualizar ultima mensagem da conversa
    const updateConversaData: Record<string, unknown> = {
      ultimaMensagemEm: new Date(),
    };
    if (conversa.status === 'ABERTA') {
      updateConversaData.status = 'EM_ATENDIMENTO';
    }
    if (conversa.usuarioId === null) {
      updateConversaData.usuarioId = usuarioId;
    }

    await db
      .update(conversas)
      .set(updateConversaData)
      .where(eq(conversas.id, dados.conversaId));

    // Aqui seria feita a integracao com o provedor (Meta API, etc)
    // Por enquanto, simular envio bem-sucedido
    await db
      .update(mensagens)
      .set({
        status: 'ENVIADA',
        idExterno: `msg_${Date.now()}`,
      })
      .where(eq(mensagens.id, mensagemCriada.id));

    return {
      ...mensagemCriada,
      status: 'ENVIADA' as const,
      usuario: usuarioInfo
        ? { id: usuarioInfo.id, nome: usuarioInfo.nome }
        : null,
    };
  },

  async atualizarStatus(mensagemId: string, dados: AtualizarStatusMensagemDTO) {
    const mensagemResult = await db
      .select({
        id: mensagens.id,
        entregueEm: mensagens.entregueEm,
      })
      .from(mensagens)
      .where(eq(mensagens.id, mensagemId))
      .limit(1);

    if (mensagemResult.length === 0) {
      throw new ErroNaoEncontrado('Mensagem nao encontrada');
    }

    const mensagem = mensagemResult[0];

    const updateData: Record<string, unknown> = {
      status: dados.status,
    };

    if (dados.idExterno) {
      updateData.idExterno = dados.idExterno;
    }

    if (dados.status === 'ENTREGUE') {
      updateData.entregueEm = new Date();
    }

    if (dados.status === 'LIDA') {
      updateData.lidoEm = new Date();
      if (!mensagem.entregueEm) {
        updateData.entregueEm = new Date();
      }
    }

    const [updated] = await db
      .update(mensagens)
      .set(updateData)
      .where(eq(mensagens.id, mensagemId))
      .returning({
        id: mensagens.id,
        status: mensagens.status,
        entregueEm: mensagens.entregueEm,
        lidoEm: mensagens.lidoEm,
      });

    return updated;
  },

  async receberWebhook(clienteId: string, dados: ReceberMensagemWebhookDTO) {
    // Verificar conexao
    const conexaoResult = await db
      .select({ id: conexoes.id })
      .from(conexoes)
      .where(and(eq(conexoes.id, dados.conexaoId), eq(conexoes.clienteId, clienteId)))
      .limit(1);

    if (conexaoResult.length === 0) {
      throw new ErroNaoEncontrado('Conexao nao encontrada');
    }

    // Buscar ou criar contato
    const contatoResult = await db
      .select()
      .from(contatos)
      .where(and(eq(contatos.clienteId, clienteId), eq(contatos.telefone, dados.telefoneRemetente)))
      .limit(1);

    let contato: typeof contatoResult[0];

    if (contatoResult.length === 0) {
      const [novoContato] = await db
        .insert(contatos)
        .values({
          clienteId,
          telefone: dados.telefoneRemetente,
        })
        .returning();

      contato = novoContato;
    } else {
      contato = contatoResult[0];
    }

    // Buscar ou criar conversa
    const conversaResult = await db
      .select()
      .from(conversas)
      .where(
        and(
          eq(conversas.clienteId, clienteId),
          eq(conversas.contatoId, contato.id),
          eq(conversas.conexaoId, dados.conexaoId),
          notInArray(conversas.status, ['ARQUIVADA'])
        )
      )
      .limit(1);

    let conversa: typeof conversaResult[0];
    const novaConversa = conversaResult.length === 0;

    if (novaConversa) {
      const [novaConv] = await db
        .insert(conversas)
        .values({
          clienteId,
          contatoId: contato.id,
          conexaoId: dados.conexaoId,
          status: 'ABERTA',
        })
        .returning();

      conversa = novaConv;
    } else {
      conversa = conversaResult[0];
    }

    // Criar mensagem
    const [mensagem] = await db
      .insert(mensagens)
      .values({
        clienteId,
        conversaId: conversa.id,
        direcao: 'ENTRADA',
        tipo: dados.tipo,
        conteudo: dados.conteudo,
        midiaUrl: dados.midiaUrl,
        midiaTipo: dados.midiaTipo,
        midiaNome: dados.midiaNome,
        idExterno: dados.idExterno,
        status: 'ENTREGUE',
        enviadoEm: dados.timestamp ?? new Date(),
        entregueEm: new Date(),
      })
      .returning({ id: mensagens.id });

    // Atualizar conversa
    const updateConversaData: Record<string, unknown> = {
      ultimaMensagemEm: new Date(),
    };
    if (conversa.status === 'RESOLVIDA') {
      updateConversaData.status = 'ABERTA';
    }

    await db
      .update(conversas)
      .set(updateConversaData)
      .where(eq(conversas.id, conversa.id));

    return {
      mensagemId: mensagem.id,
      conversaId: conversa.id,
      contatoId: contato.id,
      novaConversa,
    };
  },

  async obterPorId(clienteId: string, conversaId: string, mensagemId: string) {
    const conversaResult = await db
      .select({ id: conversas.id })
      .from(conversas)
      .where(and(eq(conversas.id, conversaId), eq(conversas.clienteId, clienteId)))
      .limit(1);

    if (conversaResult.length === 0) {
      throw new ErroNaoEncontrado('Conversa nao encontrada');
    }

    const rows = await db
      .select({
        id: mensagens.id,
        direcao: mensagens.direcao,
        tipo: mensagens.tipo,
        conteudo: mensagens.conteudo,
        midiaUrl: mensagens.midiaUrl,
        midiaTipo: mensagens.midiaTipo,
        midiaNome: mensagens.midiaNome,
        idExterno: mensagens.idExterno,
        status: mensagens.status,
        enviadoEm: mensagens.enviadoEm,
        entregueEm: mensagens.entregueEm,
        lidoEm: mensagens.lidoEm,
        usuarioId: usuarios.id,
        usuarioNome: usuarios.nome,
        usuarioAvatarUrl: usuarios.avatarUrl,
      })
      .from(mensagens)
      .leftJoin(usuarios, eq(mensagens.enviadoPor, usuarios.id))
      .where(and(eq(mensagens.id, mensagemId), eq(mensagens.conversaId, conversaId)))
      .limit(1);

    if (rows.length === 0) {
      throw new ErroNaoEncontrado('Mensagem nao encontrada');
    }

    const row = rows[0];

    return {
      id: row.id,
      direcao: row.direcao,
      tipo: row.tipo,
      conteudo: row.conteudo,
      midiaUrl: row.midiaUrl,
      midiaTipo: row.midiaTipo,
      midiaNome: row.midiaNome,
      idExterno: row.idExterno,
      status: row.status,
      enviadoEm: row.enviadoEm,
      entregueEm: row.entregueEm,
      lidoEm: row.lidoEm,
      usuario: row.usuarioId
        ? {
            id: row.usuarioId,
            nome: row.usuarioNome,
            avatarUrl: row.usuarioAvatarUrl,
          }
        : null,
    };
  },
};
