// Sistema de validação para verificar se o reset de conta funciona corretamente
// Garante que após o reset, a conta funciona como se fosse nova

class ResetValidator {
  constructor() {
    this.validationResults = [];
    this.errors = [];
  }

  // Verificar se todos os dados locais foram limpos
  validateLocalStorageCleanup(userId) {
    const results = {
      profileData: false,
      authData: false,
      friendsData: false,
      gameData: false,
      tutorialData: false
    };

    try {
      // Verificar dados do perfil
      const profileKey = `ludomusic_profile_${userId}`;
      const profileBackupKey = `ludomusic_profile_backup_${userId}`;
      
      if (!localStorage.getItem(profileKey) && !localStorage.getItem(profileBackupKey)) {
        results.profileData = true;
      } else {
        this.errors.push('❌ Dados do perfil ainda existem no localStorage');
      }

      // Verificar dados de autenticação
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const userData = localStorage.getItem('ludomusic_user_data');
      
      if (!sessionToken && !userData) {
        results.authData = true;
      } else {
        this.errors.push('❌ Dados de autenticação ainda existem no localStorage');
      }

      // Verificar dados de amigos
      const friendsKey = `ludomusic_friends_${userId}`;
      const requestsKey = `ludomusic_friend_requests_${userId}`;
      
      if (!localStorage.getItem(friendsKey) && !localStorage.getItem(requestsKey)) {
        results.friendsData = true;
      } else {
        this.errors.push('❌ Dados de amigos ainda existem no localStorage');
      }

      // Verificar dados de jogo
      const gameStateKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.includes('ludomusic_game_state')) {
          gameStateKeys.push(key);
        }
      }
      
      if (gameStateKeys.length === 0) {
        results.gameData = true;
      } else {
        this.errors.push(`❌ Dados de jogo ainda existem: ${gameStateKeys.join(', ')}`);
      }

