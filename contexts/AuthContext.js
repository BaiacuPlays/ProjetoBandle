// SOLUÇÃO SIMPLES E DIRETA - SEM COMPLICAÇÃO
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
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

  // SOLUÇÃO ROBUSTA - verificar autenticação com cache e rate limiting
  const checkAuth = async (force = false) => {
    const now = Date.now();

    // Evitar verificações muito frequentes
    if (!force && checkInProgress) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação já em andamento, ignorando...');
      }
      return;
    }

    if (!force && now - lastCheckTime < CHECK_INTERVAL) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação muito recente, ignorando...');
      }
      return;
    }

    setCheckInProgress(true);
    setLastCheckTime(now);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Verificando autenticação...');
    }

    try {
      // Tentar todas as chaves possíveis
      const token = localStorage.getItem('ludomusic_session_token') ||
                   localStorage.getItem('sessionToken') ||
                   localStorage.getItem('session_token');

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
        return;
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Fazendo chamada para API...');
      }

      // Timeout para evitar requisições que ficam pendentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos

      const response = await fetch(`/api/auth?sessionToken=${token}`, {
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Resposta da API:', data);
      }

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ SUCESSO! Usuário autenticado:', data.user.username);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ API retornou erro ou dados inválidos');
        }
        setUser(null);
        setIsAuthenticated(false);

        // Se token é inválido, remover do localStorage
        if (response.status === 401) {
          localStorage.removeItem('ludomusic_session_token');
          localStorage.removeItem('sessionToken');
          localStorage.removeItem('session_token');
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('⚠️ Timeout na verificação de autenticação');
      } else {
        console.error('❌ Erro na verificação:', error);
      }
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      setCheckInProgress(false);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Verificação concluída');
      }
    }
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
          checkAuth(); // Verificação normal (com rate limiting)
        }
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('ludomusic-token-changed', handleCustomStorageChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('ludomusic-token-changed', handleCustomStorageChange);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
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
        // Salvar token
        localStorage.setItem('ludomusic_session_token', data.sessionToken);

        // Atualizar estado
        setUser(data.user);
        setIsAuthenticated(true);

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
        // Salvar token
        localStorage.setItem('ludomusic_session_token', data.sessionToken);

        // Atualizar estado
        setUser(data.user);
        setIsAuthenticated(true);

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

    // Limpar token
    localStorage.removeItem('ludomusic_session_token');

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


