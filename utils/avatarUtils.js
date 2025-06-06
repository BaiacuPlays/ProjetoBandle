/**
 * Utilitários para validação e manipulação de avatares
 */

/**
 * Valida se um avatar é válido
 * @param {string} avatar - Avatar a ser validado
 * @returns {Object} Resultado da validação
 */
export const validateAvatar = (avatar) => {
  // Permitir null/undefined (sem avatar)
  if (avatar === null || avatar === undefined) {
    return { isValid: true, type: 'none' };
  }

  // Deve ser string
  if (typeof avatar !== 'string') {
    return { isValid: false, error: 'Avatar deve ser uma string' };
  }

  // String vazia é válida (sem avatar)
  if (avatar.trim() === '') {
    return { isValid: true, type: 'none' };
  }

  // Imagem base64
  if (avatar.startsWith('data:image/')) {
    // Verificar formato
    const formatMatch = avatar.match(/^data:image\/([^;]+);base64,/);
    if (!formatMatch) {
      return { isValid: false, error: 'Formato de imagem inválido' };
    }

    const format = `image/${formatMatch[1]}`;
    if (!AVATAR_CONSTRAINTS.ALLOWED_FORMATS.includes(format)) {
      return { isValid: false, error: 'Formato de imagem não suportado' };
    }

    // Verificar tamanho
    try {
      const base64 = avatar.split(',')[1];
      if (!base64) {
        return { isValid: false, error: 'Dados de imagem inválidos' };
      }

      const binarySize = getBase64Size(avatar);
      if (binarySize > AVATAR_CONSTRAINTS.MAX_PROCESSED_SIZE) {
        return { isValid: false, error: 'Imagem muito grande (máximo 500KB)' };
      }
    } catch (error) {
      return { isValid: false, error: 'Dados de imagem corrompidos' };
    }

    return { isValid: true, type: 'image' };
  }

  // URL externa
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
    try {
      new URL(avatar);
      return { isValid: true, type: 'url' };
    } catch {
      return { isValid: false, error: 'URL inválida' };
    }
  }

  // Emoji ou texto curto (aumentado para suportar emojis compostos)
  if (avatar.length <= 8) {
    // Para emojis, ser mais permissivo - aceitar qualquer string curta
    return { isValid: true, type: 'emoji' };
  }

  return { isValid: false, error: 'Avatar deve ser uma imagem, emoji ou URL válida' };
};

/**
 * Determina o tipo de avatar
 * @param {string} avatar - Avatar a ser analisado
 * @returns {string} Tipo do avatar: 'emoji', 'image' ou 'default'
 */
export const getAvatarType = (avatar) => {
  const validation = validateAvatar(avatar);
  return validation.isValid ? validation.type || 'default' : 'default';
};

/**
 * Sanitiza um avatar, removendo dados corrompidos
 * @param {string} avatar - Avatar a ser sanitizado
 * @returns {string|null} Avatar sanitizado ou null
 */
export const sanitizeAvatar = (avatar) => {
  // Permitir null/undefined
  if (avatar === null || avatar === undefined) {
    return null;
  }

  if (typeof avatar !== 'string') {
    return null;
  }

  // Remover dados corrompidos comuns
  if (avatar.includes('auth_') || avatar.includes('profile:') || avatar.includes('user:')) {
    return null;
  }

  // Verificar se é muito longo para ser emoji (mas permitir URLs e imagens)
  if (avatar.length > 8 && !avatar.startsWith('data:image/') && !avatar.startsWith('http')) {
    // Se não for imagem nem URL, mas for um emoji válido dos predefinidos, permitir
    if (PREDEFINED_AVATARS.includes(avatar)) {
      return avatar;
    }
    return null;
  }

  const validation = validateAvatar(avatar);
  return validation.isValid ? avatar : null;
};

/**
 * Gera um avatar padrão baseado no nome do usuário
 * @param {string} username - Nome do usuário
 * @returns {string} Emoji padrão
 */
export const generateDefaultAvatar = (username) => {
  const defaultAvatars = [
    '🎮', '🎵', '🎯', '🎪', '🎨', '🎭', '🎸', '🎹',
    '🎺', '🎻', '🥁', '🎤', '🎧', '🎬', '🎲', '🎳',
    '🚀', '⭐', '🌟', '💫', '🔥', '⚡', '💎', '👑'
  ];

  if (!username || typeof username !== 'string') {
    return '🎮';
  }

  // Usar o hash do nome para escolher um avatar consistente
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    const char = username.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Converter para 32bit integer
  }

  const index = Math.abs(hash) % defaultAvatars.length;
  return defaultAvatars[index];
};

/**
 * Calcula o tamanho de uma imagem base64 em bytes
 * @param {string} base64String - String base64
 * @returns {number} Tamanho em bytes
 */
export const getBase64Size = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return 0;
  }

  // Remover o prefixo data:image/...;base64,
  const base64Data = base64String.split(',')[1] || base64String;

  // Calcular tamanho real
  const padding = (base64Data.match(/=/g) || []).length;
  return Math.ceil((base64Data.length * 3) / 4) - padding;
};

/**
 * Lista de avatares predefinidos
 */
export const PREDEFINED_AVATARS = [
  '🎮', '🎵', '🎯', '🎪', '🎨', '🎭', '🎸', '🎹',
  '🎺', '🎻', '🥁', '🎤', '🎧', '🎬', '🎲', '🎳',
  '🚀', '⭐', '🌟', '💫', '🔥', '⚡', '💎', '👑',
  '🦄', '🐉', '🦋', '🌈', '🎊', '🎉', '💝', '🏆',
  '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🌺', '🌸',
  '🌼', '🌻', '🌷', '🌹', '🍀', '🌿', '🌱', '🌳'
];

/**
 * Constantes de validação
 */
export const AVATAR_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB para upload
  MAX_PROCESSED_SIZE: 500 * 1024, // 500KB para imagem processada
  MAX_EMOJI_LENGTH: 8, // Aumentado para suportar emojis compostos
  ALLOWED_FORMATS: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  PROCESSED_WIDTH: 200,
  PROCESSED_HEIGHT: 200,
  PROCESSED_QUALITY: 0.85
};
