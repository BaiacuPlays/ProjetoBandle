// API para gerenciar doações e benefícios
import { safeKV } from '../../utils/kv-fix';
import { verifyAuthentication } from '../../utils/auth';
import { isDevelopment, hasKVConfig } from '../../utils/kv-config';
import { Resend } from 'resend';

// Fallback para desenvolvimento local
const localDonations = new Map();

// Inicializar Resend (apenas se a chave estiver configurada)
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Função para gerar código de ativação único
const generateActivationCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segments = [];

  for (let i = 0; i < 4; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(segment);
  }

  return `LUDO-${segments.join('-')}`;
};

// Configuração de benefícios por valor de doação
const DONATION_BENEFITS = {
  5: {
    badges: ['supporter_temp'],
    xpBonus: { multiplier: 1.25, duration: 7 * 24 * 60 * 60 * 1000 }, // 7 dias
    title: 'Apoiador',
    permanent: false
  },
  15: {
    badges: ['supporter_permanent'],
    xpBonus: { multiplier: 1.5, duration: 30 * 24 * 60 * 60 * 1000 }, // 30 dias
    avatars: ['supporter_avatar_1', 'supporter_avatar_2'],
    title: 'Apoiador',
    permanent: true
  },
  30: {
    badges: ['supporter_permanent', 'premium_supporter'],
    xpBonus: { multiplier: 1.5, duration: 30 * 24 * 60 * 60 * 1000 },
    avatars: ['supporter_avatar_1', 'supporter_avatar_2', 'premium_avatar_1'],
    customTitle: true,
    nameColors: ['gold', 'silver'],
    detailedStats: true,
    cloudBackup: true,
    title: 'Apoiador Premium',
    permanent: true
  },
  50: {
    badges: ['supporter_permanent', 'premium_supporter', 'vip_supporter'],
    xpBonus: { multiplier: 2.0, duration: 60 * 24 * 60 * 60 * 1000 }, // 60 dias
    avatars: ['supporter_avatar_1', 'supporter_avatar_2', 'premium_avatar_1', 'vip_avatar_1'],
    customTitle: true,
    nameColors: ['gold', 'silver', 'rainbow', 'platinum'],
    detailedStats: true,
    cloudBackup: true,
    visualEffects: true,
    supporterRanking: true,
    customPlaylist: true,
    extraLives: 3,
    title: 'VIP',
    permanent: true
  }
};

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
      const { amount, method, timestamp, email } = req.body;

      // BLOQUEAR DOAÇÕES PIX NESTA API - usar /api/pix-donation-request
      if (method === 'pix' || method === 'pix_pending') {
        return res.status(400).json({
          error: 'Doações PIX devem ser processadas através do sistema de verificação manual. Use a API correta.'
        });
      }

      // Verificar se tem autenticação (opcional para doações)
      const authResult = await verifyAuthentication(req);
      let userId = null;
      let userEmail = email; // Email fornecido no formulário

      if (authResult.authenticated) {
        // Usuário logado - buscar email do banco de dados
        userId = authResult.userId;

        // Buscar dados completos do usuário para obter o email
        const userKey = `user:${authResult.username.toLowerCase()}`;
        let userData = null;

        if (isDevelopment && !hasKVConfig) {
          const { localUsers } = require('../../utils/storage');
          userData = localUsers.get(userKey);
        } else {
          userData = await safeKV.get(userKey);
        }

        if (userData && userData.email) {
          userEmail = userData.email;
          console.log(`📧 Email encontrado na conta: ${userEmail}`);
        } else {
          console.log('⚠️ Email não encontrado na conta do usuário');
          if (!email) {
            return res.status(400).json({
              error: 'Sua conta não tem email registrado. Por favor, forneça um email para receber o código de ativação.'
            });
          } else {
            userEmail = email;
            console.log(`📧 Usando email fornecido: ${userEmail}`);
          }
        }
      } else if (!email) {
        // Não logado e sem email - não pode doar
        return res.status(400).json({
          error: 'Email é obrigatório para doações. Faça login ou forneça um email.'
        });
      }

      if (amount === undefined || amount === null || !method) {
        return res.status(400).json({ error: 'Valor e método são obrigatórios' });
      }

      // Permitir doações de teste (valor 0 ou método 'test')
      const isTestDonation = method === 'test' || amount === 0;

      // Gerar código de ativação único
      const activationCode = generateActivationCode();

      // Registrar doação
      const donationId = `donation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const donation = {
        id: donationId,
        userId,
        amount: parseFloat(amount),
        method,
        timestamp: timestamp || new Date().toISOString(),
        activationCode,
        activated: false,
        benefits: []
      };

      // Determinar benefícios baseado no valor
      const benefits = calculateBenefits(parseFloat(amount));
      donation.benefits = benefits;

      // Salvar doação
      const donationKey = `donation:${donationId}`;
      if (isDevelopment && !hasKVConfig) {
        localDonations.set(donationKey, donation);
      } else {
        await safeKV.set(donationKey, donation);
      }

      // Salvar código de ativação
      const codeKey = `activation_code:${activationCode}`;
      const codeData = {
        code: activationCode,
        donationId,
        userId,
        amount: parseFloat(amount),
        benefits,
        createdAt: new Date().toISOString(),
        activated: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 dias
      };

      if (isDevelopment && !hasKVConfig) {
        localDonations.set(codeKey, codeData);
      } else {
        await safeKV.set(codeKey, codeData);
      }

      // Enviar email com código de ativação
      const emailData = {
        email: userEmail,
        username: authResult.authenticated ? authResult.username : 'Doador',
        userId: userId
      };
      await sendActivationEmail(emailData, activationCode, parseFloat(amount), benefits, isTestDonation);

      // Registrar no histórico de doações do usuário (apenas se logado)
      if (userId) {
        await addToUserDonationHistory(userId, donation);
      }

      return res.status(200).json({
        success: true,
        donation,
        activationCode,
        benefits,
        message: 'Doação registrada! Código de ativação enviado por email.'
      });

    } catch (error) {
      console.error('Erro ao processar doação:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Verificar autenticação
      const authResult = verifyAuthentication(req);
      if (!authResult.success) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const userId = authResult.userId;

      // Buscar histórico de doações do usuário
      const historyKey = `user_donations:${userId}`;
      let donationHistory = [];

      if (isDevelopment && !hasKVConfig) {
        donationHistory = localDonations.get(historyKey) || [];
      } else {
        donationHistory = await safeKV.get(historyKey) || [];
      }

      return res.status(200).json({
        success: true,
        donations: donationHistory
      });

    } catch (error) {
      console.error('Erro ao buscar doações:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
}

// Função para calcular benefícios baseado no valor da doação
function calculateBenefits(amount) {
  const benefits = {
    badges: [],
    xpBonus: null,
    avatars: [],
    nameColors: [],
    features: [],
    title: null,
    permanent: false
  };

  // Encontrar o tier de benefícios apropriado
  const sortedTiers = Object.keys(DONATION_BENEFITS)
    .map(Number)
    .sort((a, b) => b - a); // Ordem decrescente

  for (const tier of sortedTiers) {
    if (amount >= tier) {
      const tierBenefits = DONATION_BENEFITS[tier];
      
      benefits.badges = tierBenefits.badges || [];
      benefits.xpBonus = tierBenefits.xpBonus || null;
      benefits.avatars = tierBenefits.avatars || [];
      benefits.nameColors = tierBenefits.nameColors || [];
      benefits.title = tierBenefits.title || null;
      benefits.permanent = tierBenefits.permanent || false;

      // Adicionar features especiais
      if (tierBenefits.customTitle) benefits.features.push('customTitle');
      if (tierBenefits.detailedStats) benefits.features.push('detailedStats');
      if (tierBenefits.cloudBackup) benefits.features.push('cloudBackup');
      if (tierBenefits.visualEffects) benefits.features.push('visualEffects');
      if (tierBenefits.supporterRanking) benefits.features.push('supporterRanking');
      if (tierBenefits.customPlaylist) benefits.features.push('customPlaylist');
      if (tierBenefits.extraLives) benefits.extraLives = tierBenefits.extraLives;

      break;
    }
  }

  return benefits;
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
      profile = await safeKV.get(profileKey);
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
    await safeKV.set(profileKey, profile);

    console.log(`✅ Benefícios aplicados para ${userId}`);
    return true;

  } catch (error) {
    console.error('Erro ao aplicar benefícios:', error);
    return false;
  }
}

// Função para adicionar doação ao histórico do usuário
async function addToUserDonationHistory(userId, donation) {
  try {
    const historyKey = `user_donations:${userId}`;
    let history = [];

    if (isDevelopment && !hasKVConfig) {
      history = localDonations.get(historyKey) || [];
    } else {
      history = await safeKV.get(historyKey) || [];
    }

    // Adicionar nova doação ao início do array
    history.unshift({
      id: donation.id,
      amount: donation.amount,
      method: donation.method,
      timestamp: donation.timestamp,
      benefits: donation.benefits
    });

    // Manter apenas as últimas 50 doações
    if (history.length > 50) {
      history = history.slice(0, 50);
    }

    // Salvar histórico atualizado
    if (isDevelopment && !hasKVConfig) {
      localDonations.set(historyKey, history);
    } else {
      await safeKV.set(historyKey, history);
    }

    return true;
  } catch (error) {
    console.error('Erro ao salvar histórico de doações:', error);
    return false;
  }
}

// Função para enviar email de ativação
async function sendActivationEmail(emailData, activationCode, amount, benefits, isTestDonation = false) {
  try {
    if (!resend) {
      console.log(`📧 [SIMULADO] Email de ativação para ${emailData.username}:`);
      console.log(`   Email: ${emailData.email}`);
      console.log(`   Código: ${activationCode}`);
      console.log(`   Valor: R$ ${amount} ${isTestDonation ? '(TESTE)' : ''}`);
      console.log(`   Benefícios: ${benefits.badges?.join(', ') || 'Nenhum'}`);
      return true;
    }

    if (!emailData.email) {
      console.error('Email não fornecido para envio');
      return false;
    }

    console.log(`📧 Enviando email de ativação para: ${emailData.email}`);
    console.log(`📧 Usuário: ${emailData.username}`);
    console.log(`📧 Código: ${activationCode}`);

    // Preparar lista de benefícios para o email
    const benefitsList = [];
    if (benefits.badges) benefitsList.push(`🏆 Badges: ${benefits.badges.join(', ')}`);
    if (benefits.xpBonus) benefitsList.push(`⚡ Bônus XP: ${benefits.xpBonus.multiplier}x por ${Math.round(benefits.xpBonus.duration / (24 * 60 * 60 * 1000))} dias`);
    if (benefits.avatars) benefitsList.push(`🎨 Avatars: ${benefits.avatars.length} novos`);
    if (benefits.nameColors) benefitsList.push(`✨ Cores: ${benefits.nameColors.join(', ')}`);
    if (benefits.features) benefitsList.push(`🔧 Features: ${benefits.features.join(', ')}`);
    if (benefits.extraLives) benefitsList.push(`❤️ Vidas extras: ${benefits.extraLives}`);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #1a1a1a; color: #fff; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(45deg, #ff6b6b, #ffd700); padding: 2rem; text-align: center;">
          <h1 style="margin: 0; font-size: 2rem;">🎵 LudoMusic</h1>
          <h2 style="margin: 0.5rem 0 0 0; font-size: 1.5rem;">${isTestDonation ? 'Doação de Teste!' : 'Obrigado pela sua doação!'}</h2>
        </div>

        <div style="padding: 2rem;">
          <p style="font-size: 1.1rem; margin-bottom: 1.5rem;">
            Olá <strong>${emailData.username}</strong>! 👋
          </p>

          <p style="margin-bottom: 1.5rem;">
            ${isTestDonation
              ? `Esta é uma <strong>doação de teste</strong> de R$ ${amount} para verificar se o sistema está funcionando corretamente! 🧪`
              : `Muito obrigado pela sua doação de <strong>R$ ${amount}</strong>! Sua contribuição é fundamental para manter o LudoMusic funcionando e crescendo.`
            }
          </p>

          <div style="background: #2a2a2a; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; text-align: center;">
            <h3 style="margin: 0 0 1rem 0; color: #ffd700;">🎁 Seu Código de Ativação</h3>
            <div style="background: #1a1a1a; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 1.5rem; font-weight: bold; letter-spacing: 2px; color: #ff6b6b;">
              ${activationCode}
            </div>
            <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: #ccc;">
              Use este código no site para ativar seus benefícios
            </p>
          </div>

          <h3 style="color: #ffd700; margin: 1.5rem 0 1rem 0;">🎁 Benefícios que você receberá:</h3>
          <ul style="list-style: none; padding: 0;">
            ${benefitsList.map(benefit => `<li style="margin: 0.5rem 0; padding: 0.5rem; background: #2a2a2a; border-radius: 5px;">${benefit}</li>`).join('')}
          </ul>

          <div style="background: #2a2a2a; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0;">
            <h4 style="margin: 0 0 1rem 0; color: #ffd700;">📝 Como ativar seus benefícios:</h4>
            <ol style="margin: 0; padding-left: 1.5rem;">
              <li style="margin: 0.5rem 0;">Acesse o LudoMusic</li>
              <li style="margin: 0.5rem 0;">Faça login na sua conta</li>
              <li style="margin: 0.5rem 0;">Clique no seu perfil (ícone do usuário)</li>
              <li style="margin: 0.5rem 0;">Vá na aba "Configurações"</li>
              <li style="margin: 0.5rem 0;">Clique em "Ativar Código de Benefícios"</li>
              <li style="margin: 0.5rem 0;">Digite o código: <strong>${activationCode}</strong></li>
              <li style="margin: 0.5rem 0;">Aproveite seus benefícios! 🎉</li>
            </ol>
          </div>

          <p style="margin: 1.5rem 0; font-size: 0.9rem; color: #ccc;">
            ⏰ Este código expira em 30 dias. Não se esqueça de ativá-lo!
          </p>

          <div style="text-align: center; margin: 2rem 0;">
            <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://ludomusic.xyz'}"
               style="background: linear-gradient(45deg, #ff6b6b, #ffd700); color: white; text-decoration: none; padding: 1rem 2rem; border-radius: 10px; font-weight: bold; display: inline-block;">
              🎮 Ativar Benefícios Agora
            </a>
          </div>

          <p style="text-align: center; margin: 2rem 0; color: #ccc; font-size: 0.9rem;">
            Muito obrigado por apoiar o LudoMusic! 💝<br>
            Sua contribuição faz toda a diferença!
          </p>
        </div>
      </div>
    `;

    // Enviar email
    const fromEmail = process.env.FROM_EMAIL || 'noreply@ludomusic.xyz';
    const result = await resend.emails.send({
      from: `LudoMusic <${fromEmail}>`,
      to: emailData.email,
      subject: `🎁 Seus benefícios LudoMusic - Código: ${activationCode}`,
      html: emailHtml
    });

    console.log(`✅ Email de ativação enviado para ${emailData.email}`);
    console.log(`✅ Resultado do envio:`, result);
    return true;

  } catch (error) {
    console.error('Erro ao enviar email de ativação:', error);
    return false;
  }
}
