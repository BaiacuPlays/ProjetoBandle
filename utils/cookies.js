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
    if (typeof window === 'undefined') {
      return null; // SSR safety
    }

    console.log('🔍 DEBUG CookieManager - Buscando cookie:', name);
    console.log('🔍 DEBUG CookieManager - Todos os cookies:', document.cookie);

    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      let c = cookie.trim();
      if (c.indexOf(nameEQ) === 0) {
        const value = c.substring(nameEQ.length);
        const result = decodeURIComponent(value);
        console.log('🔍 DEBUG CookieManager - Cookie encontrado:', result);
        return result;
      }
    }
    console.log('🔍 DEBUG CookieManager - Cookie não encontrado');
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
    try {
      const options = {
        maxAge: 30 * 24 * 60 * 60, // 30 dias
        path: '/', // Garantir que funciona em toda a aplicação
        secure: false, // Permitir HTTP para desenvolvimento local
        sameSite: 'lax' // Mais permissivo para evitar problemas de CORS
      };

      console.log('💾 DEBUG - Salvando amigos nos cookies:', friends?.length || 0, 'amigos');
      console.log('💾 DEBUG - Salvando solicitações nos cookies:', friendRequests?.length || 0, 'solicitações');
      console.log('💾 DEBUG - Lista de amigos:', friends?.map(f => f.displayName || f.username) || []);

      // Salvar lista de amigos com múltiplas tentativas
      const friendsData = JSON.stringify(friends);
      const requestsData = JSON.stringify(friendRequests);

      // Múltiplas tentativas de salvamento para maior robustez
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          // Tentativa principal
          CookieManager.set(this.FRIENDS_DATA, friendsData, options);
          CookieManager.set(this.FRIEND_REQUESTS, requestsData, options);

          // Backup com nomes alternativos (caso o principal falhe)
          CookieManager.set(this.FRIENDS_DATA + '_backup', friendsData, options);
          CookieManager.set(this.FRIEND_REQUESTS + '_backup', requestsData, options);

          // Backup adicional com timestamp
          CookieManager.set(this.FRIENDS_DATA + '_backup2', friendsData, options);
          CookieManager.set(this.FRIEND_REQUESTS + '_backup2', requestsData, options);

          // Timestamp da última atualização
          CookieManager.set('ludomusic_friends_timestamp', Date.now().toString(), options);

          // Verificar se foi salvo corretamente
          const savedFriends = CookieManager.get(this.FRIENDS_DATA);
          const savedRequests = CookieManager.get(this.FRIEND_REQUESTS);

          if (savedFriends && savedRequests) {
            console.log(`✅ DEBUG - Salvamento bem-sucedido na tentativa ${attempt}`);
            break;
          } else {
            console.log(`⚠️ DEBUG - Tentativa ${attempt} falhou, tentando novamente...`);
            if (attempt === 3) {
              throw new Error('Falha em todas as tentativas de salvamento');
            }
          }
        } catch (attemptError) {
          console.error(`❌ Erro na tentativa ${attempt}:`, attemptError);
          if (attempt === 3) {
            throw attemptError;
          }
        }
      }

      console.log('👥 Dados dos amigos salvos nos cookies:', friends.length, 'amigos,', friendRequests.length, 'solicitações');

      // Sempre salvar no localStorage como backup adicional
      localStorage.setItem(this.FRIENDS_DATA, friendsData);
      localStorage.setItem(this.FRIEND_REQUESTS, requestsData);
      localStorage.setItem('ludomusic_friends_timestamp', Date.now().toString());

    } catch (error) {
      console.error('❌ Erro ao salvar dados dos amigos nos cookies:', error);
      // Fallback para localStorage
      try {
        localStorage.setItem(this.FRIENDS_DATA, JSON.stringify(friends));
        localStorage.setItem(this.FRIEND_REQUESTS, JSON.stringify(friendRequests));
        localStorage.setItem('ludomusic_friends_timestamp', Date.now().toString());
        console.log('💾 Fallback: dados salvos no localStorage');
      } catch (localError) {
        console.error('❌ Erro também no localStorage:', localError);
      }
    }
  },

  // Obter lista de amigos
  getFriendsData() {
    try {
      console.log('🔍 DEBUG - Buscando cookie:', this.FRIENDS_DATA);
      console.log('🔍 DEBUG - Todos os cookies:', CookieManager.getAll());

      // Tentar obter do cookie principal
      let friendsData = CookieManager.get(this.FRIENDS_DATA);
      console.log('🔍 DEBUG - Cookie principal encontrado:', friendsData ? 'SIM' : 'NÃO');

      // Se não encontrou, tentar backup 1
      if (!friendsData) {
        console.log('🔍 DEBUG - Tentando backup 1 do cookie...');
        friendsData = CookieManager.get(this.FRIENDS_DATA + '_backup');
        console.log('🔍 DEBUG - Cookie backup 1 encontrado:', friendsData ? 'SIM' : 'NÃO');
      }

      // Se não encontrou, tentar backup 2
      if (!friendsData) {
        console.log('🔍 DEBUG - Tentando backup 2 do cookie...');
        friendsData = CookieManager.get(this.FRIENDS_DATA + '_backup2');
        console.log('🔍 DEBUG - Cookie backup 2 encontrado:', friendsData ? 'SIM' : 'NÃO');
      }

      // Se ainda não encontrou, tentar localStorage
      if (!friendsData) {
        console.log('🔍 DEBUG - Tentando localStorage...');
        friendsData = localStorage.getItem(this.FRIENDS_DATA);
        console.log('🔍 DEBUG - localStorage encontrado:', friendsData ? 'SIM' : 'NÃO');
      }

      console.log('🔍 DEBUG - Conteúdo final:', friendsData ? 'DADOS ENCONTRADOS' : 'NENHUM DADO');
      const parsed = friendsData ? JSON.parse(friendsData) : [];
      console.log('🔍 DEBUG - Dados parseados:', parsed?.length || 0, 'amigos encontrados');
      console.log('🔍 DEBUG - Lista de amigos:', parsed?.map(f => f.displayName || f.username) || []);
      return parsed;
    } catch (error) {
      console.error('❌ Erro ao parsear dados dos amigos:', error);
      // Tentar localStorage como último recurso
      try {
        const localData = localStorage.getItem(this.FRIENDS_DATA);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('❌ Erro também no localStorage:', localError);
        return [];
      }
    }
  },

  // Obter solicitações de amizade
  getFriendRequests() {
    try {
      console.log('🔍 DEBUG - Buscando cookie:', this.FRIEND_REQUESTS);

      // Tentar obter do cookie principal
      let requestsData = CookieManager.get(this.FRIEND_REQUESTS);
      console.log('🔍 DEBUG - Cookie principal encontrado:', requestsData ? 'SIM' : 'NÃO');

      // Se não encontrou, tentar backup 1
      if (!requestsData) {
        console.log('🔍 DEBUG - Tentando backup 1 do cookie...');
        requestsData = CookieManager.get(this.FRIEND_REQUESTS + '_backup');
        console.log('🔍 DEBUG - Cookie backup 1 encontrado:', requestsData ? 'SIM' : 'NÃO');
      }

      // Se não encontrou, tentar backup 2
      if (!requestsData) {
        console.log('🔍 DEBUG - Tentando backup 2 do cookie...');
        requestsData = CookieManager.get(this.FRIEND_REQUESTS + '_backup2');
        console.log('🔍 DEBUG - Cookie backup 2 encontrado:', requestsData ? 'SIM' : 'NÃO');
      }

      // Se ainda não encontrou, tentar localStorage
      if (!requestsData) {
        console.log('🔍 DEBUG - Tentando localStorage...');
        requestsData = localStorage.getItem(this.FRIEND_REQUESTS);
        console.log('🔍 DEBUG - localStorage encontrado:', requestsData ? 'SIM' : 'NÃO');
      }

      console.log('🔍 DEBUG - Conteúdo final:', requestsData);
      const parsed = requestsData ? JSON.parse(requestsData) : [];
      console.log('🔍 DEBUG - Dados parseados:', parsed);
      return parsed;
    } catch (error) {
      console.error('❌ Erro ao parsear solicitações de amizade:', error);
      // Tentar localStorage como último recurso
      try {
        const localData = localStorage.getItem(this.FRIEND_REQUESTS);
        return localData ? JSON.parse(localData) : [];
      } catch (localError) {
        console.error('❌ Erro também no localStorage:', localError);
        return [];
      }
    }
  },

  // Limpar dados dos amigos
  clearFriendsData() {
    // Limpar cookies principais
    CookieManager.remove(this.FRIENDS_DATA);
    CookieManager.remove(this.FRIEND_REQUESTS);

    // Limpar todos os backups
    CookieManager.remove(this.FRIENDS_DATA + '_backup');
    CookieManager.remove(this.FRIEND_REQUESTS + '_backup');
    CookieManager.remove(this.FRIENDS_DATA + '_backup2');
    CookieManager.remove(this.FRIEND_REQUESTS + '_backup2');
    CookieManager.remove('ludomusic_friends_timestamp');

    // Limpar localStorage também
    localStorage.removeItem(this.FRIENDS_DATA);
    localStorage.removeItem(this.FRIEND_REQUESTS);
    localStorage.removeItem('ludomusic_friends_timestamp');

    console.log('🧹 Dados dos amigos limpos dos cookies e localStorage');
  },

  // Verificar integridade dos dados
  checkDataIntegrity() {
    try {
      const friends = this.getFriendsData();
      const requests = this.getFriendRequests();
      const timestamp = CookieManager.get('ludomusic_friends_timestamp');

      const report = {
        hasFriends: friends.length > 0,
        hasRequests: requests.length > 0,
        friendsCount: friends.length,
        requestsCount: requests.length,
        lastUpdate: timestamp ? new Date(parseInt(timestamp)).toLocaleString() : 'Nunca',
        cookiesWorking: !!CookieManager.get(this.FRIENDS_DATA),
        backup1Working: !!CookieManager.get(this.FRIENDS_DATA + '_backup'),
        backup2Working: !!CookieManager.get(this.FRIENDS_DATA + '_backup2'),
        localStorageWorking: !!localStorage.getItem(this.FRIENDS_DATA),
        // Verificar se pelo menos uma fonte está funcionando
        anySourceWorking: !!(
          CookieManager.get(this.FRIENDS_DATA) ||
          CookieManager.get(this.FRIENDS_DATA + '_backup') ||
          CookieManager.get(this.FRIENDS_DATA + '_backup2') ||
          localStorage.getItem(this.FRIENDS_DATA)
        )
      };

      console.log('🔍 Relatório de integridade dos dados dos amigos:', report);
      return report;
    } catch (error) {
      console.error('❌ Erro ao verificar integridade:', error);
      return null;
    }
  },

  // Verificar se há dados dos amigos salvos
  hasFriendsData() {
    return CookieManager.get(this.FRIENDS_DATA) !== null;
  }
};
