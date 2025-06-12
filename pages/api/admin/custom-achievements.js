// Fallback para desenvolvimento local
let localCustomAchievements = [];

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Funções de armazenamento com fallback
const getCustomAchievements = async () => {
  if (kv) {
    try {
      return await kv.get('admin:custom_achievements') || [];
    } catch (error) {
      console.warn('Erro ao acessar KV, usando fallback local:', error);
      return localCustomAchievements;
    }
  }
  return localCustomAchievements;
};

const setCustomAchievements = async (achievements) => {
  if (kv) {
    try {
      await kv.set('admin:custom_achievements', achievements);
      return;
    } catch (error) {
      console.warn('Erro ao salvar no KV, usando fallback local:', error);
    }
  }
  localCustomAchievements = achievements;
};

// Função para sanitizar entrada
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

// Função para gerar ID único
function generateAchievementId(title) {
  return `custom_${title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now()}`;
}

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Para buscar conquistas ativas, não precisa de autenticação
      const { active_only } = req.query;
      
      if (active_only === 'true') {
        const achievements = await getCustomAchievements();
        const activeAchievements = achievements.filter(achievement => achievement.active);
        
        return res.status(200).json({
          success: true,
          achievements: activeAchievements
        });
      }
      
      // Para buscar todas as conquistas, precisa de autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const achievements = await getCustomAchievements();
      
      return res.status(200).json({
        success: true,
        achievements
      });

    } else if (method === 'POST') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const {
        title,
        description,
        icon = '🏆',
        rarity = 'common',
        xpReward = 100,
        condition = 'games_played',
        value = 1,
        active = true
      } = req.body;

      // Validações
      if (!title || !description) {
        return res.status(400).json({
          error: 'Título e descrição são obrigatórios'
        });
      }

      if (!['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarity)) {
        return res.status(400).json({
          error: 'Raridade deve ser: common, uncommon, rare, epic ou legendary'
        });
      }

      const validConditions = [
        'games_played', 'games_won', 'streak', 'perfect_games',
        'daily_streak', 'multiplayer_wins', 'songs_guessed',
        'franchises_played', 'fast_guesses', 'level_reached'
      ];

      if (!validConditions.includes(condition)) {
        return res.status(400).json({
          error: `Condição deve ser uma das seguintes: ${validConditions.join(', ')}`
        });
      }

      // Criar nova conquista
      const newAchievement = {
        id: generateAchievementId(title),
        title: sanitizeInput(title, 100),
        description: sanitizeInput(description, 300),
        icon: sanitizeInput(icon, 10),
        rarity: sanitizeInput(rarity, 20),
        xpReward: Math.max(0, Math.min(10000, parseInt(xpReward) || 100)),
        condition: sanitizeInput(condition, 50),
        value: Math.max(1, parseInt(value) || 1),
        active: Boolean(active),
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Buscar conquistas existentes
      const achievements = await getCustomAchievements();
      
      // Verificar se já existe uma conquista com o mesmo título
      const existingAchievement = achievements.find(a => 
        a.title.toLowerCase() === newAchievement.title.toLowerCase()
      );

      if (existingAchievement) {
        return res.status(409).json({
          error: 'Já existe uma conquista com este título'
        });
      }
      
      // Adicionar nova conquista
      achievements.push(newAchievement);
      
      // Salvar
      await setCustomAchievements(achievements);

      return res.status(201).json({
        success: true,
        achievement: newAchievement,
        message: 'Conquista criada com sucesso'
      });

    } else if (method === 'PUT') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }
      
      const { id } = req.query;
      const {
        title,
        description,
        icon,
        rarity,
        xpReward,
        condition,
        value,
        active
      } = req.body;

      if (!id) {
        return res.status(400).json({
          error: 'ID da conquista é obrigatório'
        });
      }

      // Buscar conquistas existentes
      const achievements = await getCustomAchievements();
      
      // Encontrar conquista
      const achievementIndex = achievements.findIndex(a => a.id === id);
      if (achievementIndex === -1) {
        return res.status(404).json({
          error: 'Conquista não encontrada'
        });
      }

      // Validar raridade se fornecida
      if (rarity && !['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarity)) {
        return res.status(400).json({
          error: 'Raridade deve ser: common, uncommon, rare, epic ou legendary'
        });
      }

      // Atualizar conquista
      const updatedAchievement = {
        ...achievements[achievementIndex],
        ...(title && { title: sanitizeInput(title, 100) }),
        ...(description && { description: sanitizeInput(description, 300) }),
        ...(icon && { icon: sanitizeInput(icon, 10) }),
        ...(rarity && { rarity: sanitizeInput(rarity, 20) }),
        ...(xpReward !== undefined && { xpReward: Math.max(0, Math.min(10000, parseInt(xpReward) || 100)) }),
        ...(condition && { condition: sanitizeInput(condition, 50) }),
        ...(value !== undefined && { value: Math.max(1, parseInt(value) || 1) }),
        ...(active !== undefined && { active: Boolean(active) }),
        updatedAt: new Date().toISOString()
      };

      achievements[achievementIndex] = updatedAchievement;
      
      // Salvar
      await setCustomAchievements(achievements);

      return res.status(200).json({
        success: true,
        achievement: updatedAchievement,
        message: 'Conquista atualizada com sucesso'
      });

    } else if (method === 'DELETE') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }
      
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({
          error: 'ID da conquista é obrigatório'
        });
      }

      // Buscar conquistas existentes
      const achievements = await getCustomAchievements();
      
      // Filtrar conquista a ser deletada
      const filteredAchievements = achievements.filter(a => a.id !== id);
      
      if (filteredAchievements.length === achievements.length) {
        return res.status(404).json({
          error: 'Conquista não encontrada'
        });
      }

      // Salvar
      await setCustomAchievements(filteredAchievements);

      return res.status(200).json({
        success: true,
        message: 'Conquista deletada com sucesso'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de conquistas customizadas:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}
