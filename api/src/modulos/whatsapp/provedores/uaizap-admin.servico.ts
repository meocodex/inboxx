import axios, { type AxiosInstance } from 'axios';
import { logger } from '../../../compartilhado/utilitarios/logger.js';
import { env } from '../../../configuracao/ambiente.js';
import { extrairErroAxios } from '../../../compartilhado/utilitarios/axios.utilitarios.js';

// =============================================================================
// Serviço Admin UaiZap
// =============================================================================
// Este serviço gerencia instâncias do UaiZap usando as credenciais de admin
// API: zapwixo.uazapi.com
// Autenticação Admin: Header "admintoken"
// Autenticação Instância: Header "token"

export interface CriarInstanciaOpcoes {
  nome: string;
  webhookUrl?: string;
}

export interface InstanciaUaiZap {
  id: string;
  nome: string;
  token: string;
  status: 'disconnected' | 'connecting' | 'connected';
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
        'admintoken': env.UAIZAP_API_KEY, // Global key para operações administrativas
      },
    });

    logger.info(
      { url: env.UAIZAP_API_URL },
      'UaiZapAdmin: Serviço inicializado'
    );
  }

  // ===========================================================================
  // Criar Instância API auxiliar
  // ===========================================================================

  private criarInstanciaApi(token: string): AxiosInstance {
    return axios.create({
      baseURL: env.UAIZAP_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'token': token,
      },
    });
  }

  // ===========================================================================
  // Criar Instância
  // ===========================================================================

  async criarInstancia(opcoes: CriarInstanciaOpcoes): Promise<InstanciaUaiZap> {
    try {
      logger.info({ nome: opcoes.nome }, 'UaiZapAdmin: Criando instância');

      // 1. Criar instância - POST /instance/create (usa admintoken)
      const createResponse = await this.api.post('/instance/create', {
        name: opcoes.nome,
      });

      const dadosInstancia = createResponse.data;
      const token = dadosInstancia.token;

      logger.debug({
        endpoint: '/instance/create',
        statusCode: createResponse.status,
        data: dadosInstancia,
      }, 'UaiZapAdmin: Resposta do endpoint create');

      logger.info(
        { instanciaId: dadosInstancia.name || dadosInstancia.instance?.name, token },
        'UaiZapAdmin: Instância criada com sucesso'
      );

      // 2. Configurar webhook se fornecido
      if (opcoes.webhookUrl) {
        await this.configurarWebhook(token, opcoes.webhookUrl);
      }

      // 3. Iniciar conexão e obter QR Code - POST /instance/connect
      // O QR Code é retornado na resposta do connect, não em endpoint separado
      const instanciaApi = this.criarInstanciaApi(token);
      const connectResponse = await instanciaApi.post('/instance/connect');

      logger.debug({
        endpoint: '/instance/connect',
        statusCode: connectResponse.status,
        data: connectResponse.data,
      }, 'UaiZapAdmin: Resposta do endpoint connect (criarInstancia)');

      // QR Code vem no campo instance.qrcode da resposta do connect
      const qrcode = connectResponse.data?.instance?.qrcode || connectResponse.data?.qrcode;

      logger.info(
        { hasQRCode: !!qrcode },
        'UaiZapAdmin: QR Code obtido'
      );

      return {
        id: dadosInstancia.name || dadosInstancia.instance?.name || opcoes.nome,
        nome: opcoes.nome,
        token,
        status: 'connecting',
        qrcode,
        criadoEm: new Date(),
      };
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem, nome: opcoes.nome },
        'UaiZapAdmin: Erro ao criar instância'
      );

      // Log detalhado do erro para debug
      if (axios.isAxiosError(erro)) {
        logger.debug({
          statusCode: erro.response?.status,
          responseData: erro.response?.data,
        }, 'UaiZapAdmin: Detalhes do erro HTTP');
      }

      throw new Error(`Falha ao criar instância UaiZap: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Configurar Webhook
  // ===========================================================================

  async configurarWebhook(token: string, webhookUrl: string): Promise<void> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      // Endpoint correto: POST /webhook (não /instance/webhook)
      const response = await instanciaApi.post('/webhook', {
        enabled: true,
        url: webhookUrl,
        events: ['messages', 'connection', 'messages_update'],
      });

      // Verificar se foi habilitado corretamente
      const webhook = Array.isArray(response.data) ? response.data[0] : response.data;
      const habilitado = webhook?.enabled === true;

      logger.info(
        { webhookUrl, enabled: habilitado },
        'UaiZapAdmin: Webhook configurado'
      );
    } catch (erro) {
      logger.error(
        { erro: extrairErroAxios(erro) },
        'UaiZapAdmin: Erro ao configurar webhook (não fatal)'
      );
    }
  }

  // ===========================================================================
  // Listar Instâncias
  // ===========================================================================

  async listarInstancias(): Promise<InstanciaUaiZap[]> {
    try {
      // Verificar status do servidor - GET /status (não requer token específico)
      const statusResponse = await axios.get(`${env.UAIZAP_API_URL}/status`);

      logger.debug(
        { serverStatus: statusResponse.data },
        'UaiZapAdmin: Status do servidor'
      );

      // API UazAPI não tem endpoint /instance/list no modo single-instance
      // Retornar lista vazia se não houver instâncias
      return [];
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error({ erro: mensagem }, 'UaiZapAdmin: Erro ao verificar status do servidor');
      return [];
    }
  }

  // ===========================================================================
  // Excluir Instância
  // ===========================================================================

  async excluirInstancia(token: string, nomeInstancia?: string): Promise<void> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      logger.info(
        { nomeInstancia, hasToken: !!token },
        'UaiZapAdmin: Iniciando processo de exclusão de instância'
      );

      // 1. Fazer logout (desconectar do WhatsApp)
      try {
        await instanciaApi.get('/instance/logout');
        logger.info(
          { nomeInstancia },
          'UaiZapAdmin: Instância desconectada via logout'
        );
      } catch (logoutError) {
        logger.warn(
          { erro: extrairErroAxios(logoutError), nomeInstancia },
          'UaiZapAdmin: Falha no logout (instância pode já estar desconectada)'
        );
      }

      // 2. Deletar instância do servidor usando admintoken
      if (nomeInstancia) {
        try {
          await this.api.post('/instance/delete', {
            name: nomeInstancia,
          });
          logger.info(
            { nomeInstancia },
            'UaiZapAdmin: Instância deletada do servidor'
          );
        } catch (deleteError) {
          logger.warn(
            { erro: extrairErroAxios(deleteError), nomeInstancia },
            'UaiZapAdmin: Endpoint delete não disponível (instância apenas desconectada)'
          );
        }
      }

      logger.info(
        { nomeInstancia },
        'UaiZapAdmin: Processo de exclusão concluído'
      );
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem, nomeInstancia },
        'UaiZapAdmin: Erro ao excluir instância'
      );
      throw new Error(`Falha ao excluir instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Conectar Instância (Gerar QR Code)
  // ===========================================================================

  async conectarInstancia(token: string): Promise<{ qrcode?: string; status?: string }> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      // 1. Verificar status atual
      const statusResponse = await instanciaApi.get('/instance/status');
      const statusData = statusResponse.data?.instance || statusResponse.data;
      const status = statusData?.status || 'disconnected';

      logger.debug({
        endpoint: '/instance/status',
        statusCode: statusResponse.status,
        data: statusResponse.data,
      }, 'UaiZapAdmin: Resposta do endpoint status (conectarInstancia)');

      // Se já conectado, não precisa QR Code
      if (status === 'connected') {
        logger.info('UaiZapAdmin: Instância já conectada');
        return { status: 'connected' };
      }

      // Se já tem QR Code no status (connecting), retornar
      if (status === 'connecting' && statusData?.qrcode) {
        logger.info({ hasQRCode: true }, 'UaiZapAdmin: QR Code obtido do status');
        return { qrcode: statusData.qrcode, status: 'connecting' };
      }

      // 2. Iniciar conexão via POST /instance/connect
      // Este endpoint inicia a conexão e retorna o QR Code
      const connectResponse = await instanciaApi.post('/instance/connect');

      logger.debug({
        endpoint: '/instance/connect',
        statusCode: connectResponse.status,
        data: connectResponse.data,
      }, 'UaiZapAdmin: Resposta do endpoint connect (conectarInstancia)');

      // QR Code vem no campo instance.qrcode da resposta do connect
      const qrcode = connectResponse.data?.instance?.qrcode || connectResponse.data?.qrcode;

      logger.info(
        { hasQRCode: !!qrcode, status: 'connecting' },
        'UaiZapAdmin: Conexão iniciada'
      );

      return { qrcode, status: 'connecting' };
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem },
        'UaiZapAdmin: Erro ao conectar instância'
      );

      // Se erro 404 ou similar, a instância pode precisar ser criada/reiniciada
      if (axios.isAxiosError(erro) && erro.response?.status === 404) {
        logger.warn('UaiZapAdmin: Endpoint retornou 404 - instância pode não existir');
      }

      throw new Error(`Falha ao conectar instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Desconectar Instância
  // ===========================================================================

  async desconectarInstancia(token: string): Promise<void> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      await instanciaApi.get('/instance/logout');

      logger.info('UaiZapAdmin: Instância desconectada com sucesso');
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem },
        'UaiZapAdmin: Erro ao desconectar instância'
      );
      throw new Error(`Falha ao desconectar instância: ${mensagem}`);
    }
  }

  // ===========================================================================
  // Obter QR Code
  // ===========================================================================

  async obterQRCode(token: string): Promise<string | null> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      // 1. Verificar status primeiro - o QR Code pode estar no status
      const statusResponse = await instanciaApi.get('/instance/status');
      const statusData = statusResponse.data?.instance || statusResponse.data;
      const status = statusData?.status;

      logger.debug({
        endpoint: '/instance/status',
        statusCode: statusResponse.status,
        data: statusResponse.data,
      }, 'UaiZapAdmin: Resposta do endpoint status');

      // Se já conectado, não precisa de QR
      if (status === 'connected') {
        logger.info('UaiZapAdmin: Instância já conectada, QR Code não necessário');
        return null;
      }

      // Se já tem QR Code no status (connecting), retornar
      if (statusData?.qrcode) {
        logger.info({ hasQRCode: true }, 'UaiZapAdmin: QR Code obtido do status');
        return statusData.qrcode;
      }

      // 2. Se não tem QR Code, iniciar conexão via POST /instance/connect
      const connectResponse = await instanciaApi.post('/instance/connect');

      logger.debug({
        endpoint: '/instance/connect',
        statusCode: connectResponse.status,
        data: connectResponse.data,
      }, 'UaiZapAdmin: Resposta do endpoint connect (obterQRCode)');

      // QR Code vem no campo instance.qrcode da resposta do connect
      const qrcode = connectResponse.data?.instance?.qrcode || connectResponse.data?.qrcode;

      if (qrcode) {
        logger.info({ hasQRCode: true }, 'UaiZapAdmin: QR Code obtido com sucesso via connect');
        return qrcode;
      }

      logger.warn({ response: connectResponse.data }, 'UaiZapAdmin: Resposta sem QR Code');
      return null;
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem },
        'UaiZapAdmin: Erro ao obter QR Code'
      );

      // Se erro 404 ou similar, a instância pode precisar ser criada/reiniciada
      if (axios.isAxiosError(erro) && erro.response?.status === 404) {
        logger.warn('UaiZapAdmin: Endpoint retornou 404 - instância pode não existir');
      }

      return null;
    }
  }

  // ===========================================================================
  // Verificar Status
  // ===========================================================================

  async verificarStatus(token: string): Promise<{
    status: string;
    conectado: boolean;
    qrcode?: string;
  }> {
    try {
      const instanciaApi = this.criarInstanciaApi(token);

      // GET /instance/status
      const response = await instanciaApi.get('/instance/status');

      const instance = response.data?.instance || response.data;
      const status = instance?.status || 'disconnected';
      // Estados UazAPI: 'disconnected', 'connecting', 'connected'
      // Apenas 'connected' indica conexão ativa
      const conectado = status === 'connected';

      return {
        status,
        conectado,
        qrcode: instance?.qrcode,
      };
    } catch (erro) {
      const mensagem = extrairErroAxios(erro);
      logger.error(
        { erro: mensagem },
        'UaiZapAdmin: Erro ao verificar status'
      );
      return {
        status: 'erro',
        conectado: false,
      };
    }
  }

}

// Singleton
export const uaiZapAdmin = new UaiZapAdminServico();
