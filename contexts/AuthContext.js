// Contexto de autenticação
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthCookies, FriendsCookies } from '../utils/cookies';
import authDiagnostic, { logAuth } from '../utils/authDiagnostic';

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

  // Verificação periódica de saúde da autenticação (a cada 5 minutos)
  useEffect(() => {
    if (!isAuthenticated || typeof window === 'undefined') return;

    const healthCheck = setInterval(async () => {
      try {
        const diagnostic = await authDiagnostic.runFullDiagnostic();

        // Se detectou problemas críticos, tentar corrigir
        if (diagnostic.commonIssues.some(issue => issue.severity === 'high')) {
          logAuth('warning', 'Problemas críticos detectados na autenticação');

          // Se token inválido, tentar renovar
          if (!diagnostic.tokenValidity.valid) {
            const renewResult = await renewToken();
            if (!renewResult.success) {
              logAuth('error', 'Falha na renovação automática do token');
            }
          }
        }
      } catch (error) {
        logAuth('error', 'Erro na verificação de saúde da autenticação', error.message);
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(healthCheck);
  }, [isAuthenticated]);

  // Função para verificar sessão existente
  const checkSession = async () => {
    try {
      logAuth('info', 'Verificando sessão existente');

      // Tentar obter token dos cookies primeiro, depois localStorage
      const sessionToken = AuthCookies.getSessionToken();

      if (!sessionToken) {
        logAuth('warning', 'Nenhum token de sessão encontrado');
        setIsLoading(false);
        return;
      }

      logAuth('info', `Token encontrado (${sessionToken.length} chars)`);
      authDiagnostic.syncStorage(); // Sincronizar storage
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
        // Sessão inválida - tratar baseado no tipo de erro
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          // Verificar se é erro de token expirado vs inválido
          if (errorData.error === 'Sessão expirada') {
            // Token expirado - tentar renovar se possível
            const savedUserData = AuthCookies.getUserData();
            if (savedUserData) {
              // Manter dados do usuário mas marcar como não autenticado
              setUser(savedUserData);
              setIsAuthenticated(false);
              console.log('🔄 Sessão expirada - necessário relogin');
            } else {
              AuthCookies.clearAuth();
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Token inválido ou outros erros 401 - limpar tudo
            AuthCookies.clearAuth();
            setUser(null);
            setIsAuthenticated(false);
            console.log('❌ Sessão inválida - dados limpos');
          }
        } else {
          // Erro de rede ou servidor - manter dados locais
          const savedUserData = AuthCookies.getUserData();
          if (savedUserData) {
            setUser(savedUserData);
            setIsAuthenticated(true);
            console.log('🔄 Erro de rede - usando dados locais');
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

  // Função para renovar token automaticamente
  const renewToken = async () => {
    try {
      const sessionToken = AuthCookies.getSessionToken();
      const userData = AuthCookies.getUserData();

      if (!sessionToken || !userData) {
        return { success: false, error: 'Dados de sessão não encontrados' };
      }

      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'renew',
          sessionToken,
          username: userData.username
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Atualizar token e dados
        AuthCookies.saveAuth(data.sessionToken, data.user, AuthCookies.shouldRemember());
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ Token renovado com sucesso');
        return { success: true, user: data.user };
      } else {
        console.log('❌ Falha ao renovar token:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.log('❌ Erro ao renovar token:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  };

  // Função para verificar se usuário está logado
  const requireAuth = () => {
    return isAuthenticated && user;
  };

  // Função para executar diagnóstico de autenticação
  const runAuthDiagnostic = async () => {
    return await authDiagnostic.runFullDiagnostic();
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    register,
    login,
    logout,
    checkSession,
    renewToken,
    getAuthenticatedUserId,
    getAuthenticatedUser,
    requireAuth,
    runAuthDiagnostic
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
