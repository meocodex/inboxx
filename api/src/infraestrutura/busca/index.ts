export {
  verificarConexaoMeilisearch,
  configurarIndices,
  indexarDocumentos,
  atualizarDocumento,
  removerDocumento,
  removerDocumentosPorFiltro,
  buscar,
  meilisearchDisponivel,
  limparIndice,
  INDICES,
} from './meilisearch.servico.js';

export type {
  OpcoesBusca,
  ResultadoBusca,
} from './meilisearch.servico.js';

export type {
  ContatoDocumento,
  ConversaDocumento,
  MensagemDocumento,
} from './indices.js';

export { INDICE_CONFIG } from './indices.js';
