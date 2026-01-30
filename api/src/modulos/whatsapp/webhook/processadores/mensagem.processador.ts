import { eq, and, notInArray, like } from 'drizzle-orm';

import { db } from '../../../../infraestrutura/banco/drizzle.servico.js';
import { contatos, conversas, mensagens } from '../../../../infraestrutura/banco/schema/index.js';
import { logger } from '../../../../compartilhado/utilitarios/logger.js';
import { emitirParaConversa, emitirParaCliente } from '../../../../websocket/socket.gateway.js';
import type {
  MetaMensagemRecebida,
  MetaWebhookValue,
  UaiZapMensagemRecebida,
} from '../../whatsapp.tipos.js';

// =============================================================================
// Processar Mensagem Meta
// =============================================================================

export async function processarMensagemMeta(
  value: MetaWebhookValue,
  clienteId: string,
  conexaoId: string
): Promise<void> {
  const { messages, contacts, metadata } = value;

  if (!messages || messages.length === 0) {
    return;
  }

  for (const mensagemMeta of messages) {
    try {
      await processarMensagemMetaIndividual(
        mensagemMeta,
        contacts?.[0],
        metadata.phone_number_id,
        clienteId,
        conexaoId
      );
    } catch (erro) {
      logger.error(
        { erro, mensagemId: mensagemMeta.id },
        'Webhook: Erro ao processar mensagem Meta'
      );
    }
  }
}

// =============================================================================
// Processar Mensagem Meta Individual
// =============================================================================

async function processarMensagemMetaIndividual(
  mensagemMeta: MetaMensagemRecebida,
  contato: { profile: { name: string }; wa_id: string } | undefined,
  _phoneNumberId: string,
  clienteId: string,
  conexaoId: string
): Promise<void> {
  const telefone = mensagemMeta.from;
  const nomeContato = contato?.profile?.name || telefone;

  // Buscar ou criar contato
  const [contatoExistente] = await db
    .select()
    .from(contatos)
    .where(
      and(
        eq(contatos.clienteId, clienteId),
        like(contatos.telefone, `%${telefone.slice(-11)}%`) // Ultimos 11 digitos
      )
    )
    .limit(1);

  let contatoDB = contatoExistente;

  if (!contatoDB) {
    const [novoCont] = await db
      .insert(contatos)
      .values({
        clienteId,
        nome: nomeContato,
        telefone,
      })
      .returning();

    contatoDB = novoCont;

    logger.info({ contatoId: contatoDB.id, telefone }, 'Webhook: Novo contato criado');
  }

  // Buscar ou criar conversa
  const [conversaExistente] = await db
    .select()
    .from(conversas)
    .where(
      and(
        eq(conversas.clienteId, clienteId),
        eq(conversas.contatoId, contatoDB.id),
        eq(conversas.conexaoId, conexaoId),
        notInArray(conversas.status, ['ARQUIVADA'])
      )
    )
    .limit(1);

  let conversa = conversaExistente;

  if (!conversa) {
    const [novaConv] = await db
      .insert(conversas)
      .values({
        clienteId,
        contatoId: contatoDB.id,
        conexaoId,
        status: 'ABERTA',
      })
      .returning();

    conversa = novaConv;

    logger.info({ conversaId: conversa.id }, 'Webhook: Nova conversa criada');

    // Notificar nova conversa
    emitirParaCliente(clienteId, 'nova_conversa', {
      conversa: {
        id: conversa.id,
        contato: {
          id: contatoDB.id,
          nome: contatoDB.nome,
          telefone: contatoDB.telefone,
        },
        status: conversa.status,
      },
    });
  }

  // Extrair conteudo da mensagem
  const { tipo, conteudo, midiaUrl } = extrairConteudoMeta(mensagemMeta);

  // Criar mensagem no banco (com proteção contra duplicatas)
  let mensagem;
  try {
    [mensagem] = await db
      .insert(mensagens)
      .values({
        clienteId,
        conversaId: conversa.id,
        tipo,
        conteudo,
        midiaUrl,
        direcao: 'ENTRADA',
        status: 'ENTREGUE',
        idExterno: mensagemMeta.id,
      })
      .returning();
  } catch (erro: any) {
    // Capturar erro de UNIQUE constraint (webhook duplicado)
    if (erro.code === '23505' && erro.constraint === 'unique_mensagem_id_externo') {
      logger.debug(
        { idExterno: mensagemMeta.id, clienteId },
        'Webhook duplicado ignorado (idempotência)'
      );
      return; // Ignorar silenciosamente
    }
    // Outros erros devem ser propagados
    throw erro;
  }

  // Atualizar conversa
  await db
    .update(conversas)
    .set({
      ultimaMensagemEm: new Date(),
    })
    .where(eq(conversas.id, conversa.id));

  // Emitir evento WebSocket
  emitirParaConversa(conversa.id, 'nova_mensagem', {
    mensagem: {
      id: mensagem.id,
      tipo: mensagem.tipo,
      conteudo: mensagem.conteudo,
      midiaUrl: mensagem.midiaUrl,
      direcao: mensagem.direcao,
      status: mensagem.status,
      enviadoEm: mensagem.enviadoEm,
    },
    conversaId: conversa.id,
    contato: {
      id: contatoDB.id,
      nome: contatoDB.nome,
    },
  });

  logger.info(
    { mensagemId: mensagem.id, conversaId: conversa.id, tipo },
    'Webhook: Mensagem processada'
  );
}

