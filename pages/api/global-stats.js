// API para estatísticas globais simplificadas
import { safeKV } from '../../utils/kv-fix';

// Fallback para desenvolvimento local - armazenamento em memória
const localStats = new Map();
const localGlobalStats = {
  totalGames: 0,
  averageAttempts: 3.2,
  lastUpdated: Date.now()
};

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

// Função para obter o dia atual (UTC)
const getCurrentDay = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const currentDay = getCurrentDay();
    let stats;

    if (isDevelopment && !hasKVConfig) {
      // Buscar dados do armazenamento local em desenvolvimento
      const dailyStatsKey = `stats:daily:${currentDay}`;
      const localDailyData = localStats.get(dailyStatsKey);

      if (localDailyData && localDailyData.totalGames > 0) {
        stats = {
          totalGames: localDailyData.totalGames,
          averageAttempts: localDailyData.averageAttempts || 3.2
        };
      } else {
        // Fallback para dados iniciais
        stats = {
          totalGames: 0,
          averageAttempts: 3.2
        };
      }
    } else {
      // Buscar dados reais do Vercel KV para o dia atual
      try {
        const dailyStatsKey = `stats:daily:${currentDay}`;
        const rawStats = await safeKV.get(dailyStatsKey);

        if (rawStats && rawStats.totalGames >= 0) {
          stats = {
            totalGames: rawStats.totalGames || 0,
            averageAttempts: rawStats.averageAttempts || 3.2
          };
        } else {
          // Fallback para dados iniciais se não houver dados reais
          stats = {
            totalGames: 0,
            averageAttempts: 3.2
          };
        }
      } catch (error) {
        // Silenciar erro se for problema de configuração KV
        if (!error.message.includes('Missing required environment variable')) {
          console.error('Erro ao acessar KV para estatísticas globais:', error);
        }
        // Fallback para dados iniciais
        stats = {
          totalGames: 0,
          averageAttempts: 3.2
        };
      }
    }

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Erro na API de estatísticas globais:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      // Retornar dados iniciais mesmo em caso de erro
      totalGames: 0,
      averageAttempts: 3.2
    });
  }
}
