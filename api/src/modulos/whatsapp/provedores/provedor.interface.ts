import type {
  ConteudoMensagem,
  ResultadoEnvio,
  MidiaWhatsApp,
  TemplateWhatsApp,
  TipoProvedor,
} from '../whatsapp.tipos.js';

// =============================================================================
// Interface Base do Provedor
// =============================================================================

export interface IProvedorWhatsApp {
  /**
   * Tipo do provedor
   */
  readonly tipo: TipoProvedor;

  /**
   * Envia uma mensagem para um numero
   */
  enviarMensagem(
    telefone: string,
    conteudo: ConteudoMensagem,
    opcoes?: EnviarMensagemOpcoes
  ): Promise<ResultadoEnvio>;

  /**
   * Envia uma mensagem de template
   */
  enviarTemplate(
    telefone: string,
    templateNome: string,
    idioma: string,
    parametros?: Record<string, string>
  ): Promise<ResultadoEnvio>;

  /**
   * Faz upload de midia
   */
  uploadMidia(
    buffer: Buffer,
    mimeType: string,
    filename?: string
  ): Promise<MidiaWhatsApp>;

  /**
   * Obtem URL de download da midia
   */
  obterMidia(mediaId: string): Promise<MidiaWhatsApp>;

  /**
   * Baixa midia para buffer
   */
  baixarMidia(mediaId: string): Promise<Buffer>;

  /**
   * Lista templates disponiveis
   */
  listarTemplates(): Promise<TemplateWhatsApp[]>;

  /**
   * Marca mensagem como lida
   */
  marcarComoLida(mensagemId: string): Promise<void>;

  /**
   * Verifica se a conexao esta ativa
   */
  verificarConexao(): Promise<boolean>;

  /**
   * Desconecta o provedor
   */
  desconectar(): Promise<void>;
}

// =============================================================================
// Opcoes de Envio
// =============================================================================

export interface EnviarMensagemOpcoes {
  /**
   * ID da mensagem sendo respondida (citacao)
   */
  replyTo?: string;

  /**
   * Preview de link habilitado
   */
  previewUrl?: boolean;

  /**
   * Timeout em ms
   */
  timeout?: number;
}

// =============================================================================
// Eventos do Provedor
// =============================================================================

export type EventoProvedorTipo =
  | 'mensagem_recebida'
  | 'status_atualizado'
  | 'conexao_atualizada'
  | 'erro';

export interface EventoProvedor {
  tipo: EventoProvedorTipo;
  dados: unknown;
  timestamp: Date;
}
