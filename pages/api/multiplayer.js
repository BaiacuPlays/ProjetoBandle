// API para gerenciar multiplayer
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';
import { verifyAuthentication, sanitizeInput } from '../../utils/auth';
import { createNotification } from './notifications';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Storage local para desenvolvimento
const localRooms = new Map();
const localInvites = new Map();

function generateRoomId() {
  return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export default async function handler(req, res) {
  const { method } = req;

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ error: authResult.error });
    }

    const currentUserId = authResult.userId;
    const currentUsername = authResult.username;

    if (method === 'GET') {
      const { action } = req.query;

      if (action === 'listRooms') {
        // Listar salas disponíveis
        const roomsKey = 'multiplayer_rooms';
        let rooms = [];

        if (isDevelopment && !hasKVConfig) {
          rooms = Array.from(localRooms.values()) || [];
        } else {
          const roomsData = await kv.get(roomsKey) || {};
          rooms = Object.values(roomsData);
        }

        // Filtrar salas ativas (criadas nas últimas 24 horas)
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const activeRooms = rooms.filter(room =>
          room.createdAt > oneDayAgo && !room.gameStarted
        ).map(room => ({
          id: room.id,
          name: room.name,
          host: room.host,
          hostId: room.hostId,
          players: room.players.length,
          playersList: room.players, // Lista completa dos jogadores
          maxPlayers: room.maxPlayers || 4,
          createdAt: room.createdAt
        }));

        return res.status(200).json(activeRooms);

      } else if (action === 'getInvites') {
        // Buscar convites de multiplayer
        const invitesKey = `multiplayer_invites:${currentUserId}`;
        let invites = [];

        if (isDevelopment && !hasKVConfig) {
          invites = localInvites.get(invitesKey) || [];
        } else {
          invites = await kv.get(invitesKey) || [];
        }

        // Filtrar convites não expirados (últimas 24 horas)
        const now = Date.now();
        const oneDayAgo = now - (24 * 60 * 60 * 1000);

        const validInvites = invites.filter(invite =>
          invite.status === 'pending' &&
          new Date(invite.createdAt).getTime() > oneDayAgo
        );

        return res.status(200).json(validInvites);
      }

      return res.status(400).json({ error: 'Ação não especificada' });

    } else if (method === 'POST') {
      const { action } = req.body;

      if (action === 'createRoom') {
        // Criar nova sala
        const { roomName } = req.body;

        if (!roomName) {
          return res.status(400).json({ error: 'Nome da sala é obrigatório' });
        }

        const roomId = generateRoomId();
        const room = {
          id: roomId,
          name: sanitizeInput(roomName, 100),
          host: currentUsername,
          hostId: currentUserId,
          players: [{ id: currentUserId, username: currentUsername }],
          maxPlayers: 4,
          createdAt: Date.now(),
          gameStarted: false,
          settings: {
            rounds: 10,
            timePerRound: 30
          }
        };

        const roomsKey = 'multiplayer_rooms';
        let rooms = {};

        if (isDevelopment && !hasKVConfig) {
          localRooms.set(roomId, room);
        } else {
          rooms = await kv.get(roomsKey) || {};
          rooms[roomId] = room;
          await kv.set(roomsKey, rooms);
        }

        console.log(`✅ Sala criada: ${roomId} por ${currentUsername}`);

        return res.status(200).json({
          success: true,
          roomId: roomId,
          message: 'Sala criada com sucesso'
        });

      } else if (action === 'joinRoom') {
        // Entrar em uma sala
        const { roomId } = req.body;

        if (!roomId) {
          return res.status(400).json({ error: 'ID da sala é obrigatório' });
        }

        let room = null;

        if (isDevelopment && !hasKVConfig) {
          room = localRooms.get(roomId);
        } else {
          const roomsKey = 'multiplayer_rooms';
          const rooms = await kv.get(roomsKey) || {};
          room = rooms[roomId];
        }

        if (!room) {
          return res.status(404).json({ error: 'Sala não encontrada' });
        }

        if (room.gameStarted) {
          return res.status(400).json({ error: 'Jogo já iniciado' });
        }

        if (room.players.length >= room.maxPlayers) {
          return res.status(400).json({ error: 'Sala lotada' });
        }

        // Verificar se já está na sala
        const alreadyInRoom = room.players.some(p => p.id === currentUserId);
        if (!alreadyInRoom) {
          room.players.push({ id: currentUserId, username: currentUsername });

          if (isDevelopment && !hasKVConfig) {
            localRooms.set(roomId, room);
          } else {
            const roomsKey = 'multiplayer_rooms';
            const rooms = await kv.get(roomsKey) || {};
            rooms[roomId] = room;
            await kv.set(roomsKey, rooms);
          }
        }

        console.log(`✅ ${currentUsername} entrou na sala ${roomId}`);

        return res.status(200).json({
          success: true,
          roomId: roomId,
          message: 'Entrou na sala com sucesso'
        });

      } else if (action === 'invite') {
        // Enviar convite para multiplayer
        const { targetUsername, roomId } = req.body;

        if (!targetUsername || !roomId) {
          return res.status(400).json({ error: 'Username e ID da sala são obrigatórios' });
        }

        // Buscar ID do usuário alvo
        const targetUserId = `auth_${targetUsername}`;

        const invite = {
          id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          fromUserId: currentUserId,
          fromUsername: currentUsername,
          toUserId: targetUserId,
          toUsername: targetUsername,
          roomId: roomId,
          roomName: `Sala de ${currentUsername}`,
          createdAt: new Date().toISOString(),
          status: 'pending'
        };

        const invitesKey = `multiplayer_invites:${targetUserId}`;
        let invites = [];

        if (isDevelopment && !hasKVConfig) {
          invites = localInvites.get(invitesKey) || [];
        } else {
          invites = await kv.get(invitesKey) || [];
        }

        invites.push(invite);

        if (isDevelopment && !hasKVConfig) {
          localInvites.set(invitesKey, invites);
        } else {
          await kv.set(invitesKey, invites);
        }

        // Criar notificação para o destinatário
        try {
          await createNotification(
            targetUserId,
            'multiplayer_invite',
            `${currentUsername} convidou você para jogar multiplayer`,
            {
              inviteId: invite.id,
              fromUserId: currentUserId,
              fromUsername: currentUsername,
              roomId: roomId,
              roomName: invite.roomName
            }
          );
          console.log(`🔔 Notificação de convite multiplayer criada para ${targetUserId}`);
        } catch (notifError) {
          console.error('Erro ao criar notificação de multiplayer:', notifError);
          // Não falhar a operação principal por causa da notificação
        }

        console.log(`✅ Convite de multiplayer enviado: ${currentUsername} → ${targetUsername}`);

        return res.status(200).json({
          success: true,
          message: 'Convite enviado com sucesso',
          invite: invite
        });
      }

      return res.status(400).json({ error: 'Ação não especificada' });

    } else if (method === 'DELETE') {
      // Limpar dados (para testes)
      const { action } = req.body;

      if (action === 'clearAllRooms') {
        console.log('🗑️ Limpando todas as salas de multiplayer...');

        if (isDevelopment && !hasKVConfig) {
          // Em desenvolvimento, limpar do sistema local
          localRooms.clear();
          localInvites.clear();
          console.log('✅ Salas e convites limpos do sistema local');
        } else {
          // Em produção, limpar do KV
          try {
            await kv.del('multiplayer_rooms');
            // Limpar convites também
            const inviteKeys = await kv.keys('multiplayer_invites:*');
            if (inviteKeys.length > 0) {
              await Promise.all(inviteKeys.map(key => kv.del(key)));
            }
            console.log(`✅ Salas e ${inviteKeys.length} convites limpos do KV`);
          } catch (kvError) {
            console.error('Erro ao limpar KV:', kvError);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Todas as salas e convites foram limpos'
        });
      }

      return res.status(400).json({ error: 'Ação não reconhecida' });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de multiplayer:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