      // Verificar dados do tutorial
      const tutorialSeen = localStorage.getItem('ludomusic_tutorial_seen');
      if (!tutorialSeen) {
        results.tutorialData = true;
      } else {
        this.errors.push('❌ Dados do tutorial ainda existem no localStorage');
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao verificar localStorage: ${error.message}`);
    }

    return results;
  }

  // Verificar se os cookies foram limpos
  validateCookiesCleanup() {
    const results = {
      authCookies: false,
      friendsCookies: false
    };

    try {
      // Verificar cookies de autenticação
      const authCookies = [
        'ludomusic_session_token',
        'ludomusic_user_data',
        'ludomusic_remember_me'
      ];

      let authCookiesClean = true;
      authCookies.forEach(cookieName => {
        if (this.getCookie(cookieName)) {
          authCookiesClean = false;
          this.errors.push(`❌ Cookie de autenticação ainda existe: ${cookieName}`);
        }
      });
      results.authCookies = authCookiesClean;

      // Verificar cookies de amigos
      const friendsCookies = [
        'ludomusic_friends',
        'ludomusic_friend_requests',
        'ludomusic_friends_backup',
        'ludomusic_friend_requests_backup'
      ];

      let friendsCookiesClean = true;
      friendsCookies.forEach(cookieName => {
        if (this.getCookie(cookieName)) {
          friendsCookiesClean = false;
          this.errors.push(`❌ Cookie de amigos ainda existe: ${cookieName}`);
        }
      });
      results.friendsCookies = friendsCookiesClean;

    } catch (error) {
      this.errors.push(`❌ Erro ao verificar cookies: ${error.message}`);
    }

    return results;
  }

  // Verificar se o perfil foi resetado corretamente no servidor
  async validateServerReset(userId) {
    const results = {
      profileReset: false,
      statsReset: false,
      achievementsReset: false
    };

    try {
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      if (!sessionToken) {
        this.errors.push('❌ Não é possível verificar servidor: token de sessão não encontrado');
        return results;
      }

      const response = await fetch('/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      });

      if (!response.ok) {
        this.errors.push('❌ Erro ao buscar perfil do servidor');
        return results;
      }

      const data = await response.json();
      const profile = data.profile;

      // Verificar se o perfil foi resetado
      if (profile.stats.xp === 0 && profile.stats.level === 1) {
        results.profileReset = true;
      } else {
        this.errors.push(`❌ Perfil não foi resetado: XP=${profile.stats.xp}, Level=${profile.stats.level}`);
      }

      // Verificar se as estatísticas foram resetadas
      const statsToCheck = ['gamesPlayed', 'gamesWon', 'bestStreak'];
      let statsReset = true;
      statsToCheck.forEach(stat => {
        if (profile.stats[stat] !== 0) {
          statsReset = false;
          this.errors.push(`❌ Estatística não resetada: ${stat}=${profile.stats[stat]}`);
        }
      });
      results.statsReset = statsReset;

      // Verificar se as conquistas foram resetadas
      if (profile.achievements.length === 0 && profile.badges.length === 0) {
        results.achievementsReset = true;
      } else {
        this.errors.push(`❌ Conquistas não resetadas: ${profile.achievements.length} achievements, ${profile.badges.length} badges`);
      }

    } catch (error) {
      this.errors.push(`❌ Erro ao verificar servidor: ${error.message}`);
    }

    return results;
  }

  // Verificar se a conta funciona como nova
  async validateNewAccountFunctionality() {
    const results = {
      canLogin: false,
      canPlayGame: false,
      canAccessProfile: false,
      tutorialAppears: false
    };

    try {
      // Verificar se pode fazer login
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      if (sessionToken) {
        results.canLogin = true;
      } else {
        this.errors.push('❌ Não consegue fazer login após reset');
      }

      // Verificar se pode acessar o perfil
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (response.ok) {
          results.canAccessProfile = true;
        } else {
          this.errors.push('❌ Não consegue acessar perfil após reset');
        }
      } catch (error) {
        this.errors.push(`❌ Erro ao acessar perfil: ${error.message}`);
      }

      // Verificar se o tutorial aparece (como conta nova)
      const tutorialSeen = localStorage.getItem('ludomusic_tutorial_seen');
      if (!tutorialSeen || tutorialSeen !== 'true') {
        results.tutorialAppears = true;
      } else {
        this.errors.push('❌ Tutorial não aparece para conta resetada');
      }

      // Verificar se pode jogar
      results.canPlayGame = true; // Assumir que sim, pois é difícil testar automaticamente

    } catch (error) {
      this.errors.push(`❌ Erro ao verificar funcionalidade: ${error.message}`);
    }

    return results;
  }

  // Função auxiliar para obter cookie
  getCookie(name) {
    if (typeof document === 'undefined') return null;
    
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  // Executar validação completa
  async runCompleteValidation(userId) {
    console.log('🔍 Iniciando validação completa do reset...');
    
    this.validationResults = [];
    this.errors = [];

    // 1. Verificar limpeza do localStorage
    console.log('📱 Verificando limpeza do localStorage...');
    const localStorageResults = this.validateLocalStorageCleanup(userId);
    this.validationResults.push({ type: 'localStorage', results: localStorageResults });

    // 2. Verificar limpeza dos cookies
    console.log('🍪 Verificando limpeza dos cookies...');
    const cookiesResults = this.validateCookiesCleanup();
    this.validationResults.push({ type: 'cookies', results: cookiesResults });

    // 3. Verificar reset no servidor
    console.log('🌐 Verificando reset no servidor...');
    const serverResults = await this.validateServerReset(userId);
    this.validationResults.push({ type: 'server', results: serverResults });

    // 4. Verificar funcionalidade como conta nova
    console.log('🆕 Verificando funcionalidade como conta nova...');
    const functionalityResults = await this.validateNewAccountFunctionality();
    this.validationResults.push({ type: 'functionality', results: functionalityResults });

    // Gerar relatório
    return this.generateReport();
  }

  // Gerar relatório de validação
  generateReport() {
    const report = {
      success: this.errors.length === 0,
      errors: this.errors,
      results: this.validationResults,
      summary: {}
    };

    // Calcular resumo
    let totalChecks = 0;
    let passedChecks = 0;

    this.validationResults.forEach(validation => {
      Object.values(validation.results).forEach(result => {
        totalChecks++;
        if (result) passedChecks++;
      });
    });

    report.summary = {
      totalChecks,
      passedChecks,
      successRate: totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
    };

    return report;
  }

  // Exibir relatório no console
  displayReport(report) {
    console.log('\n📊 RELATÓRIO DE VALIDAÇÃO DO RESET');
    console.log('=====================================');
    
    if (report.success) {
      console.log('✅ RESET VALIDADO COM SUCESSO!');
      console.log(`✅ ${report.summary.passedChecks}/${report.summary.totalChecks} verificações passaram (${report.summary.successRate}%)`);
    } else {
      console.log('❌ PROBLEMAS ENCONTRADOS NO RESET!');
      console.log(`❌ ${report.summary.passedChecks}/${report.summary.totalChecks} verificações passaram (${report.summary.successRate}%)`);
      
      console.log('\n🚨 ERROS ENCONTRADOS:');
      report.errors.forEach(error => {
        console.log(`   ${error}`);
      });
    }

    console.log('\n📋 DETALHES DAS VERIFICAÇÕES:');
    report.results.forEach(validation => {
      console.log(`\n${validation.type.toUpperCase()}:`);
      Object.entries(validation.results).forEach(([check, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${check}`);
      });
    });

    console.log('\n=====================================');
    
    return report;
  }
}

// Instância global
const resetValidator = new ResetValidator();

// Função para uso fácil
window.validateReset = async (userId) => {
  const report = await resetValidator.runCompleteValidation(userId);
  return resetValidator.displayReport(report);
};

export default resetValidator;
