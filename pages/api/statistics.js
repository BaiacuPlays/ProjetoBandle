// API para estatísticas do modo diário (por userid)
import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local - armazenamento em memória
const localStats = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  const { method } = req;
  const { userid } = req.query;

  if (!userid || typeof userid !== 'string') {
    return res.status(400).json({ error: 'UserID obrigatório' });
  }

  const statsKey = `stats:daily:${userid}`;
  const defaultStats = {
    totalGames: 0,
    wins: 0,
    losses: 0,
    attemptDistribution: [0, 0, 0, 0, 0, 0],
    winPercentage: 0,
    averageAttempts: 0
  };

  if (method === 'GET') {
    // Buscar estatísticas do usuário
    let stats;

    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      stats = localStats.get(statsKey);
    } else {
      // Usar Vercel KV em produção
      try {
        stats = await kv.get(statsKey);
      } catch (error) {
        console.error('Erro ao acessar KV:', error);
        stats = null;
      }
    }

    return res.status(200).json(stats || defaultStats);
  }

  if (method === 'POST') {
    // Adicionar resultado de uma partida
    const { won, attempts } = req.body;
    if (typeof won !== 'boolean' || (won && (typeof attempts !== 'number' || attempts < 1 || attempts > 6))) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    let stats;

    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      stats = localStats.get(statsKey) || { ...defaultStats };
    } else {
      // Usar Vercel KV em produção
      try {
        stats = await kv.get(statsKey);
      } catch (error) {
        console.error('Erro ao acessar KV:', error);
        stats = null;
      }
    }

    if (!stats) {
      stats = { ...defaultStats };
    }

    stats.totalGames++;
    if (won) {
      stats.wins++;
      const idx = Math.min(Math.max(attempts - 1, 0), 5);
      stats.attemptDistribution[idx]++;
    } else {
      stats.losses++;
    }
    stats.winPercentage = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;
    if (stats.wins > 0) {
      let totalAttempts = 0;
      stats.attemptDistribution.forEach((count, index) => {
        totalAttempts += count * (index + 1);
      });
      stats.averageAttempts = Math.round((totalAttempts / stats.wins) * 10) / 10;
    }

    // Salvar estatísticas
    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      localStats.set(statsKey, stats);
    } else {
      // Usar Vercel KV em produção
      try {
        await kv.set(statsKey, stats);
      } catch (error) {
        console.error('Erro ao salvar no KV:', error);
        // Continuar mesmo com erro para não quebrar a aplicação
      }
    }

    // Atualizar estatísticas globais
    await updateGlobalStats(won, attempts);

    return res.status(200).json(stats);
  }

  return res.status(405).json({ error: 'Método não suportado' });
}

// Função para atualizar estatísticas globais
async function updateGlobalStats(won, attempts) {
  try {
    const globalStatsKey = 'stats:global';

    // Buscar estatísticas globais atuais
    let globalStats;
    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      globalStats = localStats.get(globalStatsKey) || {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        attemptDistribution: [0, 0, 0, 0, 0, 0], // tentativas 1-6
        totalAttempts: 0,
        averageAttempts: 0
      };
    } else {
      // Usar Vercel KV em produção
      globalStats = await kv.get(globalStatsKey) || {
        totalGames: 0,
        totalWins: 0,
        totalLosses: 0,
        attemptDistribution: [0, 0, 0, 0, 0, 0], // tentativas 1-6
        totalAttempts: 0,
        averageAttempts: 0
      };
    }

    // Incrementar total de jogos
    globalStats.totalGames += 1;

    if (won) {
      globalStats.totalWins += 1;
      // Incrementar distribuição de tentativas (attempts é 1-based, array é 0-based)
      if (attempts >= 1 && attempts <= 6) {
        globalStats.attemptDistribution[attempts - 1] += 1;
      }
      globalStats.totalAttempts += attempts;
    } else {
      globalStats.totalLosses += 1;
      // Para derrotas, consideramos 6 tentativas para o cálculo da média
      globalStats.totalAttempts += 6;
    }

    // Calcular nova média de tentativas
    globalStats.averageAttempts = globalStats.totalGames > 0
      ? Math.round((globalStats.totalAttempts / globalStats.totalGames) * 10) / 10
      : 0;

    // Salvar estatísticas globais atualizadas
    if (isDevelopment && !hasKVConfig) {
      localStats.set(globalStatsKey, globalStats);
    } else {
      try {
        await kv.set(globalStatsKey, globalStats);
      } catch (error) {
        console.error('Erro ao salvar estatísticas globais no KV:', error);
      }
    }

    console.log('Estatísticas globais atualizadas:', {
      totalGames: globalStats.totalGames,
      averageAttempts: globalStats.averageAttempts,
      won,
      attempts
    });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas globais:', error);
  }
}
