// Script para testar o sistema de convites para multiplayer
// Execute no console: loadScript('/test-multiplayer-invites.js')

(function() {
  'use strict';
  
  console.log('🎮 INICIANDO TESTE DO SISTEMA DE CONVITES MULTIPLAYER...');
  
  // Função para carregar o script
  window.loadScript = function(src) {
    const script = document.createElement('script');
    script.src = src;
    document.head.appendChild(script);
  };
  
  // Classe para testar convites
  class MultiplayerInviteTester {
    constructor() {
      this.testResults = [];
      this.errors = [];
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
    
    // Verificar se há amigos disponíveis
    async checkFriends() {
      console.log('👥 Verificando lista de amigos...');
      
      try {
        const auth = this.checkAuthentication();
        if (!auth) return false;
        
        const response = await fetch('/api/friends', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.sessionToken}`
          }
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao buscar amigos');
          this.errors.push('Erro ao buscar amigos');
          return false;
        }
        
        const data = await response.json();
        const friends = data.friends || [];
        
        console.log(`📊 Encontrados ${friends.length} amigos`);
        
        if (friends.length === 0) {
          console.log('⚠️ Nenhum amigo encontrado para testar convites');
          this.errors.push('Nenhum amigo encontrado para testar convites');
          return false;
        }
        
        console.log('✅ Amigos disponíveis:', friends.map(f => f.displayName || f.username));
        return friends;
      } catch (error) {
        console.error('❌ Erro ao verificar amigos:', error);
        this.errors.push(`Erro ao verificar amigos: ${error.message}`);
        return false;
      }
    }
    
    // Testar envio de convite
    async testSendInvite(friendId, friendName) {
      console.log(`📤 Testando envio de convite para ${friendName}...`);
      
      try {
        const auth = this.checkAuthentication();
        if (!auth) return false;
        
        // Criar dados do convite
        const roomCode = 'TEST' + Math.random().toString(36).substr(2, 6).toUpperCase();
        const invitation = {
          id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'multiplayer_invite',
          fromUserId: auth.user.id || `auth_${auth.user.username}`,
          toUserId: friendId,
          hostName: auth.user.displayName || auth.user.username,
          friendName: friendName,
          roomCode: roomCode,
          timestamp: Date.now(),
          status: 'pending'
        };
        
        console.log('📋 Dados do convite:', invitation);
        
        const response = await fetch('/api/send-invite', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${auth.sessionToken}`
          },
          body: JSON.stringify({
            invitation,
            currentUserId: invitation.fromUserId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.log('❌ Erro ao enviar convite:', errorData);
          this.errors.push(`Erro ao enviar convite: ${errorData.error}`);
          return false;
        }
        
        const data = await response.json();
        console.log('✅ Convite enviado com sucesso:', data);
        
        return { success: true, inviteId: data.inviteId, roomCode };
      } catch (error) {
        console.error('❌ Erro ao testar envio de convite:', error);
        this.errors.push(`Erro ao testar envio de convite: ${error.message}`);
        return false;
      }
    }
    
    // Verificar se convites são recebidos
    async testReceiveInvites(userId) {
      console.log(`📥 Testando recebimento de convites para ${userId}...`);
      
      try {
        const auth = this.checkAuthentication();
        if (!auth) return false;
        
        const response = await fetch(`/api/get-invites?userId=${userId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${auth.sessionToken}`
          }
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao buscar convites');
          this.errors.push('Erro ao buscar convites');
          return false;
        }
        
        const data = await response.json();
        const invites = data.invites || [];
        
        console.log(`📊 Encontrados ${invites.length} convites`);
        
        if (invites.length > 0) {
          console.log('✅ Convites recebidos:', invites);
          return invites;
        } else {
          console.log('ℹ️ Nenhum convite pendente');
          return [];
        }
      } catch (error) {
        console.error('❌ Erro ao verificar convites recebidos:', error);
        this.errors.push(`Erro ao verificar convites recebidos: ${error.message}`);
        return false;
      }
    }
    
    // Testar criação de sala
    async testCreateRoom() {
      console.log('🏠 Testando criação de sala...');
      
      try {
        const auth = this.checkAuthentication();
        if (!auth) return false;
        
        const nickname = auth.user.displayName || auth.user.username;
        
        const response = await fetch('/api/lobby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ nickname })
        });
        
        if (!response.ok) {
          console.log('❌ Erro ao criar sala');
          this.errors.push('Erro ao criar sala');
          return false;
        }
        
        const data = await response.json();
        console.log('✅ Sala criada com sucesso:', data.roomCode);
        
        return data.roomCode;
      } catch (error) {
        console.error('❌ Erro ao testar criação de sala:', error);
        this.errors.push(`Erro ao testar criação de sala: ${error.message}`);
        return false;
      }
    }
    
    // Testar fluxo completo
    async testCompleteFlow() {
      console.log('🚀 TESTANDO FLUXO COMPLETO DE CONVITES...');
      
      const results = {
        authentication: false,
        friendsAvailable: false,
        roomCreation: false,
        inviteSending: false,
        inviteReceiving: false
      };
      
      // 1. Verificar autenticação
      const auth = this.checkAuthentication();
      if (auth) {
        results.authentication = true;
        console.log('✅ 1/5 - Autenticação OK');
      } else {
        console.log('❌ 1/5 - Falha na autenticação');
        return this.generateReport(results);
      }
      
      // 2. Verificar amigos
      const friends = await this.checkFriends();
      if (friends && friends.length > 0) {
        results.friendsAvailable = true;
        console.log('✅ 2/5 - Amigos disponíveis');
      } else {
        console.log('❌ 2/5 - Nenhum amigo disponível');
        return this.generateReport(results);
      }
      
      // 3. Testar criação de sala
      const roomCode = await this.testCreateRoom();
      if (roomCode) {
        results.roomCreation = true;
        console.log('✅ 3/5 - Criação de sala OK');
      } else {
        console.log('❌ 3/5 - Falha na criação de sala');
        return this.generateReport(results);
      }
      
      // 4. Testar envio de convite
      const firstFriend = friends[0];
      const inviteResult = await this.testSendInvite(firstFriend.id, firstFriend.displayName || firstFriend.username);
      if (inviteResult) {
        results.inviteSending = true;
        console.log('✅ 4/5 - Envio de convite OK');
      } else {
        console.log('❌ 4/5 - Falha no envio de convite');
        return this.generateReport(results);
      }
      
      // 5. Verificar se convite foi recebido (simular)
      const receivedInvites = await this.testReceiveInvites(firstFriend.id);
      if (receivedInvites !== false) {
        results.inviteReceiving = true;
        console.log('✅ 5/5 - Recebimento de convites OK');
      } else {
        console.log('❌ 5/5 - Falha no recebimento de convites');
      }
      
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
      console.log('\n🎮 RELATÓRIO DO TESTE DE CONVITES MULTIPLAYER');
      console.log('=============================================');
      
      if (report.success) {
        console.log('✅ SISTEMA DE CONVITES FUNCIONANDO PERFEITAMENTE!');
        console.log(`✅ ${report.summary.passedTests}/${report.summary.totalTests} testes passaram (${report.summary.successRate}%)`);
      } else {
        console.log('❌ PROBLEMAS ENCONTRADOS NO SISTEMA DE CONVITES!');
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
      
      console.log('\n=============================================');
      
      if (report.success) {
        console.log('🎉 O sistema de convites está funcionando corretamente!');
        console.log('💡 Você pode convidar amigos para jogar multiplayer.');
      } else {
        console.log('⚠️ Há problemas que precisam ser corrigidos.');
        console.log('💡 Verifique se você tem amigos adicionados e está logado.');
      }
    }
  }
  
  // Criar instância global
  const inviteTester = new MultiplayerInviteTester();
  
  // Expor funções globalmente
  window.testMultiplayerInvites = {
    runComplete: () => inviteTester.testCompleteFlow(),
    checkAuth: () => inviteTester.checkAuthentication(),
    checkFriends: () => inviteTester.checkFriends(),
    createRoom: () => inviteTester.testCreateRoom(),
    sendInvite: (friendId, friendName) => inviteTester.testSendInvite(friendId, friendName),
    receiveInvites: (userId) => inviteTester.testReceiveInvites(userId)
  };
  
  console.log('🔧 COMANDOS DISPONÍVEIS:');
  console.log('   testMultiplayerInvites.runComplete() - Executar teste completo');
  console.log('   testMultiplayerInvites.checkAuth() - Verificar autenticação');
  console.log('   testMultiplayerInvites.checkFriends() - Verificar amigos');
  console.log('   testMultiplayerInvites.createRoom() - Testar criação de sala');
  console.log('   testMultiplayerInvites.sendInvite(friendId, friendName) - Testar envio');
  console.log('   testMultiplayerInvites.receiveInvites(userId) - Testar recebimento');
  console.log('\n💡 COMO USAR:');
  console.log('1. Faça login na conta');
  console.log('2. Adicione pelo menos um amigo');
  console.log('3. Execute: testMultiplayerInvites.runComplete()');
  
})();
