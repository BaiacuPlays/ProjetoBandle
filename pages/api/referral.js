import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../utils/auth';

// Configuração para desenvolvimento local
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_URL && process.env.KV_REST_API_URL;

// Armazenamento local para desenvolvimento
const localReferrals = new Map();
const localInvites = new Map();

// Função para enviar email de convite (placeholder)
const sendInviteEmail = async (email, referrerName, referralLink) => {
  // Em produção, aqui seria integrado com um serviço de email como SendGrid, Resend, etc.
  console.log(`📧 [SIMULADO] Enviando convite para ${email}`);
  console.log(`   De: ${referrerName}`);
  console.log(`   Link: ${referralLink}`);

  // Simular sucesso (em produção, retornaria o resultado real do envio)
  return true;
};

// Função para gerar código de referência baseado no userId
const generateReferralCode = (userId) => {
  return userId.replace('auth_', '').slice(-8).toUpperCase();
};

// Função para encontrar usuário pelo código de referência
const findUserByReferralCode = async (referralCode) => {
  // Buscar usuário cujo ID termine com o código de referência
  const searchPattern = referralCode.toLowerCase();

  if (isDevelopment && !hasKVConfig) {
    // Em desenvolvimento local, simular busca
    return null; // Placeholder para desenvolvimento
  } else {
    // Em produção, buscar no KV
    try {
      // Nota: Esta é uma busca simplificada. Em produção real,
      // seria melhor manter um índice separado de códigos de referência
      const keys = await kv.keys('user:*');

      for (const key of keys) {
        const userData = await kv.get(key);
        if (userData && key.includes(searchPattern)) {
          return {
            userId: `auth_${userData.username}`,
            username: userData.username,
            displayName: userData.displayName
          };
        }
      }
    } catch (error) {
      console.error('Erro ao buscar usuário por código de referência:', error);
    }
  }

  return null;
};

// Função para dar XP de referral
const giveReferralXP = async (referrerId, referredUserId) => {
  try {
    const profileKey = `profile:${referrerId}`;
    let profile = null;

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento, simular
      console.log(`🎁 [SIMULADO] ${referrerId} ganhou 100 XP por referir ${referredUserId}`);
      return true;
    } else {
      profile = await kv.get(profileKey);
    }

    if (profile) {
      // Adicionar XP de referral
      profile.xp = (profile.xp || 0) + 100;

      // Atualizar estatísticas sociais
      if (!profile.socialStats) {
        profile.socialStats = {};
      }
      profile.socialStats.friendsReferred = (profile.socialStats.friendsReferred || 0) + 1;

      // Recalcular nível - SISTEMA REBALANCEADO
      profile.level = Math.floor(Math.sqrt(profile.xp / 300)) + 1;

      // Salvar perfil atualizado
      await kv.set(profileKey, profile);

      console.log(`🎁 ${referrerId} ganhou 100 XP por referir ${referredUserId}`);
      return true;
    }
  } catch (error) {
    console.error('Erro ao dar XP de referral:', error);
  }

  return false;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const { action } = req.body;

  try {
    if (action === 'send_invite') {
      // Enviar convite por email
      const { email } = req.body;

      if (!email || !email.includes('@')) {
        return res.status(400).json({ error: 'Email inválido' });
      }

      // Autenticar usuário
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ error: authResult.error });
      }

      const currentUserId = authResult.userId;
      const referralCode = generateReferralCode(currentUserId);
      const referralLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}?ref=${referralCode}`;

      // Verificar se já foi enviado convite para este email
      const inviteKey = `invite:${email}:${currentUserId}`;
      let existingInvite = null;

      if (isDevelopment && !hasKVConfig) {
        existingInvite = localInvites.get(inviteKey);
      } else {
        existingInvite = await kv.get(inviteKey);
      }

      if (existingInvite && Date.now() - existingInvite.timestamp < 24 * 60 * 60 * 1000) {
        return res.status(400).json({
          error: 'Você já enviou um convite para este email nas últimas 24 horas'
        });
      }

      // Enviar email
      const emailSent = await sendInviteEmail(
        email,
        authResult.username,
        referralLink
      );

      if (!emailSent) {
        return res.status(500).json({ error: 'Erro ao enviar email' });
      }

      // Salvar registro do convite
      const inviteData = {
        email,
        referrerId: currentUserId,
        referrerName: authResult.username,
        referralCode,
        timestamp: Date.now(),
        status: 'sent'
      };

      if (isDevelopment && !hasKVConfig) {
        localInvites.set(inviteKey, inviteData);
      } else {
        await kv.set(inviteKey, inviteData, { ex: 30 * 24 * 60 * 60 }); // 30 dias
      }

      return res.status(200).json({
        success: true,
        message: 'Convite enviado com sucesso!'
      });

    } else if (action === 'process_referral') {
      // Processar referral quando usuário se registra
      const { referralCode } = req.body;

      if (!referralCode) {
        return res.status(400).json({ error: 'Código de referência obrigatório' });
      }

      // Autenticar usuário (quem está se registrando)
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ error: authResult.error });
      }

      const newUserId = authResult.userId;

      // Encontrar quem fez a referência
      const referrer = await findUserByReferralCode(referralCode);
      if (!referrer) {
        return res.status(404).json({ error: 'Código de referência inválido' });
      }

      // Verificar se não é auto-referência
      if (referrer.userId === newUserId) {
        return res.status(400).json({ error: 'Você não pode usar seu próprio código de referência' });
      }

      // Verificar se já foi processado
      const referralKey = `referral:${newUserId}:${referrer.userId}`;
      let existingReferral = null;

      if (isDevelopment && !hasKVConfig) {
        existingReferral = localReferrals.get(referralKey);
      } else {
        existingReferral = await kv.get(referralKey);
      }

      if (existingReferral) {
        return res.status(400).json({ error: 'Referral já foi processado' });
      }

      // Dar XP para quem fez a referência
      const xpGiven = await giveReferralXP(referrer.userId, newUserId);

      if (xpGiven) {
        // Salvar registro do referral
        const referralData = {
          referrerId: referrer.userId,
          referredUserId: newUserId,
          referralCode,
          timestamp: Date.now(),
          xpAwarded: 100,
          status: 'completed'
        };

        if (isDevelopment && !hasKVConfig) {
          localReferrals.set(referralKey, referralData);
        } else {
          await kv.set(referralKey, referralData);
        }

        return res.status(200).json({
          success: true,
          message: `${referrer.displayName} ganhou 100 XP por te convidar!`,
          referrer: referrer.displayName,
          xpAwarded: 100
        });
      } else {
        return res.status(500).json({ error: 'Erro ao processar referral' });
      }

    } else {
      return res.status(400).json({ error: 'Ação inválida' });
    }

  } catch (error) {
    console.error('Erro na API de referral:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
