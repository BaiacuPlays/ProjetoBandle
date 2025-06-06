/**
 * API para migrar perfis existentes para o sistema à prova de balas
 */

import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../utils/auth';
import { createDefaultProfile, validateStats, repairStats, saveProfileWithRetry } from '../../utils/bulletproof-stats';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    console.log('🔄 [MIGRATE] Iniciando migração para sistema à prova de balas');

    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      return res.status(401).json({ 
        error: 'Não autenticado',
        details: authResult.error 
      });
    }

    const userId = authResult.userId;
    const username = authResult.username;

    console.log(`👤 [MIGRATE] Migrando perfil: ${username} (${userId})`);

    // Carregar perfil atual
    const profileKey = `profile:${userId}`;
    const currentProfile = await kv.get(profileKey);

    if (!currentProfile) {
      console.log(`📝 [MIGRATE] Perfil não encontrado, criando novo: ${username}`);
      
      // Criar novo perfil com sistema à prova de balas
      const newProfile = createDefaultProfile(userId, username);
      await saveProfileWithRetry(userId, newProfile);

      return res.status(200).json({
        success: true,
        action: 'created',
        profile: newProfile,
        message: 'Novo perfil criado com sistema à prova de balas'
      });
    }

    // Criar backup do perfil atual
    const backupKey = `migration-backup:${profileKey}:${Date.now()}`;
    await kv.set(backupKey, currentProfile, { ex: 2592000 }); // 30 dias
    console.log(`💾 [MIGRATE] Backup criado: ${backupKey}`);

    // Criar perfil migrado com estrutura completa
    const migratedProfile = createMigratedProfile(currentProfile, userId, username);

    // Validar e reparar se necessário
    const validation = validateStats(migratedProfile.stats);
    if (!validation.isValid) {
      console.warn(`⚠️ [MIGRATE] Reparando estatísticas durante migração:`, validation.errors);
      migratedProfile.stats = repairStats(migratedProfile.stats, migratedProfile.gameHistory);
    }

    // Salvar perfil migrado
    await saveProfileWithRetry(userId, migratedProfile);

    console.log(`✅ [MIGRATE] Migração concluída para: ${username}`);

    return res.status(200).json({
      success: true,
      action: 'migrated',
      profile: migratedProfile,
      backupKey,
      validation: {
        wasValid: validation.isValid,
        errors: validation.errors
      },
      message: 'Perfil migrado com sucesso para sistema à prova de balas'
    });

  } catch (error) {
    console.error('❌ [MIGRATE] Erro na migração:', error);
    
    return res.status(500).json({
      error: 'Erro na migração',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

/**
 * Criar perfil migrado preservando dados existentes
 */
function createMigratedProfile(oldProfile, userId, username) {
  console.log(`🔄 [MIGRATE] Criando perfil migrado para: ${username}`);

  // Criar base do novo perfil
  const newProfile = createDefaultProfile(userId, username);

  // Preservar dados básicos
  newProfile.displayName = oldProfile.displayName || oldProfile.username || username;
  newProfile.bio = oldProfile.bio || '';
  newProfile.avatar = oldProfile.avatar || null;
  newProfile.createdAt = oldProfile.createdAt || newProfile.createdAt;
  newProfile.lastLogin = oldProfile.lastLogin || newProfile.lastLogin;

  // Preservar XP e level
  newProfile.xp = oldProfile.xp || 0;
  newProfile.level = oldProfile.level || 1;

  // Migrar estatísticas
  if (oldProfile.stats) {
    newProfile.stats = migrateStats(oldProfile.stats, newProfile.stats);
  }

  // Preservar conquistas e badges
  newProfile.achievements = oldProfile.achievements || [];
  newProfile.badges = oldProfile.badges || [];
  newProfile.titles = oldProfile.titles || [];
  newProfile.currentTitle = oldProfile.currentTitle || null;

  // Preservar histórico de jogos
  newProfile.gameHistory = oldProfile.gameHistory || [];

  // Migrar estatísticas de franquias
  newProfile.franchiseStats = oldProfile.franchiseStats || {};

  // Migrar estatísticas sociais
  if (oldProfile.socialStats) {
    newProfile.socialStats = {
      ...newProfile.socialStats,
      ...oldProfile.socialStats
    };
  }

  // Migrar preferências
  if (oldProfile.preferences) {
    newProfile.preferences = {
      ...newProfile.preferences,
      ...oldProfile.preferences
    };
  }

  // Marcar como migrado
  newProfile.version = '2.0';
  newProfile.migrated = true;
  newProfile.migrationDate = new Date().toISOString();

  console.log(`✅ [MIGRATE] Perfil migrado criado com sucesso`);
  return newProfile;
}

/**
 * Migrar estatísticas preservando dados existentes
 */
function migrateStats(oldStats, newStats) {
  console.log(`📊 [MIGRATE] Migrando estatísticas...`);

  const migratedStats = { ...newStats };

  // Migrar estatísticas principais
  migratedStats.totalGames = oldStats.totalGames || 0;
  migratedStats.wins = oldStats.wins || 0;
  migratedStats.losses = oldStats.losses || 0;
  migratedStats.winRate = oldStats.winRate || 0;
  migratedStats.currentStreak = oldStats.currentStreak || 0;
  migratedStats.bestStreak = oldStats.bestStreak || 0;
  migratedStats.totalPlayTime = oldStats.totalPlayTime || 0;
  migratedStats.perfectGames = oldStats.perfectGames || 0;
  migratedStats.averageAttempts = oldStats.averageAttempts || 0;
  migratedStats.fastestWin = oldStats.fastestWin || null;
  migratedStats.longestSession = oldStats.longestSession || 0;

  // Migrar estatísticas por modo
  if (oldStats.modeStats) {
    // Modo diário
    if (oldStats.modeStats.daily) {
      migratedStats.modeStats.daily = {
        ...migratedStats.modeStats.daily,
        ...oldStats.modeStats.daily
      };
    }

    // Modo infinito
    if (oldStats.modeStats.infinite) {
      migratedStats.modeStats.infinite = {
        ...migratedStats.modeStats.infinite,
        ...oldStats.modeStats.infinite
      };
    }

    // Modo multiplayer
    if (oldStats.modeStats.multiplayer) {
      migratedStats.modeStats.multiplayer = {
        ...migratedStats.modeStats.multiplayer,
        ...oldStats.modeStats.multiplayer
      };
    }
  }

  // Corrigir inconsistências matemáticas
  if (migratedStats.wins + migratedStats.losses !== migratedStats.totalGames) {
    console.warn(`⚠️ [MIGRATE] Corrigindo totalGames: ${migratedStats.wins} + ${migratedStats.losses} = ${migratedStats.wins + migratedStats.losses}`);
    migratedStats.totalGames = migratedStats.wins + migratedStats.losses;
  }

  // Recalcular winRate
  if (migratedStats.totalGames > 0) {
    migratedStats.winRate = (migratedStats.wins / migratedStats.totalGames) * 100;
  } else {
    migratedStats.winRate = 0;
  }

  // Corrigir streaks
  if (migratedStats.currentStreak > migratedStats.bestStreak) {
    migratedStats.bestStreak = migratedStats.currentStreak;
  }

  console.log(`✅ [MIGRATE] Estatísticas migradas:`, {
    totalGames: migratedStats.totalGames,
    wins: migratedStats.wins,
    losses: migratedStats.losses,
    winRate: migratedStats.winRate.toFixed(1)
  });

  return migratedStats;
}
