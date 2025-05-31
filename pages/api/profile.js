// API para gerenciar perfis de usuário no servidor
import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local - armazenamento em memória
const localProfiles = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Função para validar dados do perfil
const validateProfile = (profileData) => {
  if (!profileData || typeof profileData !== 'object') {
    throw new Error('Dados de perfil inválidos');
  }

  if (!profileData.id || typeof profileData.id !== 'string') {
    throw new Error('ID do usuário é obrigatório');
  }

  if (!profileData.stats || typeof profileData.stats !== 'object') {
    throw new Error('Estatísticas do perfil são obrigatórias');
  }

  return true;
};

// Função para sanitizar dados do perfil (remover dados sensíveis se houver)
const sanitizeProfile = (profileData) => {
  // Por enquanto, retorna todos os dados
  // No futuro, pode remover campos sensíveis se necessário
  return profileData;
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      // Buscar perfil do usuário
      const { userId } = req.query;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      const profileKey = `profile:${userId}`;
      let profile = null;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        profile = localProfiles.get(profileKey);
      } else {
        // Usar Vercel KV em produção
        try {
          profile = await kv.get(profileKey);
        } catch (error) {
          console.error('Erro ao acessar KV:', error);
          return res.status(500).json({ error: 'Erro interno do servidor' });
        }
      }

      if (!profile) {
        return res.status(404).json({ error: 'Perfil não encontrado' });
      }

      return res.status(200).json({
        success: true,
        profile: sanitizeProfile(profile)
      });

    } else if (method === 'POST') {
      // Criar ou atualizar perfil
      const { userId, profileData } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      // Validar dados do perfil
      try {
        validateProfile(profileData);
      } catch (error) {
        return res.status(400).json({ error: error.message });
      }

      // Adicionar timestamp de atualização
      const updatedProfile = {
        ...profileData,
        id: userId, // Garantir que o ID está correto
        lastSyncedAt: new Date().toISOString(),
        version: profileData.version || '1.0'
      };

      const profileKey = `profile:${userId}`;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        localProfiles.set(profileKey, updatedProfile);
      } else {
        // Usar Vercel KV em produção
        try {
          await kv.set(profileKey, updatedProfile);
        } catch (error) {
          console.error('Erro ao salvar perfil no KV:', error);
          return res.status(500).json({ error: 'Erro ao salvar perfil' });
        }
      }

      console.log(`✅ Perfil ${userId} salvo com sucesso`);

      return res.status(200).json({
        success: true,
        message: 'Perfil salvo com sucesso',
        profile: sanitizeProfile(updatedProfile)
      });

    } else if (method === 'DELETE') {
      // Deletar conta do usuário
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'ID do usuário é obrigatório' });
      }

      const profileKey = `profile:${userId}`;

      if (isDevelopment && !hasKVConfig) {
        // Usar armazenamento local em desenvolvimento
        const existed = localProfiles.has(profileKey);
        localProfiles.delete(profileKey);
        
        if (!existed) {
          return res.status(404).json({ error: 'Perfil não encontrado' });
        }
      } else {
        // Usar Vercel KV em produção
        try {
          const existed = await kv.get(profileKey);
          if (!existed) {
            return res.status(404).json({ error: 'Perfil não encontrado' });
          }
          
          await kv.del(profileKey);
        } catch (error) {
          console.error('Erro ao deletar perfil do KV:', error);
          return res.status(500).json({ error: 'Erro ao deletar perfil' });
        }
      }

      console.log(`🗑️ Perfil ${userId} deletado com sucesso`);

      return res.status(200).json({
        success: true,
        message: 'Conta deletada com sucesso'
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de perfil:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
