import axios, { type AxiosInstance } from 'axios';
import { logger } from '../../../compartilhado/utilitarios/logger.js';
import { env } from '../../../configuracao/ambiente.js';

// =============================================================================
// Serviço Admin UaiZap
// =============================================================================
// Este serviço gerencia instâncias do UaiZap usando as credenciais globais

export interface CriarInstanciaOpcoes {
  nome: string;
  webhookUrl?: string;
}

export interface InstanciaUaiZap {
  id: string;
  nome: string;
  status: 'conectado' | 'desconectado' | 'aguardando-qr';
  qrcode?: string;
  criadoEm: Date;
}

export class UaiZapAdminServico {
  private api: AxiosInstance;

  constructor() {
    if (!env.UAIZAP_API_URL || !env.UAIZAP_API_KEY) {
      throw new Error('Credenciais UaiZap não configuradas no .env');
    }

    this.api = axios.create({
      baseURL: env.UAIZAP_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': env.UAIZAP_API_KEY,
      },
    });

    logger.info(
      { url: env.UAIZAP_API_URL },
      'UaiZapAdmin: Serviço inicializado'
    );
  }

  // ===========================================================================
  // Criar Instância
  // ===========================================================================

  async criarInstancia(opcoes: CriarInstanciaOpcoes): Promise<InstanciaUaiZap> {
    try {
      logger.info({ nome: opcoes.nome }, 'UaiZapAdmin: Criando instância');

      const response = await this.api.post('/instancias', {
        nome: opcoes.nome,
        webhookUrl: opcoes.webhookUrl,
      });

      const instancia = response.data;

      logger.info(
        { instanciaId: instancia.id, nome: opcoes.nome },
        'UaiZapAdmin: Instância criada com sucesso'
      );

      return {
        id: instancia.id,
        nome: instancia.nome,
        status: instancia.status || 'desconectado',
        qrcode: instancia.qrcode,
        criadoEm: new Date(instancia.criadoEm || Date.now()),
      };
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, nome: opcoes.nome },
        'UaiZapAdmin: Erro ao criar instância'
      );
      throw new Error(`Falha ao criar instância UaiZap: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Listar Instâncias
  // ===========================================================================

  async listarInstancias(): Promise<InstanciaUaiZap[]> {
    try {
      const response = await this.api.get('/instancias');

      return response.data.instancias.map((inst: any) => ({
        id: inst.id,
        nome: inst.nome,
        status: inst.status || 'desconectado',
        criadoEm: new Date(inst.criadoEm),
      }));
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error({ erro: mensagem }, 'UaiZapAdmin: Erro ao listar instâncias');
      throw new Error(`Falha ao listar instâncias: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Obter Instância
  // ===========================================================================

  async obterInstancia(instanciaId: string): Promise<InstanciaUaiZap> {
    try {
      const response = await this.api.get(`/instancias/${instanciaId}`);

      const inst = response.data;

      return {
        id: inst.id,
        nome: inst.nome,
        status: inst.status || 'desconectado',
        qrcode: inst.qrcode,
        criadoEm: new Date(inst.criadoEm),
      };
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao obter instância'
      );
      throw new Error(`Falha ao obter instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Excluir Instância
  // ===========================================================================

  async excluirInstancia(instanciaId: string): Promise<void> {
    try {
      await this.api.delete(`/instancias/${instanciaId}`);

      logger.info(
        { instanciaId },
        'UaiZapAdmin: Instância excluída com sucesso'
      );
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao excluir instância'
      );
      throw new Error(`Falha ao excluir instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Conectar Instância
  // ===========================================================================

  async conectarInstancia(instanciaId: string): Promise<{ qrcode?: string }> {
    try {
      const response = await this.api.post(`/instancias/${instanciaId}/conectar`);

      return {
        qrcode: response.data.qrcode,
      };
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao conectar instância'
      );
      throw new Error(`Falha ao conectar instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Desconectar Instância
  // ===========================================================================

  async desconectarInstancia(instanciaId: string): Promise<void> {
    try {
      await this.api.post(`/instancias/${instanciaId}/desconectar`);

      logger.info(
        { instanciaId },
        'UaiZapAdmin: Instância desconectada com sucesso'
      );
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao desconectar instância'
      );
      throw new Error(`Falha ao desconectar instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Obter QR Code
  // ===========================================================================

  async obterQRCode(instanciaId: string): Promise<string | null> {
    try {
      const response = await this.api.get(`/instancias/${instanciaId}/qrcode`);

      return response.data.qrcode || null;
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao obter QR Code'
      );
      return null;
    }
  }

  // ===========================================================================
  // Verificar Status
  // ===========================================================================

  async verificarStatus(instanciaId: string): Promise<{
    status: string;
    conectado: boolean;
  }> {
    try {
      const response = await this.api.get(`/instancias/${instanciaId}/status`);

      return {
        status: response.data.status || 'desconectado',
        conectado: response.data.status === 'conectado',
      };
    } catch (erro) {
      const mensagem = this.extrairErro(erro);
      logger.error(
        { erro: mensagem, instanciaId },
        'UaiZapAdmin: Erro ao verificar status'
      );
      return {
        status: 'erro',
        conectado: false,
      };
    }
  }

  // ===========================================================================
  // Utilitários
  // ===========================================================================

  private extrairErro(erro: unknown): string {
    if (axios.isAxiosError(erro)) {
      const data = erro.response?.data;
      if (data?.mensagem) return data.mensagem;
      if (data?.erro) return data.erro;
      if (data?.message) return data.message;
      return erro.message;
    }
    if (erro instanceof Error) {
      return erro.message;
    }
    return 'Erro desconhecido';
  }
}

// Singleton
export const uaiZapAdmin = new UaiZapAdminServico();
