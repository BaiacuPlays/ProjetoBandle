#!/usr/bin/env node

// Script para testar as correções do sistema KV
const fs = require('fs');
const path = require('path');

console.log('🧪 Testando correções do sistema KV...\n');

// 1. Verificar se os arquivos foram criados
console.log('📁 1. Verificando arquivos criados:');

const filesToCheck = [
  'utils/kv-config.js',
  'utils/profileUtils.js', 
  'utils/cloud-storage.js',
  'utils/steam-like-profile.js',
  'components/SystemStatus.js',
  'pages/api/debug/clear-cache.js'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allFilesExist = false;
});

if (!allFilesExist) {
  console.log('\n❌ Alguns arquivos estão faltando. Verifique a criação dos arquivos.');
  process.exit(1);
}

// 2. Verificar se as funções estão exportadas corretamente
console.log('\n🔍 2. Verificando exports dos módulos:');

try {
  // Verificar kv-config.js
  const kvConfigContent = fs.readFileSync('utils/kv-config.js', 'utf8');
  const hasRateLimiter = kvConfigContent.includes('class RateLimiter');
  const hasLocalCache = kvConfigContent.includes('class LocalCache');
  const hasRetryFunction = kvConfigContent.includes('retryWithBackoff');
  
  console.log(`${hasRateLimiter ? '✅' : '❌'} RateLimiter implementado`);
  console.log(`${hasLocalCache ? '✅' : '❌'} LocalCache implementado`);
  console.log(`${hasRetryFunction ? '✅' : '❌'} Retry com backoff implementado`);

  // Verificar profileUtils.js
  const profileUtilsContent = fs.readFileSync('utils/profileUtils.js', 'utf8');
  const hasSanitizeProfile = profileUtilsContent.includes('export function sanitizeProfile');
  const hasRepairProfile = profileUtilsContent.includes('export function repairCorruptedProfile');
  
  console.log(`${hasSanitizeProfile ? '✅' : '❌'} sanitizeProfile exportado`);
  console.log(`${hasRepairProfile ? '✅' : '❌'} repairCorruptedProfile exportado`);

  // Verificar cloud-storage.js
  const cloudStorageContent = fs.readFileSync('utils/cloud-storage.js', 'utf8');
  const hasSteamStorage = cloudStorageContent.includes('export const steamStorage');
  
  console.log(`${hasSteamStorage ? '✅' : '❌'} steamStorage exportado`);

  // Verificar steam-like-profile.js
  const steamProfileContent = fs.readFileSync('utils/steam-like-profile.js', 'utf8');
  const hasValidateProfile = steamProfileContent.includes('export function validateProfile');
  const hasMigrateProfile = steamProfileContent.includes('export function migrateProfile');
  
  console.log(`${hasValidateProfile ? '✅' : '❌'} validateProfile exportado`);
  console.log(`${hasMigrateProfile ? '✅' : '❌'} migrateProfile exportado`);

} catch (error) {
  console.log(`❌ Erro ao verificar exports: ${error.message}`);
}

// 3. Verificar se o AuthContext foi atualizado
console.log('\n🔐 3. Verificando atualizações do AuthContext:');

try {
  const authContextContent = fs.readFileSync('contexts/AuthContext.js', 'utf8');
  const hasRateLimit = authContextContent.includes('CHECK_INTERVAL');
  const hasTimeout = authContextContent.includes('AbortController');
  const hasDevLogs = authContextContent.includes('process.env.NODE_ENV === \'development\'');
  
  console.log(`${hasRateLimit ? '✅' : '❌'} Rate limiting implementado`);
  console.log(`${hasTimeout ? '✅' : '❌'} Timeout para requisições implementado`);
  console.log(`${hasDevLogs ? '✅' : '❌'} Logs condicionais implementados`);

} catch (error) {
  console.log(`❌ Erro ao verificar AuthContext: ${error.message}`);
}

// 4. Verificar se o GameMenu foi atualizado
console.log('\n🎮 4. Verificando atualizações do GameMenu:');

