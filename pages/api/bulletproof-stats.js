/**
 * API À PROVA DE BALAS PARA ESTATÍSTICAS
 * Esta API GARANTE que as estatísticas sempre funcionem
 */

import { verifyAuthentication } from '../../utils/auth';
import {
  createDefaultProfile,
  validateStats,
  repairStats,
  recalculateFromHistory,
  saveProfileWithRetry,
  loadProfileWithFallback,
  updateGameStats
} from '../../utils/bulletproof-stats';

export default async function handler(req, res) {
  console.log(`🚀 [BULLETPROOF] ${req.method} ${req.url}`);
  
  try {
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

    if (req.method === 'GET') {
      // CARREGAR PERFIL
      console.log(`📖 [BULLETPROOF] Carregando perfil: ${username}`);
      
      let profile = await loadProfileWithFallback(userId);
      
      if (!profile) {
        console.log(`📝 [BULLETPROOF] Criando novo perfil: ${username}`);
        profile = createDefaultProfile(userId, username);
        await saveProfileWithRetry(userId, profile);
      }

      return res.status(200).json({
        success: true,
        profile,
        source: 'bulletproof-api'
      });
    }

    if (req.method === 'POST') {
      const { action, gameData, forceRecalculate } = req.body;

      if (action === 'update-game') {
        // ATUALIZAR ESTATÍSTICAS DE JOGO
        console.log(`🎮 [BULLETPROOF] Atualizando jogo: ${username}`);
        
        if (!gameData) {
          return res.status(400).json({ error: 'gameData é obrigatório' });
        }

        const updatedProfile = await updateGameStats(userId, gameData);
        
        if (!updatedProfile) {
          return res.status(500).json({ error: 'Falha ao atualizar estatísticas' });
        }

        return res.status(200).json({
          success: true,
          profile: updatedProfile,
          message: 'Estatísticas atualizadas com sucesso'
        });
      }

      if (action === 'force-recalculate' || forceRecalculate) {
        // FORÇAR RECÁLCULO COMPLETO
        console.log(`🔄 [BULLETPROOF] Forçando recálculo: ${username}`);
        
        let profile = await loadProfileWithFallback(userId);
        
        if (!profile) {
          return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        // Criar backup antes do recálculo
        const backupKey = `manual-backup:profile:${userId}:${Date.now()}`;
        const { kv } = await import('@vercel/kv');
        await kv.set(backupKey, profile, { ex: 604800 }); // 7 dias

        // Recalcular estatísticas do zero
        if (profile.gameHistory && profile.gameHistory.length > 0) {
          profile.stats = {
            ...createDefaultProfile(userId, username).stats,
            ...recalculateFromHistory(profile.gameHistory)
          };
        } else {
          profile.stats = createDefaultProfile(userId, username).stats;
        }

        // Salvar perfil recalculado
        await saveProfileWithRetry(userId, profile);

        return res.status(200).json({
          success: true,
          profile,
          message: 'Estatísticas recalculadas com sucesso',
          backupKey
        });
      }

      if (action === 'validate') {
        // VALIDAR ESTATÍSTICAS
        console.log(`✅ [BULLETPROOF] Validando: ${username}`);
        
        const profile = await loadProfileWithFallback(userId);
        
        if (!profile) {
          return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        const validation = validateStats(profile.stats);
        
        return res.status(200).json({
          success: true,
          validation,
          profile: validation.isValid ? profile : null,
          repairedProfile: validation.isValid ? null : {
            ...profile,
            stats: repairStats(profile.stats, profile.gameHistory)
          }
        });
      }

      if (action === 'repair') {
        // REPARAR ESTATÍSTICAS
        console.log(`🔧 [BULLETPROOF] Reparando: ${username}`);
        
        let profile = await loadProfileWithFallback(userId);
        
        if (!profile) {
          return res.status(404).json({ error: 'Perfil não encontrado' });
        }

        // Criar backup antes do reparo
        const backupKey = `repair-backup:profile:${userId}:${Date.now()}`;
        const { kv } = await import('@vercel/kv');
        await kv.set(backupKey, profile, { ex: 604800 }); // 7 dias

        // Reparar estatísticas
        const originalStats = { ...profile.stats };
        profile.stats = repairStats(profile.stats, profile.gameHistory);

        // Salvar perfil reparado
        await saveProfileWithRetry(userId, profile);

        return res.status(200).json({
          success: true,
          profile,
          message: 'Estatísticas reparadas com sucesso',
          backupKey,
          changes: {
            before: originalStats,
            after: profile.stats
          }
        });
      }

      return res.status(400).json({ 
        error: 'Ação inválida',
        validActions: ['update-game', 'force-recalculate', 'validate', 'repair']
      });
    }

    if (req.method === 'PUT') {
      // SALVAR PERFIL COMPLETO
      console.log(`💾 [BULLETPROOF] Salvando perfil: ${username}`);
      
      const { profile: profileData } = req.body;
      
      if (!profileData) {
        return res.status(400).json({ error: 'Dados do perfil são obrigatórios' });
      }

      // Garantir que o perfil tem a estrutura correta
      const completeProfile = {
        ...createDefaultProfile(userId, username),
        ...profileData,
        id: userId,
        username: username,
        lastUpdated: new Date().toISOString()
      };

      // Validar e reparar se necessário
      const validation = validateStats(completeProfile.stats);
      if (!validation.isValid) {
        console.warn('⚠️ [BULLETPROOF] Reparando stats antes de salvar');
        completeProfile.stats = repairStats(completeProfile.stats, completeProfile.gameHistory);
      }

      await saveProfileWithRetry(userId, completeProfile);

      return res.status(200).json({
        success: true,
        profile: completeProfile,
        message: 'Perfil salvo com sucesso'
      });
    }

    if (req.method === 'DELETE') {
      // RESETAR PERFIL
      console.log(`🗑️ [BULLETPROOF] Resetando perfil: ${username}`);
      
      // Carregar perfil atual para backup
      const currentProfile = await loadProfileWithFallback(userId);
      
      if (currentProfile) {
        // Criar backup antes do reset
        const backupKey = `reset-backup:profile:${userId}:${Date.now()}`;
        const { kv } = await import('@vercel/kv');
        await kv.set(backupKey, currentProfile, { ex: 2592000 }); // 30 dias
      }

      // Criar novo perfil limpo
      const newProfile = createDefaultProfile(userId, username);
      await saveProfileWithRetry(userId, newProfile);

      return res.status(200).json({
        success: true,
        profile: newProfile,
        message: 'Perfil resetado com sucesso',
        backupKey: currentProfile ? `reset-backup:profile:${userId}:${Date.now()}` : null
      });
    }

    return res.status(405).json({ error: 'Método não permitido' });

  } catch (error) {
    console.error('❌ [BULLETPROOF] Erro crítico:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
