#!/usr/bin/env node

/**
 * Script para diagnosticar e corrigir problemas com Vercel KV
 * Execute: node scripts/fix-kv-issues.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Script de Correção do Vercel KV\n');

// Verificar se estamos no diretório correto
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ Execute este script na raiz do projeto (onde está o package.json)');
  process.exit(1);
}

// Verificar arquivo .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
console.log('📋 1. Verificando arquivo .env.local...');

if (!fs.existsSync(envLocalPath)) {
  console.log('❌ Arquivo .env.local não encontrado');
  console.log('💡 Criando arquivo .env.local baseado no .env.example...');
  
  const envExamplePath = path.join(process.cwd(), '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('✅ Arquivo .env.local criado');
  } else {
    console.log('⚠️ .env.example não encontrado, criando .env.local básico...');
    const basicEnv = `# Vercel KV Configuration
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_URL=

# Environment
NODE_ENV=development
`;
    fs.writeFileSync(envLocalPath, basicEnv);
    console.log('✅ Arquivo .env.local básico criado');
  }
} else {
  console.log('✅ Arquivo .env.local encontrado');
}

// Ler e verificar variáveis do .env.local
console.log('\n📋 2. Verificando variáveis de ambiente...');
const envContent = fs.readFileSync(envLocalPath, 'utf8');
const envLines = envContent.split('\n');

const envVars = {};
envLines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key) {
      envVars[key] = valueParts.join('=');
    }
  }
});

// Verificar variáveis KV específicas
const kvVars = {
  'KV_REST_API_URL': envVars.KV_REST_API_URL,
  'KV_REST_API_TOKEN': envVars.KV_REST_API_TOKEN,
  'KV_URL': envVars.KV_URL
};

console.log('Variáveis KV encontradas:');
Object.entries(kvVars).forEach(([key, value]) => {
  const status = value && value.trim() ? '✅ DEFINIDA' : '❌ NÃO DEFINIDA';
  const displayValue = value && value.trim() ? 
    (value.length > 20 ? value.substring(0, 20) + '...' : value) : 
    'VAZIA';
  console.log(`  ${key}: ${status} (${displayValue})`);
});

// Verificar se pelo menos uma configuração está completa
const hasValidConfig = (kvVars.KV_REST_API_URL || kvVars.KV_URL) && kvVars.KV_REST_API_TOKEN;

if (!hasValidConfig) {
  console.log('\n❌ Configuração KV incompleta!');
  console.log('\n💡 Para corrigir:');
  console.log('1. Acesse o painel do Vercel: https://vercel.com/dashboard');
  console.log('2. Vá para seu projeto: https://vercel.com/baiacuplays-projects/projeto-bandle');
  console.log('3. Clique em "Storage" > "KV"');
  console.log('4. Copie as variáveis de ambiente para o arquivo .env.local');
  console.log('5. Ou execute o deploy no Vercel para que as variáveis sejam definidas automaticamente');
  
  console.log('\n📝 Exemplo de configuração no .env.local:');
  console.log('KV_REST_API_URL=https://concise-spaniel-34484.upstash.io');
  console.log('KV_REST_API_TOKEN=AYa0AAIjcDE...');
  console.log('KV_URL=rediss://default:AYa0AAIjcDE...@concise-spaniel-34484.upstash.io:6379');
} else {
  console.log('\n✅ Configuração KV parece válida');
}

// Verificar dependências
console.log('\n📋 3. Verificando dependências...');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

const requiredDeps = ['@vercel/kv'];
const missingDeps = requiredDeps.filter(dep => !dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Dependências faltando:', missingDeps.join(', '));
  console.log('💡 Execute: npm install @vercel/kv');
} else {
  console.log('✅ Todas as dependências necessárias estão instaladas');
}

// Verificar arquivos de configuração
console.log('\n📋 4. Verificando arquivos de configuração...');

const configFiles = [
  'utils/kv-config.js',
  'utils/kv-fix.js',
  'pages/api/debug-kv.js'
];

configFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} encontrado`);
  } else {
    console.log(`❌ ${file} não encontrado`);
  }
});

// Gerar relatório final
console.log('\n📊 RELATÓRIO FINAL:');
console.log('==================');

if (hasValidConfig) {
  console.log('✅ Configuração KV: VÁLIDA');
  console.log('💡 Se ainda há problemas:');
  console.log('   1. Reinicie o servidor de desenvolvimento (npm run dev)');
  console.log('   2. Acesse /debug-kv para diagnóstico detalhado');
  console.log('   3. Verifique se as variáveis estão definidas no Vercel também');
} else {
  console.log('❌ Configuração KV: INVÁLIDA');
  console.log('🔧 Ações necessárias:');
  console.log('   1. Configurar variáveis KV no .env.local');
  console.log('   2. Ou fazer deploy no Vercel para configuração automática');
  console.log('   3. Reiniciar o servidor após configurar');
}

console.log('\n🔗 Links úteis:');
console.log('   - Painel Vercel: https://vercel.com/baiacuplays-projects/projeto-bandle');
console.log('   - Debug local: http://localhost:3000/debug-kv');
console.log('   - Documentação KV: https://vercel.com/docs/storage/vercel-kv');

console.log('\n✨ Script concluído!');

// Se estivermos em ambiente de desenvolvimento, tentar carregar as variáveis
if (process.env.NODE_ENV !== 'production') {
  console.log('\n🧪 Testando carregamento das variáveis...');
  
  // Carregar variáveis do .env.local
  require('dotenv').config({ path: envLocalPath });
  
  const testVars = {
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    KV_URL: process.env.KV_URL
  };
  
  console.log('Variáveis carregadas no processo:');
  Object.entries(testVars).forEach(([key, value]) => {
    const status = value ? '✅ CARREGADA' : '❌ NÃO CARREGADA';
    console.log(`  ${key}: ${status}`);
  });
  
  const processHasValidConfig = (testVars.KV_REST_API_URL || testVars.KV_URL) && testVars.KV_REST_API_TOKEN;
  
  if (processHasValidConfig) {
    console.log('✅ Variáveis carregadas com sucesso no processo Node.js');
  } else {
    console.log('❌ Variáveis não foram carregadas corretamente');
    console.log('💡 Certifique-se de reiniciar o servidor após editar o .env.local');
  }
}
