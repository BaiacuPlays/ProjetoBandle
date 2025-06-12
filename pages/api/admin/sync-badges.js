import { kv } from '@vercel/kv';
import { syncProfileBadges, debugBadges } from '../../../data/badges';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Maps locais para desenvolvimento
const localProfiles = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  // Verificar chave de admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  const { userId, username } = req.body;

  if (!userId && !username) {
    return res.status(400).json({ error: 'userId ou username é obrigatório' });
  }

  try {
    let profileKey;
    let profile = null;

    if (userId) {
      profileKey = `profile:${userId}`;
    } else {
      // Buscar userId pelo username
      const userKey = `user:${username}`;
      let userData = null;

      if (isDevelopment && !hasKVConfig) {
        // Em desenvolvimento, simular
        console.log(`🔄 [SIMULADO] Sincronizando badges para ${username || userId}`);
        return res.status(200).json({ 
          success: true, 
          message: 'Sincronização simulada em desenvolvimento',
          debug: 'Funcionalidade disponível apenas em produção'
        });
      } else {
        userData = await kv.get(userKey);
      }

      if (!userData) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      profileKey = `profile:${userData.id}`;
    }

    // Carregar perfil
    if (isDevelopment && !hasKVConfig) {
      profile = localProfiles.get(profileKey);
    } else {
      profile = await kv.get(profileKey);
    }

    if (!profile) {
      return res.status(404).json({ error: 'Perfil não encontrado' });
    }

    console.log('🔍 Executando debug de badges antes da sincronização...');
    debugBadges(profile);

    // Sincronizar badges
    const syncedProfile = syncProfileBadges(profile);
    
    let badgesAdded = [];
    if (syncedProfile !== profile) {
      const oldBadges = profile.badges || [];
      const newBadges = syncedProfile.badges || [];
      badgesAdded = newBadges.filter(badge => !oldBadges.includes(badge));

      // Salvar perfil atualizado
      if (isDevelopment && !hasKVConfig) {
        localProfiles.set(profileKey, syncedProfile);
      } else {
        await kv.set(profileKey, syncedProfile);
      }

      console.log(`🎖️ Badges sincronizadas para ${profile.username || profile.displayName}`);
      console.log('📊 Badges adicionadas:', badgesAdded);
    }

    console.log('🔍 Executando debug de badges após a sincronização...');
    debugBadges(syncedProfile);

    return res.status(200).json({
      success: true,
      message: 'Badges sincronizadas com sucesso',
      badgesAdded: badgesAdded,
      totalBadges: syncedProfile.badges?.length || 0,
      profile: {
        username: syncedProfile.username,
        displayName: syncedProfile.displayName,
        level: syncedProfile.level,
        badges: syncedProfile.badges
      }
    });

  } catch (error) {
    console.error('❌ Erro ao sincronizar badges:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
