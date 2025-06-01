// Utilitários para gerenciar cookies de forma segura
export const CookieManager = {
  // Configurações padrão para cookies
  defaultOptions: {
    path: '/',
    secure: process.env.NODE_ENV === 'production', // HTTPS apenas em produção
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 // 30 dias em segundos
  },

  // Definir um cookie
  set(name, value, options = {}) {
    if (typeof window === 'undefined') return; // SSR safety

    const finalOptions = { ...this.defaultOptions, ...options };
    
    let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    
    if (finalOptions.maxAge) {
      cookieString += `; Max-Age=${finalOptions.maxAge}`;
    }
    
    if (finalOptions.expires) {
      cookieString += `; Expires=${finalOptions.expires.toUTCString()}`;
    }
    
    if (finalOptions.path) {
      cookieString += `; Path=${finalOptions.path}`;
    }
    
    if (finalOptions.domain) {
      cookieString += `; Domain=${finalOptions.domain}`;
    }
    
    if (finalOptions.secure) {
      cookieString += `; Secure`;
    }
    
    if (finalOptions.sameSite) {
      cookieString += `; SameSite=${finalOptions.sameSite}`;
    }
    
    if (finalOptions.httpOnly) {
      cookieString += `; HttpOnly`;
    }

    document.cookie = cookieString;
    console.log(`🍪 Cookie definido: ${name}`);
  },

  // Obter um cookie
  get(name) {
    if (typeof window === 'undefined') return null; // SSR safety

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');
    
    for (let cookie of cookies) {
      let c = cookie.trim();
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length);
        return decodeURIComponent(value);
      }
    }
    return null;
  },

  // Remover um cookie
  remove(name, options = {}) {
    if (typeof window === 'undefined') return; // SSR safety

    const finalOptions = { ...options, maxAge: -1, expires: new Date(0) };
    this.set(name, '', finalOptions);
    console.log(`🗑️ Cookie removido: ${name}`);
  },

  // Verificar se um cookie existe
  exists(name) {
    return this.get(name) !== null;
  },

  // Obter todos os cookies como objeto
  getAll() {
    if (typeof window === 'undefined') return {}; // SSR safety

    const cookies = {};
    const cookieArray = document.cookie.split(';');
    
    for (let cookie of cookieArray) {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[decodeURIComponent(name)] = decodeURIComponent(value);
      }
    }
    
    return cookies;
  }
};

// Funções específicas para autenticação
export const AuthCookies = {
  // Nomes dos cookies
  SESSION_TOKEN: 'ludomusic_session',
  USER_DATA: 'ludomusic_user',
  REMEMBER_ME: 'ludomusic_remember',

  // Salvar dados de autenticação
  saveAuth(sessionToken, userData, rememberMe = true) {
    const options = rememberMe ? 
      { maxAge: 30 * 24 * 60 * 60 } : // 30 dias se "lembrar"
      { maxAge: 24 * 60 * 60 }; // 1 dia se não "lembrar"

    // Salvar token de sessão
    CookieManager.set(this.SESSION_TOKEN, sessionToken, options);
    
    // Salvar dados do usuário (JSON)
    CookieManager.set(this.USER_DATA, JSON.stringify(userData), options);
    
    // Salvar preferência de "lembrar"
    CookieManager.set(this.REMEMBER_ME, rememberMe.toString(), options);

    // Também salvar no localStorage como backup
    localStorage.setItem('ludomusic_session_token', sessionToken);
    localStorage.setItem('ludomusic_user_data', JSON.stringify(userData));
    
    console.log('🔐 Dados de autenticação salvos nos cookies e localStorage');
  },

  // Obter token de sessão
  getSessionToken() {
    // Tentar primeiro dos cookies, depois localStorage
    return CookieManager.get(this.SESSION_TOKEN) || 
           localStorage.getItem('ludomusic_session_token');
  },

  // Obter dados do usuário
  getUserData() {
    try {
      // Tentar primeiro dos cookies
      const cookieData = CookieManager.get(this.USER_DATA);
      if (cookieData) {
        return JSON.parse(cookieData);
      }
      
      // Fallback para localStorage
      const localData = localStorage.getItem('ludomusic_user_data');
      if (localData) {
        return JSON.parse(localData);
      }
      
      return null;
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      return null;
    }
  },

  // Verificar se deve lembrar do usuário
  shouldRemember() {
    const remember = CookieManager.get(this.REMEMBER_ME);
    return remember === 'true';
  },

  // Limpar dados de autenticação
  clearAuth() {
    // Remover cookies
    CookieManager.remove(this.SESSION_TOKEN);
    CookieManager.remove(this.USER_DATA);
    CookieManager.remove(this.REMEMBER_ME);
    
    // Remover localStorage
    localStorage.removeItem('ludomusic_session_token');
    localStorage.removeItem('ludomusic_user_data');
    
    console.log('🧹 Dados de autenticação limpos dos cookies e localStorage');
  },

  // Verificar se há dados de autenticação salvos
  hasAuthData() {
    return this.getSessionToken() !== null && this.getUserData() !== null;
  }
};

// Funções específicas para dados dos amigos
export const FriendsCookies = {
  // Nomes dos cookies
  FRIENDS_DATA: 'ludomusic_friends',
  FRIEND_REQUESTS: 'ludomusic_friend_requests',

  // Salvar dados dos amigos
  saveFriendsData(friends, friendRequests = []) {
    const options = { maxAge: 30 * 24 * 60 * 60 }; // 30 dias

    // Salvar lista de amigos
    CookieManager.set(this.FRIENDS_DATA, JSON.stringify(friends), options);

    // Salvar solicitações de amizade
    CookieManager.set(this.FRIEND_REQUESTS, JSON.stringify(friendRequests), options);

    console.log('👥 Dados dos amigos salvos nos cookies:', friends.length, 'amigos,', friendRequests.length, 'solicitações');
  },

  // Obter lista de amigos
  getFriendsData() {
    try {
      const friendsData = CookieManager.get(this.FRIENDS_DATA);
      return friendsData ? JSON.parse(friendsData) : [];
    } catch (error) {
      console.error('Erro ao parsear dados dos amigos:', error);
      return [];
    }
  },

  // Obter solicitações de amizade
  getFriendRequests() {
    try {
      const requestsData = CookieManager.get(this.FRIEND_REQUESTS);
      return requestsData ? JSON.parse(requestsData) : [];
    } catch (error) {
      console.error('Erro ao parsear solicitações de amizade:', error);
      return [];
    }
  },

  // Limpar dados dos amigos
  clearFriendsData() {
    CookieManager.remove(this.FRIENDS_DATA);
    CookieManager.remove(this.FRIEND_REQUESTS);
    console.log('🧹 Dados dos amigos limpos dos cookies');
  },

  // Verificar se há dados dos amigos salvos
  hasFriendsData() {
    return CookieManager.get(this.FRIENDS_DATA) !== null;
  }
};
