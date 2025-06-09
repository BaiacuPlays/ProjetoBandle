import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      // Buscar perfil
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      try {
        const profile = await kv.get(`profile:${userId}`);
        
        if (profile) {
          return res.status(200).json({ 
            success: true, 
            profile: profile 
          });
        } else {
          return res.status(404).json({ 
            success: false, 
            message: 'Perfil não encontrado' 
          });
        }
      } catch (error) {
        console.error('Erro ao buscar perfil no KV:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor',
          details: error.message 
        });
      }

    } else if (req.method === 'POST') {
      // Salvar perfil
      const { userId, profile } = req.body;
      
      if (!userId || !profile) {
        return res.status(400).json({ 
          error: 'userId e profile são obrigatórios' 
        });
      }

      try {
        // Adicionar timestamp de salvamento
        const profileToSave = {
          ...profile,
          id: userId,
          savedAt: new Date().toISOString()
        };

        await kv.set(`profile:${userId}`, profileToSave);
        
        console.log(`✅ Perfil salvo para usuário ${userId}`);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Perfil salvo com sucesso',
          profile: profileToSave
        });
        
      } catch (error) {
        console.error('Erro ao salvar perfil no KV:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor',
          details: error.message 
        });
      }

    } else if (req.method === 'DELETE') {
      // Deletar perfil
      const { userId } = req.query;
      
      if (!userId) {
        return res.status(400).json({ error: 'userId é obrigatório' });
      }

      try {
        await kv.del(`profile:${userId}`);
        
        console.log(`🗑️ Perfil deletado para usuário ${userId}`);
        
        return res.status(200).json({ 
          success: true, 
          message: 'Perfil deletado com sucesso' 
        });
        
      } catch (error) {
        console.error('Erro ao deletar perfil no KV:', error);
        return res.status(500).json({ 
          error: 'Erro interno do servidor',
          details: error.message 
        });
      }

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro geral na API de perfil:', error);
    return res.status(500).json({ 
      error: 'Erro interno do servidor',
      details: error.message 
    });
  }
}
