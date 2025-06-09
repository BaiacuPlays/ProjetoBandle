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

  console.log('🔐 AuthProvider: Estado atual:', {
    user: user?.username,
    isAuthenticated,
    isLoading
  });

  // SOLUÇÃO SIMPLES - verificar autenticação
  const checkAuth = async () => {
    console.log('🔍 Verificando autenticação...');

    try {
      // Tentar todas as chaves possíveis
      const token = localStorage.getItem('ludomusic_session_token') ||
                   localStorage.getItem('sessionToken') ||
                   localStorage.getItem('session_token');

      console.log('🔍 Token encontrado:', token ? 'SIM' : 'NÃO');

      if (!token) {
        console.log('❌ Sem token - usuário não autenticado');
        setUser(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      console.log('🔍 Fazendo chamada para API...');
      const response = await fetch(`/api/auth?sessionToken=${token}`);
      const data = await response.json();

      console.log('🔍 Resposta da API:', data);

      if (response.ok && data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        console.log('✅ SUCESSO! Usuário autenticado:', data.user.username);
      } else {
        console.log('❌ API retornou erro ou dados inválidos');
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('❌ Erro na verificação:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('🔍 Verificação concluída');
    }
  };

  useEffect(() => {
    // Só executar no cliente
    if (typeof window !== 'undefined') {
      checkAuth();

      // Listener para mudanças no localStorage
      const handleStorageChange = (e) => {
        if (e.key === 'ludomusic_session_token') {
          console.log('🔄 Token mudou no localStorage - recarregando auth...');
          checkAuth();
        }
      };

      // Listener customizado para mudanças feitas na mesma aba
      const handleCustomStorageChange = () => {
        console.log('🔄 Token mudou (custom) - recarregando auth...');
        checkAuth();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('ludomusic-token-changed', handleCustomStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('ludomusic-token-changed', handleCustomStorageChange);
      };
    } else {
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
    userId: user ? `auth_${user.username}` : null, // Adicionar userId como propriedade
    isLoading,
    isAuthenticated,
    login,
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


