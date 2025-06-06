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

// Classe de armazenamento persistente que usa localStorage quando disponível
class PersistentStorage {
  constructor(mapStorage, storagePrefix) {
    this.mapStorage = mapStorage;
    this.prefix = storagePrefix;
    this.loadFromLocalStorage();
  }

  // Carregar dados do localStorage para o Map
  loadFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    
    try {
      // Buscar todas as chaves que começam com o prefixo
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.prefix)) {
          const value = JSON.parse(localStorage.getItem(key));
          const actualKey = key.substring(this.prefix.length);
          this.mapStorage.set(actualKey, value);
        }
      }
      console.log(`✅ Dados carregados do localStorage para ${this.prefix}`);
    } catch (error) {
      console.error(`❌ Erro ao carregar dados do localStorage para ${this.prefix}:`, error);
    }
  }

  // Salvar no Map e no localStorage
  set(key, value) {
    this.mapStorage.set(key, value);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(`${this.prefix}${key}`, JSON.stringify(value));
      } catch (error) {
        console.warn(`⚠️ Erro ao salvar no localStorage (${this.prefix}${key}):`, error);
      }
    }
    return true;
  }

  // Obter do Map
  get(key) {
    return this.mapStorage.get(key);
  }

  // Deletar do Map e do localStorage
  delete(key) {
    this.mapStorage.delete(key);
    
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem(`${this.prefix}${key}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao remover do localStorage (${this.prefix}${key}):`, error);
      }
    }
    return true;
  }
}

// Exportar instâncias com persistência
export const localUsers = new PersistentStorage(storage.localUsers, 'ludomusic_user_');
export const localSessions = new PersistentStorage(storage.localSessions, 'ludomusic_session_');
export const localProfiles = new PersistentStorage(storage.localProfiles, 'ludomusic_profile_');
