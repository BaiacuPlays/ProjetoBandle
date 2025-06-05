// Diagnóstico completo do sistema de perfil
import { verifyAuthentication } from '../../utils/auth';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const diagnosis = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    tests: [],
    errors: [],
    warnings: []
  };

  // Função para adicionar teste
  const addTest = (name, status, details = {}, error = null) => {
    const test = { name, status, details };
    if (error) {
      test.error = {
        message: error.message,
        name: error.name,
        stack: error.stack
      };
      diagnosis.errors.push(`${name}: ${error.message}`);
    }
    diagnosis.tests.push(test);
    console.log(`🧪 ${name}: ${status}`, details);
  };

  try {
    // Teste 1: Verificar variáveis KV
    try {
      const kvVars = {
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        urlLength: process.env.KV_REST_API_URL?.length || 0,
        tokenLength: process.env.KV_REST_API_TOKEN?.length || 0
      };
      addTest('Variáveis KV', 'PASSOU', kvVars);
    } catch (error) {
      addTest('Variáveis KV', 'FALHOU', {}, error);
    }

    // Teste 2: Importar KV
    let kvInstance = null;
    try {
      const kvModule = await import('@vercel/kv');
      kvInstance = kvModule.kv;
      addTest('Importação KV', 'PASSOU', { hasKV: !!kvInstance });
    } catch (error) {
      addTest('Importação KV', 'FALHOU', {}, error);
    }

    // Teste 3: Operação básica KV
    if (kvInstance) {
      try {
        const testKey = `diagnosis:${Date.now()}`;
        const testValue = { test: true, timestamp: new Date().toISOString() };
        
        await kvInstance.set(testKey, testValue);
        const retrieved = await kvInstance.get(testKey);
        await kvInstance.del(testKey);
        
        addTest('Operações KV', 'PASSOU', {
          write: true,
          read: !!retrieved,
          dataIntegrity: retrieved?.test === true,
          delete: true
        });
      } catch (error) {
        addTest('Operações KV', 'FALHOU', {}, error);
      }
    }

    // Teste 4: Verificar autenticação (se token fornecido)
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const authResult = await verifyAuthentication(req);
        addTest('Autenticação', authResult.authenticated ? 'PASSOU' : 'FALHOU', {
          authenticated: authResult.authenticated,
          userId: authResult.userId,
          username: authResult.username,
          error: authResult.error
        });
      } catch (error) {
        addTest('Autenticação', 'ERRO', {}, error);
      }
    } else {
      addTest('Autenticação', 'PULADO', { reason: 'Nenhum token fornecido' });
    }

    // Teste 5: Verificar dados existentes no KV
    if (kvInstance) {
      try {
        const userKeys = await kvInstance.keys('user:*');
        const profileKeys = await kvInstance.keys('profile:*');
        
        addTest('Dados Existentes', 'PASSOU', {
          userCount: userKeys.length,
          profileCount: profileKeys.length,
          sampleUsers: userKeys.slice(0, 3),
          sampleProfiles: profileKeys.slice(0, 3)
        });
      } catch (error) {
        addTest('Dados Existentes', 'FALHOU', {}, error);
      }
    }

    // Teste 6: Verificar estrutura de um perfil existente
    if (kvInstance) {
      try {
        const profileKeys = await kvInstance.keys('profile:*');
        if (profileKeys.length > 0) {
          const sampleProfile = await kvInstance.get(profileKeys[0]);
          addTest('Estrutura Perfil', 'PASSOU', {
            profileKey: profileKeys[0],
            hasProfile: !!sampleProfile,
            fields: sampleProfile ? Object.keys(sampleProfile) : [],
            sampleData: sampleProfile ? {
              username: sampleProfile.username,
              displayName: sampleProfile.displayName,
              level: sampleProfile.level,
              xp: sampleProfile.xp
            } : null
          });
        } else {
          addTest('Estrutura Perfil', 'PULADO', { reason: 'Nenhum perfil encontrado' });
        }
      } catch (error) {
        addTest('Estrutura Perfil', 'FALHOU', {}, error);
      }
    }

    // Teste 7: Simular salvamento de perfil
    if (kvInstance && req.method === 'POST' && req.body.testProfile) {
      try {
        const testProfile = req.body.testProfile;
        const profileKey = `profile:test_${Date.now()}`;
        
        await kvInstance.set(profileKey, testProfile);
        const saved = await kvInstance.get(profileKey);
        await kvInstance.del(profileKey);
        
        addTest('Simulação Salvamento', 'PASSOU', {
          profileKey,
          saved: !!saved,
          dataMatch: JSON.stringify(saved) === JSON.stringify(testProfile)
        });
      } catch (error) {
        addTest('Simulação Salvamento', 'FALHOU', {}, error);
      }
    }

    // Resumo final
    const summary = {
      total: diagnosis.tests.length,
      passed: diagnosis.tests.filter(t => t.status === 'PASSOU').length,
      failed: diagnosis.tests.filter(t => t.status === 'FALHOU').length,
      errors: diagnosis.tests.filter(t => t.status === 'ERRO').length,
      skipped: diagnosis.tests.filter(t => t.status === 'PULADO').length
    };

    diagnosis.summary = summary;
    diagnosis.overallStatus = summary.failed === 0 && summary.errors === 0 ? 'SAUDÁVEL' : 'PROBLEMAS_DETECTADOS';

    // Recomendações baseadas nos resultados
    diagnosis.recommendations = [];
    
    if (summary.failed > 0 || summary.errors > 0) {
      diagnosis.recommendations.push('Verificar logs detalhados dos testes que falharam');
    }
    
    if (diagnosis.errors.length > 0) {
      diagnosis.recommendations.push('Verificar configuração das variáveis de ambiente no Vercel');
      diagnosis.recommendations.push('Verificar se o KV está ativo no projeto Vercel');
    }

    return res.status(200).json(diagnosis);

  } catch (error) {
    diagnosis.criticalError = {
      message: error.message,
      name: error.name,
      stack: error.stack
    };
    
    return res.status(500).json(diagnosis);
  }
}
