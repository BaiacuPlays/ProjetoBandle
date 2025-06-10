// SOLUÇÃO ROBUSTA PARA PERSISTÊNCIA DE SESSÃO
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

// Sistema robusto de gerenciamento de sessão
class SessionManager {
  constructor() {
    this.SESSION_KEY = 'ludomusic_session_token';
    this.USER_KEY = 'ludomusic_user_data';
    this.LAST_CHECK_KEY = 'ludomusic_last_check';
    this.HEARTBEAT_INTERVAL = 5 * 60 * 1000; // 5 minutos
    this.heartbeatTimer = null;
  }

  // Salvar sessão com redundância
  saveSession(token, userData) {
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        console.warn('⚠️ SessionManager: Tentativa de salvar sessão no servidor');
        return false;
      }

      // Salvar no localStorage
      localStorage.setItem(this.SESSION_KEY, token);
      localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
      localStorage.setItem(this.LAST_CHECK_KEY, Date.now().toString());

      // Salvar em cookies como backup (30 dias) - apenas se document estiver disponível
      if (typeof document !== 'undefined') {
        const expires = new Date();
        expires.setDate(expires.getDate() + 30);

        document.cookie = `${this.SESSION_KEY}=${token}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
        document.cookie = `${this.USER_KEY}=${encodeURIComponent(JSON.stringify(userData))}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
      }

