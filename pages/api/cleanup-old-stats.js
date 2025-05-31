// API para limpeza de estatísticas antigas (manutenção)
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para obter o dia atual (UTC)
const getCurrentDay = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para obter uma data X dias atrás
const getDaysAgo = (daysAgo) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default async function handler(req, res) {
  // Apenas permitir em desenvolvimento ou com chave de API específica
  const authKey = req.headers['x-cleanup-key'] || req.query.key;
  const validKey = process.env.CLEANUP_API_KEY || 'dev-cleanup-key';
  
  if (!isDevelopment && authKey !== validKey) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { daysToKeep = 7 } = req.body;
    
    if (!hasKVConfig) {
      return res.status(200).json({ 
        message: 'Limpeza não necessária em desenvolvimento local',
        cleaned: 0
      });
    }

    let cleanedCount = 0;
    const currentDay = getCurrentDay();
    
    // Listar todas as chaves de estatísticas diárias
    const keys = await kv.keys('stats:daily:*');
    
    for (const key of keys) {
      // Extrair a data da chave
      const dateMatch = key.match(/stats:daily:(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) {
        const keyDate = dateMatch[1];
        
        // Verificar se a data é muito antiga
        const keyDateObj = new Date(keyDate + 'T00:00:00Z');
        const cutoffDate = new Date(getDaysAgo(daysToKeep) + 'T00:00:00Z');
        
        if (keyDateObj < cutoffDate) {
          await kv.del(key);
          cleanedCount++;
          console.log(`Removida estatística antiga: ${key}`);
        }
      }
    }

    return res.status(200).json({
      message: `Limpeza concluída. ${cleanedCount} estatísticas antigas removidas.`,
      cleaned: cleanedCount,
      currentDay,
      daysKept: daysToKeep
    });

  } catch (error) {
    console.error('Erro na limpeza de estatísticas:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
