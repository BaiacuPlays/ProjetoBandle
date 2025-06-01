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

export const localUsers = storage.localUsers;
export const localSessions = storage.localSessions;
export const localProfiles = storage.localProfiles;
