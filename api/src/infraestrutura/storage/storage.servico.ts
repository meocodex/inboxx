import { existsSync, mkdirSync, writeFileSync, unlinkSync, readFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import mime from 'mime-types';
import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';

// =============================================================================
// Tipos
// =============================================================================

export interface ArquivoUpload {
  buffer: Buffer;
  nomeOriginal: string;
  mimetype: string;
  tamanho: number;
}

export interface ResultadoUpload {
  url: string;
  chave: string;
  nomeOriginal: string;
  mimetype: string;
  tamanho: number;
}

export type TipoPasta = 'avatares' | 'midias' | 'documentos' | 'temp';

// =============================================================================
// Storage Local
// =============================================================================

class StorageLocal {
  private basePath: string;

  constructor() {
    this.basePath = env.STORAGE_LOCAL_PATH || './uploads';
    this.garantirPastas();
  }

  private garantirPastas(): void {
    const pastas: TipoPasta[] = ['avatares', 'midias', 'documentos', 'temp'];

    if (!existsSync(this.basePath)) {
      mkdirSync(this.basePath, { recursive: true });
    }

    pastas.forEach((pasta) => {
      const caminho = join(this.basePath, pasta);
      if (!existsSync(caminho)) {
        mkdirSync(caminho, { recursive: true });
      }
    });

    logger.info({ basePath: this.basePath }, 'Pastas de storage local criadas');
  }

  private gerarNomeArquivo(nomeOriginal: string): string {
    const extensao = extname(nomeOriginal);
    const uuid = randomUUID();
    return `${uuid}${extensao}`;
  }

  async upload(arquivo: ArquivoUpload, pasta: TipoPasta, clienteId: string): Promise<ResultadoUpload> {
    const nomeArquivo = this.gerarNomeArquivo(arquivo.nomeOriginal);
    const pastaCliente = join(this.basePath, pasta, clienteId);

    if (!existsSync(pastaCliente)) {
      mkdirSync(pastaCliente, { recursive: true });
    }

    const caminhoCompleto = join(pastaCliente, nomeArquivo);
    writeFileSync(caminhoCompleto, arquivo.buffer);

    const chave = `${pasta}/${clienteId}/${nomeArquivo}`;
    const url = `/uploads/${chave}`;

    logger.debug({ chave, tamanho: arquivo.tamanho }, 'Arquivo salvo localmente');

    return {
      url,
      chave,
      nomeOriginal: arquivo.nomeOriginal,
      mimetype: arquivo.mimetype,
      tamanho: arquivo.tamanho,
    };
  }

  async excluir(chave: string): Promise<void> {
    const caminhoCompleto = join(this.basePath, chave);

    if (existsSync(caminhoCompleto)) {
      unlinkSync(caminhoCompleto);
      logger.debug({ chave }, 'Arquivo local excluido');
    }
  }

  async obterUrl(chave: string): Promise<string> {
    return `/uploads/${chave}`;
  }

  async obterBuffer(chave: string): Promise<Buffer | null> {
    const caminhoCompleto = join(this.basePath, chave);

    if (existsSync(caminhoCompleto)) {
      return readFileSync(caminhoCompleto);
    }

    return null;
  }
}

// =============================================================================
// Storage S3/MinIO
// =============================================================================

class StorageS3 {
  private client: S3Client;
  private bucket: string;

  constructor() {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new Error('Configuracao S3 incompleta. Verifique S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY');
    }

    this.bucket = env.S3_BUCKET;

    this.client = new S3Client({
      region: env.S3_REGION || 'us-east-1',
      endpoint: env.S3_ENDPOINT,
      forcePathStyle: env.S3_FORCE_PATH_STYLE ?? true, // Necessario para MinIO
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
    });

    logger.info({ bucket: this.bucket, endpoint: env.S3_ENDPOINT }, 'Storage S3/MinIO configurado');
  }

  private gerarChave(nomeOriginal: string, pasta: TipoPasta, clienteId: string): string {
    const extensao = extname(nomeOriginal);
    const uuid = randomUUID();
    return `${pasta}/${clienteId}/${uuid}${extensao}`;
  }

  async upload(arquivo: ArquivoUpload, pasta: TipoPasta, clienteId: string): Promise<ResultadoUpload> {
    const chave = this.gerarChave(arquivo.nomeOriginal, pasta, clienteId);
    const contentType = arquivo.mimetype || mime.lookup(arquivo.nomeOriginal) || 'application/octet-stream';

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: chave,
        Body: arquivo.buffer,
        ContentType: contentType,
        Metadata: {
          'original-name': encodeURIComponent(arquivo.nomeOriginal),
          'cliente-id': clienteId,
        },
      })
    );

    const url = await this.obterUrl(chave);

    logger.debug({ chave, tamanho: arquivo.tamanho }, 'Arquivo salvo no S3');

    return {
      url,
      chave,
      nomeOriginal: arquivo.nomeOriginal,
      mimetype: contentType,
      tamanho: arquivo.tamanho,
    };
  }

  async excluir(chave: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: chave,
      })
    );

    logger.debug({ chave }, 'Arquivo excluido do S3');
  }

  async obterUrl(chave: string, expiracaoSegundos = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: chave,
    });

    return getSignedUrl(this.client, command, { expiresIn: expiracaoSegundos });
  }

  async obterBuffer(chave: string): Promise<Buffer | null> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: chave,
        })
      );

      if (response.Body) {
        const chunks: Uint8Array[] = [];
        for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
          chunks.push(chunk);
        }
        return Buffer.concat(chunks);
      }

      return null;
    } catch (erro) {
      logger.error({ erro, chave }, 'Erro ao obter arquivo do S3');
      return null;
    }
  }
}

