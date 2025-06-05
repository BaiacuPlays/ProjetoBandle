// Script de teste para verificar problemas de autenticação
import authDiagnostic from './authDiagnostic';
import { AuthCookies } from './cookies';

class AuthTester {
  constructor() {
    this.results = [];
  }

  log(test, status, message, data = null) {
    const result = {
      test,
      status, // 'pass', 'fail', 'warning'
      message,
      data,
      timestamp: new Date().toISOString()
    };
    
    this.results.push(result);
    
    const emoji = {
      pass: '✅',
      fail: '❌',
      warning: '⚠️'
    };
    
    console.log(`${emoji[status]} [AUTH-TEST] ${test}: ${message}`, data || '');
  }

  // Teste 1: Verificar se cookies e localStorage estão sincronizados
  testStorageSync() {
    try {
      const cookieToken = AuthCookies.getSessionToken();
      const localToken = localStorage.getItem('ludomusic_session_token');
      
      if (cookieToken && localToken && cookieToken === localToken) {
        this.log('Storage Sync', 'pass', 'Cookies e localStorage sincronizados');
      } else if (!cookieToken && !localToken) {
        this.log('Storage Sync', 'pass', 'Nenhum token presente (estado limpo)');
      } else {
        this.log('Storage Sync', 'fail', 'Inconsistência entre cookies e localStorage', {
          cookie: cookieToken ? 'presente' : 'ausente',
          localStorage: localToken ? 'presente' : 'ausente'
        });
      }
    } catch (error) {
      this.log('Storage Sync', 'fail', 'Erro ao verificar sincronização', error.message);
    }
  }

  // Teste 2: Verificar validade do token
  async testTokenValidity() {
    try {
      const token = AuthCookies.getSessionToken();
      
      if (!token) {
        this.log('Token Validity', 'pass', 'Nenhum token para validar');
        return;
      }

      const response = await fetch(`/api/auth?sessionToken=${token}`);
      
      if (response.ok) {
        this.log('Token Validity', 'pass', 'Token válido');
      } else {
        const errorData = await response.json();
        this.log('Token Validity', 'fail', 'Token inválido', errorData);
      }
    } catch (error) {
      this.log('Token Validity', 'fail', 'Erro ao validar token', error.message);
    }
  }

  // Teste 3: Verificar se APIs autenticadas funcionam
  async testAuthenticatedAPI() {
    try {
      const token = AuthCookies.getSessionToken();
      
      if (!token) {
        this.log('Authenticated API', 'warning', 'Sem token para testar APIs autenticadas');
        return;
      }

      const response = await fetch('/api/simple-friends?action=friends', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        this.log('Authenticated API', 'pass', 'API autenticada funcionando');
      } else {
        const errorData = await response.json();
        this.log('Authenticated API', 'fail', 'Erro na API autenticada', errorData);
      }
    } catch (error) {
      this.log('Authenticated API', 'fail', 'Erro ao testar API autenticada', error.message);
    }
  }

  // Teste 4: Verificar se busca de usuários funciona
  async testUserSearch() {
    try {
      const userData = AuthCookies.getUserData();
      
      if (!userData) {
        this.log('User Search', 'warning', 'Sem dados de usuário para testar busca');
        return;
      }

      const currentUserId = `auth_${userData.username}`;
      const response = await fetch(`/api/search-users?query=test&currentUserId=${encodeURIComponent(currentUserId)}`);

      if (response.status === 404) {
        this.log('User Search', 'pass', 'API de busca funcionando (usuário não encontrado é esperado)');
      } else if (response.ok) {
        this.log('User Search', 'pass', 'API de busca funcionando');
      } else {
        const errorData = await response.json();
        this.log('User Search', 'fail', 'Erro na busca de usuários', errorData);
      }
    } catch (error) {
      this.log('User Search', 'fail', 'Erro ao testar busca de usuários', error.message);
    }
  }

  // Teste 5: Verificar diagnóstico automático
  async testAutoDiagnostic() {
    try {
      const diagnostic = await authDiagnostic.runFullDiagnostic();
      
      if (diagnostic.commonIssues.length === 0) {
        this.log('Auto Diagnostic', 'pass', 'Nenhum problema detectado');
      } else {
        const criticalIssues = diagnostic.commonIssues.filter(issue => issue.severity === 'high');
        if (criticalIssues.length > 0) {
          this.log('Auto Diagnostic', 'fail', 'Problemas críticos detectados', criticalIssues);
        } else {
          this.log('Auto Diagnostic', 'warning', 'Problemas menores detectados', diagnostic.commonIssues);
        }
      }
    } catch (error) {
      this.log('Auto Diagnostic', 'fail', 'Erro no diagnóstico automático', error.message);
    }
  }

  // Executar todos os testes
  async runAllTests() {
    console.log('🧪 Iniciando testes de autenticação...');
    
    this.testStorageSync();
    await this.testTokenValidity();
    await this.testAuthenticatedAPI();
    await this.testUserSearch();
    await this.testAutoDiagnostic();
    
    const summary = this.getSummary();
    console.log('📊 Resumo dos testes:', summary);
    
    return {
      results: this.results,
      summary
    };
  }

  // Obter resumo dos resultados
  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    return {
      total,
      passed,
      failed,
      warnings,
      success: failed === 0
    };
  }
}

// Instância global para uso no console
const authTester = new AuthTester();

// Disponibilizar globalmente para debug
if (typeof window !== 'undefined') {
  window.authTester = authTester;
  window.testAuth = () => authTester.runAllTests();
}

export default authTester;
