import { kv } from '@vercel/kv';

// Fallback para desenvolvimento local
const localInvites = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

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

    // Verificar se o usuário não está tentando convidar a si mesmo
    if (invitation.toUserId === currentUserId) {
      return res.status(400).json({ error: 'Você não pode convidar a si mesmo' });
    }

    // Verificação adicional de segurança
    if (invitation.fromUserId === invitation.toUserId) {
      return res.status(400).json({ error: 'IDs de usuário inválidos' });
    }

    // Chave para armazenar convites do usuário destinatário
    const inviteKey = `invites:${invitation.toUserId}`;

    try {
      if (isDevelopment && !hasKVConfig) {
        // Desenvolvimento local - usar Map
        const existingInvites = localInvites.get(inviteKey) || [];

        // Verificar se já existe um convite similar (mesmo remetente, destinatário e sala)
        const duplicateInvite = existingInvites.find(inv =>
          inv.fromUserId === invitation.fromUserId &&
          inv.toUserId === invitation.toUserId &&
          inv.roomCode === invitation.roomCode &&
          inv.status === 'pending'
        );

        if (duplicateInvite) {
          duplicateInvite.timestamp = invitation.timestamp;
          localInvites.set(inviteKey, existingInvites);
        } else {
          const updatedInvites = [...existingInvites, invitation];
          localInvites.set(inviteKey, updatedInvites);
        }
      } else {
        // Produção - usar Vercel KV
        try {
          const existingInvites = await kv.get(inviteKey) || [];

          // Verificar se já existe um convite similar
          const duplicateInvite = existingInvites.find(inv =>
            inv.fromUserId === invitation.fromUserId &&
            inv.toUserId === invitation.toUserId &&
            inv.roomCode === invitation.roomCode &&
            inv.status === 'pending'
          );

          if (duplicateInvite) {
            duplicateInvite.timestamp = invitation.timestamp;
            await kv.set(inviteKey, existingInvites);
          } else {
            const updatedInvites = [...existingInvites, invitation];
            await kv.set(inviteKey, updatedInvites);
          }
        } catch (kvError) {
          throw kvError;
        }
      }

      // Também salvar na lista de convites enviados pelo remetente
      const sentInvitesKey = `sent_invites:${currentUserId}`;

      if (isDevelopment && !hasKVConfig) {
        const existingSentInvites = localInvites.get(sentInvitesKey) || [];
        const updatedSentInvites = [...existingSentInvites, invitation];
        localInvites.set(sentInvitesKey, updatedSentInvites);
      } else {
        try {
          const existingSentInvites = await kv.get(sentInvitesKey) || [];
          const updatedSentInvites = [...existingSentInvites, invitation];
          await kv.set(sentInvitesKey, updatedSentInvites);
        } catch (kvError) {
          // Não falhar por causa disso, o convite principal já foi salvo
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Convite enviado com sucesso',
        inviteId: invitation.id
      });

    } catch (error) {
      return res.status(500).json({
        error: 'Erro ao salvar convite',
        details: isDevelopment ? error.message : undefined
      });
    }

  } catch (error) {
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
