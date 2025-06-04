// Script para configurar CORS no Cloudflare R2
const { S3Client, PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');

// Configuração do cliente S3 para Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://f0ef294a1c4bb8e90e9ee5006f374f2d.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: '879ea31185c2b3db0b1479b9886b455e',
    secretAccessKey: 'e62c0661a47cf4c3e31ea252371b5567333e573a6880f4e50fa103ac1ef25bd5'
  }
});

const BUCKET_NAME = 'ludomusic-audio';

// Configuração CORS otimizada para áudio
const corsConfiguration = {
  CORSRules: [
    {
      ID: 'AllowAudioAccess',
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: [
        'http://localhost:3000',
        'https://ludomusic.xyz',
        'https://www.ludomusic.xyz',
        'https://*.vercel.app',
        'https://*.ludomusic.xyz'
      ],
      ExposeHeaders: [
        'Content-Length',
        'Content-Type',
        'Content-Range',
        'Accept-Ranges',
        'ETag',
        'Last-Modified'
      ],
      MaxAgeSeconds: 86400 // 24 horas
    },
    {
      ID: 'AllowAllOrigins',
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'HEAD'],
      AllowedOrigins: ['*'], // Permitir todos os domínios para máxima compatibilidade
      ExposeHeaders: [
        'Content-Length',
        'Content-Type',
        'Content-Range',
        'Accept-Ranges',
        'ETag',
        'Last-Modified'
      ],
      MaxAgeSeconds: 86400
    }
  ]
};

async function configureCORS() {
  try {
    console.log('🔧 Configurando CORS no bucket Cloudflare R2...');
    
    // Aplicar configuração CORS
    const putCommand = new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: corsConfiguration
    });
    
    await r2Client.send(putCommand);
    console.log('✅ CORS configurado com sucesso!');
    
    // Verificar configuração
    console.log('🔍 Verificando configuração CORS...');
    const getCommand = new GetBucketCorsCommand({
      Bucket: BUCKET_NAME
    });
    
    const result = await r2Client.send(getCommand);
    console.log('📋 Configuração CORS atual:');
    console.log(JSON.stringify(result.CORSRules, null, 2));
    
    console.log('\n🎉 CORS configurado com sucesso!');
    console.log('📝 Configuração aplicada:');
    console.log('   - Permite acesso de localhost:3000 e ludomusic.xyz');
    console.log('   - Permite métodos GET e HEAD');
    console.log('   - Cache de 24 horas');
    console.log('   - Headers otimizados para áudio');
    
  } catch (error) {
    console.error('❌ Erro ao configurar CORS:', error);
    
    if (error.name === 'CredentialsProviderError') {
      console.log('💡 Verifique se as credenciais do Cloudflare R2 estão corretas');
    } else if (error.name === 'NoSuchBucket') {
      console.log('💡 Verifique se o nome do bucket está correto');
    } else {
      console.log('💡 Verifique a conexão e as permissões do bucket');
    }
  }
}

async function checkCurrentCORS() {
  try {
    console.log('🔍 Verificando configuração CORS atual...');
    
    const getCommand = new GetBucketCorsCommand({
      Bucket: BUCKET_NAME
    });
    
    const result = await r2Client.send(getCommand);
    
    if (result.CORSRules && result.CORSRules.length > 0) {
      console.log('📋 Configuração CORS encontrada:');
      console.log(JSON.stringify(result.CORSRules, null, 2));
    } else {
      console.log('⚠️ Nenhuma configuração CORS encontrada');
    }
    
  } catch (error) {
    if (error.name === 'NoSuchCORSConfiguration') {
      console.log('⚠️ Nenhuma configuração CORS encontrada no bucket');
    } else {
      console.error('❌ Erro ao verificar CORS:', error);
    }
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'configure';
  
  console.log('🎵 Configurador de CORS - Cloudflare R2');
  console.log('=====================================\n');
  
  switch (command) {
    case 'check':
      await checkCurrentCORS();
      break;
    case 'configure':
    default:
      await configureCORS();
      break;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { configureCORS, checkCurrentCORS };
