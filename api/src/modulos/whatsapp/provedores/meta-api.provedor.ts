import axios, { type AxiosInstance } from 'axios';

import { logger } from '../../../compartilhado/utilitarios/logger.js';
import type { IProvedorWhatsApp, EnviarMensagemOpcoes } from './provedor.interface.js';
import type {
  ConteudoMensagem,
  ResultadoEnvio,
  MidiaWhatsApp,
  TemplateWhatsApp,
  ConfiguracaoMeta,
  MensagemTexto,
  MensagemMidia,
  MensagemLocalizacao,
  MensagemContato,
  MensagemTemplate,
} from '../whatsapp.tipos.js';

// =============================================================================
// Constantes
// =============================================================================

const META_API_URL = 'https://graph.facebook.com/v18.0';
const TIMEOUT_MS = 30000;

// =============================================================================
// Provedor Meta Cloud API
// =============================================================================

export class MetaApiProvedor implements IProvedorWhatsApp {
  readonly tipo = 'META_API' as const;

  private api: AxiosInstance;
  private config: ConfiguracaoMeta;

  constructor(config: ConfiguracaoMeta) {
    this.config = config;

    this.api = axios.create({
      baseURL: META_API_URL,
      timeout: TIMEOUT_MS,
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
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
      const payload = this.construirPayload(telefone, conteudo, opcoes);

      const response = await this.api.post(
        `/${this.config.phoneNumberId}/messages`,
        payload
      );

      const mensagemId = response.data.messages?.[0]?.id;

      logger.debug({ telefone, mensagemId }, 'Meta: Mensagem enviada');

      return {
        sucesso: true,
        mensagemId,
        provedor: 'META_API',
        timestamp: new Date(),
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, telefone }, 'Meta: Erro ao enviar mensagem');

      return {
        sucesso: false,
        erro: mensagemErro,
        provedor: 'META_API',
        timestamp: new Date(),
      };
    }
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
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: this.formatarTelefone(telefone),
    };

    if (opcoes?.replyTo) {
      base.context = { message_id: opcoes.replyTo };
    }

