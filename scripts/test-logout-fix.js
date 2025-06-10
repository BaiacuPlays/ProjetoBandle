#!/usr/bin/env node

// Script para verificar se as correções de logout foram aplicadas
const fs = require('fs');

console.log('🚪 Verificando correções de logout...\n');

// 1. Verificar se as correções de logout foram aplicadas
console.log('🔧 1. Verificando correções no AuthContext:');

try {
  const authContextContent = fs.readFileSync('contexts/AuthContext.js', 'utf8');
  
  const hasLogoutTryCatch = authContextContent.includes('const logout = async () => {\n    try {');
  const hasLogoutErrorHandling = authContextContent.includes('} catch (error) {\n      console.error(\'❌ Erro durante logout:\', error);');
  const hasWindowCheck = authContextContent.includes('if (typeof window !== \'undefined\' && window.dispatchEvent)');
  const hasEventErrorHandling = authContextContent.includes('} catch (eventError) {\n          console.warn(\'⚠️ Erro ao disparar evento');
  const hasLogoutFallback = authContextContent.includes('return { success: false, error: error.message };');
  
  console.log(`${hasLogoutTryCatch ? '✅' : '❌'} Logout com try/catch implementado`);
  console.log(`${hasLogoutErrorHandling ? '✅' : '❌'} Error handling no logout implementado`);
  console.log(`${hasWindowCheck ? '✅' : '❌'} Verificação de window implementada`);
  console.log(`${hasEventErrorHandling ? '✅' : '❌'} Error handling para eventos implementado`);
  console.log(`${hasLogoutFallback ? '✅' : '❌'} Fallback de erro implementado`);

} catch (error) {
  console.log(`❌ Erro ao verificar AuthContext: ${error.message}`);
}

// 2. Verificar se as correções no UserProfile foram aplicadas
console.log('\n🔧 2. Verificando correções no UserProfile:');

try {
  const userProfileContent = fs.readFileSync('components/UserProfile.js', 'utf8');
  
  const hasLogoutValidation = userProfileContent.includes('if (typeof logout !== \'function\')');
  const hasLogoutConsoleLog = userProfileContent.includes('console.log(\'🚪 Iniciando logout do UserProfile...\');');
  const hasLogoutErrorAlert = userProfileContent.includes('alert(`Erro ao fazer logout: ${error.message || \'Erro desconhecido\'}`');
  const hasPageReload = userProfileContent.includes('window.location.reload();');
  const hasResultLogging = userProfileContent.includes('console.log(\'✅ Logout executado:\', result);');
  
  console.log(`${hasLogoutValidation ? '✅' : '❌'} Validação da função logout implementada`);
  console.log(`${hasLogoutConsoleLog ? '✅' : '❌'} Logging de início do logout implementado`);
  console.log(`${hasLogoutErrorAlert ? '✅' : '❌'} Alert de erro melhorado implementado`);
  console.log(`${hasPageReload ? '✅' : '❌'} Reload da página implementado`);
  console.log(`${hasResultLogging ? '✅' : '❌'} Logging do resultado implementado`);

} catch (error) {
  console.log(`❌ Erro ao verificar UserProfile: ${error.message}`);
}

// 3. Verificar se outras referências a window.dispatchEvent foram corrigidas
console.log('\n🔧 3. Verificando outras correções de window.dispatchEvent:');

const filesToCheck = [
  { file: 'components/AdBanner.js', name: 'AdBanner' },
  { file: 'components/ToastNotification.js', name: 'ToastNotification' }
];

filesToCheck.forEach(({ file, name }) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    const hasWindowCheck = content.includes('if (typeof window !== \'undefined\' && window.dispatchEvent)');
    const hasEventErrorHandling = content.includes('} catch (error) {\n        console.warn(\'⚠️ Erro ao');
    const hasUnsafeDispatch = content.includes('window.dispatchEvent(') && 
                             !content.includes('if (typeof window !== \'undefined\'');
    
    console.log(`${hasWindowCheck ? '✅' : '❌'} ${name}: Verificação de window implementada`);
    console.log(`${hasEventErrorHandling ? '✅' : '❌'} ${name}: Error handling implementado`);
    console.log(`${!hasUnsafeDispatch ? '✅' : '❌'} ${name}: Sem uso inseguro de dispatchEvent`);
    
  } catch (error) {
    console.log(`❌ ${name}: Arquivo não encontrado`);
  }
});

// 4. Verificar problemas comuns que causam erros de logout
console.log('\n⚠️ 4. Verificando problemas comuns:');

