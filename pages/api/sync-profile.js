import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, localData } = req.body;

    if (!username || !localData) {
      return res.status(400).json({ error: 'Username e localData são obrigatórios' });
    }

    console.log('🔄 SYNC-PROFILE: Sincronizando dados para', username);
    console.log('📦 Dados locais recebidos:', localData);

    // Buscar perfil atual no servidor
    const currentProfile = await kv.get(`user:${username}`);
    console.log('📋 Perfil atual no servidor:', currentProfile);

    if (!currentProfile) {
      return res.status(404).json({ error: 'Usuário não encontrado no servidor' });
    }

    // Preparar dados atualizados
    const updatedProfile = {
      ...currentProfile,
      xp: localData.xp || currentProfile.xp || 0,
      level: localData.level || currentProfile.level || 1,
      achievements: localData.achievements || currentProfile.achievements || [],
      stats: {
        ...currentProfile.stats,
        ...localData.stats,
        xp: localData.xp || currentProfile.stats?.xp || 0,
        level: localData.level || currentProfile.stats?.level || 1
      },
      lastSyncAt: new Date().toISOString()
    };

    console.log('💾 Salvando perfil atualizado:', updatedProfile);

    // Salvar no servidor
    await kv.set(`user:${username}`, updatedProfile);

    // Verificar se foi salvo corretamente
    const verifyProfile = await kv.get(`user:${username}`);
    console.log('✅ Verificação pós-salvamento:', verifyProfile);

    return res.status(200).json({
      success: true,
      message: 'Dados sincronizados com sucesso',
      profile: updatedProfile
    });

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
