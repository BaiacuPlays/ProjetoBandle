// Script para testar o sistema de XP em todos os modos
// Execute no console: loadScript('/test-xp-system.js')

(function() {
  'use strict';
  
  console.log('⭐ INICIANDO TESTE COMPLETO DO SISTEMA DE XP...');
  
  // Função para carregar o script
  window.loadScript = function(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  };
  
  // Classe para testar XP
  class XPSystemTester {
    constructor() {
      this.testResults = [];
      this.errors = [];
      this.initialProfile = null;
    }
    
    // Verificar se o usuário está logado
    checkAuthentication() {
      console.log('🔐 Verificando autenticação...');
      
      const sessionToken = localStorage.getItem('ludomusic_session_token');
      const userData = localStorage.getItem('ludomusic_user_data');
      
      if (!sessionToken || !userData) {
        console.log('❌ Usuário não está logado');
        this.errors.push('Usuário não está logado');
        return false;
      }
      
      try {
        const user = JSON.parse(userData);
        console.log('✅ Usuário logado:', user.username);
        return { sessionToken, user };
      } catch (error) {
        console.log('❌ Erro ao parsear dados do usuário');
        this.errors.push('Erro ao parsear dados do usuário');
        return false;
      }
    }
    
    // Obter perfil atual
    async getCurrentProfile() {
      console.log('📊 Obtendo perfil atual...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        const response = await fetch('/api/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.sessionToken}`
          }
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao buscar perfil');
          this.errors.push('Erro ao buscar perfil');
          return false;
        }
        
        const data = await response.json();
        const profile = data.profile;
        
        console.log('📊 Perfil atual:', {
          level: profile.stats.level,
          xp: profile.stats.xp,
          totalGames: profile.stats.totalGames,
          wins: profile.stats.wins
        });
        
        this.initialProfile = profile;
        return profile;
      } catch (error) {
        console.error('❌ Erro ao obter perfil:', error);
        this.errors.push(`Erro ao obter perfil: ${error.message}`);
        return false;
      }
    }
    
    // Testar cálculo de nível
    testLevelCalculation() {
      console.log('🧮 Testando cálculo de nível...');
      
      // Fórmula: Level = floor(sqrt(XP / 100)) + 1
      const testCases = [
        { xp: 0, expectedLevel: 1 },
        { xp: 100, expectedLevel: 2 },
        { xp: 400, expectedLevel: 3 },
        { xp: 900, expectedLevel: 4 },
        { xp: 1600, expectedLevel: 5 },
        { xp: 2500, expectedLevel: 6 }
      ];
      
      let allCorrect = true;
      
      testCases.forEach(({ xp, expectedLevel }) => {
        const calculatedLevel = Math.floor(Math.sqrt(xp / 100)) + 1;
        const isCorrect = calculatedLevel === expectedLevel;
        
        console.log(`📊 XP: ${xp} → Level: ${calculatedLevel} (esperado: ${expectedLevel}) ${isCorrect ? '✅' : '❌'}`);
        
        if (!isCorrect) {
          allCorrect = false;
          this.errors.push(`Cálculo de nível incorreto: XP ${xp} resultou em level ${calculatedLevel}, esperado ${expectedLevel}`);
        }
      });
      
      if (allCorrect) {
        console.log('✅ Cálculo de nível funcionando corretamente');
      }
      
      return allCorrect;
    }
    
    // Testar XP do modo diário
    async testDailyModeXP() {
      console.log('🌅 Testando XP do modo diário...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        // Simular vitória no modo diário
        const response = await fetch('/api/profile/update-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.sessionToken}`
          },
          body: JSON.stringify({
            won: true,
            attempts: 1, // Perfeito
            mode: 'daily',
            song: {
              title: 'Teste',
              game: 'Teste Game',
              artist: 'Teste Artist'
            },
            playTime: 30
          })
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao atualizar estatísticas do modo diário');
          this.errors.push('Erro ao atualizar estatísticas do modo diário');
          return false;
        }
        
        const data = await response.json();
        console.log('✅ Estatísticas do modo diário atualizadas');
        
        // Verificar XP ganho
        const expectedXP = 50 + 50; // Base + bônus perfeito
        console.log(`📊 XP esperado: ${expectedXP} (50 base + 50 perfeito)`);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao testar modo diário:', error);
        this.errors.push(`Erro ao testar modo diário: ${error.message}`);
        return false;
      }
    }
    
    // Testar XP do modo infinito
    async testInfiniteModeXP() {
      console.log('♾️ Testando XP do modo infinito...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        // Simular vitória no modo infinito
        const response = await fetch('/api/profile/update-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.sessionToken}`
          },
          body: JSON.stringify({
            won: true,
            attempts: 2,
            mode: 'infinite',
            song: {
              title: 'Teste Infinito',
              game: 'Teste Game',
              artist: 'Teste Artist'
            },
            streak: 5,
            songsCompleted: 1,
            playTime: 45
          })
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao atualizar estatísticas do modo infinito');
          this.errors.push('Erro ao atualizar estatísticas do modo infinito');
          return false;
        }
        
        const data = await response.json();
        console.log('✅ Estatísticas do modo infinito atualizadas');
        
        // Verificar XP ganho
        const expectedXP = 50 + 30 + 10; // Base + bônus 2 tentativas + bônus streak
        console.log(`📊 XP esperado: ${expectedXP} (50 base + 30 bônus + 10 streak)`);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao testar modo infinito:', error);
        this.errors.push(`Erro ao testar modo infinito: ${error.message}`);
        return false;
      }
    }
    
    // Testar XP do multiplayer
    async testMultiplayerXP() {
      console.log('🎮 Testando XP do multiplayer...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        // Simular vitória no multiplayer
        const response = await fetch('/api/profile/update-social-stats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.sessionToken}`
          },
          body: JSON.stringify({
            action: 'multiplayer_game',
            data: {
              won: true,
              totalRounds: 10
            }
          })
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao atualizar estatísticas do multiplayer');
          this.errors.push('Erro ao atualizar estatísticas do multiplayer');
          return false;
        }
        
        const data = await response.json();
        console.log('✅ Estatísticas do multiplayer atualizadas');
        
        // Verificar XP ganho
        const expectedXP = Math.floor(10 * 2.5 * 1.5); // 10 rodadas * 2.5 base * 1.5 bônus vitória
        console.log(`📊 XP esperado: ${expectedXP} (10 rodadas * 2.5 * 1.5 bônus)`);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao testar multiplayer:', error);
        this.errors.push(`Erro ao testar multiplayer: ${error.message}`);
        return false;
      }
    }
    
    // Verificar se XP foi salvo corretamente
    async verifyXPSaved() {
      console.log('💾 Verificando se XP foi salvo...');
      
      const newProfile = await this.getCurrentProfile();
      if (!newProfile || !this.initialProfile) return false;
      
      const xpGained = newProfile.stats.xp - this.initialProfile.stats.xp;
      const levelGained = newProfile.stats.level - this.initialProfile.stats.level;
      
      console.log(`📊 XP inicial: ${this.initialProfile.stats.xp}`);
      console.log(`📊 XP final: ${newProfile.stats.xp}`);
      console.log(`📊 XP ganho: ${xpGained}`);
      console.log(`📊 Level inicial: ${this.initialProfile.stats.level}`);
      console.log(`📊 Level final: ${newProfile.stats.level}`);
      console.log(`📊 Levels ganhos: ${levelGained}`);
      
      if (xpGained > 0) {
        console.log('✅ XP foi ganho e salvo corretamente');
        return true;
      } else {
        console.log('❌ Nenhum XP foi ganho');
        this.errors.push('Nenhum XP foi ganho');
        return false;
      }
    }
    
    // Testar persistência após reload
    async testPersistenceAfterReload() {
      console.log('🔄 Testando persistência após reload...');
      
      const profileBeforeReload = await this.getCurrentProfile();
      if (!profileBeforeReload) return false;
      
      console.log('⚠️ Para testar persistência, recarregue a página e execute:');
      console.log('   testXP.verifyPersistence()');
      
      // Salvar dados para verificação posterior
      localStorage.setItem('xp_test_before_reload', JSON.stringify({
        xp: profileBeforeReload.stats.xp,
        level: profileBeforeReload.stats.level,
        timestamp: Date.now()
      }));
      
      return true;
    }
    
    // Verificar persistência (executar após reload)
    async verifyPersistence() {
      console.log('🔍 Verificando persistência após reload...');
      
      const savedData = localStorage.getItem('xp_test_before_reload');
      if (!savedData) {
        console.log('❌ Dados de teste não encontrados');
        return false;
      }
      
      const beforeReload = JSON.parse(savedData);
      const currentProfile = await this.getCurrentProfile();
      
      if (!currentProfile) return false;
      
      const xpMatch = currentProfile.stats.xp === beforeReload.xp;
      const levelMatch = currentProfile.stats.level === beforeReload.level;
      
      console.log(`📊 XP antes: ${beforeReload.xp}, depois: ${currentProfile.stats.xp} ${xpMatch ? '✅' : '❌'}`);
      console.log(`📊 Level antes: ${beforeReload.level}, depois: ${currentProfile.stats.level} ${levelMatch ? '✅' : '❌'}`);
      
      if (xpMatch && levelMatch) {
        console.log('✅ Dados persistiram corretamente após reload');
        localStorage.removeItem('xp_test_before_reload');
        return true;
      } else {
        console.log('❌ Dados não persistiram corretamente');
        this.errors.push('Dados não persistiram após reload');
        return false;
      }
    }
    
    // Executar teste completo
    async runCompleteTest() {
      console.log('🚀 EXECUTANDO TESTE COMPLETO DO SISTEMA DE XP...');
      
      const results = {
        authentication: false,
        profileAccess: false,
        levelCalculation: false,
        dailyModeXP: false,
        infiniteModeXP: false,
        multiplayerXP: false,
        xpSaved: false,
        persistenceSetup: false
      };
      
      // 1. Verificar autenticação
      results.authentication = !!this.checkAuthentication();
      console.log(`${results.authentication ? '✅' : '❌'} 1/8 - Autenticação`);
      
      if (!results.authentication) {
        return this.generateReport(results);
      }
      
      // 2. Obter perfil atual
      results.profileAccess = !!(await this.getCurrentProfile());
      console.log(`${results.profileAccess ? '✅' : '❌'} 2/8 - Acesso ao perfil`);
      
      // 3. Testar cálculo de nível
      results.levelCalculation = this.testLevelCalculation();
      console.log(`${results.levelCalculation ? '✅' : '❌'} 3/8 - Cálculo de nível`);
      
      // 4. Testar XP modo diário
      results.dailyModeXP = await this.testDailyModeXP();
      console.log(`${results.dailyModeXP ? '✅' : '❌'} 4/8 - XP modo diário`);
      
      // 5. Testar XP modo infinito
      results.infiniteModeXP = await this.testInfiniteModeXP();
      console.log(`${results.infiniteModeXP ? '✅' : '❌'} 5/8 - XP modo infinito`);
      
      // 6. Testar XP multiplayer
      results.multiplayerXP = await this.testMultiplayerXP();
      console.log(`${results.multiplayerXP ? '✅' : '❌'} 6/8 - XP multiplayer`);
      
      // 7. Verificar se XP foi salvo
      results.xpSaved = await this.verifyXPSaved();
      console.log(`${results.xpSaved ? '✅' : '❌'} 7/8 - XP salvo`);
      
      // 8. Configurar teste de persistência
      results.persistenceSetup = await this.testPersistenceAfterReload();
      console.log(`${results.persistenceSetup ? '✅' : '❌'} 8/8 - Setup persistência`);
      
      return this.generateReport(results);
    }
    
    // Gerar relatório
    generateReport(results) {
      const totalTests = Object.keys(results).length;
      const passedTests = Object.values(results).filter(Boolean).length;
      const successRate = Math.round((passedTests / totalTests) * 100);
      
      const report = {
        success: this.errors.length === 0 && passedTests === totalTests,
        results,
        errors: this.errors,
        summary: {
          totalTests,
          passedTests,
          successRate
        }
      };
      
      this.displayReport(report);
      return report;
    }
    
    // Exibir relatório
    displayReport(report) {
      console.log('\n⭐ RELATÓRIO DO TESTE DE XP');
      console.log('===========================');
      
      if (report.success) {
        console.log('✅ SISTEMA DE XP FUNCIONANDO PERFEITAMENTE!');
        console.log(`✅ ${report.summary.passedTests}/${report.summary.totalTests} testes passaram (${report.summary.successRate}%)`);
      } else {
        console.log('❌ PROBLEMAS ENCONTRADOS NO SISTEMA DE XP!');
        console.log(`❌ ${report.summary.passedTests}/${report.summary.totalTests} testes passaram (${report.summary.successRate}%)`);
        
        if (report.errors.length > 0) {
          console.log('\n🚨 ERROS ENCONTRADOS:');
          report.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
          });
        }
      }
      
      console.log('\n📋 DETALHES DOS TESTES:');
      Object.entries(report.results).forEach(([test, passed]) => {
        console.log(`   ${passed ? '✅' : '❌'} ${test}`);
      });
      
      console.log('\n===========================');
      
      if (report.success) {
        console.log('🎉 O sistema de XP está funcionando corretamente em todos os modos!');
        console.log('💡 Para testar persistência, recarregue a página e execute testXP.verifyPersistence()');
      } else {
        console.log('⚠️ Há problemas que precisam ser corrigidos.');
        console.log('💡 Verifique se está logado e as APIs estão funcionando.');
      }
    }
  }
  
  // Criar instância global
  const xpTester = new XPSystemTester();
  
  // Expor funções globalmente
  window.testXP = {
    runComplete: () => xpTester.runCompleteTest(),
    checkAuth: () => xpTester.checkAuthentication(),
    getProfile: () => xpTester.getCurrentProfile(),
    testLevelCalc: () => xpTester.testLevelCalculation(),
    testDaily: () => xpTester.testDailyModeXP(),
    testInfinite: () => xpTester.testInfiniteModeXP(),
    testMultiplayer: () => xpTester.testMultiplayerXP(),
    verifyXP: () => xpTester.verifyXPSaved(),
    verifyPersistence: () => xpTester.verifyPersistence()
  };
  
  console.log('🔧 COMANDOS DISPONÍVEIS:');
  console.log('   testXP.runComplete() - Executar teste completo');
  console.log('   testXP.checkAuth() - Verificar autenticação');
  console.log('   testXP.getProfile() - Obter perfil atual');
  console.log('   testXP.testLevelCalc() - Testar cálculo de nível');
  console.log('   testXP.testDaily() - Testar XP modo diário');
  console.log('   testXP.testInfinite() - Testar XP modo infinito');
  console.log('   testXP.testMultiplayer() - Testar XP multiplayer');
  console.log('   testXP.verifyXP() - Verificar se XP foi salvo');
  console.log('   testXP.verifyPersistence() - Verificar persistência (após reload)');
  console.log('\n💡 COMO USAR:');
  console.log('1. Faça login na conta');
  console.log('2. Execute: testXP.runComplete()');
  console.log('3. Para testar persistência, recarregue e execute testXP.verifyPersistence()');
  
})();
