// Contexto de autenticação
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthCookies, FriendsCookies } from '../utils/cookies';

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
      // Tentar obter token dos cookies primeiro, depois localStorage
      const sessionToken = AuthCookies.getSessionToken();

      if (!sessionToken) {
        setIsLoading(false);
        return;
      }
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

        // Atualizar cookies e localStorage com dados mais recentes se necessário
        const currentUserData = JSON.stringify(data.user);
        const savedUserData = AuthCookies.getUserData();
        if (!savedUserData || JSON.stringify(savedUserData) !== currentUserData) {
          AuthCookies.saveAuth(sessionToken, data.user, AuthCookies.shouldRemember());
        }
      } else {
        // Sessão inválida, mas não remover token imediatamente
        // Pode ser um erro temporário de rede
        const errorData = await response.json().catch(() => ({}));

        // Só remover token em casos específicos de sessão realmente inválida
        if (response.status === 401 &&
            (errorData.error === 'Sessão inválida ou expirada' ||
             errorData.error === 'Sessão expirada' ||
             errorData.error === 'Token de sessão não fornecido')) {

          // Em vez de remover imediatamente, usar dados dos cookies/localStorage como fallback
          const savedUserData = AuthCookies.getUserData();
          if (savedUserData) {
            try {
              setUser(savedUserData);
              setIsAuthenticated(true);
            } catch (e) {
              // Só remover se os dados estão corrompidos
              AuthCookies.clearAuth();
            }
          } else {
            // Só remover token se não há dados salvos
            AuthCookies.clearAuth();
          }
        } else {
          // Para outros erros (500, timeout, etc.), usar dados dos cookies/localStorage como fallback
          const savedUserData = AuthCookies.getUserData();
          if (savedUserData) {
            try {
              setUser(savedUserData);
              setIsAuthenticated(true);
            } catch (e) {
              // Só remover se os dados estão corrompidos
              AuthCookies.clearAuth();
            }
          }
        }
      }
    } catch (error) {
      // Em caso de erro de rede, tentar carregar dados dos cookies/localStorage
      const savedUserData = AuthCookies.getUserData();
      if (savedUserData) {
        try {
          setUser(savedUserData);
          setIsAuthenticated(true);
        } catch (e) {
          AuthCookies.clearAuth();
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Função para registrar usuário
  const register = async (username, password, email = null, anonymousUserId = null) => {
    try {
      // Capturar código de referência da URL se existir
      const urlParams = new URLSearchParams(window.location.search);
      const referralCode = urlParams.get('ref');

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
          anonymousUserId,
          referralCode
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Salvar token de sessão e dados do usuário nos cookies e localStorage
        AuthCookies.saveAuth(data.sessionToken, data.user, true); // Sempre lembrar no registro
        setUser(data.user);
        setIsAuthenticated(true);

        // Disparar evento customizado para notificar outros componentes sobre o registro
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: data.user }
        }));

        // Mostrar mensagem de referral se houver
        if (data.referralMessage) {
          setTimeout(() => {
            alert(`🎉 ${data.referralMessage}`);
          }, 1000);
        }

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para fazer login
  const login = async (username, password, rememberMe = true) => {
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
        // Salvar token de sessão e dados do usuário nos cookies e localStorage
        AuthCookies.saveAuth(data.sessionToken, data.user, rememberMe);
        setUser(data.user);
        setIsAuthenticated(true);

        // Disparar evento customizado para notificar outros componentes sobre o login
        window.dispatchEvent(new CustomEvent('userLoggedIn', {
          detail: { user: data.user }
        }));

        return { success: true, user: data.user };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para fazer logout
  const logout = async () => {
    try {
      const sessionToken = AuthCookies.getSessionToken();

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

      // Limpar dados dos cookies e localStorage
      AuthCookies.clearAuth();
      FriendsCookies.clearFriendsData(); // Limpar dados dos amigos também
      setUser(null);
      setIsAuthenticated(false);

      return { success: true };
    } catch (error) {
      // Mesmo com erro, limpar dados locais
      AuthCookies.clearAuth();
      FriendsCookies.clearFriendsData(); // Limpar dados dos amigos também
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

    // Fallback: tentar obter dos cookies/localStorage
    try {
      const savedUserData = AuthCookies.getUserData();
      if (savedUserData) {
        return `auth_${savedUserData.username}`;
      }
    } catch (error) {
      // Silent error handling
    }

    return null;
  };

  // Função para obter dados completos do usuário autenticado
  const getAuthenticatedUser = () => {
    if (isAuthenticated && user) {
      return user;
    }

    // Fallback: tentar obter dos cookies/localStorage
    try {
      const savedUserData = AuthCookies.getUserData();
      if (savedUserData) {
        return savedUserData;
      }
    } catch (error) {
      // Silent error handling
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