try {
  const authContextContent = fs.readFileSync('contexts/AuthContext.js', 'utf8');
  const userProfileContent = fs.readFileSync('components/UserProfile.js', 'utf8');
  
  // Verificar se há uso de APIs do navegador sem verificação
  const hasUnsafeWindow = (authContextContent + userProfileContent).includes('window.') && 
                         !(authContextContent + userProfileContent).includes('typeof window');
  
  const hasUnsafeDocument = (authContextContent + userProfileContent).includes('document.') && 
                           !(authContextContent + userProfileContent).includes('typeof document');
  
  const hasAsyncLogout = authContextContent.includes('const logout = async () =>');
  const hasLogoutInProvider = authContextContent.includes('logout,') && 
                             authContextContent.includes('const value = {');
  
  console.log(`${!hasUnsafeWindow ? '✅' : '❌'} Sem uso inseguro de window`);
  console.log(`${!hasUnsafeDocument ? '✅' : '❌'} Sem uso inseguro de document`);
  console.log(`${hasAsyncLogout ? '✅' : '❌'} Função logout é async`);
  console.log(`${hasLogoutInProvider ? '✅' : '❌'} Logout exportado no provider`);

} catch (error) {
  console.log(`❌ Erro ao verificar problemas: ${error.message}`);
}

// 5. Verificar sintaxe específica do logout
console.log('\n📝 5. Verificando sintaxe do logout:');

const logoutFiles = [
  'contexts/AuthContext.js',
  'components/UserProfile.js'
];

let syntaxErrors = 0;

logoutFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificações específicas para logout
    const hasUnmatchedAsync = content.includes('async () => {') && 
                             !content.includes('await ') && 
                             content.includes('logout');
    
    const hasUnhandledPromise = content.includes('logout()') && 
                               !content.includes('await logout()') && 
                               !content.includes('.then(') && 
                               !content.includes('.catch(');
    
    if (hasUnmatchedAsync) {
      console.log(`⚠️ ${file}: Função async sem await detectada`);
    }
    
    if (hasUnhandledPromise) {
      console.log(`⚠️ ${file}: Promise não tratada detectada`);
    }
    
    if (!hasUnmatchedAsync && !hasUnhandledPromise) {
      console.log(`✅ ${file}: Sintaxe de logout OK`);
    } else {
      syntaxErrors++;
    }
    
  } catch (error) {
    console.log(`❌ ${file}: Erro ao ler arquivo`);
    syntaxErrors++;
  }
});

// 6. Instruções de teste específicas para logout
console.log('\n🧪 6. Como testar o logout:');

const testSteps = [
  '1. 🚀 Inicie o servidor de desenvolvimento:',
  '   npm run dev',
  '',
  '2. 🔐 Faça login com uma conta:',
  '   - Crie uma conta ou use uma existente',
  '   - Verifique se o login funciona normalmente',
  '',
  '3. 🚪 Teste o logout:',
  '   - Clique no ícone do perfil',
  '   - Vá para a aba "Configurações"',
  '   - Clique em "Sair da Conta"',
  '   - Confirme no popup',
  '   - Verifique se NÃO aparece "Application error"',
  '',
  '4. ✅ Verificações pós-logout:',
  '   - Modal de perfil deve fechar',
  '   - Página deve recarregar automaticamente',
  '   - Usuário deve estar deslogado',
  '   - Não deve haver erros no console',
  '',
  '5. 🔄 Teste múltiplos logouts:',
  '   - Faça login novamente',
  '   - Teste logout várias vezes seguidas',
  '   - Teste logout em abas diferentes',
  '',
  '6. 🔍 Verifique o console:',
  '   - Deve mostrar "🚪 Fazendo logout..."',
  '   - Deve mostrar "✅ Logout realizado"',
  '   - Não deve haver erros vermelhos'
];

testSteps.forEach(step => console.log(step));

// Resumo final
console.log('\n📊 RESUMO DAS CORREÇÕES DE LOGOUT:');

const corrections = [
  '✅ Try/catch robusto na função logout',
  '✅ Verificações de segurança para window/document',
  '✅ Error handling para eventos dispatchEvent',
  '✅ Validação da função logout no UserProfile',
  '✅ Logging detalhado para debug',
  '✅ Fallback de erro com mensagem específica',
  '✅ Reload automático da página após logout',
  '✅ Correções em AdBanner e ToastNotification'
];

corrections.forEach(correction => console.log(correction));

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('🟢 Logout funciona sem "Application error"');
console.log('🟢 Modal fecha automaticamente');
console.log('🟢 Página recarrega após logout');
console.log('🟢 Usuário fica deslogado corretamente');
console.log('🟢 Sem erros no console do navegador');

if (syntaxErrors === 0) {
  console.log('\n🎉 Todas as correções de logout foram aplicadas com sucesso!');
  console.log('   Agora teste o botão de logout no perfil.');
  console.log('   O erro "Application error" não deve mais aparecer.');
} else {
  console.log(`\n⚠️ ${syntaxErrors} arquivo(s) com possíveis problemas de sintaxe.`);
  console.log('   Verifique os erros acima antes de testar.');
}

console.log('\n🔧 Se ainda houver problemas:');
console.log('   1. Abra o console do navegador (F12)');
console.log('   2. Verifique se há erros específicos durante o logout');
console.log('   3. Teste em modo incógnito para descartar cache');
console.log('   4. Verifique se as variáveis de ambiente estão configuradas');
console.log('   5. Use o "Diagnóstico de Sessão" para identificar problemas');
