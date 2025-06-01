// Utilitários para limpeza e validação de dados de perfil

/**
 * Limpa e valida dados de avatar
 * @param {string} avatar - Avatar a ser validado
 * @returns {string} Avatar limpo ou emoji padrão
 */
export const sanitizeAvatar = (avatar) => {
  // Se não é string ou é muito longo, usar padrão
  if (!avatar || typeof avatar !== 'string' || avatar.length > 10) {
    return '👤';
  }
  
  // Se contém caracteres estranhos ou dados corrompidos, usar padrão
  if (avatar.includes('auth_') || avatar.includes('profile:') || avatar.length > 4) {
    return '👤';
  }
  
  return avatar;
};

/**
 * Limpa e valida dados de perfil completo
 * @param {object} profile - Perfil a ser limpo
 * @returns {object} Perfil limpo
 */
export const sanitizeProfile = (profile) => {
  if (!profile || typeof profile !== 'object') {
    return null;
  }

  return {
    ...profile,
    avatar: sanitizeAvatar(profile.avatar),
    displayName: typeof profile.displayName === 'string' ? profile.displayName : 'Jogador',
    username: typeof profile.username === 'string' ? profile.username : 'usuario',
    bio: typeof profile.bio === 'string' && profile.bio.length <= 200 ? profile.bio : '',
    level: typeof profile.level === 'number' && profile.level > 0 ? profile.level : 1,
    xp: typeof profile.xp === 'number' && profile.xp >= 0 ? profile.xp : 0
  };
};

/**
 * Valida se um ID de usuário está no formato correto
 * @param {string} userId - ID do usuário
 * @returns {boolean} Se o ID é válido
 */
export const isValidUserId = (userId) => {
  if (!userId || typeof userId !== 'string') {
    return false;
  }
  
  // Deve começar com 'auth_' seguido de username válido
  return /^auth_[a-zA-Z0-9_]{3,20}$/.test(userId);
};

/**
 * Valida se um username está no formato correto
 * @param {string} username - Username
 * @returns {boolean} Se o username é válido
 */
export const isValidUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return false;
  }
  
  // Entre 3 e 20 caracteres, apenas letras, números e underscore
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
};

/**
 * Remove dados corrompidos de uma lista de objetos
 * @param {array} items - Lista de itens
 * @param {function} validator - Função de validação
 * @returns {array} Lista limpa
 */
export const cleanCorruptedData = (items, validator) => {
  if (!Array.isArray(items)) {
    return [];
  }
  
  return items.filter(item => {
    try {
      return validator ? validator(item) : true;
    } catch (error) {
      console.warn('Item corrompido removido:', item, error);
      return false;
    }
  });
};

/**
 * Corrige dados de perfil corrompidos
 * @param {object} profile - Perfil possivelmente corrompido
 * @returns {object} Perfil corrigido
 */
export const repairCorruptedProfile = (profile) => {
  if (!profile) return null;
  
  try {
    // Se o perfil inteiro parece ser uma string corrompida
    if (typeof profile === 'string') {
      console.warn('Perfil corrompido detectado (string):', profile.substring(0, 100));
      return null;
    }
    
    // Verificar se campos essenciais estão corrompidos
    const hasCorruptedFields = Object.values(profile).some(value => 
      typeof value === 'string' && 
      (value.includes('auth_') || value.includes('profile:') || value.length > 1000)
    );
    
    if (hasCorruptedFields) {
      console.warn('Perfil com campos corrompidos detectado, limpando...');
      
      // Manter apenas campos seguros
      return {
        id: isValidUserId(profile.id) ? profile.id : null,
        username: isValidUsername(profile.username) ? profile.username : 'usuario',
        displayName: typeof profile.displayName === 'string' && profile.displayName.length <= 50 ? 
          profile.displayName : 'Jogador',
        avatar: sanitizeAvatar(profile.avatar),
        level: typeof profile.level === 'number' ? profile.level : 1,
        xp: typeof profile.xp === 'number' ? profile.xp : 0,
        createdAt: profile.createdAt || new Date().toISOString(),
        lastLoginAt: profile.lastLoginAt || new Date().toISOString()
      };
    }
    
    return sanitizeProfile(profile);
  } catch (error) {
    console.error('Erro ao reparar perfil corrompido:', error);
    return null;
  }
};
