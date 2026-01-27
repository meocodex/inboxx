import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =============================================================================
// Schema do IndexedDB
// =============================================================================

interface CrmDBSchema extends DBSchema {
  conversas: {
    key: string;
    value: {
      id: string;
      contatoId: string;
      contatoNome: string;
      contatoTelefone: string;
      contatoAvatarUrl?: string;
      ultimaMensagem: string;
      ultimaMensagemEm: string;
      naoLidas: number;
      status: string;
      canal: string;
      atualizadoEm: string;
    };
    indexes: { 'by-contato': string; 'by-atualizado': string };
  };
  mensagens: {
    key: string;
    value: {
      id: string;
      conversaId: string;
      tipo: string;
      conteudo: string;
      midiaUrl?: string;
      origem: string;
      status: string;
      criadoEm: string;
    };
    indexes: { 'by-conversa': string; 'by-criado': string };
  };
  filaOffline: {
    key: string;
    value: {
      id: string;
      tipo: 'mensagem' | 'leitura';
      dados: Record<string, unknown>;
      criadoEm: string;
      tentativas: number;
    };
  };
  configuracoes: {
    key: string;
    value: {
      chave: string;
      valor: unknown;
    };
  };
}

// =============================================================================
// Constantes
// =============================================================================

const DB_NAME = 'crm-offline-db';
const DB_VERSION = 1;

// =============================================================================
// Inicializar Database
// =============================================================================

let dbPromise: Promise<IDBPDatabase<CrmDBSchema>> | null = null;

export async function obterDB(): Promise<IDBPDatabase<CrmDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<CrmDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store de Conversas
        if (!db.objectStoreNames.contains('conversas')) {
          const conversasStore = db.createObjectStore('conversas', { keyPath: 'id' });
          conversasStore.createIndex('by-contato', 'contatoId');
          conversasStore.createIndex('by-atualizado', 'atualizadoEm');
        }

        // Store de Mensagens
        if (!db.objectStoreNames.contains('mensagens')) {
          const mensagensStore = db.createObjectStore('mensagens', { keyPath: 'id' });
          mensagensStore.createIndex('by-conversa', 'conversaId');
          mensagensStore.createIndex('by-criado', 'criadoEm');
        }

        // Store de Fila Offline
        if (!db.objectStoreNames.contains('filaOffline')) {
          db.createObjectStore('filaOffline', { keyPath: 'id' });
        }

        // Store de Configuracoes
        if (!db.objectStoreNames.contains('configuracoes')) {
          db.createObjectStore('configuracoes', { keyPath: 'chave' });
        }
      },
    });
  }

  return dbPromise;
}

// =============================================================================
// Conversas
// =============================================================================

export async function salvarConversas(
  conversas: CrmDBSchema['conversas']['value'][]
): Promise<void> {
  const db = await obterDB();
  const tx = db.transaction('conversas', 'readwrite');

  await Promise.all([
    ...conversas.map((conversa) => tx.store.put(conversa)),
    tx.done,
  ]);
}

export async function obterConversas(): Promise<CrmDBSchema['conversas']['value'][]> {
  const db = await obterDB();
  return db.getAllFromIndex('conversas', 'by-atualizado');
}

export async function obterConversa(
  id: string
): Promise<CrmDBSchema['conversas']['value'] | undefined> {
  const db = await obterDB();
  return db.get('conversas', id);
}

export async function removerConversa(id: string): Promise<void> {
  const db = await obterDB();
  await db.delete('conversas', id);
}

// =============================================================================
// Mensagens
// =============================================================================

export async function salvarMensagens(
  mensagens: CrmDBSchema['mensagens']['value'][]
): Promise<void> {
  const db = await obterDB();
  const tx = db.transaction('mensagens', 'readwrite');

  await Promise.all([
    ...mensagens.map((mensagem) => tx.store.put(mensagem)),
    tx.done,
  ]);
}

export async function obterMensagensDaConversa(
  conversaId: string
): Promise<CrmDBSchema['mensagens']['value'][]> {
  const db = await obterDB();
  return db.getAllFromIndex('mensagens', 'by-conversa', conversaId);
}

export async function obterMensagem(
  id: string
): Promise<CrmDBSchema['mensagens']['value'] | undefined> {
  const db = await obterDB();
  return db.get('mensagens', id);
}

export async function removerMensagensDaConversa(conversaId: string): Promise<void> {
  const db = await obterDB();
  const tx = db.transaction('mensagens', 'readwrite');
  const index = tx.store.index('by-conversa');

  let cursor = await index.openCursor(conversaId);
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }

  await tx.done;
}

// =============================================================================
// Fila Offline
// =============================================================================

export async function adicionarFilaOffline(
  item: Omit<CrmDBSchema['filaOffline']['value'], 'id' | 'criadoEm' | 'tentativas'>
): Promise<string> {
  const db = await obterDB();
  const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  await db.put('filaOffline', {
    ...item,
    id,
    criadoEm: new Date().toISOString(),
    tentativas: 0,
  });

  return id;
}

export async function obterFilaOffline(): Promise<CrmDBSchema['filaOffline']['value'][]> {
  const db = await obterDB();
  return db.getAll('filaOffline');
}

export async function removerFilaOffline(id: string): Promise<void> {
  const db = await obterDB();
  await db.delete('filaOffline', id);
}

export async function atualizarTentativaFilaOffline(id: string): Promise<void> {
  const db = await obterDB();
  const item = await db.get('filaOffline', id);

  if (item) {
    await db.put('filaOffline', {
      ...item,
      tentativas: item.tentativas + 1,
    });
  }
}

// =============================================================================
// Configuracoes
// =============================================================================

export async function salvarConfiguracao(chave: string, valor: unknown): Promise<void> {
  const db = await obterDB();
  await db.put('configuracoes', { chave, valor });
}

export async function obterConfiguracao<T>(chave: string): Promise<T | undefined> {
  const db = await obterDB();
  const item = await db.get('configuracoes', chave);
  return item?.valor as T | undefined;
}

// =============================================================================
// Limpar Database
// =============================================================================

export async function limparDatabase(): Promise<void> {
  const db = await obterDB();
  const tx = db.transaction(
    ['conversas', 'mensagens', 'filaOffline', 'configuracoes'],
    'readwrite'
  );

  await Promise.all([
    tx.objectStore('conversas').clear(),
    tx.objectStore('mensagens').clear(),
    tx.objectStore('filaOffline').clear(),
    tx.objectStore('configuracoes').clear(),
    tx.done,
  ]);
}
