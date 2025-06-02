// Script para testar o sistema de notificações
// Execute no console: loadScript('/test-notifications.js')

(function() {
  'use strict';
  
  console.log('🔔 INICIANDO TESTE DO SISTEMA DE NOTIFICAÇÕES...');
  
  // Função para carregar o script
  window.loadScript = function(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  };
  
  // Classe para testar notificações
  class NotificationTester {
    constructor() {
      this.testResults = [];
      this.errors = [];
      this.testNotifications = [];
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
    
    // Verificar se o componente de notificações está presente
    checkNotificationComponent() {
      console.log('🔍 Verificando componente de notificações...');
      
      const bellButton = document.querySelector('[aria-label="Notificações"]');
      if (!bellButton) {
        console.log('❌ Botão de notificações não encontrado');
        this.errors.push('Botão de notificações não encontrado');
        return false;
      }
      
      console.log('✅ Componente de notificações encontrado');
      return bellButton;
    }
    
    // Verificar permissão de notificações do navegador
    async checkBrowserNotificationPermission() {
      console.log('🌐 Verificando permissão de notificações do navegador...');
      
      if (!('Notification' in window)) {
        console.log('❌ Notificações do navegador não suportadas');
        this.errors.push('Notificações do navegador não suportadas');
        return false;
      }
      
      const permission = Notification.permission;
      console.log('📊 Permissão atual:', permission);
      
      if (permission === 'denied') {
        console.log('❌ Notificações negadas pelo usuário');
        this.errors.push('Notificações negadas pelo usuário');
        return false;
      }
      
      if (permission === 'default') {
        console.log('⚠️ Permissão não solicitada ainda');
        try {
          const newPermission = await Notification.requestPermission();
          console.log('📊 Nova permissão:', newPermission);
          return newPermission === 'granted';
        } catch (error) {
          console.log('❌ Erro ao solicitar permissão:', error);
          return false;
        }
      }
      
      console.log('✅ Notificações permitidas');
      return true;
    }
    
    // Testar criação de notificação manual
    testCreateNotification() {
      console.log('📝 Testando criação de notificação...');
      
      try {
        // Verificar se o contexto de notificações está disponível
        const notificationContext = window.React && window.React.useContext;
        if (!notificationContext) {
          console.log('⚠️ Contexto React não acessível diretamente');
        }
        
        // Tentar criar notificação via função global (se existir)
        if (typeof window.showAchievementToast === 'function') {
          console.log('🏆 Testando notificação de conquista...');
          window.showAchievementToast({
            title: 'Teste de Notificação',
            description: 'Esta é uma notificação de teste',
            icon: '🧪',
            rarity: 'common',
            xpReward: 10
          });
          console.log('✅ Notificação de conquista criada');
          return true;
        }
        
        if (typeof window.showLevelUpToast === 'function') {
          console.log('⭐ Testando notificação de level up...');
          window.showLevelUpToast(5);
          console.log('✅ Notificação de level up criada');
          return true;
        }
        
        console.log('⚠️ Funções de notificação não encontradas');
        return false;
      } catch (error) {
        console.error('❌ Erro ao criar notificação:', error);
        this.errors.push(`Erro ao criar notificação: ${error.message}`);
        return false;
      }
    }
    
    // Testar notificação do navegador
    testBrowserNotification() {
      console.log('🌐 Testando notificação do navegador...');
      
      try {
        if (Notification.permission === 'granted') {
          const notification = new Notification('Teste LudoMusic', {
            body: 'Esta é uma notificação de teste do sistema',
            icon: '/Logo.png',
            tag: 'test-notification'
          });
          
          // Auto-fechar após 3 segundos
          setTimeout(() => {
            notification.close();
          }, 3000);
          
          console.log('✅ Notificação do navegador criada');
          return true;
        } else {
          console.log('❌ Permissão de notificação não concedida');
          this.errors.push('Permissão de notificação não concedida');
          return false;
        }
      } catch (error) {
        console.error('❌ Erro ao criar notificação do navegador:', error);
        this.errors.push(`Erro ao criar notificação do navegador: ${error.message}`);
        return false;
      }
    }
    
    // Verificar localStorage de notificações
    checkNotificationStorage() {
      console.log('💾 Verificando armazenamento de notificações...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        const userId = auth.user.id || `auth_${auth.user.username}`;
        
        // Verificar notificações salvas
        const notificationsKey = `ludomusic_notifications_${userId}`;
        const invitationsKey = `ludomusic_invitations_${userId}`;
        
        const savedNotifications = localStorage.getItem(notificationsKey);
        const savedInvitations = localStorage.getItem(invitationsKey);
        
        console.log('📊 Notificações salvas:', savedNotifications ? 'Sim' : 'Não');
        console.log('📊 Convites salvos:', savedInvitations ? 'Sim' : 'Não');
        
        if (savedNotifications) {
          try {
            const notifications = JSON.parse(savedNotifications);
            console.log(`📊 Total de notificações: ${notifications.length}`);
          } catch (error) {
            console.log('❌ Erro ao parsear notificações salvas');
            this.errors.push('Erro ao parsear notificações salvas');
            return false;
          }
        }
        
        if (savedInvitations) {
          try {
            const invitations = JSON.parse(savedInvitations);
            console.log(`📊 Total de convites: ${invitations.length}`);
          } catch (error) {
            console.log('❌ Erro ao parsear convites salvos');
            this.errors.push('Erro ao parsear convites salvos');
            return false;
          }
        }
        
        console.log('✅ Armazenamento de notificações verificado');
        return true;
      } catch (error) {
        console.error('❌ Erro ao verificar armazenamento:', error);
        this.errors.push(`Erro ao verificar armazenamento: ${error.message}`);
        return false;
      }
    }
    
    // Testar API de convites
    async testInviteAPI() {
      console.log('🌐 Testando API de convites...');
      
      const auth = this.checkAuthentication();
      if (!auth) return false;
      
      try {
        const userId = auth.user.id || `auth_${auth.user.username}`;
        
        const response = await fetch(`/api/get-invites?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.sessionToken}`
          }
        });
        
        if (!response.ok) {
          console.log('❌ Erro na API de convites:', response.status);
          this.errors.push(`Erro na API de convites: ${response.status}`);
          return false;
        }
        
        const data = await response.json();
        console.log('✅ API de convites funcionando');
        console.log('📊 Convites recebidos:', data.invites?.length || 0);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao testar API de convites:', error);
        this.errors.push(`Erro ao testar API de convites: ${error.message}`);
        return false;
      }
    }
    
    // Testar interação com o componente
    testComponentInteraction() {
      console.log('🖱️ Testando interação com componente...');
      
      const bellButton = this.checkNotificationComponent();
      if (!bellButton) return false;
      
      try {
        // Simular clique no botão
        console.log('🖱️ Simulando clique no sino...');
        bellButton.click();
        
        // Aguardar um pouco para o dropdown aparecer
        setTimeout(() => {
          const dropdown = document.querySelector('[class*="dropdown"]');
          if (dropdown) {
            console.log('✅ Dropdown de notificações aberto');
            
            // Verificar abas
            const tabs = dropdown.querySelectorAll('[class*="tab"]');
            console.log(`📊 Abas encontradas: ${tabs.length}`);
            
            // Fechar dropdown
            bellButton.click();
            console.log('✅ Dropdown fechado');
          } else {
            console.log('❌ Dropdown não encontrado');
            this.errors.push('Dropdown não encontrado');
          }
        }, 100);
        
        return true;
      } catch (error) {
        console.error('❌ Erro ao testar interação:', error);
        this.errors.push(`Erro ao testar interação: ${error.message}`);
        return false;
      }
    }
    
    // Executar teste completo
    async runCompleteTest() {
      console.log('🚀 EXECUTANDO TESTE COMPLETO DE NOTIFICAÇÕES...');
      
      const results = {
        authentication: false,
        component: false,
        browserPermission: false,
        createNotification: false,
        browserNotification: false,
        storage: false,
        inviteAPI: false,
        interaction: false
      };
      
      // 1. Verificar autenticação
      results.authentication = !!this.checkAuthentication();
      console.log(`${results.authentication ? '✅' : '❌'} 1/8 - Autenticação`);
      
      // 2. Verificar componente
      results.component = !!this.checkNotificationComponent();
      console.log(`${results.component ? '✅' : '❌'} 2/8 - Componente`);
      
      // 3. Verificar permissão do navegador
      results.browserPermission = await this.checkBrowserNotificationPermission();
      console.log(`${results.browserPermission ? '✅' : '❌'} 3/8 - Permissão do navegador`);
      
      // 4. Testar criação de notificação
      results.createNotification = this.testCreateNotification();
      console.log(`${results.createNotification ? '✅' : '❌'} 4/8 - Criação de notificação`);
      
      // 5. Testar notificação do navegador
      results.browserNotification = this.testBrowserNotification();
      console.log(`${results.browserNotification ? '✅' : '❌'} 5/8 - Notificação do navegador`);
      
      // 6. Verificar armazenamento
      results.storage = this.checkNotificationStorage();
      console.log(`${results.storage ? '✅' : '❌'} 6/8 - Armazenamento`);
      
      // 7. Testar API de convites
      results.inviteAPI = await this.testInviteAPI();
      console.log(`${results.inviteAPI ? '✅' : '❌'} 7/8 - API de convites`);
      
      // 8. Testar interação
      results.interaction = this.testComponentInteraction();
      console.log(`${results.interaction ? '✅' : '❌'} 8/8 - Interação`);
      
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
      console.log('\n🔔 RELATÓRIO DO TESTE DE NOTIFICAÇÕES');
      console.log('====================================');
      
      if (report.success) {
        console.log('✅ SISTEMA DE NOTIFICAÇÕES FUNCIONANDO PERFEITAMENTE!');
        console.log(`✅ ${report.summary.passedTests}/${report.summary.totalTests} testes passaram (${report.summary.successRate}%)`);
      } else {
        console.log('❌ PROBLEMAS ENCONTRADOS NO SISTEMA DE NOTIFICAÇÕES!');
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
      
      console.log('\n====================================');
      
      if (report.success) {
        console.log('🎉 O sistema de notificações está funcionando corretamente!');
        console.log('💡 Você receberá notificações de convites, conquistas e outros eventos.');
      } else {
        console.log('⚠️ Há problemas que precisam ser corrigidos.');
        console.log('💡 Verifique se está logado e permita notificações do navegador.');
      }
    }
  }
  
  // Criar instância global
  const notificationTester = new NotificationTester();
  
  // Expor funções globalmente
  window.testNotifications = {
    runComplete: () => notificationTester.runCompleteTest(),
    checkAuth: () => notificationTester.checkAuthentication(),
    checkComponent: () => notificationTester.checkNotificationComponent(),
    checkPermission: () => notificationTester.checkBrowserNotificationPermission(),
    createNotification: () => notificationTester.testCreateNotification(),
    testBrowser: () => notificationTester.testBrowserNotification(),
    checkStorage: () => notificationTester.checkNotificationStorage(),
    testAPI: () => notificationTester.testInviteAPI(),
    testInteraction: () => notificationTester.testComponentInteraction()
  };
  
  console.log('🔧 COMANDOS DISPONÍVEIS:');
  console.log('   testNotifications.runComplete() - Executar teste completo');
  console.log('   testNotifications.checkAuth() - Verificar autenticação');
  console.log('   testNotifications.checkComponent() - Verificar componente');
  console.log('   testNotifications.checkPermission() - Verificar permissão');
  console.log('   testNotifications.createNotification() - Criar notificação');
  console.log('   testNotifications.testBrowser() - Testar notificação do navegador');
  console.log('   testNotifications.checkStorage() - Verificar armazenamento');
  console.log('   testNotifications.testAPI() - Testar API');
  console.log('   testNotifications.testInteraction() - Testar interação');
  console.log('\n💡 COMO USAR:');
  console.log('1. Faça login na conta');
  console.log('2. Permita notificações quando solicitado');
  console.log('3. Execute: testNotifications.runComplete()');
  
})();
