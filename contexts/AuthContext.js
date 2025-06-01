// Contexto de autenticação
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

  // Verificar se há sessão ativa ao carregar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      checkSession();
    }
  }, []);

  // Função para verificar sessão existente
  const checkSession = async () => {
    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');

      if (!sessionToken) {
        console.log('🔍 Nenhum token de sessão encontrado');
        setIsLoading(false);
        return;
      }

      console.log('🔍 Verificando sessão existente...');
      const response = await fetch(`/api/auth?sessionToken=${sessionToken}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ Sessão válida encontrada:', data.user.displayName);

        // Atualizar localStorage com dados mais recentes se necessário
        const currentUserData = JSON.stringify(data.user);
        const savedUserData = localStorage.getItem('ludomusic_user_data');
        if (savedUserData !== currentUserData) {
          localStorage.setItem('ludomusic_user_data', currentUserData);
        }
      } else {
        // Sessão inválida, mas não remover token imediatamente
        // Pode ser um erro temporário de rede
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Erro na verificação de sessão:', response.status, errorData.error);

        // Só remover token se for erro 401 (não autorizado) ou 404 (não encontrado)
        if (response.status === 401 || response.status === 404) {
          localStorage.removeItem('ludomusic_session_token');
          localStorage.removeItem('ludomusic_user_data');
          console.log('❌ Sessão inválida, removendo token');
        } else {
          // Para outros erros, tentar carregar dados do localStorage como fallback
          const savedUserData = localStorage.getItem('ludomusic_user_data');
          if (savedUserData) {
            try {
              const userData = JSON.parse(savedUserData);
              setUser(userData);
              setIsAuthenticated(true);
              console.log('📱 Usando dados salvos localmente como fallback');
            } catch (e) {
              console.error('Erro ao parsear dados salvos:', e);
              localStorage.removeItem('ludomusic_user_data');
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar sessão (rede):', error);

      // Em caso de erro de rede, tentar carregar dados do localStorage
      const savedUserData = localStorage.getItem('ludomusic_user_data');
      if (savedUserData) {
        try {
          const userData = JSON.parse(savedUserData);
          setUser(userData);
          setIsAuthenticated(true);
          console.log('📱 Usando dados salvos localmente (erro de rede)');
        } catch (e) {
          console.error('Erro ao parsear dados salvos:', e);
          localStorage.removeItem('ludomusic_user_data');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para registrar usuário
  const register = async (username, password, email = null, anonymousUserId = null) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'register',
          username,
          password,
          email,
          anonymousUserId
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar token de sessão
        localStorage.setItem('ludomusic_session_token', data.sessionToken);
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ Usuário registrado:', data.user.displayName);
        return { success: true, user: data.user };
      } else {
        console.error('❌ Erro no registro:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro na requisição de registro:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para fazer login
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'login',
          username,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar token de sessão e dados do usuário
        localStorage.setItem('ludomusic_session_token', data.sessionToken);
        localStorage.setItem('ludomusic_user_data', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ Login realizado:', data.user.displayName);
        return { success: true, user: data.user };
      } else {
        console.error('❌ Erro no login:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('❌ Erro na requisição de login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      
      if (sessionToken) {
        await fetch('/api/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'logout',
            sessionToken
          })
        });
      }

      // Limpar dados locais
      localStorage.removeItem('ludomusic_session_token');
      localStorage.removeItem('ludomusic_user_data');
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout realizado');

      return { success: true };
    } catch (error) {
      console.error('❌ Erro no logout:', error);
      // Mesmo com erro, limpar dados locais
      localStorage.removeItem('ludomusic_session_token');
      localStorage.removeItem('ludomusic_user_data');
      setUser(null);
      setIsAuthenticated(false);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para obter ID do usuário autenticado
  const getAuthenticatedUserId = () => {
    if (isAuthenticated && user) {
      return `auth_${user.username}`;
    }
    return null;
  };

  // Função para obter dados completos do usuário autenticado
  const getAuthenticatedUser = () => {
    if (isAuthenticated && user) {
      return user;
    }
    return null;
  };

  // Função para verificar se usuário está logado
  const requireAuth = () => {
    return isAuthenticated && user;
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    checkSession,
    getAuthenticatedUserId,
    getAuthenticatedUser,
    requireAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
