// Fallback para desenvolvimento local
let localModerationData = {
  bannedUsers: [],
  reports: [],
  warnings: []
};

// Tentar importar KV, mas usar fallback se não estiver disponível
let kv = null;
try {
  const kvModule = require('@vercel/kv');
  kv = kvModule.kv;
} catch (error) {
  console.log('⚠️ Vercel KV não disponível, usando armazenamento local');
}

// Funções de armazenamento com fallback
const getModerationData = async () => {
  if (kv) {
    try {
      return await kv.get('admin:moderation_data') || localModerationData;
    } catch (error) {
      console.warn('Erro ao acessar KV, usando fallback local:', error);
      return localModerationData;
    }
  }
  return localModerationData;
};

const setModerationData = async (data) => {
  if (kv) {
    try {
      await kv.set('admin:moderation_data', data);
      return;
    } catch (error) {
      console.warn('Erro ao salvar no KV, usando fallback local:', error);
    }
  }
  localModerationData = data;
};

// Função para sanitizar entrada
function sanitizeInput(input, maxLength = 1000) {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method === 'GET') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const moderationData = await getModerationData();
      
      return res.status(200).json({
        success: true,
        moderation: moderationData
      });

    } else if (method === 'POST') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const { action, data } = req.body;

      if (!action) {
        return res.status(400).json({
          error: 'Ação é obrigatória'
        });
      }

      const moderationData = await getModerationData();

      if (action === 'ban_user') {
        const { userId, username, reason, duration, bannedBy } = data;

        if (!userId || !username || !reason) {
          return res.status(400).json({
            error: 'userId, username e reason são obrigatórios para banimento'
          });
        }

        // Verificar se usuário já está banido
        const existingBan = moderationData.bannedUsers.find(ban => ban.userId === userId);
        if (existingBan) {
          return res.status(409).json({
            error: 'Usuário já está banido'
          });
        }

        const banRecord = {
          id: `ban_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: sanitizeInput(userId, 100),
          username: sanitizeInput(username, 50),
          reason: sanitizeInput(reason, 500),
          duration: duration || 'permanent', // 'permanent', '1d', '7d', '30d'
          bannedBy: sanitizeInput(bannedBy, 50),
          bannedAt: new Date().toISOString(),
          expiresAt: duration && duration !== 'permanent' ? 
            new Date(Date.now() + parseDuration(duration)).toISOString() : null,
          active: true
        };

        moderationData.bannedUsers.push(banRecord);
        await setModerationData(moderationData);

        return res.status(200).json({
          success: true,
          ban: banRecord,
          message: 'Usuário banido com sucesso'
        });

      } else if (action === 'unban_user') {
        const { userId } = data;

        if (!userId) {
          return res.status(400).json({
            error: 'userId é obrigatório para desbanimento'
          });
        }

        const banIndex = moderationData.bannedUsers.findIndex(ban => 
          ban.userId === userId && ban.active
        );

        if (banIndex === -1) {
          return res.status(404).json({
            error: 'Usuário não está banido'
          });
        }

        moderationData.bannedUsers[banIndex].active = false;
        moderationData.bannedUsers[banIndex].unbannedAt = new Date().toISOString();

        await setModerationData(moderationData);

        return res.status(200).json({
          success: true,
          message: 'Usuário desbanido com sucesso'
        });

      } else if (action === 'add_warning') {
        const { userId, username, reason, warnedBy } = data;

        if (!userId || !username || !reason) {
          return res.status(400).json({
            error: 'userId, username e reason são obrigatórios para advertência'
          });
        }

        const warningRecord = {
          id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: sanitizeInput(userId, 100),
          username: sanitizeInput(username, 50),
          reason: sanitizeInput(reason, 500),
          warnedBy: sanitizeInput(warnedBy, 50),
          warnedAt: new Date().toISOString()
        };

        moderationData.warnings.push(warningRecord);
        await setModerationData(moderationData);

        return res.status(200).json({
          success: true,
          warning: warningRecord,
          message: 'Advertência adicionada com sucesso'
        });

      } else if (action === 'add_report') {
        const { reportedUserId, reportedUsername, reporterUserId, reason, description } = data;

        if (!reportedUserId || !reportedUsername || !reason) {
          return res.status(400).json({
            error: 'reportedUserId, reportedUsername e reason são obrigatórios'
          });
        }

        const reportRecord = {
          id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          reportedUserId: sanitizeInput(reportedUserId, 100),
          reportedUsername: sanitizeInput(reportedUsername, 50),
          reporterUserId: sanitizeInput(reporterUserId, 100),
          reason: sanitizeInput(reason, 100),
          description: sanitizeInput(description, 1000),
          status: 'pending', // 'pending', 'reviewed', 'resolved'
          reportedAt: new Date().toISOString()
        };

        moderationData.reports.push(reportRecord);
        await setModerationData(moderationData);

        return res.status(200).json({
          success: true,
          report: reportRecord,
          message: 'Denúncia registrada com sucesso'
        });

      } else {
        return res.status(400).json({
          error: 'Ação não reconhecida'
        });
      }

    } else if (method === 'PUT') {
      // Verificar autenticação admin
      if (adminKey !== 'admin123') {
        return res.status(401).json({ error: 'Acesso negado' });
      }

      const { type, id } = req.query;
      const { status } = req.body;

      if (!type || !id) {
        return res.status(400).json({
          error: 'Tipo e ID são obrigatórios'
        });
      }

      const moderationData = await getModerationData();

      if (type === 'report') {
        const reportIndex = moderationData.reports.findIndex(r => r.id === id);
        if (reportIndex === -1) {
          return res.status(404).json({
            error: 'Denúncia não encontrada'
          });
        }

        moderationData.reports[reportIndex].status = status || 'reviewed';
        moderationData.reports[reportIndex].reviewedAt = new Date().toISOString();

        await setModerationData(moderationData);

        return res.status(200).json({
          success: true,
          message: 'Status da denúncia atualizado'
        });
      }

      return res.status(400).json({
        error: 'Tipo não reconhecido'
      });

    } else {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

  } catch (error) {
    console.error('Erro na API de moderação:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}

// Função auxiliar para parsear duração
function parseDuration(duration) {
  const units = {
    'd': 24 * 60 * 60 * 1000, // dias
    'h': 60 * 60 * 1000,      // horas
    'm': 60 * 1000            // minutos
  };

  const match = duration.match(/^(\d+)([dhm])$/);
  if (!match) return 0;

  const [, amount, unit] = match;
  return parseInt(amount) * (units[unit] || 0);
}
