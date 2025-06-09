// Módulo compartilhado para armazenamento local em desenvolvimento
// Isso garante que todas as APIs usem o mesmo Map em memória

// Maps compartilhados para desenvolvimento - usando globalThis para garantir singleton
if (typeof globalThis !== 'undefined') {
  if (!globalThis.__ludomusic_storage) {
    globalThis.__ludomusic_storage = {
      localUsers: new Map(),
      localSessions: new Map(),
      localProfiles: new Map()
    };
  }
}

// Fallback para ambientes que não suportam globalThis
const storage = globalThis?.__ludomusic_storage || {
  localUsers: new Map(),
  localSessions: new Map(),
  localProfiles: new Map()
};

// Classe de armazenamento simples para desenvolvimento (apenas memória no servidor)
class SimpleStorage {
  constructor(mapStorage, storagePrefix) {
    this.mapStorage = mapStorage;
    this.prefix = storagePrefix;
    console.log(`📦 Storage inicializado: ${storagePrefix}`);
  }

  // Salvar no Map
  set(key, value) {
    this.mapStorage.set(key, value);
    console.log(`💾 Salvando ${this.prefix}${key}`);
    return true;
  }

  // Obter do Map
  get(key) {
    const value = this.mapStorage.get(key);
    console.log(`📖 Lendo ${this.prefix}${key}: ${value ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
    return value;
  }

  // Deletar do Map
  delete(key) {
    const deleted = this.mapStorage.delete(key);
    console.log(`🗑️ Deletando ${this.prefix}${key}: ${deleted ? 'SUCESSO' : 'NÃO ENCONTRADO'}`);
    return deleted;
  }

  // Listar todas as chaves (para debug)
  keys() {
    return Array.from(this.mapStorage.keys());
  }

  // Verificar se existe
  has(key) {
    return this.mapStorage.has(key);
  }
}

// Exportar instâncias simples para desenvolvimento
export const localUsers = new SimpleStorage(storage.localUsers, 'ludomusic_user_');
export const localSessions = new SimpleStorage(storage.localSessions, 'ludomusic_session_');
export const localProfiles = new SimpleStorage(storage.localProfiles, 'ludomusic_profile_');
