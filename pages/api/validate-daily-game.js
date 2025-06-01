// API para validar se usuário já jogou o jogo diário hoje
import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local
const localDailyGames = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para verificar autenticação
const verifyAuthentication = async (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authenticated: false, error: 'Token de autorização não fornecido' };
  }

  const sessionToken = authHeader.substring(7);
  const sessionKey = `session:${sessionToken}`;
  let sessionData;

  try {
    if (isDevelopment && !hasKVConfig) {
      // Buscar no storage local
      const { localSessions } = require('./auth');
      sessionData = localSessions.get(sessionKey);
    } else {
      sessionData = await kv.get(sessionKey);
    }

    if (!sessionData) {
      return { authenticated: false, error: 'Sessão inválida ou expirada' };
    }

    // Verificar se sessão expirou
    if (new Date() > new Date(sessionData.expiresAt)) {
      return { authenticated: false, error: 'Sessão expirada' };
    }

    return {
      authenticated: true,
      userId: `auth_${sessionData.username}`,
      username: sessionData.username
    };
  } catch (error) {
    console.error('Erro ao verificar autenticação:', error);
    return { authenticated: false, error: 'Erro interno de autenticação' };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const { date, gameStats } = req.body;
    const userId = authResult.userId;

    if (!date || !gameStats) {
      return res.status(400).json({ error: 'Data e estatísticas do jogo são obrigatórias' });
    }

    // Chave para armazenar jogos diários do usuário
    const dailyGameKey = `daily_game:${userId}:${date}`;

    // Verificar se usuário já jogou hoje
    let existingGame = null;
    
    if (isDevelopment && !hasKVConfig) {
      existingGame = localDailyGames.get(dailyGameKey);
    } else {
      existingGame = await kv.get(dailyGameKey);
    }

    if (existingGame) {
      console.log(`🚫 Usuário ${userId} já jogou em ${date}:`, existingGame);
      return res.status(400).json({ 
        error: 'Jogo diário já completado hoje',
        existingGame: {
          date: existingGame.date,
          won: existingGame.won,
          attempts: existingGame.attempts,
          completedAt: existingGame.completedAt
        }
      });
    }

    // Registrar o jogo atual
    const gameRecord = {
      userId: userId,
      date: date,
      won: gameStats.won,
      attempts: gameStats.attempts,
      mode: gameStats.mode,
      song: gameStats.song ? {
        title: gameStats.song.title,
        game: gameStats.song.game,
        id: gameStats.song.id
      } : null,
      playTime: gameStats.playTime || 0,
      completedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // Salvar no armazenamento
    if (isDevelopment && !hasKVConfig) {
      localDailyGames.set(dailyGameKey, gameRecord);
    } else {
      await kv.set(dailyGameKey, gameRecord, { ex: 86400 * 7 }); // Expira em 7 dias
    }

    console.log(`✅ Jogo diário registrado para ${userId} em ${date}:`, {
      won: gameRecord.won,
      attempts: gameRecord.attempts,
      song: gameRecord.song?.title
    });

    return res.status(200).json({
      success: true,
      message: 'Jogo diário validado e registrado',
      gameRecord: {
        date: gameRecord.date,
        won: gameRecord.won,
        attempts: gameRecord.attempts,
        completedAt: gameRecord.completedAt
      }
    });

  } catch (error) {
    console.error('Erro na validação do jogo diário:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
