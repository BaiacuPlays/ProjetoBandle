// API para dar conquistas/badges - Admin
import { achievements } from '../../../data/achievements';
import { badges } from '../../../data/badges';

// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  console.warn('⚠️ KV não disponível:', error.message);
}

const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { userId, username, achievementId, badgeId } = req.body;
    
    if (!userId && !username) {
      return res.status(400).json({ error: 'userId ou username é obrigatório' });
    }

    if (!achievementId && !badgeId) {
      return res.status(400).json({ error: 'achievementId ou badgeId é obrigatório' });
    }

    // Buscar usuário
    let userKey;
    let userData;
    
    if (userId) {
      userKey = `profile:${userId}`;
    } else {
      userKey = `user:${username.toLowerCase()}`;
    }

    if (isDevelopment && !hasKVConfig) {
      // Modo desenvolvimento sem KV
      return res.status(200).json({
        success: true,
        message: 'Conquista concedida (modo desenvolvimento)',
        achievement: achievementId || badgeId
      });
    }

    userData = await kv.get(userKey);
    
    if (!userData) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Inicializar arrays se não existirem
    if (!userData.achievements) userData.achievements = [];
    if (!userData.badges) userData.badges = [];
    if (!userData.titles) userData.titles = [];

    let itemGiven = null;
    let xpBonus = 0;

    if (achievementId) {
      // Dar conquista
      const achievement = achievements[achievementId];
      if (!achievement) {
        return res.status(400).json({ error: 'Conquista não encontrada' });
      }

      if (!userData.achievements.includes(achievementId)) {
        userData.achievements.push(achievementId);
        xpBonus = achievement.xpReward || 0;
        itemGiven = achievement;
        
        console.log(`🏆 Admin deu conquista "${achievement.title}" para ${userData.username || userData.displayName}`);
      } else {
        return res.status(400).json({ error: 'Usuário já possui esta conquista' });
      }
    }

    if (badgeId) {
      // Dar badge
      const badge = badges[badgeId];
      if (!badge) {
        return res.status(400).json({ error: 'Badge não encontrado' });
      }

      if (!userData.badges.includes(badgeId)) {
        userData.badges.push(badgeId);
        itemGiven = badge;
        
        console.log(`🎖️ Admin deu badge "${badge.title}" para ${userData.username || userData.displayName}`);
      } else {
        return res.status(400).json({ error: 'Usuário já possui este badge' });
      }
    }

    // Adicionar XP se houver
    if (xpBonus > 0) {
      userData.xp = (userData.xp || 0) + xpBonus;
      userData.level = Math.floor(Math.sqrt(userData.xp / 300)) + 1;
    }

    // Atualizar timestamp
    userData.lastUpdated = new Date().toISOString();

    // Salvar usuário atualizado
    await kv.set(userKey, userData);

    return res.status(200).json({
      success: true,
      message: `${achievementId ? 'Conquista' : 'Badge'} concedida com sucesso!`,
      item: itemGiven,
      xpBonus,
      newXP: userData.xp,
      newLevel: userData.level
    });

  } catch (error) {
    console.error('Erro ao conceder conquista/badge:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
