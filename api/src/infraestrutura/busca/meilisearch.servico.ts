import { MeiliSearch, Index } from 'meilisearch';
import { env } from '../../configuracao/ambiente.js';
import { logger } from '../../compartilhado/utilitarios/logger.js';
import { INDICES, INDICE_CONFIG, type IndiceNome } from './indices.js';

// =============================================================================
// Cliente Meilisearch
// =============================================================================

let cliente: MeiliSearch | null = null;

function obterCliente(): MeiliSearch | null {
  if (!env.MEILI_URL) return null;

  if (!cliente) {
    cliente = new MeiliSearch({
      host: env.MEILI_URL,
      apiKey: env.MEILI_MASTER_KEY,
    });
  }

  return cliente;
}

// =============================================================================
// Verificacao de Conexao
// =============================================================================

export async function verificarConexaoMeilisearch(): Promise<boolean> {
  const cli = obterCliente();
  if (!cli) return false;

  try {
    await cli.health();
    return true;
  } catch (erro) {
    logger.warn({ erro }, 'Meilisearch nao disponivel');
    return false;
  }
}

// =============================================================================
// Configuracao de Indices
// =============================================================================

export async function configurarIndices(): Promise<void> {
  const cli = obterCliente();
  if (!cli) return;

  for (const [nome, config] of Object.entries(INDICE_CONFIG)) {
    try {
      const indice = cli.index(nome);

      await indice.updateSettings({
        searchableAttributes: config.searchableAttributes,
        filterableAttributes: config.filterableAttributes,
        sortableAttributes: config.sortableAttributes,
        ...(config.displayedAttributes && { displayedAttributes: config.displayedAttributes }),
      });

      logger.info({ indice: nome }, 'Indice Meilisearch configurado');
    } catch (erro) {
      logger.error({ erro, indice: nome }, 'Erro ao configurar indice Meilisearch');
    }
  }
}

// =============================================================================
// Operacoes CRUD de Documentos
// =============================================================================

function obterIndice<T extends Record<string, any>>(nome: IndiceNome): Index<T> | null {
  const cli = obterCliente();
  if (!cli) return null;
  return cli.index<T>(nome);
}

export async function indexarDocumentos<T extends Record<string, any>>(
  indice: IndiceNome,
  documentos: T[],
): Promise<void> {
  const idx = obterIndice<T>(indice);
  if (!idx || documentos.length === 0) return;

  try {
    await idx.addDocuments(documentos, { primaryKey: 'id' });
  } catch (erro) {
    logger.error({ erro, indice, quantidade: documentos.length }, 'Erro ao indexar documentos');
  }
}

export async function atualizarDocumento<T extends Record<string, any>>(
  indice: IndiceNome,
  documento: T,
): Promise<void> {
  const idx = obterIndice<T>(indice);
  if (!idx) return;

  try {
    await idx.addDocuments([documento], { primaryKey: 'id' });
  } catch (erro) {
    logger.error({ erro, indice }, 'Erro ao atualizar documento');
  }
}

export async function removerDocumento(
  indice: IndiceNome,
  documentoId: string,
): Promise<void> {
  const idx = obterIndice(indice);
  if (!idx) return;

  try {
    await idx.deleteDocument(documentoId);
  } catch (erro) {
    logger.error({ erro, indice, documentoId }, 'Erro ao remover documento');
  }
}

export async function removerDocumentosPorFiltro(
  indice: IndiceNome,
  filtro: string,
): Promise<void> {
  const idx = obterIndice(indice);
  if (!idx) return;

  try {
    await idx.deleteDocuments({ filter: filtro });
  } catch (erro) {
    logger.error({ erro, indice, filtro }, 'Erro ao remover documentos por filtro');
  }
}

// =============================================================================
// Busca
// =============================================================================

export interface OpcoesBusca {
  filtro?: string;
  ordenarPor?: string[];
  limite?: number;
  offset?: number;
}

export interface ResultadoBusca<T> {
  hits: T[];
  totalHits: number;
  tempoProcessamento: number;
}

export async function buscar<T extends Record<string, any>>(
  indice: IndiceNome,
  termo: string,
  opcoes: OpcoesBusca = {},
): Promise<ResultadoBusca<T> | null> {
  const idx = obterIndice<T>(indice);
  if (!idx) return null;

  try {
    const resultado = await idx.search(termo, {
      filter: opcoes.filtro,
      sort: opcoes.ordenarPor,
      limit: opcoes.limite ?? 20,
      offset: opcoes.offset ?? 0,
    });

    return {
      hits: resultado.hits as T[],
      totalHits: resultado.estimatedTotalHits ?? resultado.hits.length,
      tempoProcessamento: resultado.processingTimeMs,
    };
  } catch (erro) {
    logger.error({ erro, indice, termo }, 'Erro ao buscar no Meilisearch');
    return null;
  }
}

// =============================================================================
// Utilitarios
// =============================================================================

export function meilisearchDisponivel(): boolean {
  return !!env.MEILI_URL;
}

export async function limparIndice(indice: IndiceNome): Promise<void> {
  const idx = obterIndice(indice);
  if (!idx) return;

  try {
    await idx.deleteAllDocuments();
  } catch (erro) {
    logger.error({ erro, indice }, 'Erro ao limpar indice');
  }
}

export { INDICES };
