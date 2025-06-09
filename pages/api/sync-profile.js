// API para sincronização de perfis com Cloudflare R2
import { steamStorage } from '../../utils/cloud-storage';
import { validateProfile, migrateProfile } from '../../utils/steam-like-profile';
import { verifyAuthentication } from '../../utils/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.isValid) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    const { userId, profile } = req.body;

    if (!userId || !profile) {
      return res.status(400).json({ error: 'userId e profile são obrigatórios' });
    }

    // Verificar se o usuário pode sincronizar este perfil
    if (authResult.userId !== userId) {
      return res.status(403).json({ error: 'Não autorizado a sincronizar este perfil' });
    }

    console.log(`🔄 Sincronizando perfil para usuário: ${userId}`);

    // Validar estrutura do perfil
    const validation = validateProfile(profile);
    let profileToSync = profile;

    if (!validation.isValid) {
      console.warn('⚠️ Perfil com problemas, tentando migrar:', validation.errors);

      // Tentar migrar perfil problemático
      const migratedProfile = migrateProfile(profile, userId, authResult.username);
      const newValidation = validateProfile(migratedProfile);

      if (!newValidation.isValid) {
        return res.status(400).json({
          error: 'Perfil inválido e não pôde ser migrado',
          details: newValidation.errors
        });
      }

      // Usar perfil migrado
      profileToSync = migratedProfile;
    }

    // Adicionar metadados de sincronização
    profileToSync = {
      ...profileToSync,
      lastSyncAt: new Date().toISOString(),
      syncedBy: authResult.username,
      syncVersion: 2
    };

    // Salvar no sistema de armazenamento
    const saveResults = await steamStorage.saveProfile(userId, profileToSync);

    // Verificar se pelo menos uma forma de salvamento funcionou
    const success = saveResults.localStorage || saveResults.cloudflare;

    if (success) {
      console.log(`✅ Perfil sincronizado com sucesso para ${userId}`);

      return res.status(200).json({
        success: true,
        message: 'Perfil sincronizado com sucesso',
        syncResults: saveResults,
        profile: profileToSync
      });
    } else {
      console.error(`❌ Falha na sincronização para ${userId}`);

      return res.status(500).json({
        error: 'Falha ao sincronizar perfil',
        syncResults: saveResults
      });
    }

  } catch (error) {
    console.error('❌ Erro na API de sincronização:', error);

    return res.status(500).json({
      error: 'Erro interno do servidor',
      message: error.message
    });
  }
}