// =============================================================================
// Interface Unificada
// =============================================================================

interface IStorage {
  upload(arquivo: ArquivoUpload, pasta: TipoPasta, clienteId: string): Promise<ResultadoUpload>;
  excluir(chave: string): Promise<void>;
  obterUrl(chave: string): Promise<string>;
  obterBuffer(chave: string): Promise<Buffer | null>;
}

// =============================================================================
// Factory & Singleton
// =============================================================================

let storageInstance: IStorage | null = null;

function criarStorage(): IStorage {
  const driver = env.STORAGE_DRIVER || 'local';

  if (driver === 's3') {
    return new StorageS3();
  }

  return new StorageLocal();
}

export function getStorage(): IStorage {
  if (!storageInstance) {
    storageInstance = criarStorage();
  }
  return storageInstance;
}

// =============================================================================
// Servico de Storage (API publica)
// =============================================================================

export const storageServico = {
  /**
   * Fazer upload de arquivo
   */
  async upload(arquivo: ArquivoUpload, pasta: TipoPasta, clienteId: string): Promise<ResultadoUpload> {
    const storage = getStorage();
    return storage.upload(arquivo, pasta, clienteId);
  },

  /**
   * Excluir arquivo
   */
  async excluir(chave: string): Promise<void> {
    const storage = getStorage();
    return storage.excluir(chave);
  },

  /**
   * Obter URL do arquivo (assinada para S3, direta para local)
   */
  async obterUrl(chave: string): Promise<string> {
    const storage = getStorage();
    return storage.obterUrl(chave);
  },

  /**
   * Obter conteudo do arquivo como Buffer
   */
  async obterBuffer(chave: string): Promise<Buffer | null> {
    const storage = getStorage();
    return storage.obterBuffer(chave);
  },

  /**
   * Verificar se o storage esta usando S3
   */
  usandoS3(): boolean {
    return env.STORAGE_DRIVER === 's3';
  },

  /**
   * Obter driver atual
   */
  getDriver(): string {
    return env.STORAGE_DRIVER || 'local';
  },
};