// =============================================================================
// Extrair Conteudo Meta
// =============================================================================

function extrairConteudoMeta(mensagem: MetaMensagemRecebida): {
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'LOCALIZACAO' | 'CONTATO' | 'STICKER';
  conteudo: string;
  midiaUrl?: string;
} {
  switch (mensagem.type) {
    case 'text':
      return {
        tipo: 'TEXTO',
        conteudo: mensagem.text?.body || '',
      };

    case 'image':
      return {
        tipo: 'IMAGEM',
        conteudo: mensagem.image?.caption || '[Imagem]',
        midiaUrl: `media:${mensagem.image?.id}`,
      };

    case 'audio':
      return {
        tipo: 'AUDIO',
        conteudo: '[Audio]',
        midiaUrl: `media:${mensagem.audio?.id}`,
      };

    case 'video':
      return {
        tipo: 'VIDEO',
        conteudo: mensagem.video?.caption || '[Video]',
        midiaUrl: `media:${mensagem.video?.id}`,
      };

    case 'document':
      return {
        tipo: 'DOCUMENTO',
        conteudo: mensagem.document?.filename || '[Documento]',
        midiaUrl: `media:${mensagem.document?.id}`,
      };

    case 'sticker':
      return {
        tipo: 'STICKER',
        conteudo: '[Sticker]',
        midiaUrl: `media:${mensagem.sticker?.id}`,
      };

    case 'location':
      return {
        tipo: 'LOCALIZACAO',
        conteudo: `${mensagem.location?.name || ''} ${mensagem.location?.address || ''}`.trim() ||
          `${mensagem.location?.latitude}, ${mensagem.location?.longitude}`,
      };

    case 'contacts':
      return {
        tipo: 'CONTATO',
        conteudo: mensagem.contacts?.map((c) => c.name.formatted_name).join(', ') || '[Contato]',
      };

    default:
      return {
        tipo: 'TEXTO',
        conteudo: `[Mensagem tipo: ${mensagem.type}]`,
      };
  }
}

// =============================================================================
// Processar Mensagem UaiZap
// =============================================================================

