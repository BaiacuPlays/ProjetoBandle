// API para estatísticas globais simplificadas
import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local - armazenamento em memória
const localStats = new Map();
const localGlobalStats = {
  totalGames: 0,
  averageAttempts: 3.2,
  lastUpdated: Date.now()
};

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    let stats;

    if (isDevelopment && !hasKVConfig) {
      // Buscar dados do armazenamento local em desenvolvimento
      const globalStatsKey = 'stats:global';
      const localGlobalData = localStats.get(globalStatsKey);

      if (localGlobalData && localGlobalData.totalGames > 0) {
        stats = {
          totalGames: localGlobalData.totalGames,
          averageAttempts: localGlobalData.averageAttempts || 3.2
        };
      } else {
        // Fallback para dados iniciais
        stats = {
          totalGames: 0,
          averageAttempts: 3.2
        };
      }
    } else {
      // Buscar dados reais do Vercel KV
      try {
        const globalStatsKey = 'stats:global';
        const rawStats = await kv.get(globalStatsKey);

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
        console.error('Erro ao acessar KV para estatísticas globais:', error);
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
