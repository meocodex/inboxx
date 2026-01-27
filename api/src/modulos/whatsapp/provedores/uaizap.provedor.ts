import axios, { type AxiosInstance } from 'axios';

import { logger } from '../../../compartilhado/utilitarios/logger.js';
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

    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
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
    try {
      const endpoint = this.obterEndpoint(conteudo.tipo);
      const payload = this.construirPayload(telefone, conteudo, opcoes);

      const response = await this.api.post(
        `/instancias/${this.config.instanciaId}/${endpoint}`,
        payload
      );

      const mensagemId = response.data.id || response.data.mensagemId;

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
  }

  // ===========================================================================
  // Obter Endpoint
  // ===========================================================================

  private obterEndpoint(tipo: ConteudoMensagem['tipo']): string {
    const endpoints: Record<string, string> = {
      text: 'mensagem/texto',
      image: 'mensagem/imagem',
      audio: 'mensagem/audio',
      video: 'mensagem/video',
      document: 'mensagem/documento',
      location: 'mensagem/localizacao',
      contacts: 'mensagem/contato',
      sticker: 'mensagem/sticker',
    };

    return endpoints[tipo] || 'mensagem/texto';
  }

  // ===========================================================================
  // Construir Payload
  // ===========================================================================

  private construirPayload(
    telefone: string,
    conteudo: ConteudoMensagem,
    opcoes?: EnviarMensagemOpcoes
  ): Record<string, unknown> {
    const base: Record<string, unknown> = {
      numero: this.formatarTelefone(telefone),
    };

    if (opcoes?.replyTo) {
      base.citarMensagem = opcoes.replyTo;
    }

    switch (conteudo.tipo) {
      case 'text':
        return {
          ...base,
          texto: (conteudo as MensagemTexto).texto,
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
          mediaId: midia.mediaId,
          caption: midia.caption,
          nomeArquivo: midia.filename,
          mimeType: midia.mimeType,
        };
      }

      case 'location': {
        const loc = conteudo as MensagemLocalizacao;
        return {
          ...base,
          latitude: loc.latitude,
          longitude: loc.longitude,
          nome: loc.nome,
          endereco: loc.endereco,
        };
      }

      case 'contacts': {
        return {
          ...base,
          // UaiZap usa formato diferente para contatos
          conteudo,
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
      Object.entries(parametros).forEach(([chave, valor]) => {
        texto = texto.replace(`{{${chave}}}`, valor);
      });
    }

    return this.enviarMensagem(telefone, { tipo: 'text', texto });
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

      form.append('arquivo', buffer, {
        filename: filename || 'file',
        contentType: mimeType,
      });

      const response = await this.api.post(
        `/instancias/${this.config.instanciaId}/midia/upload`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            'x-api-key': this.config.apiKey,
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
      const response = await this.api.get(
        `/instancias/${this.config.instanciaId}/midia/${mediaId}`
      );

      return {
        id: mediaId,
        url: response.data.url,
        mimeType: response.data.mimeType,
        tamanho: response.data.tamanho,
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
      await this.api.post(
        `/instancias/${this.config.instanciaId}/mensagem/${mensagemId}/lida`
      );

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
      const response = await this.api.get(
        `/instancias/${this.config.instanciaId}/status`
      );

      return response.data.status === 'conectado';
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Desconectar
  // ===========================================================================

  async desconectar(): Promise<void> {
    try {
      await this.api.post(
        `/instancias/${this.config.instanciaId}/desconectar`
      );

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
   */
  async obterQRCode(): Promise<string | null> {
    try {
      const response = await this.api.get(
        `/instancias/${this.config.instanciaId}/qrcode`
      );

      return response.data.qrcode || null;
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao obter QR Code');
      return null;
    }
  }

  /**
   * Reiniciar conexao
   */
  async reiniciar(): Promise<void> {
    try {
      await this.api.post(
        `/instancias/${this.config.instanciaId}/reiniciar`
      );

      logger.debug('UaiZap: Reiniciado');
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'UaiZap: Erro ao reiniciar');
    }
  }

  // ===========================================================================
  // Utilitarios
  // ===========================================================================

  private formatarTelefone(telefone: string): string {
    // Remove caracteres nao numericos
    let limpo = telefone.replace(/\D/g, '');

    // Adiciona codigo do pais se nao tiver
    if (!limpo.startsWith('55') && limpo.length <= 11) {
      limpo = '55' + limpo;
    }

    return limpo;
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
      return erro.message;
    }
    if (erro instanceof Error) {
      return erro.message;
    }
    return 'Erro desconhecido';
  }
}
