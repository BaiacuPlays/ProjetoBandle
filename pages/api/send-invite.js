import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local
const localInvites = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { invitation, currentUserId } = req.body;

    if (!invitation || !currentUserId) {
      return res.status(400).json({ error: 'Dados obrigatórios não fornecidos' });
    }

    // Validar dados do convite
    if (!invitation.toUserId || !invitation.roomCode || !invitation.hostName) {
      return res.status(400).json({ error: 'Dados do convite incompletos' });
    }

    // Chave para armazenar convites do usuário destinatário
    const inviteKey = `invites:${invitation.toUserId}`;

    try {
      if (isDevelopment && !hasKVConfig) {
        // Desenvolvimento local - usar Map
        const existingInvites = localInvites.get(inviteKey) || [];
        const updatedInvites = [...existingInvites, invitation];
        localInvites.set(inviteKey, updatedInvites);
        
        console.log('Convite salvo localmente:', invitation);
      } else {
        // Produção - usar Vercel KV
        const existingInvites = await kv.get(inviteKey) || [];
        const updatedInvites = [...existingInvites, invitation];
        await kv.set(inviteKey, updatedInvites);
        
        console.log('Convite salvo no KV:', invitation);
      }

      // Também salvar na lista de convites enviados pelo remetente
      const sentInvitesKey = `sent_invites:${currentUserId}`;
      
      if (isDevelopment && !hasKVConfig) {
        const existingSentInvites = localInvites.get(sentInvitesKey) || [];
        const updatedSentInvites = [...existingSentInvites, invitation];
        localInvites.set(sentInvitesKey, updatedSentInvites);
      } else {
        const existingSentInvites = await kv.get(sentInvitesKey) || [];
        const updatedSentInvites = [...existingSentInvites, invitation];
        await kv.set(sentInvitesKey, updatedSentInvites);
      }

      return res.status(200).json({
        success: true,
        message: 'Convite enviado com sucesso'
      });

    } catch (error) {
      console.error('Erro ao salvar convite:', error);
      return res.status(500).json({
        error: 'Erro ao salvar convite',
        details: isDevelopment ? error.message : undefined
      });
    }

  } catch (error) {
    console.error('Erro na API de envio de convites:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
