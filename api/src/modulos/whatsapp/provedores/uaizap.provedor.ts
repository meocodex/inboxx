import axios, { type AxiosInstance } from 'axios';

import { logger } from '../../../compartilhado/utilitarios/logger.js';
import { agendarEnvioWhatsApp } from '../../../infraestrutura/rate-limiting/whatsapp-limiter.js';
import type { IProvedorWhatsApp, EnviarMensagemOpcoes } from './provedor.interface.js';
import type {
  ConteudoMensagem,
  ResultadoEnvio,
  MidiaWhatsApp,
  TemplateWhatsApp,
  ConfiguracaoUaiZap,
  MensagemTexto,
  MensagemMidia,
  MensagemLocalizacao,
} from '../whatsapp.tipos.js';

// =============================================================================
// Constantes
// =============================================================================

const TIMEOUT_MS = 30000;

// =============================================================================
// Provedor UaiZap
// =============================================================================

export class UaiZapProvedor implements IProvedorWhatsApp {
  readonly tipo = 'UAIZAP' as const;

  private api: AxiosInstance;
  private config: ConfiguracaoUaiZap;

  constructor(config: ConfiguracaoUaiZap) {
    this.config = config;

    // API UazAPI usa header "token" para autenticação por instância
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'token': config.apiKey, // Token da instância específica
      },
    });
  }

  // ===========================================================================
  // Enviar Mensagem
  // ===========================================================================

  async enviarMensagem(
    telefone: string,
    conteudo: ConteudoMensagem,
    opcoes?: EnviarMensagemOpcoes
  ): Promise<ResultadoEnvio> {
    // CRÍTICO: Rate limiting WhatsApp (80 msg/s)
    return agendarEnvioWhatsApp(async () => {
      try {
        const endpoint = this.obterEndpoint(conteudo.tipo);
        const payload = this.construirPayload(telefone, conteudo, opcoes);

        const response = await this.api.post(endpoint, payload);

        const mensagemId = response.data.id || response.data.mensagemId || response.data.key?.id;

        logger.debug({ telefone, mensagemId }, 'UaiZap: Mensagem enviada');

        return {
          sucesso: true,
          mensagemId,
          provedor: 'UAIZAP',
          timestamp: new Date(),
        };
      } catch (erro) {
        const mensagemErro = this.extrairErro(erro);
        logger.error({ erro: mensagemErro, telefone }, 'UaiZap: Erro ao enviar mensagem');

        return {
          sucesso: false,
          erro: mensagemErro,
          provedor: 'UAIZAP',
          timestamp: new Date(),
        };
      }
    }, `msg:${telefone}:${Date.now()}`);
  }

  // ===========================================================================
  // Obter Endpoint
  // ===========================================================================

  private obterEndpoint(tipo: ConteudoMensagem['tipo']): string {
    // Endpoints corretos da API UazAPI
    const endpoints: Record<string, string> = {
      text: '/message/text',
      image: '/message/image',
      audio: '/message/audio',
      video: '/message/video',
      document: '/message/document',
      location: '/message/location',
      contacts: '/message/contact',
      sticker: '/message/sticker',
    };

    return endpoints[tipo] || '/message/text';
  }

  // ===========================================================================
  // Construir Payload
  // ===========================================================================

  private construirPayload(
    telefone: string,
    conteudo: ConteudoMensagem,
    opcoes?: EnviarMensagemOpcoes
  ): Record<string, unknown> {
    // API UazAPI usa "jid" no formato "5511999999999@s.whatsapp.net"
    const jid = this.formatarJid(telefone);

    const base: Record<string, unknown> = {
      jid,
    };

    if (opcoes?.replyTo) {
      base.quoted = {
        key: {
          id: opcoes.replyTo,
          remoteJid: jid,
        },
      };
    }

    switch (conteudo.tipo) {
      case 'text':
        return {
          ...base,
          text: (conteudo as MensagemTexto).texto,
        };

      case 'image':
      case 'audio':
      case 'video':
      case 'document':
      case 'sticker': {
        const midia = conteudo as MensagemMidia;
        return {
          ...base,
          url: midia.url,
          caption: midia.caption,
          filename: midia.filename,
          mimetype: midia.mimeType,
        };
      }

      case 'location': {
        const loc = conteudo as MensagemLocalizacao;
        return {
          ...base,
          latitude: loc.latitude,
          longitude: loc.longitude,
          name: loc.nome,
          address: loc.endereco,
        };
      }

      case 'contacts': {
        return {
          ...base,
          contact: conteudo,
        };
      }

      default:
        return base;
    }
  }

  // ===========================================================================
  // Enviar Template
  // ===========================================================================

  async enviarTemplate(
    telefone: string,
    templateNome: string,
    _idioma: string,
    parametros?: Record<string, string>
  ): Promise<ResultadoEnvio> {
    // UaiZap nao usa templates oficiais, envia como texto formatado
    let texto = templateNome;

    if (parametros) {
      // Limitar número de substituições (prevenir loop)
      let substituicoes = 0;
      const MAX_SUBSTITUICOES = 20;

      Object.entries(parametros).forEach(([chave, valor]) => {
        if (substituicoes >= MAX_SUBSTITUICOES) {
          logger.warn('Limite de substituições de template atingido');
          return;
        }

        // Sanitizar antes de substituir (prevenir template injection)
        const valorSanitizado = this.sanitizarParametroTemplate(valor);
        const placeholder = `{{${chave}}}`;

        // Substituir apenas primeira ocorrência (prevenir recursão)
        texto = texto.replace(placeholder, valorSanitizado);
        substituicoes++;
      });
    }

    return this.enviarMensagem(telefone, { tipo: 'text', texto });
  }

  // ===========================================================================
  // Sanitização de Parâmetros
  // ===========================================================================

  private sanitizarParametroTemplate(valor: string): string {
    return valor
      .replace(/\{\{/g, '&#123;&#123;') // Escape {{ para HTML entity
      .replace(/\}\}/g, '&#125;&#125;') // Escape }}
      .replace(/[<>]/g, '') // Remover tags HTML
      .substring(0, 1000); // Limitar tamanho (prevenir DoS)
  }

  // ===========================================================================
  // Upload de Midia
  // ===========================================================================

  async uploadMidia(
    buffer: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<MidiaWhatsApp> {
    try {
      const FormData = (await import('form-data')).default;
      const form = new FormData();

      form.append('file', buffer, {
        filename: filename || 'file',
        contentType: mimeType,
      });

      const response = await this.api.post(
        '/media/upload',
        form,
        {
          headers: {
            ...form.getHeaders(),
            'token': this.config.apiKey,
          },
        }
      );

      logger.debug({ mediaId: response.data.id }, 'UaiZap: Midia enviada');

      return {
        id: response.data.id,
        url: response.data.url,
        mimeType,
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao fazer upload de midia');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Obter Midia
  // ===========================================================================

  async obterMidia(mediaId: string): Promise<MidiaWhatsApp> {
    try {
      const response = await this.api.post('/media/download', {
        messageId: mediaId,
      });

      return {
        id: mediaId,
        url: response.data.url,
        mimeType: response.data.mimeType,
        tamanho: response.data.size,
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mediaId }, 'UaiZap: Erro ao obter midia');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Baixar Midia
  // ===========================================================================

  async baixarMidia(mediaId: string): Promise<Buffer> {
    try {
      const midia = await this.obterMidia(mediaId);

      if (!midia.url) {
        throw new Error('URL da midia nao disponivel');
      }

      const response = await axios.get(midia.url, {
        responseType: 'arraybuffer',
      });

      return Buffer.from(response.data);
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mediaId }, 'UaiZap: Erro ao baixar midia');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Listar Templates
  // ===========================================================================

  async listarTemplates(): Promise<TemplateWhatsApp[]> {
    // UaiZap nao suporta templates oficiais
    logger.debug('UaiZap: Templates nao suportados');
    return [];
  }

  // ===========================================================================
  // Marcar como Lida
  // ===========================================================================

  async marcarComoLida(mensagemId: string): Promise<void> {
    try {
      // API UazAPI usa /chats/markasread
      await this.api.post('/chats/markasread', {
        jid: mensagemId, // JID do chat, não da mensagem
      });

      logger.debug({ mensagemId }, 'UaiZap: Mensagem marcada como lida');
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mensagemId }, 'UaiZap: Erro ao marcar como lida');
    }
  }

  // ===========================================================================
  // Verificar Conexao
  // ===========================================================================

  async verificarConexao(): Promise<boolean> {
    try {
      // Endpoint correto: GET /instance/status
      const response = await this.api.get('/instance/status');

      // Estados UazAPI: 'disconnected', 'connecting', 'connected'
      // O status vem em response.data.instance.status ou response.data.status
      const instanceData = response.data?.instance || response.data;
      return instanceData?.status === 'connected';
    } catch {
      return false;
    }
  }

  /**
   * Verificar status detalhado da conexão
   */
  async verificarStatus(): Promise<{ conectado: boolean; status: string; mensagem?: string }> {
    try {
      // Endpoint correto: GET /instance/status
      const response = await this.api.get('/instance/status');

      logger.debug({
        endpoint: '/instance/status',
        data: response.data,
      }, 'UaiZap: Resposta do verificarStatus');

      // Estados UazAPI: 'disconnected', 'connecting', 'connected'
      // O status vem em response.data.instance.status ou response.data.status
      const instanceData = response.data?.instance || response.data;
      const status = instanceData?.status || 'disconnected';
      const conectado = status === 'connected';

      return {
        conectado,
        status,
        mensagem: conectado ? 'WhatsApp conectado' : `Status: ${status}`,
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao verificar status');

      return {
        conectado: false,
        status: 'erro',
        mensagem: mensagemErro,
      };
    }
  }

  // ===========================================================================
  // Desconectar
  // ===========================================================================

  async desconectar(): Promise<void> {
    try {
      // Endpoint correto: GET /instance/logout
      await this.api.get('/instance/logout');

      logger.debug('UaiZap: Desconectado');
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao desconectar');
    }
  }

  // ===========================================================================
  // Metodos Adicionais UaiZap
  // ===========================================================================

  /**
   * Obter QR Code para conexao
   * Usa POST /instance/connect para iniciar conexão e obter QR Code
   */
  async obterQRCode(): Promise<string | null> {
    try {
      // 1. Verificar status primeiro - o QR Code pode estar no status
      const statusResponse = await this.api.get('/instance/status');
      const statusData = statusResponse.data?.instance || statusResponse.data;
      const status = statusData?.status;

      logger.debug({
        endpoint: '/instance/status',
        statusCode: statusResponse.status,
        data: statusResponse.data,
      }, 'UaiZap: Resposta do endpoint status');

      // Se já conectado, não precisa de QR
      if (status === 'connected') {
        logger.info('UaiZap: Instância já conectada, QR Code não necessário');
        return null;
      }

      // Se já tem QR Code no status (connecting), retornar
      if (statusData?.qrcode) {
        logger.info({ hasQRCode: true }, 'UaiZap: QR Code obtido do status');
        return statusData.qrcode;
      }

      // 2. Se não tem QR Code, iniciar conexão via POST /instance/connect
      const connectResponse = await this.api.post('/instance/connect');

      logger.debug({
        endpoint: '/instance/connect',
        statusCode: connectResponse.status,
        data: connectResponse.data,
      }, 'UaiZap: Resposta do endpoint connect');

      // QR Code vem no campo instance.qrcode da resposta do connect
      const qrcode = connectResponse.data?.instance?.qrcode || connectResponse.data?.qrcode;

      if (qrcode) {
        logger.info({ hasQRCode: true }, 'UaiZap: QR Code obtido com sucesso via connect');
        return qrcode;
      }

      logger.warn({ response: connectResponse.data }, 'UaiZap: Resposta sem QR Code');
      return null;
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao obter QR Code');

      // Se erro 404 ou similar, a instância pode precisar ser criada/reiniciada
      if (axios.isAxiosError(erro) && erro.response?.status === 404) {
        logger.warn('UaiZap: Endpoint retornou 404 - instância pode não existir');
      }

      return null;
    }
  }

  /**
   * Reiniciar conexao (gerar novo QR Code)
   */
  async reiniciar(): Promise<{ qrcode?: string; status?: string }> {
    try {
      // Desconectar primeiro
      await this.desconectar();
      // Aguardar um momento antes de reconectar
      await new Promise(resolve => setTimeout(resolve, 1000));

      // POST /instance/connect - inicia conexão e retorna QR Code
      const response = await this.api.post('/instance/connect');

      logger.debug({
        endpoint: '/instance/connect',
        statusCode: response.status,
        data: response.data,
      }, 'UaiZap: Resposta do endpoint connect (reiniciar)');

      // QR Code vem no campo instance.qrcode da resposta do connect
      const qrcode = response.data?.instance?.qrcode || response.data?.qrcode;

      logger.info({ hasQRCode: !!qrcode }, 'UaiZap: Reiniciado');
      return { qrcode, status: 'connecting' };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao reiniciar');

      // Se erro 404 ou similar, a instância pode precisar ser criada/reiniciada
      if (axios.isAxiosError(erro) && erro.response?.status === 404) {
        logger.warn('UaiZap: Endpoint retornou 404 - instância pode não existir');
      }

      return { status: 'erro' };
    }
  }

  // ===========================================================================
  // Utilitarios
  // ===========================================================================

  /**
   * Formatar telefone para JID do WhatsApp
   */
  private formatarJid(telefone: string): string {
    // Remove caracteres nao numericos
    let limpo = telefone.replace(/\D/g, '');

    // Adiciona codigo do pais se nao tiver
    if (!limpo.startsWith('55') && limpo.length <= 11) {
      limpo = '55' + limpo;
    }

    // Formato JID do WhatsApp
    return `${limpo}@s.whatsapp.net`;
  }

  private extrairErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const data = erro.response?.data;
      if (data?.mensagem) {
        return data.mensagem;
      }
      if (data?.erro) {
        return data.erro;
      }
      if (data?.message) {
        return data.message;
      }
      if (data?.error) {
        return data.error;
      }
      return erro.message;
    }
    if (erro instanceof Error) {
      return erro.message;
    }
    return 'Erro desconhecido';
  }
}
