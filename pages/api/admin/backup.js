// API para backup do sistema - Admin
import fs from 'fs';
import path from 'path';

// Importação segura do KV
let kv = null;
try {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    const kvModule = await import('@vercel/kv');
    kv = kvModule.kv;
  }
} catch (error) {
  console.warn('⚠️ KV não disponível:', error.message);
}

export default async function handler(req, res) {
  // Verificar autenticação admin
  const adminKey = req.headers['x-admin-key'];
  if (adminKey !== 'admin123') {
    return res.status(401).json({ error: 'Acesso negado' });
  }

  if (req.method === 'POST') {
    return await createBackup(req, res);
  } else if (req.method === 'GET') {
    return await listBackups(req, res);
  } else {
    return res.status(405).json({ error: 'Método não permitido' });
  }
}

async function createBackup(req, res) {
  try {
    const { type = 'full' } = req.body;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${timestamp}`;

    console.log(`🔄 Iniciando backup ${type}: ${backupId}`);

    const backup = {
      id: backupId,
      type,
      timestamp: new Date().toISOString(),
      status: 'in_progress',
      data: {}
    };

    if (type === 'full' || type === 'users') {
      backup.data.users = await backupUsers();
    }

    if (type === 'full' || type === 'profiles') {
      backup.data.profiles = await backupProfiles();
    }

    if (type === 'full' || type === 'donations') {
      backup.data.donations = await backupDonations();
    }

    if (type === 'full' || type === 'games') {
      backup.data.games = await backupGames();
    }

    if (type === 'full' || type === 'config') {
      backup.data.config = await backupConfig();
    }

    backup.status = 'completed';
    backup.completedAt = new Date().toISOString();

    // Salvar backup no KV (com expiração de 30 dias)
    if (kv) {
      await kv.set(`backup:${backupId}`, backup, { ex: 30 * 24 * 60 * 60 });
      
      // Manter lista de backups
      const backupList = await kv.get('backup_list') || [];
      backupList.push({
        id: backupId,
        type,
        timestamp: backup.timestamp,
        size: JSON.stringify(backup).length
      });
      
      // Manter apenas os últimos 10 backups na lista
      if (backupList.length > 10) {
        const oldBackup = backupList.shift();
        await kv.del(`backup:${oldBackup.id}`);
      }
      
      await kv.set('backup_list', backupList);
    }

    console.log(`✅ Backup concluído: ${backupId}`);

    return res.status(200).json({
      success: true,
      backup: {
        id: backupId,
        type,
        timestamp: backup.timestamp,
        status: backup.status,
        size: JSON.stringify(backup).length
      },
      message: 'Backup criado com sucesso'
    });

  } catch (error) {
    console.error('Erro ao criar backup:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function listBackups(req, res) {
  try {
    if (!kv) {
      return res.status(200).json({
        success: true,
        backups: [],
        message: 'KV não disponível - backups não suportados'
      });
    }

    const backupList = await kv.get('backup_list') || [];

    return res.status(200).json({
      success: true,
      backups: backupList.reverse(), // Mais recentes primeiro
      total: backupList.length
    });

  } catch (error) {
    console.error('Erro ao listar backups:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

async function backupUsers() {
  if (!kv) return [];

  try {
    const userKeys = await kv.keys('user:*');
    const users = [];

    for (const key of userKeys.slice(0, 100)) { // Limitar para performance
      try {
        const userData = await kv.get(key);
        if (userData) {
          users.push({
            key,
            data: userData
          });
        }
      } catch (err) {
        console.warn(`Erro ao fazer backup do usuário ${key}:`, err);
      }
    }

    return users;
  } catch (error) {
    console.error('Erro ao fazer backup de usuários:', error);
    return [];
  }
}

async function backupProfiles() {
  if (!kv) return [];

  try {
    const profileKeys = await kv.keys('profile:*');
    const profiles = [];

    for (const key of profileKeys.slice(0, 100)) { // Limitar para performance
      try {
        const profileData = await kv.get(key);
        if (profileData) {
          profiles.push({
            key,
            data: profileData
          });
        }
      } catch (err) {
        console.warn(`Erro ao fazer backup do perfil ${key}:`, err);
      }
    }

    return profiles;
  } catch (error) {
    console.error('Erro ao fazer backup de perfis:', error);
    return [];
  }
}

async function backupDonations() {
  if (!kv) return {};

  try {
    const donations = {
      pending: await kv.get('pending_pix_donations') || [],
      approved: await kv.get('approved_donations') || [],
      rejected: await kv.get('rejected_donations') || []
    };

    // Backup dos detalhes das doações
    const donationDetails = [];
    const allDonationIds = [...donations.pending, ...donations.approved, ...donations.rejected];

    for (const donationId of allDonationIds.slice(0, 50)) {
      try {
        const donationData = await kv.get(`donation_request:${donationId}`);
        if (donationData) {
          donationDetails.push({
            id: donationId,
            data: donationData
          });
        }
      } catch (err) {
        console.warn(`Erro ao fazer backup da doação ${donationId}:`, err);
      }
    }

    donations.details = donationDetails;
    return donations;
  } catch (error) {
    console.error('Erro ao fazer backup de doações:', error);
    return {};
  }
}

async function backupGames() {
  if (!kv) return {};

  try {
    const today = new Date().toISOString().split('T')[0];
    const gameKeys = await kv.keys(`daily-game:*:${today}`);
    const games = [];

    for (const key of gameKeys.slice(0, 100)) {
      try {
        const gameData = await kv.get(key);
        if (gameData) {
          games.push({
            key,
            data: gameData
          });
        }
      } catch (err) {
        console.warn(`Erro ao fazer backup do jogo ${key}:`, err);
      }
    }

    return { dailyGames: games };
  } catch (error) {
    console.error('Erro ao fazer backup de jogos:', error);
    return {};
  }
}

async function backupConfig() {
  try {
    const config = {
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    };

    // Backup de configurações do sistema (sem dados sensíveis)
    if (kv) {
      try {
        const dailySongOverrides = await kv.keys('daily-song-override:*');
        config.dailySongOverrides = dailySongOverrides.length;
      } catch (err) {
        console.warn('Erro ao fazer backup de configurações:', err);
      }
    }

    return config;
  } catch (error) {
    console.error('Erro ao fazer backup de configurações:', error);
    return {};
  }
}
