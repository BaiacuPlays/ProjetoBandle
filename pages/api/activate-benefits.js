// API para ativar códigos de benefícios de doação
import { kv } from '@vercel/kv';
import { verifyAuthentication } from '../../utils/auth';
import { isDevelopment, hasKVConfig } from '../../utils/kv-config';

// Fallback para desenvolvimento local
const localCodes = new Map();

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // Verificar autenticação
      const authResult = await verifyAuthentication(req);
      if (!authResult.authenticated) {
        return res.status(401).json({ error: authResult.error || 'Não autorizado' });
      }

      const { activationCode } = req.body;
      const userId = authResult.userId;

      if (!activationCode) {
        return res.status(400).json({ error: 'Código de ativação é obrigatório' });
      }

      // Normalizar código (remover espaços, converter para maiúsculo)
      const normalizedCode = activationCode.trim().toUpperCase();

      // Buscar código de ativação
      const codeKey = `activation_code:${normalizedCode}`;
      let codeData = null;

      if (isDevelopment && !hasKVConfig) {
        codeData = localCodes.get(codeKey);
      } else {
        codeData = await kv.get(codeKey);
      }

      if (!codeData) {
        return res.status(404).json({ error: 'Código de ativação não encontrado ou inválido' });
      }

      // Verificar se o código já foi ativado
      if (codeData.activated) {
        return res.status(400).json({ error: 'Este código já foi ativado' });
      }

      // Verificar se o código expirou
      if (new Date() > new Date(codeData.expiresAt)) {
        return res.status(400).json({ error: 'Este código expirou' });
      }

      // Verificar se o código pertence ao usuário atual
      if (codeData.userId !== userId) {
        return res.status(403).json({ error: 'Este código não pertence a você' });
      }

      // Aplicar benefícios ao perfil do usuário
      const benefitsApplied = await applyBenefitsToProfile(userId, codeData.benefits);

      if (!benefitsApplied) {
        return res.status(500).json({ error: 'Erro ao aplicar benefícios' });
      }

      // Marcar código como ativado
      codeData.activated = true;
      codeData.activatedAt = new Date().toISOString();

      if (isDevelopment && !hasKVConfig) {
        localCodes.set(codeKey, codeData);
      } else {
        await kv.set(codeKey, codeData);
      }

      // Atualizar doação como ativada
      const donationKey = `donation:${codeData.donationId}`;
      if (isDevelopment && !hasKVConfig) {
        const donation = localCodes.get(donationKey);
        if (donation) {
          donation.activated = true;
          donation.activatedAt = new Date().toISOString();
          localCodes.set(donationKey, donation);
        }
      } else {
        const donation = await kv.get(donationKey);
        if (donation) {
          donation.activated = true;
          donation.activatedAt = new Date().toISOString();
          await kv.set(donationKey, donation);
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Benefícios ativados com sucesso!',
        benefits: codeData.benefits,
        amount: codeData.amount
      });

    } catch (error) {
      console.error('Erro ao ativar código:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

// Função para aplicar benefícios ao perfil do usuário
async function applyBenefitsToProfile(userId, benefits) {
  try {
    const profileKey = `profile:${userId}`;
    let profile = null;

    if (isDevelopment && !hasKVConfig) {
      // Em desenvolvimento, simular
      console.log(`🎁 [SIMULADO] Aplicando benefícios para ${userId}:`, benefits);
      return true;
    } else {
      profile = await kv.get(profileKey);
    }

    if (!profile) {
      console.log('Perfil não encontrado para aplicar benefícios');
      return false;
    }

    // Inicializar campos de doação se não existirem
    if (!profile.donationBenefits) {
      profile.donationBenefits = {
        badges: [],
        activeXpBonus: null,
        unlockedAvatars: [],
        nameColors: [],
        features: [],
        customTitle: null,
        extraLives: 0
      };
    }

    // Aplicar badges
    if (benefits.badges) {
      benefits.badges.forEach(badge => {
        if (!profile.donationBenefits.badges.includes(badge)) {
          profile.donationBenefits.badges.push(badge);
        }
      });
    }

    // Aplicar bônus de XP
    if (benefits.xpBonus) {
      profile.donationBenefits.activeXpBonus = {
        multiplier: benefits.xpBonus.multiplier,
        expiresAt: new Date(Date.now() + benefits.xpBonus.duration).toISOString()
      };
    }

    // Aplicar avatars desbloqueados
    if (benefits.avatars) {
      benefits.avatars.forEach(avatar => {
        if (!profile.donationBenefits.unlockedAvatars.includes(avatar)) {
          profile.donationBenefits.unlockedAvatars.push(avatar);
        }
      });
    }

    // Aplicar cores de nome
    if (benefits.nameColors) {
      profile.donationBenefits.nameColors = [...new Set([
        ...profile.donationBenefits.nameColors,
        ...benefits.nameColors
      ])];
    }

    // Aplicar features
    if (benefits.features) {
      profile.donationBenefits.features = [...new Set([
        ...profile.donationBenefits.features,
        ...benefits.features
      ])];
    }

    // Aplicar vidas extras
    if (benefits.extraLives) {
      profile.donationBenefits.extraLives = Math.max(
        profile.donationBenefits.extraLives || 0,
        benefits.extraLives
      );
    }

    // Aplicar título
    if (benefits.title) {
      profile.donationBenefits.customTitle = benefits.title;
    }

    // Marcar como apoiador
    profile.isSupporter = true;
    profile.supporterSince = profile.supporterSince || new Date().toISOString();

    // Salvar perfil atualizado
    await kv.set(profileKey, profile);

    console.log(`✅ Benefícios aplicados para ${userId}`);
    return true;

  } catch (error) {
    console.error('Erro ao aplicar benefícios:', error);
    return false;
  }
}
