// API para estatísticas do modo diário (por userid)
import { safeKV } from '../../utils/kv-fix';

// Fallback para desenvolvimento local - armazenamento em memória
const localStats = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';

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
    // Buscar estatísticas do usuário usando SafeKV
    try {
      const stats = await safeKV.get(statsKey);
      return res.status(200).json(stats || defaultStats);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return res.status(200).json(defaultStats);
    }
  }

  if (method === 'POST') {
    // Adicionar resultado de uma partida
    const { won, attempts } = req.body;
    if (typeof won !== 'boolean' || (won && (typeof attempts !== 'number' || attempts < 1 || attempts > 6))) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }

    try {
      // Buscar estatísticas atuais usando SafeKV
      let stats = await safeKV.get(statsKey);

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

      // Salvar estatísticas usando SafeKV
      await safeKV.set(statsKey, stats);

      // Atualizar estatísticas globais
      await updateGlobalStats(won, attempts);

      return res.status(200).json(stats);

    } catch (error) {
      console.error('Erro ao processar estatísticas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não suportado' });
}

// Função para obter o dia atual (UTC)
const getCurrentDay = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para atualizar estatísticas globais diárias
async function updateGlobalStats(won, attempts) {
  try {
    const currentDay = getCurrentDay();
    const dailyStatsKey = `stats:daily:${currentDay}`;

    // Buscar estatísticas diárias atuais usando SafeKV
    let dailyStats = await safeKV.get(dailyStatsKey) || {
      totalGames: 0,
      totalWins: 0,
      totalLosses: 0,
      attemptDistribution: [0, 0, 0, 0, 0, 0], // tentativas 1-6
      totalAttempts: 0,
      averageAttempts: 0,
      date: currentDay
    };

    // Incrementar total de jogos
    dailyStats.totalGames += 1;

    if (won) {
      dailyStats.totalWins += 1;
      // Incrementar distribuição de tentativas (attempts é 1-based, array é 0-based)
      if (attempts >= 1 && attempts <= 6) {
        dailyStats.attemptDistribution[attempts - 1] += 1;
      }
      dailyStats.totalAttempts += attempts;
    } else {
      dailyStats.totalLosses += 1;
      // Para derrotas, consideramos 6 tentativas para o cálculo da média
      dailyStats.totalAttempts += 6;
    }

    // Calcular nova média de tentativas
    dailyStats.averageAttempts = dailyStats.totalGames > 0
      ? Math.round((dailyStats.totalAttempts / dailyStats.totalGames) * 10) / 10
      : 0;

    // Salvar estatísticas diárias atualizadas usando SafeKV
    await safeKV.set(dailyStatsKey, dailyStats);

    console.log('Estatísticas diárias atualizadas:', {
      date: currentDay,
      totalGames: dailyStats.totalGames,
      averageAttempts: dailyStats.averageAttempts,
      won,
      attempts
    });

  } catch (error) {
    console.error('Erro ao atualizar estatísticas diárias:', error);
  }
}
