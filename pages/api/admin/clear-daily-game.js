// API para limpar dados de jogo diário (apenas para desenvolvimento/teste)
import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../../utils/auth';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // Apenas permitir em desenvolvimento
  if (!isDevelopment) {
    return res.status(403).json({ error: 'Apenas disponível em desenvolvimento' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const { date } = req.body;
    const userId = authResult.userId;

    if (!date) {
      return res.status(400).json({ error: 'Data é obrigatória' });
    }

    // Chave para armazenar jogos diários do usuário
    const dailyGameKey = `daily_game:${userId}:${date}`;

    console.log(`🧹 Limpando jogo diário para ${userId} em ${date}`);

    // Remover do armazenamento
    if (isDevelopment && !hasKVConfig) {
      // Usar armazenamento local em desenvolvimento
      const { localDailyGames } = require('../validate-daily-game');
      if (localDailyGames && localDailyGames.has(dailyGameKey)) {
        localDailyGames.delete(dailyGameKey);
        console.log(`✅ Jogo diário removido do armazenamento local`);
      }
    } else {
      const { safeKV } = require('../../../utils/kv-fix');
      await safeKV.del(dailyGameKey);
      console.log(`✅ Jogo diário removido do KV`);
    }

    return res.status(200).json({
      success: true,
      message: `Jogo diário removido para ${userId} em ${date}`,
      key: dailyGameKey
    });

  } catch (error) {
    console.error('Erro ao limpar jogo diário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
