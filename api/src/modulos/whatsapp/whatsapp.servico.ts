import { eq } from 'drizzle-orm';
import { db } from '../../infraestrutura/banco/drizzle.servico.js';
import { conexoes } from '../../infraestrutura/banco/schema/index.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import { criarProvedor, obterProvedorCache, removerProvedorCache } from './provedores/index.js';
import type { IProvedorWhatsApp } from './provedores/provedor.interface.js';
import type {
  TipoProvedor,
  ConteudoMensagem,
  ResultadoEnvio,
  ConfiguracaoMeta,
  ConfiguracaoUaiZap,
} from './whatsapp.tipos.js';

// =============================================================================
// Obter Provedor para Conexao
// =============================================================================

export async function obterProvedorParaConexao(conexaoId: string): Promise<IProvedorWhatsApp> {
  // Verificar cache
  const cacheKey = `conexao:${conexaoId}`;
  const provedorCache = obterProvedorCache(cacheKey);

  if (provedorCache) {
    return provedorCache;
  }

  // Buscar conexao no banco
  const resultado = await db
    .select()
    .from(conexoes)
    .where(eq(conexoes.id, conexaoId))
    .limit(1);

  const conexao = resultado[0];

  if (!conexao) {
    throw new Error(`Conexao nao encontrada: ${conexaoId}`);
  }

  if (conexao.status !== 'CONECTADO') {
    throw new Error(`Conexao nao esta ativa: ${conexao.status}`);
  }

  const config = conexao.configuracoes as Record<string, unknown> | null;
  const tipo = conexao.provedor as TipoProvedor;

  if (!config) {
    throw new Error(`Configuracoes da conexao nao encontradas: ${conexaoId}`);
  }

  // Criar provedor baseado no tipo
  let provedorConfig: ConfiguracaoMeta | ConfiguracaoUaiZap;

  if (tipo === 'META_API') {
    provedorConfig = {
      accessToken: config.accessToken as string,
      phoneNumberId: config.phoneNumberId as string,
      businessAccountId: config.businessAccountId as string | undefined,
      webhookVerifyToken: config.webhookVerifyToken as string,
      appSecret: config.appSecret as string,
    };
  } else if (tipo === 'UAIZAP') {
    provedorConfig = {
      apiUrl: config.apiUrl as string,
      apiKey: config.apiKey as string,
      instanciaId: config.instanciaId as string,
    };
  } else {
    throw new Error(`Tipo de provedor nao suportado: ${tipo}`);
  }

  return criarProvedor(tipo, provedorConfig, cacheKey);
}

// =============================================================================
// Enviar Mensagem
// =============================================================================

export async function enviarMensagem(
  conexaoId: string,
  telefone: string,
  conteudo: ConteudoMensagem
): Promise<ResultadoEnvio> {
  const provedor = await obterProvedorParaConexao(conexaoId);

  logger.debug({ conexaoId, telefone, tipo: conteudo.tipo }, 'WhatsApp: Enviando mensagem');

  const resultado = await provedor.enviarMensagem(telefone, conteudo);

  if (resultado.sucesso) {
    logger.info(
      { conexaoId, telefone, mensagemId: resultado.mensagemId },
      'WhatsApp: Mensagem enviada com sucesso'
    );
  } else {
    logger.error(
      { conexaoId, telefone, erro: resultado.erro },
      'WhatsApp: Falha ao enviar mensagem'
    );
  }

  return resultado;
}

// =============================================================================
// Enviar Mensagem de Texto
// =============================================================================

export async function enviarTexto(
  conexaoId: string,
  telefone: string,
  texto: string
): Promise<ResultadoEnvio> {
  return enviarMensagem(conexaoId, telefone, {
    tipo: 'text',
    texto,
  });
}

// =============================================================================
// Enviar Template
// =============================================================================

export async function enviarTemplate(
  conexaoId: string,
  telefone: string,
  templateNome: string,
  idioma: string,
  parametros?: Record<string, string>
): Promise<ResultadoEnvio> {
  const provedor = await obterProvedorParaConexao(conexaoId);

  logger.debug({ conexaoId, telefone, templateNome }, 'WhatsApp: Enviando template');

  const resultado = await provedor.enviarTemplate(telefone, templateNome, idioma, parametros);

  if (resultado.sucesso) {
    logger.info(
      { conexaoId, telefone, templateNome, mensagemId: resultado.mensagemId },
      'WhatsApp: Template enviado com sucesso'
    );
  } else {
    logger.error(
      { conexaoId, telefone, templateNome, erro: resultado.erro },
      'WhatsApp: Falha ao enviar template'
    );
  }

  return resultado;
}

// =============================================================================
// Enviar Midia
// =============================================================================

export async function enviarMidia(
  conexaoId: string,
  telefone: string,
  tipo: 'image' | 'audio' | 'video' | 'document',
  url: string,
  caption?: string,
  filename?: string
): Promise<ResultadoEnvio> {
  return enviarMensagem(conexaoId, telefone, {
    tipo,
    url,
    caption,
    filename,
  });
}

// =============================================================================
// Marcar como Lida
// =============================================================================

export async function marcarComoLida(
  conexaoId: string,
  mensagemIdExterno: string
): Promise<void> {
  const provedor = await obterProvedorParaConexao(conexaoId);
  await provedor.marcarComoLida(mensagemIdExterno);
}

// =============================================================================
// Verificar Conexao
// =============================================================================

export async function verificarConexao(conexaoId: string): Promise<boolean> {
  try {
    const provedor = await obterProvedorParaConexao(conexaoId);
    const conectado = await provedor.verificarConexao();

    // Atualizar status no banco
    await db
      .update(conexoes)
      .set({
        status: conectado ? 'CONECTADO' : 'DESCONECTADO',
        ultimoStatus: new Date(),
      })
      .where(eq(conexoes.id, conexaoId));

    return conectado;
  } catch (erro) {
    logger.error({ erro, conexaoId }, 'WhatsApp: Erro ao verificar conexao');

    // Atualizar status como erro
    await db
      .update(conexoes)
      .set({
        status: 'ERRO',
        ultimoStatus: new Date(),
      })
      .where(eq(conexoes.id, conexaoId));

    return false;
  }
}

// =============================================================================
// Desconectar
// =============================================================================

export async function desconectar(conexaoId: string): Promise<void> {
  const cacheKey = `conexao:${conexaoId}`;
  await removerProvedorCache(cacheKey);

  await db
    .update(conexoes)
    .set({
      status: 'DESCONECTADO',
    })
    .where(eq(conexoes.id, conexaoId));

  logger.info({ conexaoId }, 'WhatsApp: Conexao desconectada');
}

// =============================================================================
// Listar Templates
// =============================================================================

export async function listarTemplates(conexaoId: string) {
  const provedor = await obterProvedorParaConexao(conexaoId);
  return provedor.listarTemplates();
}

// =============================================================================
// Upload de Midia
// =============================================================================

export async function uploadMidia(
  conexaoId: string,
  buffer: Buffer,
  mimeType: string,
  filename?: string
) {
  const provedor = await obterProvedorParaConexao(conexaoId);
  return provedor.uploadMidia(buffer, mimeType, filename);
}

// =============================================================================
// Baixar Midia
// =============================================================================

export async function baixarMidia(conexaoId: string, mediaId: string): Promise<Buffer> {
  const provedor = await obterProvedorParaConexao(conexaoId);
  return provedor.baixarMidia(mediaId);
}
