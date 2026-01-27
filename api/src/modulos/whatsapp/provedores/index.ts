export * from './provedor.interface.js';
export { MetaApiProvedor } from './meta-api.provedor.js';
export { UaiZapProvedor } from './uaizap.provedor.js';
export {
  criarProvedor,
  obterProvedorCache,
  removerProvedorCache,
  limparCacheProvedores,
  listarProvedoresCache,
} from './factory.js';
