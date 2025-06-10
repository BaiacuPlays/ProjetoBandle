// API para limpar cache e diagnosticar problemas de performance
import { clearLocalCache, getKVStatus, testKVConnection } from '../../../utils/kv-config';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { action } = req.body;

    switch (action) {
      case 'clear-cache':
        clearLocalCache();
        return res.status(200).json({
          success: true,
          message: 'Cache local limpo com sucesso'
        });

      case 'status':
        const status = getKVStatus();
        return res.status(200).json({
          success: true,
          status
        });

      case 'test-kv':
        const testResult = await testKVConnection();
        return res.status(200).json({
          success: true,
          test: testResult
        });

      case 'full-diagnostic':
        // Limpar cache
        clearLocalCache();
        
        // Obter status
        const fullStatus = getKVStatus();
        
        // Testar KV
        const kvTest = await testKVConnection();
        
        return res.status(200).json({
          success: true,
          message: 'Diagnóstico completo realizado',
          diagnostic: {
            cacheCleared: true,
            status: fullStatus,
            kvTest
          }
        });

      default:
        return res.status(400).json({
          error: 'Ação inválida',
          validActions: ['clear-cache', 'status', 'test-kv', 'full-diagnostic']
        });
    }

  } catch (error) {
    console.error('Erro na API de debug:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
