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
  // Upload Multiplo (sequencial - envia um a um)
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
        const enviados: ResultadoUpload[] = [];
        const erros: ErroUpload[] = [];

        for (let i = 0; i < arquivos.length; i++) {
          const arquivo = arquivos[i];
          const validacao = validarArquivo(arquivo, pasta);

          if (!validacao.valido) {
            erros.push({ arquivo: arquivo.name, erro: validacao.erro || 'Arquivo invalido' });
            continue;
          }

          try {
            const formData = new FormData();
            formData.append('file', arquivo);

            const response = await api.post<{ sucesso: boolean; dados: ResultadoUpload }>(
              `/uploads?pasta=${pasta}`,
              formData,
              {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (event) => {
                  if (event.total) {
                    const fileProgress = Math.round((event.loaded * 100) / event.total);
                    const totalProgress = Math.round(((i + fileProgress / 100) / arquivos.length) * 100);
                    setProgresso(totalProgress);
                  }
                },
              }
            );

            enviados.push(response.data.dados);
          } catch {
            erros.push({ arquivo: arquivo.name, erro: 'Falha no upload' });
          }
        }

        if (enviados.length === 0 && erros.length > 0) {
          setErro('Todos os arquivos falharam');
        }

        return { enviados, erros: erros.length > 0 ? erros : undefined };
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
      await api.delete('/uploads', { data: { chave } });
      return true;
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : 'Erro ao excluir arquivo';
      setErro(mensagem);
      return false;
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
    obterInfo,
    carregando,
    progresso,
    erro,
    limparErro,
  };
}

