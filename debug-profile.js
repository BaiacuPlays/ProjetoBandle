// Script de debug para verificar dados do perfil
const { kv } = require('@vercel/kv');

async function debugProfile() {
  try {
    console.log('🔍 Verificando dados do perfil...');
    
    // Listar todas as chaves de perfil
    const keys = await kv.keys('profile:*');
    console.log('📋 Chaves de perfil encontradas:', keys);
    
    for (const key of keys) {
      const profile = await kv.get(key);
      console.log(`\n📄 Perfil ${key}:`, {
        id: profile?.id,
        username: profile?.username,
        displayName: profile?.displayName,
        bio: profile?.bio,
        avatar: profile?.avatar,
        level: profile?.level,
        xp: profile?.xp,
        stats: profile?.stats ? {
          totalGames: profile.stats.totalGames,
          wins: profile.stats.wins,
          winRate: profile.stats.winRate
        } : 'Não definido'
      });
    }
    
    // Verificar usuários autenticados
    const userKeys = await kv.keys('user:*');
    console.log('\n👥 Usuários encontrados:', userKeys);
    
    for (const userKey of userKeys) {
      const user = await kv.get(userKey);
      console.log(`\n👤 Usuário ${userKey}:`, {
        username: user?.username,
        displayName: user?.displayName,
        email: user?.email,
        createdAt: user?.createdAt
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar dados:', error);
  }
}

debugProfile();
