// API para gerenciar lista de amigos
import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../utils/auth';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Storage local para desenvolvimento
const localFriends = new Map();

export default async function handler(req, res) {
  const { method } = req;

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const currentUserId = authResult.userId;

    if (method === 'GET') {
      // Buscar lista de amigos
      const friendsKey = `friends:${currentUserId}`;
      let friends = [];

      if (isDevelopment && !hasKVConfig) {
        friends = localFriends.get(friendsKey) || [];
      } else {
        friends = await kv.get(friendsKey) || [];
      }

      // Enriquecer dados dos amigos com informações de perfil
      const enrichedFriends = [];

      for (const friend of friends) {
        try {
          // Buscar perfil completo do amigo
          const profileKey = `profile:${friend.id}`;
          let friendProfile = null;

          if (isDevelopment && !hasKVConfig) {
            const { localProfiles } = require('./profile');
            friendProfile = localProfiles?.get?.(profileKey);
          } else {
            friendProfile = await kv.get(profileKey);
          }

          // Sistema de presença removido - todos os amigos aparecem sem status online/offline

          // Combinar dados básicos com dados do perfil
          const enrichedFriend = {
            ...friend,
            avatar: friendProfile?.avatar || friend.avatar || '👤',
            bio: friendProfile?.bio || friend.bio || '',
            level: friendProfile?.level || friend.level || 1,
            xp: friendProfile?.xp || 0,
            lastActiveAt: friendProfile?.lastLogin || friend.lastActiveAt
            // Status online/offline removido
          };

          enrichedFriends.push(enrichedFriend);
        } catch (error) {
          console.warn(`Erro ao buscar perfil do amigo ${friend.id}:`, error);
          // Usar dados básicos se não conseguir buscar o perfil
          enrichedFriends.push({
            ...friend,
            avatar: friend.avatar || '👤',
            level: friend.level || 1,
            status: 'offline'
          });
        }
      }

      return res.status(200).json(enrichedFriends);

    } else if (method === 'DELETE') {
      // Remover amigo
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ error: 'ID do amigo é obrigatório' });
      }

      // Remover da lista do usuário atual
      const friendsKey1 = `friends:${currentUserId}`;
      let friends1 = [];

      if (isDevelopment && !hasKVConfig) {
        friends1 = localFriends.get(friendsKey1) || [];
      } else {
        friends1 = await kv.get(friendsKey1) || [];
      }

      friends1 = friends1.filter(friend => friend.id !== friendId);

      // Remover da lista do amigo
      const friendsKey2 = `friends:${friendId}`;
      let friends2 = [];

      if (isDevelopment && !hasKVConfig) {
        friends2 = localFriends.get(friendsKey2) || [];
      } else {
        friends2 = await kv.get(friendsKey2) || [];
      }

      friends2 = friends2.filter(friend => friend.id !== currentUserId);

      // Salvar listas atualizadas
      if (isDevelopment && !hasKVConfig) {
        localFriends.set(friendsKey1, friends1);
        localFriends.set(friendsKey2, friends2);
      } else {
        await kv.set(friendsKey1, friends1);
        await kv.set(friendsKey2, friends2);
      }

      console.log(`✅ Amizade removida: ${currentUserId} ↔ ${friendId}`);

      return res.status(200).json({
        success: true,
        message: 'Amigo removido com sucesso'
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de amigos:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
