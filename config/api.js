// Configuração da API externa
const API_CONFIG = {
  // URL do backend externo (será configurado depois)
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://bandle-api.railway.app',

  // Endpoints
  ENDPOINTS: {
    LOBBY: '/api/lobby',
    MUSIC_INFO: '/api/music-info',
    TIMEZONE: '/api/timezone'
  },

  // Configurações de timeout
  TIMEOUT: 10000,

  // Configurações de retry
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Função helper para fazer requests com retry
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      console.warn(`API request attempt ${attempt} failed:`, error.message);

      if (attempt === API_CONFIG.RETRY_ATTEMPTS) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.RETRY_DELAY * attempt));
    }
  }
};

// Função para buscar timezone (fallback para API externa)
export const fetchTimezone = async () => {
  try {
    // Primeiro tenta a API externa
    const response = await apiRequest(API_CONFIG.ENDPOINTS.TIMEZONE);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('API externa falhou, usando fallback local:', error.message);

    // Fallback: usar data local do navegador
    const now = new Date();
    return {
      datetime: now.toISOString(),
      fallback: true
    };
  }
};

// Função para buscar informações de música
export const fetchMusicInfo = async (title, game) => {
  try {
    const params = new URLSearchParams({
      title: title,
      game: game
    });

    const response = await apiRequest(`${API_CONFIG.ENDPOINTS.MUSIC_INFO}?${params}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Erro ao buscar informações da música:', error.message);

    // Retorna dados padrão em caso de erro
    return {
      artist: 'Unknown Artist',
      year: 'Unknown Year',
      album: 'Unknown Album',
      console: 'Unknown Platform'
    };
  }
};

export default API_CONFIG;