export async function processarMensagemUaiZap(
  mensagem: UaiZapMensagemRecebida,
  clienteId: string,
  conexaoId: string
): Promise<void> {
  const telefone = mensagem.de;
  const nomeContato = mensagem.nomeRemetente || telefone;

  // Ignorar mensagens de grupo por enquanto
  if (mensagem.isGrupo) {
    logger.debug({ grupoId: mensagem.grupoId }, 'Webhook: Mensagem de grupo ignorada');
    return;
  }

  // Buscar ou criar contato
  const [contatoExistente] = await db
    .select()
    .from(contatos)
    .where(
      and(
        eq(contatos.clienteId, clienteId),
        like(contatos.telefone, `%${telefone.slice(-11)}%`)
      )
    )
    .limit(1);

  let contatoDB = contatoExistente;

  if (!contatoDB) {
    const [novoCont] = await db
      .insert(contatos)
      .values({
        clienteId,
        nome: nomeContato,
        telefone,
        fotoUrl: mensagem.fotoRemetente,
      })
      .returning();

    contatoDB = novoCont;

    logger.info({ contatoId: contatoDB.id, telefone }, 'Webhook: Novo contato criado');
  }

  // Buscar ou criar conversa
  const [conversaExistente] = await db
    .select()
    .from(conversas)
    .where(
      and(
        eq(conversas.clienteId, clienteId),
        eq(conversas.contatoId, contatoDB.id),
        eq(conversas.conexaoId, conexaoId),
        notInArray(conversas.status, ['ARQUIVADA'])
      )
    )
    .limit(1);

  let conversa = conversaExistente;

  if (!conversa) {
    const [novaConv] = await db
      .insert(conversas)
      .values({
        clienteId,
        contatoId: contatoDB.id,
        conexaoId,
        status: 'ABERTA',
      })
      .returning();

    conversa = novaConv;

    logger.info({ conversaId: conversa.id }, 'Webhook: Nova conversa criada');

    emitirParaCliente(clienteId, 'nova_conversa', {
      conversa: {
        id: conversa.id,
        contato: {
          id: contatoDB.id,
          nome: contatoDB.nome,
          telefone: contatoDB.telefone,
        },
        status: conversa.status,
      },
    });
  }

  // Extrair conteudo
  const { tipo, conteudo, midiaUrl } = extrairConteudoUaiZap(mensagem);

  // Criar mensagem (com proteção contra duplicatas)
  let mensagemDB;
  try {
    [mensagemDB] = await db
      .insert(mensagens)
      .values({
        clienteId,
        conversaId: conversa.id,
        tipo,
        conteudo,
        midiaUrl,
        direcao: 'ENTRADA',
        status: 'ENTREGUE',
        idExterno: mensagem.id,
      })
      .returning();
  } catch (erro: any) {
    // Capturar erro de UNIQUE constraint (webhook duplicado)
    if (erro.code === '23505' && erro.constraint === 'unique_mensagem_id_externo') {
      logger.debug(
        { idExterno: mensagem.id, clienteId },
        'Webhook UaiZap duplicado ignorado (idempotência)'
      );
      return; // Ignorar silenciosamente
    }
    // Outros erros devem ser propagados
    throw erro;
  }

  // Atualizar conversa
  await db
    .update(conversas)
    .set({
      ultimaMensagemEm: new Date(),
    })
    .where(eq(conversas.id, conversa.id));

  // Emitir evento WebSocket
  emitirParaConversa(conversa.id, 'nova_mensagem', {
    mensagem: {
      id: mensagemDB.id,
      tipo: mensagemDB.tipo,
      conteudo: mensagemDB.conteudo,
      midiaUrl: mensagemDB.midiaUrl,
      direcao: mensagemDB.direcao,
      status: mensagemDB.status,
      enviadoEm: mensagemDB.enviadoEm,
    },
    conversaId: conversa.id,
    contato: {
      id: contatoDB.id,
      nome: contatoDB.nome,
    },
  });

  logger.info(
    { mensagemId: mensagemDB.id, conversaId: conversa.id, tipo },
    'Webhook: Mensagem UaiZap processada'
  );
}

// =============================================================================
// Extrair Conteudo UaiZap
// =============================================================================

function extrairConteudoUaiZap(mensagem: UaiZapMensagemRecebida): {
  tipo: 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'LOCALIZACAO' | 'CONTATO' | 'STICKER';
  conteudo: string;
  midiaUrl?: string;
} {
  const tipoMap: Record<string, 'TEXTO' | 'IMAGEM' | 'AUDIO' | 'VIDEO' | 'DOCUMENTO' | 'LOCALIZACAO' | 'CONTATO' | 'STICKER'> = {
    texto: 'TEXTO',
    imagem: 'IMAGEM',
    audio: 'AUDIO',
    video: 'VIDEO',
    documento: 'DOCUMENTO',
    localizacao: 'LOCALIZACAO',
    contato: 'CONTATO',
    sticker: 'STICKER',
  };

  const tipo = tipoMap[mensagem.tipo] || 'TEXTO';

  switch (mensagem.tipo) {
    case 'texto':
      return { tipo, conteudo: mensagem.conteudo };

    case 'imagem':
      return {
        tipo,
        conteudo: mensagem.caption || '[Imagem]',
        midiaUrl: mensagem.midiaUrl,
      };

    case 'audio':
      return {
        tipo,
        conteudo: '[Audio]',
        midiaUrl: mensagem.midiaUrl,
      };

    case 'video':
      return {
        tipo,
        conteudo: mensagem.caption || '[Video]',
        midiaUrl: mensagem.midiaUrl,
      };

    case 'documento':
      return {
        tipo,
        conteudo: mensagem.nomeArquivo || '[Documento]',
        midiaUrl: mensagem.midiaUrl,
      };

    case 'sticker':
      return {
        tipo,
        conteudo: '[Sticker]',
        midiaUrl: mensagem.midiaUrl,
      };

    case 'localizacao':
      return {
        tipo,
        conteudo: `${mensagem.latitude}, ${mensagem.longitude}`,
      };

    case 'contato':
      return {
        tipo,
        conteudo: mensagem.nomeContato || '[Contato]',
      };

    default:
      return { tipo: 'TEXTO', conteudo: mensagem.conteudo || '[Mensagem]' };
  }
}
