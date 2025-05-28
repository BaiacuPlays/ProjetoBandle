// API para estatísticas do modo diário (por userid)
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  const { method } = req;
  const { userid } = req.query;

  if (!userid || typeof userid !== 'string') {
    return res.status(400).json({ error: 'UserID obrigatório' });
  }

  const statsKey = `stats:daily:${userid}`;

  if (method === 'GET') {
    // Buscar estatísticas do usuário
    const stats = await kv.get(statsKey);
    return res.status(200).json(stats || {
      totalGames: 0,
      wins: 0,
      losses: 0,
      attemptDistribution: [0, 0, 0, 0, 0, 0],
      winPercentage: 0,
      averageAttempts: 0
    });
  }

  if (method === 'POST') {
    // Adicionar resultado de uma partida
    const { won, attempts } = req.body;
    if (typeof won !== 'boolean' || (won && (typeof attempts !== 'number' || attempts < 1 || attempts > 6))) {
      return res.status(400).json({ error: 'Dados inválidos' });
    }
    let stats = await kv.get(statsKey);
    if (!stats) {
      stats = {
        totalGames: 0,
        wins: 0,
        losses: 0,
        attemptDistribution: [0, 0, 0, 0, 0, 0],
        winPercentage: 0,
        averageAttempts: 0
      };
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
    await kv.set(statsKey, stats);
    return res.status(200).json(stats);
  }

  return res.status(405).json({ error: 'Método não suportado' });
}
