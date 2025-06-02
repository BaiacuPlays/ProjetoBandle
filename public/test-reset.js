// Script para testar se o reset de conta funciona corretamente
// Execute no console: loadScript('/test-reset.js')

(function() {
  'use strict';
  
  console.log('🧪 INICIANDO TESTE DE RESET DE CONTA...');
  
  // Função para carregar o script
  window.loadScript = function(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  };
  
  // Classe para testar o reset
  class ResetTester {
    constructor() {
      this.testResults = [];
      this.errors = [];
      this.originalData = {};
    }
    
    // Capturar dados antes do reset
    captureDataBeforeReset() {
      console.log('📸 Capturando dados antes do reset...');
      
      try {
        // Capturar localStorage
        this.originalData.localStorage = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('ludomusic_')) {
            this.originalData.localStorage[key] = localStorage.getItem(key);
          }
        }
        
        // Capturar cookies
        this.originalData.cookies = {};
        const cookieNames = [
          'ludomusic_session_token',
          'ludomusic_user_data',
          'ludomusic_friends',
          'ludomusic_friend_requests'
        ];
        
        cookieNames.forEach(name => {
          const value = this.getCookie(name);
          if (value) {
            this.originalData.cookies[name] = value;
          }
        });
        
        console.log('📊 Dados capturados:');
        console.log(`   - localStorage: ${Object.keys(this.originalData.localStorage).length} chaves`);
        console.log(`   - cookies: ${Object.keys(this.originalData.cookies).length} cookies`);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao capturar dados:', error);
        return false;
      }
    }
    
    // Verificar se os dados foram limpos após reset
    verifyDataCleanup() {
      console.log('🔍 Verificando limpeza de dados...');
      
      const results = {
        localStorageClean: true,
        cookiesClean: true,
        tutorialReset: true
      };
      
      // Verificar localStorage
      const remainingKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('ludomusic_')) {
          // Permitir apenas algumas chaves que devem permanecer
          const allowedKeys = [
            'ludomusic_session_token', // Token de sessão deve permanecer para manter login
            'ludomusic_user_data',     // Dados básicos do usuário
            'ludomusic_profile_'       // Novo perfil resetado
          ];
          
          const isAllowed = allowedKeys.some(allowed => key.startsWith(allowed));
          if (!isAllowed) {
            remainingKeys.push(key);
            results.localStorageClean = false;
          }
        }
      }
      
      if (remainingKeys.length > 0) {
        console.log('❌ Dados não limpos no localStorage:', remainingKeys);
        this.errors.push(`localStorage não limpo: ${remainingKeys.join(', ')}`);
      } else {
        console.log('✅ localStorage limpo corretamente');
      }
      
      // Verificar cookies (alguns devem permanecer para manter login)
      const problematicCookies = [];
      const cookiesToCheck = [
        'ludomusic_friends',
        'ludomusic_friend_requests',
        'ludomusic_friends_backup'
      ];
      
      cookiesToCheck.forEach(name => {
        if (this.getCookie(name)) {
          problematicCookies.push(name);
          results.cookiesClean = false;
        }
      });
      
      if (problematicCookies.length > 0) {
        console.log('❌ Cookies não limpos:', problematicCookies);
        this.errors.push(`Cookies não limpos: ${problematicCookies.join(', ')}`);
      } else {
        console.log('✅ Cookies limpos corretamente');
      }
      
      // Verificar se tutorial foi resetado
      const tutorialSeen = localStorage.getItem('ludomusic_tutorial_seen');
      if (tutorialSeen === 'true') {
        console.log('❌ Tutorial não foi resetado');
        this.errors.push('Tutorial não foi resetado');
        results.tutorialReset = false;
      } else {
        console.log('✅ Tutorial resetado corretamente');
      }
      
      return results;
    }
    
    // Verificar se o perfil foi resetado no servidor
    async verifyServerReset() {
      console.log('🌐 Verificando reset no servidor...');
      
      try {
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (!sessionToken) {
          console.log('❌ Token de sessão não encontrado');
          return false;
        }
        
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${sessionToken}`
          }
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao buscar perfil do servidor');
          return false;
        }
        
        const data = await response.json();
        const profile = data.profile;
        
        // Verificar se foi resetado
        const isReset = (
          profile.stats.xp === 0 &&
          profile.stats.level === 1 &&
          profile.stats.gamesPlayed === 0 &&
          profile.achievements.length === 0 &&
          profile.badges.length === 0
        );
        
        if (isReset) {
          console.log('✅ Perfil resetado corretamente no servidor');
          console.log('📊 Dados do perfil resetado:', {
            xp: profile.stats.xp,
            level: profile.stats.level,
            gamesPlayed: profile.stats.gamesPlayed,
            achievements: profile.achievements.length,
            badges: profile.badges.length
          });
        } else {
          console.log('❌ Perfil NÃO foi resetado no servidor');
          console.log('📊 Dados atuais do perfil:', {
            xp: profile.stats.xp,
            level: profile.stats.level,
            gamesPlayed: profile.stats.gamesPlayed,
            achievements: profile.achievements.length,
            badges: profile.badges.length
          });
          this.errors.push('Perfil não foi resetado no servidor');
        }
        
        return isReset;
      } catch (error) {
        console.error('❌ Erro ao verificar servidor:', error);
        this.errors.push(`Erro ao verificar servidor: ${error.message}`);
        return false;
      }
    }
    
    // Testar funcionalidades básicas após reset
    async testBasicFunctionality() {
      console.log('🧪 Testando funcionalidades básicas...');
      
      const results = {
        canAccessProfile: false,
        canPlayGame: false,
        tutorialWillShow: false
      };
      
      try {
        // Testar acesso ao perfil
        const sessionToken = localStorage.getItem('ludomusic_session_token');
        if (sessionToken) {
          const response = await fetch('/api/profile', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${sessionToken}`
            }
          });
          
          if (response.ok) {
            results.canAccessProfile = true;
            console.log('✅ Pode acessar perfil após reset');
          } else {
            console.log('❌ Não pode acessar perfil após reset');
            this.errors.push('Não pode acessar perfil após reset');
          }
        }
        
        // Verificar se tutorial aparecerá
        const tutorialSeen = localStorage.getItem('ludomusic_tutorial_seen');
        if (!tutorialSeen || tutorialSeen !== 'true') {
          results.tutorialWillShow = true;
          console.log('✅ Tutorial aparecerá para conta resetada');
        } else {
          console.log('❌ Tutorial NÃO aparecerá para conta resetada');
          this.errors.push('Tutorial não aparecerá para conta resetada');
        }
        
        // Assumir que pode jogar (difícil testar automaticamente)
        results.canPlayGame = true;
        console.log('✅ Assumindo que pode jogar (teste manual necessário)');
        
      } catch (error) {
        console.error('❌ Erro ao testar funcionalidades:', error);
        this.errors.push(`Erro ao testar funcionalidades: ${error.message}`);
      }
      
      return results;
    }
    
    // Executar teste completo
    async runCompleteTest() {
      console.log('🚀 EXECUTANDO TESTE COMPLETO DE RESET...');
      console.log('⚠️ IMPORTANTE: Execute este teste APÓS fazer o reset da conta');
      
      // 1. Verificar limpeza de dados
      const cleanupResults = this.verifyDataCleanup();
      
      // 2. Verificar reset no servidor
      const serverReset = await this.verifyServerReset();
      
      // 3. Testar funcionalidades básicas
      const functionalityResults = await this.testBasicFunctionality();
      
      // Gerar relatório
      const report = {
        success: this.errors.length === 0,
        errors: this.errors,
        results: {
          cleanup: cleanupResults,
          serverReset: serverReset,
          functionality: functionalityResults
        }
      };
      
      this.displayReport(report);
      return report;
    }
    
    // Exibir relatório
    displayReport(report) {
      console.log('\n📊 RELATÓRIO DO TESTE DE RESET');
      console.log('===============================');
      
      if (report.success) {
        console.log('✅ RESET FUNCIONOU PERFEITAMENTE!');
        console.log('✅ A conta está funcionando como se fosse nova');
      } else {
        console.log('❌ PROBLEMAS ENCONTRADOS NO RESET!');
        console.log(`❌ ${report.errors.length} erro(s) encontrado(s)`);
        
        console.log('\n🚨 ERROS:');
        report.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. ${error}`);
        });
      }
      
      console.log('\n📋 DETALHES:');
      console.log('Limpeza de dados:', report.results.cleanup);
      console.log('Reset no servidor:', report.results.serverReset ? '✅' : '❌');
      console.log('Funcionalidades básicas:', report.results.functionality);
      
      console.log('\n===============================');
      
      if (report.success) {
        console.log('🎉 A conta foi resetada com sucesso e está funcionando como nova!');
      } else {
        console.log('⚠️ Há problemas que precisam ser corrigidos.');
      }
    }
    
    // Função auxiliar para obter cookie
    getCookie(name) {
      if (typeof document === 'undefined') return null;
      
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    }
  }
  
  // Criar instância global
  const resetTester = new ResetTester();
  
  // Expor funções globalmente
  window.testReset = {
    runComplete: () => resetTester.runCompleteTest(),
    captureData: () => resetTester.captureDataBeforeReset(),
    verifyCleanup: () => resetTester.verifyDataCleanup(),
    verifyServer: () => resetTester.verifyServerReset(),
    testFunctionality: () => resetTester.testBasicFunctionality()
  };
  
  console.log('🔧 COMANDOS DISPONÍVEIS:');
  console.log('   testReset.runComplete() - Executar teste completo');
  console.log('   testReset.captureData() - Capturar dados antes do reset');
  console.log('   testReset.verifyCleanup() - Verificar limpeza de dados');
  console.log('   testReset.verifyServer() - Verificar reset no servidor');
  console.log('   testReset.testFunctionality() - Testar funcionalidades');
  console.log('\n💡 COMO USAR:');
  console.log('1. Faça login na conta');
  console.log('2. Execute: testReset.captureData()');
  console.log('3. Faça o reset da conta no perfil');
  console.log('4. Execute: testReset.runComplete()');
  
})();
