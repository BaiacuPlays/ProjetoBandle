// API para gerenciar notificações
import { kv } from '@vercel/kv';
import { localUsers, localProfiles } from '../../utils/storage';
import { verifyAuthentication, sanitizeInput } from '../../utils/auth';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

// Storage local para desenvolvimento
const localNotifications = new Map();

// Função para criar notificação (para uso em outras APIs)
export async function createNotification(userId, type, message, data = {}) {
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: sanitizeInput(type, 50),
    message: sanitizeInput(message, 500),
    data: data || {},
    createdAt: new Date().toISOString(),
    read: false
  };

  const notificationsKey = `notifications:${userId}`;
  let notifications = [];

  try {
    if (isDevelopment && !hasKVConfig) {
      notifications = localNotifications.get(notificationsKey) || [];
    } else {
      notifications = await kv.get(notificationsKey) || [];
    }

    notifications.push(notification);

    // Manter apenas as últimas 100 notificações
    if (notifications.length > 100) {
      notifications = notifications.slice(-100);
    }

    if (isDevelopment && !hasKVConfig) {
      localNotifications.set(notificationsKey, notifications);
    } else {
      await kv.set(notificationsKey, notifications);
    }

    console.log(`🔔 Notificação criada para ${userId}: ${type} - ${message}`);
    return notification;
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    throw error;
  }
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

    if (method === 'GET') {
      // Buscar notificações do usuário
      const notificationsKey = `notifications:${currentUserId}`;
      let notifications = [];

      if (isDevelopment && !hasKVConfig) {
        notifications = localNotifications.get(notificationsKey) || [];
      } else {
        notifications = await kv.get(notificationsKey) || [];
      }

      // Filtrar notificações não expiradas (últimos 30 dias)
      const now = Date.now();
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      const validNotifications = notifications.filter(notification =>
        new Date(notification.createdAt).getTime() > thirtyDaysAgo
      );

      // Ordenar por data (mais recentes primeiro)
      validNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.status(200).json(validNotifications);

    } else if (method === 'POST') {
      // Criar nova notificação
      const { type, message, data } = req.body;

      if (!type || !message) {
        return res.status(400).json({ error: 'Tipo e mensagem são obrigatórios' });
      }

      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: sanitizeInput(type, 50),
        message: sanitizeInput(message, 500),
        data: data || {},
        createdAt: new Date().toISOString(),
        read: false
      };

      const notificationsKey = `notifications:${currentUserId}`;
      let notifications = [];

      if (isDevelopment && !hasKVConfig) {
        notifications = localNotifications.get(notificationsKey) || [];
      } else {
        notifications = await kv.get(notificationsKey) || [];
      }

      notifications.push(notification);

      // Manter apenas as últimas 100 notificações
      if (notifications.length > 100) {
        notifications = notifications.slice(-100);
      }

      if (isDevelopment && !hasKVConfig) {
        localNotifications.set(notificationsKey, notifications);
      } else {
        await kv.set(notificationsKey, notifications);
      }

      console.log(`✅ Notificação criada para ${currentUserId}: ${type}`);

      return res.status(200).json({
        success: true,
        message: 'Notificação criada com sucesso',
        notification: notification
      });

    } else if (method === 'PUT') {
      // Marcar notificações como lidas
      const { action, notificationId } = req.body;

      const notificationsKey = `notifications:${currentUserId}`;
      let notifications = [];

      if (isDevelopment && !hasKVConfig) {
        notifications = localNotifications.get(notificationsKey) || [];
      } else {
        notifications = await kv.get(notificationsKey) || [];
      }

      if (action === 'markAllAsRead') {
        // Marcar todas como lidas
        notifications.forEach(notification => {
          notification.read = true;
        });
      } else if (action === 'markAsRead' && notificationId) {
        // Marcar uma específica como lida
        const notification = notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.read = true;
        }
      } else {
        return res.status(400).json({ error: 'Ação inválida' });
      }

      if (isDevelopment && !hasKVConfig) {
        localNotifications.set(notificationsKey, notifications);
      } else {
        await kv.set(notificationsKey, notifications);
      }

      console.log(`✅ Notificações marcadas como lidas para ${currentUserId}`);

      return res.status(200).json({
        success: true,
        message: 'Notificações atualizadas com sucesso'
      });

    } else if (method === 'DELETE') {
      // Limpar notificações
      const { notificationId } = req.body;

      const notificationsKey = `notifications:${currentUserId}`;
      let notifications = [];

      if (isDevelopment && !hasKVConfig) {
        notifications = localNotifications.get(notificationsKey) || [];
      } else {
        notifications = await kv.get(notificationsKey) || [];
      }

      if (notificationId) {
        // Deletar notificação específica
        notifications = notifications.filter(n => n.id !== notificationId);
      } else {
        // Limpar todas as notificações
        notifications = [];
      }

      if (isDevelopment && !hasKVConfig) {
        localNotifications.set(notificationsKey, notifications);
      } else {
        await kv.set(notificationsKey, notifications);
      }

      console.log(`✅ Notificações limpas para ${currentUserId}`);

      return res.status(200).json({
        success: true,
        message: 'Notificações limpas com sucesso'
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de notificações:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
