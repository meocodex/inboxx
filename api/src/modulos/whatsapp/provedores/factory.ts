import { MetaApiProvedor } from './meta-api.provedor.js';
import { UaiZapProvedor } from './uaizap.provedor.js';
import type { IProvedorWhatsApp } from './provedor.interface.js';
import type {
  TipoProvedor,
  ConfiguracaoMeta,
  ConfiguracaoUaiZap,
} from '../whatsapp.tipos.js';

// =============================================================================
// Cache de Provedores
// =============================================================================

const provedoresCache = new Map<string, IProvedorWhatsApp>();

// =============================================================================
// Factory de Provedores
// =============================================================================

export function criarProvedor(
  tipo: TipoProvedor,
  config: ConfiguracaoMeta | ConfiguracaoUaiZap,
  cacheKey?: string
): IProvedorWhatsApp {
  // Verificar cache
  if (cacheKey && provedoresCache.has(cacheKey)) {
    return provedoresCache.get(cacheKey)!;
  }

  let provedor: IProvedorWhatsApp;

  switch (tipo) {
    case 'META_API':
      provedor = new MetaApiProvedor(config as ConfiguracaoMeta);
      break;

    case 'UAIZAP':
      provedor = new UaiZapProvedor(config as ConfiguracaoUaiZap);
      break;

    default:
      throw new Error(`Tipo de provedor nao suportado: ${tipo}`);
  }

  // Armazenar no cache
  if (cacheKey) {
    provedoresCache.set(cacheKey, provedor);
  }

  return provedor;
}

// =============================================================================
// Obter Provedor do Cache
// =============================================================================

export function obterProvedorCache(cacheKey: string): IProvedorWhatsApp | undefined {
  return provedoresCache.get(cacheKey);
}

// =============================================================================
// Remover Provedor do Cache
// =============================================================================

export async function removerProvedorCache(cacheKey: string): Promise<void> {
  const provedor = provedoresCache.get(cacheKey);

  if (provedor) {
    await provedor.desconectar();
    provedoresCache.delete(cacheKey);
  }
}

// =============================================================================
// Limpar Cache de Provedores
// =============================================================================

export async function limparCacheProvedores(): Promise<void> {
  for (const [key, provedor] of provedoresCache) {
    await provedor.desconectar();
    provedoresCache.delete(key);
  }
}

// =============================================================================
// Listar Provedores no Cache
// =============================================================================

export function listarProvedoresCache(): string[] {
  return Array.from(provedoresCache.keys());
}
