// Sistema de diagnóstico de autenticação
import { AuthCookies } from './cookies';

class AuthDiagnostic {
  constructor() {
    this.logs = [];
    this.maxLogs = 50;
  }

  log(type, message, data = null) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type, // 'info', 'warning', 'error', 'success'
      message,
      data
    };

    this.logs.unshift(logEntry);
    
    // Manter apenas os últimos logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log no console em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const emoji = {
        info: 'ℹ️',
        warning: '⚠️',
        error: '❌',
        success: '✅'
      };
      
      console.log(`${emoji[type]} [AUTH] ${message}`, data || '');
    }
  }

  // Verificar estado atual da autenticação
  checkAuthState() {
    const sessionToken = AuthCookies.getSessionToken();
    const userData = AuthCookies.getUserData();
    const hasLocalStorage = typeof localStorage !== 'undefined';
    
    let localStorageToken = null;
    let localStorageUser = null;
    
    if (hasLocalStorage) {
      localStorageToken = localStorage.getItem('ludomusic_session_token');
      localStorageUser = localStorage.getItem('ludomusic_user_data');
    }

    const state = {
      cookies: {
        hasToken: !!sessionToken,
        hasUserData: !!userData,
        tokenLength: sessionToken?.length || 0,
        userData: userData ? {
          username: userData.username,
          displayName: userData.displayName
        } : null
      },
      localStorage: {
        available: hasLocalStorage,
        hasToken: !!localStorageToken,
        hasUserData: !!localStorageUser,
        tokenLength: localStorageToken?.length || 0,
        tokenMatch: sessionToken === localStorageToken
      },
      sync: {
        tokensMatch: sessionToken === localStorageToken,
        bothHaveData: !!sessionToken && !!localStorageToken
      }
    };

    this.log('info', 'Estado da autenticação verificado', state);
    return state;
  }

  // Verificar se token está expirado
  async checkTokenValidity() {
    const sessionToken = AuthCookies.getSessionToken();
    
    if (!sessionToken) {
      this.log('warning', 'Nenhum token encontrado');
      return { valid: false, reason: 'no_token' };
    }

    try {
      const response = await fetch(`/api/auth?sessionToken=${sessionToken}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        this.log('success', 'Token válido');
        return { valid: true, data: await response.json() };
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.log('error', `Token inválido: ${response.status}`, errorData);
        return { 
          valid: false, 
          reason: 'invalid_token',
          status: response.status,
          error: errorData.error
        };
      }
    } catch (error) {
      this.log('error', 'Erro ao verificar token', error.message);
      return { 
        valid: false, 
        reason: 'network_error',
        error: error.message
      };
    }
  }

  // Tentar renovar token
  async attemptTokenRenewal() {
    const sessionToken = AuthCookies.getSessionToken();
    const userData = AuthCookies.getUserData();

    if (!sessionToken || !userData) {
      this.log('error', 'Dados insuficientes para renovação');
      return { success: false, reason: 'insufficient_data' };
    }

    try {
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

      if (response.ok) {
        const data = await response.json();
        this.log('success', 'Token renovado com sucesso');
        return { success: true, data };
      } else {
        const errorData = await response.json().catch(() => ({}));
        this.log('error', `Falha na renovação: ${response.status}`, errorData);
        return { 
          success: false, 
          reason: 'renewal_failed',
          status: response.status,
          error: errorData.error
        };
      }
    } catch (error) {
      this.log('error', 'Erro na renovação', error.message);
      return { 
        success: false, 
        reason: 'network_error',
        error: error.message
      };
    }
  }

  // Limpar dados corrompidos
  clearCorruptedData() {
    try {
      AuthCookies.clearAuth();
      
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ludomusic_session_token');
        localStorage.removeItem('ludomusic_user_data');
      }
      
      this.log('success', 'Dados corrompidos limpos');
      return true;
    } catch (error) {
      this.log('error', 'Erro ao limpar dados', error.message);
      return false;
    }
  }

  // Sincronizar cookies e localStorage
  syncStorage() {
    try {
      const sessionToken = AuthCookies.getSessionToken();
      const userData = AuthCookies.getUserData();

      if (sessionToken && userData && typeof localStorage !== 'undefined') {
        localStorage.setItem('ludomusic_session_token', sessionToken);
        localStorage.setItem('ludomusic_user_data', JSON.stringify(userData));
        this.log('success', 'Storage sincronizado');
        return true;
      } else {
        this.log('warning', 'Dados insuficientes para sincronização');
        return false;
      }
    } catch (error) {
      this.log('error', 'Erro na sincronização', error.message);
      return false;
    }
  }

  // Diagnóstico completo
  async runFullDiagnostic() {
    this.log('info', 'Iniciando diagnóstico completo');

    const results = {
      authState: this.checkAuthState(),
      tokenValidity: await this.checkTokenValidity(),
      timestamp: new Date().toISOString()
    };

    // Se token inválido, tentar renovar
    if (!results.tokenValidity.valid && results.authState.cookies.hasToken) {
      this.log('info', 'Tentando renovar token...');
      results.tokenRenewal = await this.attemptTokenRenewal();
    }

    this.log('info', 'Diagnóstico completo finalizado', results);
    return results;
  }

  // Obter logs recentes
  getLogs(limit = 10) {
    return this.logs.slice(0, limit);
  }

  // Limpar logs
  clearLogs() {
    this.logs = [];
    this.log('info', 'Logs limpos');
  }

  // Exportar diagnóstico para debug
  exportDiagnostic() {
    return {
      logs: this.logs,
      authState: this.checkAuthState(),
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    };
  }
}

// Instância global
const authDiagnostic = new AuthDiagnostic();

export default authDiagnostic;

// Funções de conveniência
export const logAuth = (type, message, data) => authDiagnostic.log(type, message, data);
export const checkAuth = () => authDiagnostic.checkAuthState();
export const validateToken = () => authDiagnostic.checkTokenValidity();
export const renewToken = () => authDiagnostic.attemptTokenRenewal();
export const runDiagnostic = () => authDiagnostic.runFullDiagnostic();

// Função global para debug
if (typeof window !== 'undefined') {
  window.authDiagnostic = authDiagnostic;
}
