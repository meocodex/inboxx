import { useState, useCallback } from 'react';
import { api } from '@/servicos/api';

// =============================================================================
// Tipos
// =============================================================================

export type TipoPastaUpload = 'avatares' | 'midias' | 'documentos' | 'temp';

export interface ResultadoUpload {
  url: string;
  chave: string;
  nomeOriginal: string;
  mimetype: string;
  tamanho: number;
}

export interface ErroUpload {
  arquivo: string;
  erro: string;
}

export interface ResultadoUploadMultiplo {
  enviados: ResultadoUpload[];
  erros?: ErroUpload[];
}

export interface InfoStorage {
  driver: 'local' | 's3';
  limites: {
    avatares: string;
    midias: string;
    documentos: string;
    temp: string;
  };
}

// =============================================================================
// Limites (espelha o backend)
// =============================================================================

export const LIMITES_UPLOAD = {
  avatares: 5 * 1024 * 1024, // 5MB
  midias: 50 * 1024 * 1024, // 50MB
  documentos: 25 * 1024 * 1024, // 25MB
  temp: 50 * 1024 * 1024, // 50MB
};

export const TIPOS_PERMITIDOS = {
  avatares: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  midias: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
  ],
  documentos: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  temp: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'audio/mpeg',
    'audio/ogg',
    'application/pdf',
    'text/plain',
  ],
};

// =============================================================================
// Utilitarios
// =============================================================================

export function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function validarArquivo(
  arquivo: File,
  pasta: TipoPastaUpload
): { valido: boolean; erro?: string } {
  // Validar tipo
  if (!TIPOS_PERMITIDOS[pasta].includes(arquivo.type)) {
    return {
      valido: false,
      erro: `Tipo de arquivo nao permitido: ${arquivo.type}`,
    };
  }

  // Validar tamanho
  if (arquivo.size > LIMITES_UPLOAD[pasta]) {
    return {
      valido: false,
      erro: `Arquivo excede o limite de ${formatarTamanho(LIMITES_UPLOAD[pasta])}`,
    };
  }

  return { valido: true };
}

// =============================================================================
// Hook Principal
// =============================================================================

export function useUpload() {
  const [carregando, setCarregando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [erro, setErro] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Upload Unico
  // ---------------------------------------------------------------------------
  const upload = useCallback(
    async (arquivo: File, pasta: TipoPastaUpload = 'temp'): Promise<ResultadoUpload | null> => {
      // Validar arquivo antes de enviar
      const validacao = validarArquivo(arquivo, pasta);
      if (!validacao.valido) {
        setErro(validacao.erro || 'Arquivo invalido');
        return null;
      }

      setCarregando(true);
      setProgresso(0);
      setErro(null);

      try {
        const formData = new FormData();
        formData.append('file', arquivo);

        const response = await api.post<{ sucesso: boolean; dados: ResultadoUpload }>(
          `/uploads?pasta=${pasta}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (event) => {
              if (event.total) {
                const percent = Math.round((event.loaded * 100) / event.total);
                setProgresso(percent);
              }
            },
          }
        );

        return response.data.dados;
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : 'Erro ao fazer upload';
        setErro(mensagem);
        return null;
      } finally {
        setCarregando(false);
        setProgresso(0);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Upload Multiplo
  // ---------------------------------------------------------------------------
  const uploadMultiplo = useCallback(
    async (
      arquivos: File[],
      pasta: TipoPastaUpload = 'temp'
    ): Promise<ResultadoUploadMultiplo | null> => {
      setCarregando(true);
      setProgresso(0);
      setErro(null);

      try {
        const formData = new FormData();

        // Validar e adicionar arquivos
        const errosValidacao: ErroUpload[] = [];
        arquivos.forEach((arquivo) => {
          const validacao = validarArquivo(arquivo, pasta);
          if (validacao.valido) {
            formData.append('files', arquivo);
          } else {
            errosValidacao.push({
              arquivo: arquivo.name,
              erro: validacao.erro || 'Arquivo invalido',
            });
          }
        });

        // Se todos os arquivos falharam na validacao
        if (errosValidacao.length === arquivos.length) {
          setErro('Todos os arquivos sao invalidos');
          return { enviados: [], erros: errosValidacao };
        }

        const response = await api.post<{ sucesso: boolean; dados: ResultadoUploadMultiplo }>(
          `/uploads/multiplo?pasta=${pasta}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (event) => {
              if (event.total) {
                const percent = Math.round((event.loaded * 100) / event.total);
                setProgresso(percent);
              }
            },
          }
        );

        // Combinar erros de validacao com erros do servidor
        const resultado = response.data.dados;
        if (errosValidacao.length > 0) {
          resultado.erros = [...(resultado.erros || []), ...errosValidacao];
        }

        return resultado;
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : 'Erro ao fazer upload';
        setErro(mensagem);
        return null;
      } finally {
        setCarregando(false);
        setProgresso(0);
      }
    },
    []
  );

  // ---------------------------------------------------------------------------
  // Excluir Arquivo
  // ---------------------------------------------------------------------------
  const excluir = useCallback(async (chave: string): Promise<boolean> => {
    try {
      await api.delete(`/uploads/${chave}`);
      return true;
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir arquivo';
      setErro(mensagem);
      return false;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Obter URL Assinada
  // ---------------------------------------------------------------------------
  const obterUrl = useCallback(async (chave: string): Promise<string | null> => {
    try {
      const response = await api.get<{ sucesso: boolean; dados: { url: string } }>(
        `/uploads/url/${chave}`
      );
      return response.data.dados.url;
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao obter URL';
      setErro(mensagem);
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Info do Storage
  // ---------------------------------------------------------------------------
  const obterInfo = useCallback(async (): Promise<InfoStorage | null> => {
    try {
      const response = await api.get<{ sucesso: boolean; dados: InfoStorage }>('/uploads/info');
      return response.data.dados;
    } catch {
      return null;
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Limpar Erro
  // ---------------------------------------------------------------------------
  const limparErro = useCallback(() => {
    setErro(null);
  }, []);

  return {
    upload,
    uploadMultiplo,
    excluir,
    obterUrl,
    obterInfo,
    carregando,
    progresso,
    erro,
    limparErro,
  };
}

// =============================================================================
// Hook para Upload de Avatar
// =============================================================================

export function useUploadAvatar() {
  const { upload, carregando, progresso, erro, limparErro } = useUpload();

  const uploadAvatar = useCallback(
    async (arquivo: File): Promise<ResultadoUpload | null> => {
      return upload(arquivo, 'avatares');
    },
    [upload]
  );

  return {
    uploadAvatar,
    carregando,
    progresso,
    erro,
    limparErro,
  };
}

// =============================================================================
// Hook para Upload de Midia (Conversa)
// =============================================================================

export function useUploadMidia() {
  const { upload, uploadMultiplo, carregando, progresso, erro, limparErro } = useUpload();

  const uploadMidia = useCallback(
    async (arquivo: File): Promise<ResultadoUpload | null> => {
      return upload(arquivo, 'midias');
    },
    [upload]
  );

  const uploadMidias = useCallback(
    async (arquivos: File[]): Promise<ResultadoUploadMultiplo | null> => {
      return uploadMultiplo(arquivos, 'midias');
    },
    [uploadMultiplo]
  );

  return {
    uploadMidia,
    uploadMidias,
    carregando,
    progresso,
    erro,
    limparErro,
  };
}
