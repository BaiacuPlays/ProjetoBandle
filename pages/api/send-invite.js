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
      console.log(`📤 Salvando convite para ${invitation.toUserId}:`, invitation);
      console.log(`🔧 Ambiente: ${isDevelopment ? 'desenvolvimento' : 'produção'}, KV configurado: ${hasKVConfig}`);

      if (isDevelopment && !hasKVConfig) {
        // Desenvolvimento local - usar Map
        const existingInvites = localInvites.get(inviteKey) || [];
        console.log(`📊 Convites existentes no Map local: ${existingInvites.length}`);

        // Verificar se já existe um convite similar (mesmo remetente, destinatário e sala)
        const duplicateInvite = existingInvites.find(inv =>
          inv.fromUserId === invitation.fromUserId &&
          inv.toUserId === invitation.toUserId &&
          inv.roomCode === invitation.roomCode &&
          inv.status === 'pending'
        );

        if (duplicateInvite) {
          console.log('⚠️ Convite duplicado detectado, atualizando timestamp...');
          duplicateInvite.timestamp = invitation.timestamp;
          localInvites.set(inviteKey, existingInvites);
        } else {
          const updatedInvites = [...existingInvites, invitation];
          localInvites.set(inviteKey, updatedInvites);
          console.log(`✅ Convite salvo localmente para: ${invitation.toUserId}`, invitation);
          console.log(`📊 Total de convites após salvar: ${updatedInvites.length}`);
        }
      } else {
        // Produção - usar Vercel KV
        try {
          const existingInvites = await kv.get(inviteKey) || [];
          console.log(`📊 Convites existentes no KV: ${existingInvites.length}`);

          // Verificar se já existe um convite similar
          const duplicateInvite = existingInvites.find(inv =>
            inv.fromUserId === invitation.fromUserId &&
            inv.toUserId === invitation.toUserId &&
            inv.roomCode === invitation.roomCode &&
            inv.status === 'pending'
          );

          if (duplicateInvite) {
            console.log('⚠️ Convite duplicado detectado, atualizando timestamp...');
            duplicateInvite.timestamp = invitation.timestamp;
            await kv.set(inviteKey, existingInvites);
          } else {
            const updatedInvites = [...existingInvites, invitation];
            await kv.set(inviteKey, updatedInvites);
            console.log(`✅ Convite salvo no KV para: ${invitation.toUserId}`, invitation);
            console.log(`📊 Total de convites após salvar: ${updatedInvites.length}`);
          }
        } catch (kvError) {
          console.error('❌ Erro ao salvar no KV:', kvError);
          throw kvError;
        }
      }

      // Também salvar na lista de convites enviados pelo remetente
      const sentInvitesKey = `sent_invites:${currentUserId}`;
      console.log(`📤 Salvando na lista de enviados: ${sentInvitesKey}`);

      if (isDevelopment && !hasKVConfig) {
        const existingSentInvites = localInvites.get(sentInvitesKey) || [];
        const updatedSentInvites = [...existingSentInvites, invitation];
        localInvites.set(sentInvitesKey, updatedSentInvites);
        console.log(`✅ Convite adicionado à lista de enviados (local)`);
      } else {
        try {
          const existingSentInvites = await kv.get(sentInvitesKey) || [];
          const updatedSentInvites = [...existingSentInvites, invitation];
          await kv.set(sentInvitesKey, updatedSentInvites);
          console.log(`✅ Convite adicionado à lista de enviados (KV)`);
        } catch (kvError) {
          console.error('❌ Erro ao salvar lista de enviados no KV:', kvError);
          // Não falhar por causa disso, o convite principal já foi salvo
        }
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
