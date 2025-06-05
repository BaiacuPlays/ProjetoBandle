// Teste específico para salvamento de perfil
import { verifyAuthentication } from '../../utils/auth';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const testResult = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    steps: []
  };

  try {
    // Passo 1: Verificar autenticação
    testResult.steps.push({ step: 'VERIFICANDO_AUTH', status: 'EXECUTANDO' });
    
    const authResult = await verifyAuthentication(req);
    
    if (!authResult.authenticated) {
      testResult.steps[0].status = 'FALHOU';
      testResult.steps[0].error = authResult.error;
      return res.status(401).json({ 
        ...testResult,
        error: 'Não autenticado: ' + authResult.error 
      });
    }

    testResult.steps[0].status = 'PASSOU';
    testResult.steps[0].details = {
      userId: authResult.userId,
      username: authResult.username
    };

    // Passo 2: Testar salvamento no KV
    testResult.steps.push({ step: 'TESTANDO_SAVE_KV', status: 'EXECUTANDO' });
    
    const testProfile = {
      id: authResult.userId,
      username: authResult.username,
      displayName: 'Teste Profile',
      bio: 'Perfil de teste',
      avatar: '🧪',
      level: 1,
      xp: 0,
      lastUpdated: new Date().toISOString(),
      testSave: true
    };

    const profileKey = `profile:${authResult.userId}`;
    
    // Salvar no KV
    await kv.set(profileKey, testProfile);
    
    // Verificar se foi salvo
    const savedProfile = await kv.get(profileKey);
    
    const saveSuccess = savedProfile && savedProfile.testSave === true;
    
    testResult.steps[1].status = saveSuccess ? 'PASSOU' : 'FALHOU';
    testResult.steps[1].details = {
      profileKey,
      saved: !!savedProfile,
      testSaveFlag: savedProfile?.testSave,
      profileData: savedProfile
    };

    // Passo 3: Testar leitura
    testResult.steps.push({ step: 'TESTANDO_READ_KV', status: 'EXECUTANDO' });
    
    const readProfile = await kv.get(profileKey);
    const readSuccess = readProfile && readProfile.testSave === true;
    
    testResult.steps[2].status = readSuccess ? 'PASSOU' : 'FALHOU';
    testResult.steps[2].details = {
      found: !!readProfile,
      testFlag: readProfile?.testSave,
      username: readProfile?.username
    };

    // Passo 4: Limpar teste
    testResult.steps.push({ step: 'LIMPANDO_TESTE', status: 'EXECUTANDO' });
    
    // Restaurar perfil original se existir
    const { profile: originalProfile } = req.body;
    if (originalProfile) {
      await kv.set(profileKey, originalProfile);
      testResult.steps[3].status = 'PASSOU';
      testResult.steps[3].details = { restored: true };
    } else {
      testResult.steps[3].status = 'PASSOU';
      testResult.steps[3].details = { restored: false, reason: 'Nenhum perfil original fornecido' };
    }

    // Resultado final
    const allPassed = testResult.steps.every(step => step.status === 'PASSOU');
    
    return res.status(200).json({
      ...testResult,
      success: allPassed,
      message: allPassed ? 'Todos os testes passaram - perfil pode ser salvo' : 'Alguns testes falharam'
    });

  } catch (error) {
    return res.status(500).json({
      ...testResult,
      success: false,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack
      }
    });
  }
}
