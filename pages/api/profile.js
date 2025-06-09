import { verifyAuthentication } from '../../utils/auth';
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  console.log('🔍 [PROFILE API] Método:', req.method);
  console.log('🔍 [PROFILE API] Headers:', {
    authorization: req.headers.authorization ? 'PRESENTE' : 'AUSENTE',
    'content-type': req.headers['content-type']
  });

  // Verificar autenticação
  const authResult = await verifyAuthentication(req);
  console.log('🔍 [PROFILE API] Auth result:', authResult);

  if (!authResult.authenticated) {
    console.log('❌ [PROFILE API] Falha na autenticação:', authResult.error);
    return res.status(401).json({ error: authResult.error });
  }

  console.log('✅ [PROFILE API] Usuário autenticado:', authResult.userId);

  const userId = authResult.userId;

  if (req.method === 'GET') {
    try {
      const { userId: targetUserId } = req.query;
      const profileUserId = targetUserId || userId;
      const profileKey = `profile:${profileUserId}`;

      console.log('🔍 Buscando perfil:', profileKey);

      // Buscar perfil no Vercel KV
      const profile = await kv.get(profileKey);

      if (!profile) {
        console.log('❌ Perfil não encontrado:', profileKey);
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      console.log('✅ Perfil encontrado:', profile.username);
      return res.status(200).json({
        success: true,
        profile
      });

    } catch (error) {
      console.error('❌ Erro ao buscar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'POST') {
    try {
      if (!req.body || !req.body.profile) {
        return res.status(400).json({ error: 'Dados do perfil não fornecidos' });
      }

      const profileData = req.body.profile;
      const profileKey = `profile:${userId}`;

      // Garantir que o ID do perfil corresponde ao usuário autenticado
      profileData.id = userId;
      profileData.lastUpdated = new Date().toISOString();

      console.log('💾 Salvando perfil:', profileKey, profileData.username);

      // Salvar no Vercel KV
      await kv.set(profileKey, profileData);

      console.log('✅ Perfil salvo com sucesso:', profileData.username);

      return res.status(200).json({
        success: true,
        message: 'Perfil salvo com sucesso',
        profile: profileData
      });

    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const profileKey = `profile:${userId}`;

      console.log('🗑️ Deletando perfil:', profileKey);

      // Deletar do Vercel KV
      await kv.del(profileKey);

      console.log('✅ Perfil deletado com sucesso');

      return res.status(200).json({
        success: true,
        message: 'Perfil deletado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao deletar perfil:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}