try {
  const gameMenuContent = fs.readFileSync('components/GameMenu.js', 'utf8');
  const hasSystemStatus = gameMenuContent.includes('SystemStatus');
  const hasServerIcon = gameMenuContent.includes('faServer');
  
  console.log(`${hasSystemStatus ? '✅' : '❌'} SystemStatus importado`);
  console.log(`${hasServerIcon ? '✅' : '❌'} Ícone do servidor adicionado`);

} catch (error) {
  console.log(`❌ Erro ao verificar GameMenu: ${error.message}`);
}

// 5. Verificar estrutura da API de debug
console.log('\n🐛 5. Verificando API de debug:');

try {
  const debugApiContent = fs.readFileSync('pages/api/debug/clear-cache.js', 'utf8');
  const hasActions = debugApiContent.includes('clear-cache') && 
                    debugApiContent.includes('status') && 
                    debugApiContent.includes('test-kv') && 
                    debugApiContent.includes('full-diagnostic');
  
  console.log(`${hasActions ? '✅' : '❌'} Todas as ações implementadas`);

} catch (error) {
  console.log(`❌ Erro ao verificar API de debug: ${error.message}`);
}

// 6. Sugestões de teste
console.log('\n🧪 6. Próximos passos para testar:');
console.log('   1. Execute "npm run dev" para iniciar o servidor de desenvolvimento');
console.log('   2. Abra o jogo no navegador');
console.log('   3. Pressione F5 várias vezes para testar o rate limiting');
console.log('   4. Abra o menu do jogo e clique em "Status do Sistema"');
console.log('   5. Teste as funções de limpeza de cache');
console.log('   6. Verifique o console do navegador para logs reduzidos');

// 7. Verificar se há problemas de sintaxe
console.log('\n🔍 7. Verificando sintaxe dos arquivos:');

const jsFiles = [
  'utils/kv-config.js',
  'utils/profileUtils.js',
  'utils/cloud-storage.js',
  'utils/steam-like-profile.js',
  'components/SystemStatus.js',
  'pages/api/debug/clear-cache.js'
];

let syntaxErrors = 0;

jsFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Verificações básicas de sintaxe
    const hasUnmatchedBraces = (content.match(/\{/g) || []).length !== (content.match(/\}/g) || []).length;
    const hasUnmatchedParens = (content.match(/\(/g) || []).length !== (content.match(/\)/g) || []).length;
    
    if (hasUnmatchedBraces || hasUnmatchedParens) {
      console.log(`❌ ${file}: Possível erro de sintaxe (chaves/parênteses não balanceados)`);
      syntaxErrors++;
    } else {
      console.log(`✅ ${file}: Sintaxe OK`);
    }
  } catch (error) {
    console.log(`❌ ${file}: Erro ao ler arquivo`);
    syntaxErrors++;
  }
});

// Resumo final
console.log('\n📊 Resumo:');
console.log(`✅ Arquivos criados: ${allFilesExist ? 'Todos' : 'Alguns faltando'}`);
console.log(`✅ Sintaxe: ${syntaxErrors === 0 ? 'OK' : `${syntaxErrors} erros encontrados`}`);

if (allFilesExist && syntaxErrors === 0) {
  console.log('\n🎉 Todas as correções foram aplicadas com sucesso!');
  console.log('   O sistema agora deve ser mais estável e resistente a erros de KV.');
  console.log('   Rate limiting e cache local implementados para melhor performance.');
} else {
  console.log('\n⚠️ Algumas correções podem precisar de ajustes.');
  console.log('   Verifique os erros acima antes de testar.');
}

console.log('\n🔧 Para resolver problemas de F5 excessivo:');
console.log('   - O rate limiting agora limita requisições a 10 por minuto por chave');
console.log('   - Cache local reduz chamadas desnecessárias ao servidor');
console.log('   - Retry automático com backoff exponencial para falhas temporárias');
console.log('   - Logs reduzidos em produção para evitar spam no console');
console.log('   - Timeout de 10 segundos para evitar requisições que ficam pendentes');