    switch (conteudo.tipo) {
      case 'text':
        return {
          ...base,
          type: 'text',
          text: {
            preview_url: opcoes?.previewUrl ?? false,
            body: (conteudo as MensagemTexto).texto,
          },
        };

      case 'image':
      case 'audio':
      case 'video':
      case 'document':
      case 'sticker': {
        const midia = conteudo as MensagemMidia;
        const mediaObj: Record<string, unknown> = {};

        if (midia.mediaId) {
          mediaObj.id = midia.mediaId;
        } else if (midia.url) {
          mediaObj.link = midia.url;
        }

        if (midia.caption) {
          mediaObj.caption = midia.caption;
        }

        if (midia.filename && conteudo.tipo === 'document') {
          mediaObj.filename = midia.filename;
        }

        return {
          ...base,
          type: conteudo.tipo,
          [conteudo.tipo]: mediaObj,
        };
      }

      case 'location': {
        const loc = conteudo as MensagemLocalizacao;
        return {
          ...base,
          type: 'location',
          location: {
            latitude: loc.latitude,
            longitude: loc.longitude,
            name: loc.nome,
            address: loc.endereco,
          },
        };
      }

      case 'contacts': {
        const contatos = conteudo as MensagemContato;
        return {
          ...base,
          type: 'contacts',
          contacts: contatos.contatos.map((c) => ({
            name: { formatted_name: c.nome },
            phones: c.telefones.map((t) => ({
              phone: t.numero,
              type: t.tipo || 'CELL',
            })),
          })),
        };
      }

      case 'template': {
        const template = conteudo as MensagemTemplate;
        return {
          ...base,
          type: 'template',
          template: {
            name: template.nome,
            language: { code: template.idioma },
            components: template.componentes?.map((c) => ({
              type: c.tipo,
              sub_type: c.subTipo,
              index: c.indice,
              parameters: c.parametros?.map((p) => {
                if (p.tipo === 'text') return { type: 'text', text: p.texto };
                if (p.tipo === 'currency') {
                  return {
                    type: 'currency',
                    currency: {
                      fallback_value: `${p.moeda?.codigo} ${p.moeda?.valor}`,
                      code: p.moeda?.codigo,
                      amount_1000: (p.moeda?.valor ?? 0) * 1000,
                    },
                  };
                }
                if (p.tipo === 'image' || p.tipo === 'video' || p.tipo === 'document') {
                  return { type: p.tipo, [p.tipo]: { link: p.url } };
                }
                return { type: p.tipo };
              }),
            })),
          },
        };
      }

      default:
        throw new Error(`Tipo de mensagem nao suportado: ${(conteudo as { tipo: string }).tipo}`);
    }
  }

  // ===========================================================================
  // Enviar Template
  // ===========================================================================

  async enviarTemplate(
    telefone: string,
    templateNome: string,
    idioma: string,
    parametros?: Record<string, string>
  ): Promise<ResultadoEnvio> {
    const componentes: MensagemTemplate['componentes'] = [];

    if (parametros && Object.keys(parametros).length > 0) {
      componentes.push({
        tipo: 'body',
        parametros: Object.values(parametros).map((valor) => ({
          tipo: 'text',
          texto: valor,
        })),
      });
    }

    return this.enviarMensagem(telefone, {
      tipo: 'template',
      nome: templateNome,
      idioma,
      componentes,
    });
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

      form.append('messaging_product', 'whatsapp');
      form.append('file', buffer, {
        filename: filename || 'file',
        contentType: mimeType,
      });

      const response = await this.api.post(
        `/${this.config.phoneNumberId}/media`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Authorization: `Bearer ${this.config.accessToken}`,
          },
        }
      );

      logger.debug({ mediaId: response.data.id }, 'Meta: Midia enviada');

      return {
        id: response.data.id,
        mimeType,
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'Meta: Erro ao fazer upload de midia');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Obter Midia
  // ===========================================================================

  async obterMidia(mediaId: string): Promise<MidiaWhatsApp> {
    try {
      const response = await this.api.get(`/${mediaId}`);

      return {
        id: mediaId,
        url: response.data.url,
        mimeType: response.data.mime_type,
        sha256: response.data.sha256,
        tamanho: response.data.file_size,
      };
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mediaId }, 'Meta: Erro ao obter midia');
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
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
        },
      });

      return Buffer.from(response.data);
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mediaId }, 'Meta: Erro ao baixar midia');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Listar Templates
  // ===========================================================================

  async listarTemplates(): Promise<TemplateWhatsApp[]> {
    try {
      if (!this.config.businessAccountId) {
        throw new Error('businessAccountId nao configurado');
      }

      const response = await this.api.get(
        `/${this.config.businessAccountId}/message_templates`
      );

      return response.data.data.map((t: Record<string, unknown>) => ({
        id: t.id,
        nome: t.name,
        idioma: t.language,
        categoria: t.category,
        status: t.status,
        componentes: (t.components as Array<Record<string, unknown>>)?.map((c) => ({
          tipo: c.type,
          formato: c.format,
          texto: c.text,
          exemplo: c.example,
          botoes: c.buttons,
        })) || [],
      }));
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro }, 'Meta: Erro ao listar templates');
      throw new Error(mensagemErro);
    }
  }

  // ===========================================================================
  // Marcar como Lida
  // ===========================================================================

  async marcarComoLida(mensagemId: string): Promise<void> {
    try {
      await this.api.post(`/${this.config.phoneNumberId}/messages`, {
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: mensagemId,
      });

      logger.debug({ mensagemId }, 'Meta: Mensagem marcada como lida');
    } catch (erro) {
      const mensagemErro = this.extrairErro(erro);
      logger.error({ erro: mensagemErro, mensagemId }, 'Meta: Erro ao marcar como lida');
    }
  }

  // ===========================================================================
  // Verificar Conexao
  // ===========================================================================

  async verificarConexao(): Promise<boolean> {
    try {
      const response = await this.api.get(`/${this.config.phoneNumberId}`);
      return !!response.data.id;
    } catch {
      return false;
    }
  }

  // ===========================================================================
  // Desconectar
  // ===========================================================================

  async desconectar(): Promise<void> {
    // Meta API nao requer desconexao
    logger.debug('Meta: Desconectado (no-op)');
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
      if (data?.error?.message) {
        return data.error.message;
      }
      if (data?.error?.error_data?.details) {
        return data.error.error_data.details;
      }
      return erro.message;
    }
    if (erro instanceof Error) {
      return erro.message;
    }
    return 'Erro desconhecido';
  }
}