      console.log('💾 Sessão salva com redundância (localStorage + cookies)');
      return true;
    } catch (error) {
      console.error('❌ Erro ao salvar sessão:', error);
      return false;
    }
  }

  // Recuperar token de sessão
  getSessionToken() {
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        return null;
      }

      // Tentar localStorage primeiro
      let token = localStorage.getItem(this.SESSION_KEY);
      if (token) return token;

      // Fallback para cookies - apenas se document estiver disponível
      if (typeof document !== 'undefined') {
        token = this.getCookie(this.SESSION_KEY);
        if (token) {
          // Restaurar no localStorage
          localStorage.setItem(this.SESSION_KEY, token);
          return token;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar token:', error);
      return null;
    }
  }

  // Recuperar dados do usuário
  getUserData() {
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        return null;
      }

      // Tentar localStorage primeiro
      let userData = localStorage.getItem(this.USER_KEY);
      if (userData) {
        return JSON.parse(userData);
      }

      // Fallback para cookies - apenas se document estiver disponível
      if (typeof document !== 'undefined') {
        userData = this.getCookie(this.USER_KEY);
        if (userData) {
          const decoded = JSON.parse(decodeURIComponent(userData));
          // Restaurar no localStorage
          localStorage.setItem(this.USER_KEY, JSON.stringify(decoded));
          return decoded;
        }
      }

      return null;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados do usuário:', error);
      return null;
    }
  }

  // Limpar sessão completamente
  clearSession() {
    try {
      // Verificar se estamos no cliente
      if (typeof window === 'undefined') {
        return;
      }

      // Limpar localStorage
      localStorage.removeItem(this.SESSION_KEY);
      localStorage.removeItem(this.USER_KEY);
      localStorage.removeItem(this.LAST_CHECK_KEY);

      // Limpar cookies - apenas se document estiver disponível
      if (typeof document !== 'undefined') {
        document.cookie = `${this.SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${this.USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      // Parar heartbeat
      this.stopHeartbeat();

      console.log('🧹 Sessão limpa completamente');
    } catch (error) {
      console.error('❌ Erro ao limpar sessão:', error);
    }
  }

  // Utilitário para ler cookies
  getCookie(name) {
    try {
      // Verificar se document está disponível
      if (typeof document === 'undefined') {
        return null;
      }

      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    } catch (error) {
      console.error('❌ Erro ao ler cookie:', error);
      return null;
    }
  }

  // Iniciar heartbeat para manter sessão ativa
  startHeartbeat(checkAuthFunction) {
    this.stopHeartbeat(); // Limpar timer anterior se existir

    this.heartbeatTimer = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
        console.log('💓 Heartbeat: Verificando sessão...');
      }
      checkAuthFunction(false); // Verificação silenciosa
    }, this.HEARTBEAT_INTERVAL);

    console.log('💓 Heartbeat iniciado (5 min)');
  }

  // Parar heartbeat
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      console.log('💓 Heartbeat parado');
    }
  }

  // Verificar se a última verificação foi muito recente
  shouldSkipCheck() {
    try {
      const lastCheck = localStorage.getItem(this.LAST_CHECK_KEY);
      if (!lastCheck) return false;

      const timeSinceLastCheck = Date.now() - parseInt(lastCheck);
      return timeSinceLastCheck < 10000; // Menos de 10 segundos
    } catch (error) {
      return false;
    }
  }

  // Atualizar timestamp da última verificação
  updateLastCheck() {
    try {
      localStorage.setItem(this.LAST_CHECK_KEY, Date.now().toString());
    } catch (error) {
      // Silent error
    }
  }
}

// Instância global do SessionManager (apenas no cliente)
let sessionManager = null;

// Função para obter ou criar SessionManager
const getSessionManager = () => {
  if (typeof window === 'undefined') {
    // No servidor, retornar um mock
    return {
      saveSession: () => false,
      getSessionToken: () => null,
      getUserData: () => null,
      clearSession: () => {},
      shouldSkipCheck: () => false,
      updateLastCheck: () => {},
      startHeartbeat: () => {},
      stopHeartbeat: () => {},
      SESSION_KEY: 'ludomusic_session_token'
    };
  }

  if (!sessionManager) {
    sessionManager = new SessionManager();
  }
  return sessionManager;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Log apenas em desenvolvimento para evitar spam no console
  if (process.env.NODE_ENV === 'development') {
    console.log('🔐 AuthProvider: Estado atual:', {
      user: user?.username,
      isAuthenticated,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }

  // Sistema de cache para evitar verificações desnecessárias
  const [lastCheckTime, setLastCheckTime] = useState(0);
  const [checkInProgress, setCheckInProgress] = useState(false);
  const CHECK_INTERVAL = 30000; // 30 segundos

  // SOLUÇÃO ROBUSTA - verificar autenticação com SessionManager
  const checkAuth = async (force = false) => {
    const now = Date.now();

    // Evitar verificações muito frequentes (exceto se forçado)
    if (!force && checkInProgress) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação já em andamento, ignorando...');
      }
      return;
    }

    const sm = getSessionManager();

    if (!force && sm.shouldSkipCheck()) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação muito recente, ignorando...');
      }
      return;
    }

    setCheckInProgress(true);
    setLastCheckTime(now);
    sm.updateLastCheck();

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verificando autenticação com SessionManager...');
    }

    try {
      // Usar SessionManager para recuperar token
      const token = sm.getSessionToken();

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Token encontrado:', token ? 'SIM' : 'NÃO');
      }

      if (!token) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Sem token - usuário não autenticado');
        }
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        sm.stopHeartbeat();
        return;
      }

      // Verificar se temos dados do usuário em cache
      const cachedUserData = sm.getUserData();
      if (cachedUserData && !force) {
        // Usar dados em cache para resposta rápida
        setUser(cachedUserData);
        setIsAuthenticated(true);
        setIsLoading(false);

        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ Usando dados em cache:', cachedUserData.username);
        }

        // Iniciar heartbeat se não estiver rodando
        if (!sm.heartbeatTimer) {
          sm.startHeartbeat(checkAuth);
        }

        // Verificar no servidor em background (sem bloquear UI)
        setTimeout(() => {
          verifyTokenWithServer(token, cachedUserData);
        }, 100);

        return;
      }

      // Verificação completa no servidor
      await verifyTokenWithServer(token, cachedUserData);

    } catch (error) {
      console.error('❌ Erro na verificação de autenticação:', error);
      handleAuthError();
    } finally {
      setCheckInProgress(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação concluída');
      }
    }
  };

  // Função auxiliar para verificar token no servidor
  const verifyTokenWithServer = async (token, cachedUserData) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificando token no servidor...');
      }

      // Timeout para evitar requisições que ficam pendentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(`/api/auth?sessionToken=${token}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.success && data.user) {
        // Sucesso - atualizar dados
        setUser(data.user);
        setIsAuthenticated(true);
        setIsLoading(false);

        // Salvar dados atualizados
        const sm = getSessionManager();
        sm.saveSession(token, data.user);

        // Iniciar heartbeat se não estiver rodando
        if (!sm.heartbeatTimer) {
          sm.startHeartbeat(checkAuth);
        }

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Token válido no servidor:', data.user.username);
        }
      } else {
        // Token inválido
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ Token inválido no servidor:', data.error);
        }
        handleAuthError();
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout na verificação do servidor');
        // Se temos dados em cache e houve timeout, manter usuário logado
        if (cachedUserData) {
          setUser(cachedUserData);
          setIsAuthenticated(true);
          setIsLoading(false);
          return;
        }
      } else {
        console.error('❌ Erro na verificação do servidor:', error);
      }

      // Se temos dados em cache, usar como fallback
      if (cachedUserData) {
        setUser(cachedUserData);
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log('🔄 Usando dados em cache devido a erro no servidor');
      } else {
        handleAuthError();
      }
    }
  };

  // Função auxiliar para lidar com erros de autenticação
  const handleAuthError = () => {
    setUser(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    const sm = getSessionManager();
    sm.clearSession();
  };

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 AuthProvider useEffect executado');
    }

    // Só executar no cliente
    if (typeof window !== 'undefined') {
      if (process.env.NODE_ENV === 'development') {
        console.log('🌐 Executando no cliente - chamando checkAuth');
      }

      // Executar imediatamente com força para primeira verificação
      checkAuth(true);

      // Listener para mudanças no localStorage
      const handleStorageChange = (e) => {
        if (e.key === 'ludomusic_session_token') {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Token mudou no localStorage - recarregando auth...');
          }
          checkAuth(true); // Forçar verificação quando token muda
        }
      };

      // Listener customizado para mudanças feitas na mesma aba
      const handleCustomStorageChange = () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Token mudou (custom) - recarregando auth...');
        }
        checkAuth(true); // Forçar verificação quando token muda
      };

      // Listener para quando a aba fica visível novamente
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          if (process.env.NODE_ENV === 'development') {
            console.log('👁️ Aba ficou visível - verificando auth...');
          }
          // Verificar se o usuário ainda está logado quando volta para a aba
          const token = sessionManager.getSessionToken();
          if (token && !isAuthenticated) {
            // Se tem token mas não está autenticado, tentar reautenticar
            checkAuth(true);
          } else if (token) {
            // Verificação normal (com rate limiting)
            checkAuth();
          }
        }
      };

      // Listener para detectar mudanças no localStorage de outras abas
      const handleStorageSync = (e) => {
        const sm = getSessionManager();
        if (e.key === sm.SESSION_KEY) {
          if (e.newValue && !isAuthenticated) {
            // Token foi adicionado em outra aba - sincronizar
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Token adicionado em outra aba - sincronizando...');
            }
            checkAuth(true);
          } else if (!e.newValue && isAuthenticated) {
            // Token foi removido em outra aba - fazer logout
            if (process.env.NODE_ENV === 'development') {
              console.log('🔄 Token removido em outra aba - fazendo logout...');
            }
            handleAuthError();
          }
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('storage', handleStorageSync);
      window.addEventListener('ludomusic-token-changed', handleCustomStorageChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('storage', handleStorageSync);
        window.removeEventListener('ludomusic-token-changed', handleCustomStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        const sm = getSessionManager();
        sm.stopHeartbeat();
      };
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.log('🖥️ Executando no servidor - definindo isLoading como false');
      }
      setIsLoading(false);
    }
  }, []);

  // Função de login
  const login = async (username, password) => {
    console.log('🔑 Tentando fazer login:', username);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          username,
          password
        })
      });

      const data = await response.json();
      console.log('🔑 Resposta do login:', data);

      if (response.ok && data.success && data.sessionToken) {
        // Salvar sessão com SessionManager
        const sm = getSessionManager();
        sm.saveSession(data.sessionToken, data.user);

        // Atualizar estado
        setUser(data.user);
        setIsAuthenticated(true);

        // Iniciar heartbeat
        sm.startHeartbeat(checkAuth);

        // Disparar evento para outros contextos
        window.dispatchEvent(new Event('ludomusic-token-changed'));

        console.log('✅ Login realizado com sucesso:', data.user.username);
        return { success: true, user: data.user };
      } else {
        console.log('❌ Login falhou:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de registro
  const register = async (username, password, email, anonymousUserId) => {
    console.log('📝 Tentando registrar usuário:', username);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          username,
          password,
          email,
          anonymousUserId
        })
      });

      const data = await response.json();
      console.log('📝 Resposta do registro:', data);

      if (response.ok && data.success && data.sessionToken) {
        // Salvar sessão com SessionManager
        const sm = getSessionManager();
        sm.saveSession(data.sessionToken, data.user);

        // Atualizar estado
        setUser(data.user);
        setIsAuthenticated(true);

        // Iniciar heartbeat
        sm.startHeartbeat(checkAuth);

        // Disparar evento para outros contextos
        window.dispatchEvent(new Event('ludomusic-token-changed'));

        console.log('✅ Registro realizado com sucesso:', data.user.username);
        return { success: true, user: data.user, message: data.message };
      } else {
        console.log('❌ Registro falhou:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return { success: false, error: error.message };
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = async () => {
    console.log('🚪 Fazendo logout...');

    // Limpar sessão completamente com SessionManager
    const sm = getSessionManager();
    sm.clearSession();

    // Limpar estado
    setUser(null);
    setIsAuthenticated(false);

    // Disparar evento
    window.dispatchEvent(new Event('ludomusic-token-changed'));

    console.log('✅ Logout realizado');
    return { success: true };
  };

  const value = {
    user,
    username: user?.username, // Adicionar username como propriedade separada
    userId: user ? `auth_${user.username}` : null, // Adicionar userId como propriedade
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkSession: checkAuth, // Expor função para recarregar
    getAuthenticatedUserId: () => user ? `auth_${user.username}` : null
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};


