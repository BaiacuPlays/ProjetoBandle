#!/usr/bin/env node

/**
 * Script de teste para verificar funcionamento dos sistemas de admin
 * e recuperação de conta
 */

const https = require('https');
const http = require('http');

// Configurações
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const ADMIN_PASSWORD = 'laikas2';

// Função para fazer requisições HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            json: null
          };
          
          if (res.headers['content-type']?.includes('application/json')) {
            result.json = JSON.parse(body);
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    
    req.end();
  });
}

// Teste 1: Verificar autenticação do admin
async function testAdminAuth() {
  console.log('\n🔐 Testando autenticação do admin...');
  
  try {
    const url = new URL('/api/admin/auth', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
      password: ADMIN_PASSWORD
    });
    
    if (response.statusCode === 200 && response.json?.success) {
      console.log('✅ Autenticação do admin funcionando');
      return true;
    } else {
      console.log('❌ Falha na autenticação do admin:', response.json?.error || response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar autenticação do admin:', error.message);
    return false;
  }
}

// Teste 2: Verificar listagem de contas
async function testAccountsList() {
  console.log('\n📋 Testando listagem de contas...');
  
  try {
    const url = new URL('/api/admin/accounts', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ADMIN_PASSWORD}`,
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const accounts = response.json;
      console.log(`✅ Listagem funcionando - ${accounts?.length || 0} contas encontradas`);
      
      if (accounts && accounts.length > 0) {
        console.log(`   Primeira conta: ${accounts[0].username || accounts[0].id}`);
        return accounts[0]; // Retornar primeira conta para teste de deleção
      }
      return null;
    } else {
      console.log('❌ Falha na listagem de contas:', response.json?.error || response.body);
      return null;
    }
  } catch (error) {
    console.log('❌ Erro ao testar listagem de contas:', error.message);
    return null;
  }
}

// Teste 3: Verificar sistema de recuperação de senha
async function testPasswordReset() {
  console.log('\n🔑 Testando sistema de recuperação de senha...');
  
  try {
    const url = new URL('/api/password-reset', BASE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const response = await makeRequest(options, {
      action: 'request',
      email: 'teste@exemplo.com'
    });
    
    if (response.statusCode === 200 && response.json?.success) {
      console.log('✅ Sistema de recuperação funcionando');
      console.log(`   Mensagem: ${response.json.message}`);
      return true;
    } else {
      console.log('❌ Falha no sistema de recuperação:', response.json?.error || response.body);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar recuperação de senha:', error.message);
    return false;
  }
}

// Teste 4: Verificar configurações de email
async function testEmailConfig() {
  console.log('\n📧 Verificando configurações de email...');
  
  const resendKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.FROM_EMAIL;
  
  console.log(`   RESEND_API_KEY: ${resendKey ? 'Configurada' : 'NÃO CONFIGURADA'}`);
  console.log(`   FROM_EMAIL: ${fromEmail || 'noreply@ludomusic.xyz (padrão)'}`);
  
  if (!resendKey) {
    console.log('⚠️ RESEND_API_KEY não configurada - emails serão simulados');
    return false;
  } else {
    console.log('✅ Configurações de email parecem corretas');
    return true;
  }
}

// Função principal
async function runTests() {
  console.log('🧪 Iniciando testes dos sistemas de admin e recuperação...');
  console.log(`🌐 URL base: ${BASE_URL}`);
  
  const results = {
    adminAuth: false,
    accountsList: false,
    passwordReset: false,
    emailConfig: false
  };
  
  // Executar testes
  results.adminAuth = await testAdminAuth();
  results.accountsList = !!(await testAccountsList());
  results.passwordReset = await testPasswordReset();
  results.emailConfig = await testEmailConfig();
  
  // Resumo dos resultados
  console.log('\n📊 Resumo dos testes:');
  console.log(`   Autenticação Admin: ${results.adminAuth ? '✅' : '❌'}`);
  console.log(`   Listagem de Contas: ${results.accountsList ? '✅' : '❌'}`);
  console.log(`   Recuperação de Senha: ${results.passwordReset ? '✅' : '❌'}`);
  console.log(`   Configuração de Email: ${results.emailConfig ? '✅' : '⚠️'}`);
  
  const totalPassed = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Resultado: ${totalPassed}/${totalTests} testes passaram`);
  
  if (totalPassed === totalTests) {
    console.log('🎉 Todos os sistemas estão funcionando!');
    process.exit(0);
  } else {
    console.log('⚠️ Alguns sistemas precisam de atenção');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(error => {
    console.error('❌ Erro fatal nos testes:', error);
    process.exit(1);
  });
}

module.exports = { runTests, testAdminAuth, testAccountsList, testPasswordReset, testEmailConfig };
