// Módulo compartilhado para armazenamento local em desenvolvimento
// Isso garante que todas as APIs usem o mesmo Map em memória

// Maps compartilhados para desenvolvimento
const localUsers = new Map();
const localSessions = new Map();
const localProfiles = new Map();

export { localUsers, localSessions, localProfiles };
