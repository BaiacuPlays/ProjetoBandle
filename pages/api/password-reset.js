// API para reset de senha via email
import { kv } from '@vercel/kv';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Resend } from 'resend';

// Fallback para desenvolvimento local
const localUsers = new Map();
const localResetTokens = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

// Inicializar Resend (apenas se a chave estiver configurada)
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Função para gerar token seguro
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Função para validar email
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Função para enviar email de reset
const sendResetEmail = async (email, username, resetToken) => {
  if (!resend) {
    console.log('📧 Email de reset (modo desenvolvimento):');
    console.log(`Para: ${email}`);
    console.log(`Token: ${resetToken}`);
    console.log(`Link: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`);
    return true;
  }

  try {
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await resend.emails.send({
      from: process.env.FROM_EMAIL || 'noreply@ludomusic.xyz',
      to: email,
      subject: 'Redefinir senha - LudoMusic',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4ade80;">Redefinir Senha - LudoMusic</h2>
          
          <p>Olá <strong>${username}</strong>,</p>
          
          <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: linear-gradient(45deg, #4ade80, #22c55e); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      font-weight: bold;
                      display: inline-block;">
              Redefinir Senha
            </a>
          </div>
          
          <p>Ou copie e cole este link no seu navegador:</p>
          <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all;">
            ${resetUrl}
          </p>
          
          <p><strong>Este link expira em 1 hora.</strong></p>
          
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">
            Este email foi enviado automaticamente. Não responda a este email.
          </p>
        </div>
      `
    });

    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
};

export default async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const { action, email, username, token, newPassword } = req.body;

      if (action === 'request') {
        // Solicitar reset de senha
        if (!email && !username) {
          return res.status(400).json({ error: 'Email ou nome de usuário é obrigatório' });
        }

        let userData = null;
        let userKey = null;

        // Buscar usuário por email ou username
        if (isDevelopment && !hasKVConfig) {
          // Buscar em armazenamento local
          for (const [key, user] of localUsers.entries()) {
            if ((email && user.email === email) || (username && user.username === username.toLowerCase())) {
              userData = user;
              userKey = key;
              break;
            }
          }
        } else {
          // Buscar no Vercel KV
          if (username) {
            userKey = `user:${username.toLowerCase()}`;
            userData = await kv.get(userKey);
          } else if (email) {
            // Buscar por email (implementação simplificada)
            const keys = await kv.keys('user:*');
            for (const key of keys) {
              const user = await kv.get(key);
              if (user && user.email === email) {
                userData = user;
                userKey = key;
                break;
              }
            }
          }
        }

        if (!userData) {
          // Por segurança, sempre retornar sucesso mesmo se usuário não existir
          return res.status(200).json({
            success: true,
            message: 'Se o email/usuário existir, você receberá um link de redefinição.'
          });
        }

        if (!userData.email) {
          return res.status(400).json({
            error: 'Este usuário não possui email cadastrado. Entre em contato com o suporte.'
          });
        }

        // Gerar token de reset
        const resetToken = generateResetToken();
        const resetData = {
          userId: userData.username,
          email: userData.email,
          token: resetToken,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hora
        };

        // Salvar token
        const tokenKey = `reset_token:${resetToken}`;
        if (isDevelopment && !hasKVConfig) {
          localResetTokens.set(tokenKey, resetData);
        } else {
          await kv.set(tokenKey, resetData, { ex: 60 * 60 }); // 1 hora
        }

        // Enviar email
        const emailSent = await sendResetEmail(userData.email, userData.displayName || userData.username, resetToken);

        if (!emailSent) {
          return res.status(500).json({
            error: 'Erro ao enviar email. Tente novamente mais tarde.'
          });
        }

        console.log(`✅ Reset de senha solicitado para: ${userData.username}`);

        return res.status(200).json({
          success: true,
          message: 'Link de redefinição enviado para seu email.'
        });

      } else if (action === 'reset') {
        // Redefinir senha com token
        if (!token || !newPassword) {
          return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        if (newPassword.length < 6) {
          return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
        }

        // Buscar token
        const tokenKey = `reset_token:${token}`;
        let resetData = null;

        if (isDevelopment && !hasKVConfig) {
          resetData = localResetTokens.get(tokenKey);
        } else {
          resetData = await kv.get(tokenKey);
        }

        if (!resetData) {
          return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        // Verificar expiração
        if (new Date() > new Date(resetData.expiresAt)) {
          // Remover token expirado
          if (isDevelopment && !hasKVConfig) {
            localResetTokens.delete(tokenKey);
          } else {
            await kv.del(tokenKey);
          }
          return res.status(400).json({ error: 'Token expirado' });
        }

        // Buscar usuário
        const userKey = `user:${resetData.userId}`;
        let userData = null;

        if (isDevelopment && !hasKVConfig) {
          userData = localUsers.get(userKey);
        } else {
          userData = await kv.get(userKey);
        }

        if (!userData) {
          return res.status(400).json({ error: 'Usuário não encontrado' });
        }

        // Atualizar senha
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        userData.hashedPassword = hashedPassword;
        userData.passwordChangedAt = new Date().toISOString();

        // Salvar usuário atualizado
        if (isDevelopment && !hasKVConfig) {
          localUsers.set(userKey, userData);
        } else {
          await kv.set(userKey, userData);
        }

        // Remover token usado
        if (isDevelopment && !hasKVConfig) {
          localResetTokens.delete(tokenKey);
        } else {
          await kv.del(tokenKey);
        }

        console.log(`✅ Senha redefinida para: ${userData.username}`);

        return res.status(200).json({
          success: true,
          message: 'Senha redefinida com sucesso!'
        });

      } else {
        return res.status(400).json({ error: 'Ação inválida' });
      }

    } else if (method === 'GET') {
      // Verificar validade do token
      const { token } = req.query;

      if (!token) {
        return res.status(400).json({ error: 'Token não fornecido' });
      }

      const tokenKey = `reset_token:${token}`;
      let resetData = null;

      if (isDevelopment && !hasKVConfig) {
        resetData = localResetTokens.get(tokenKey);
      } else {
        resetData = await kv.get(tokenKey);
      }

      if (!resetData) {
        return res.status(400).json({ error: 'Token inválido' });
      }

      // Verificar expiração
      if (new Date() > new Date(resetData.expiresAt)) {
        return res.status(400).json({ error: 'Token expirado' });
      }

      return res.status(200).json({
        success: true,
        valid: true,
        email: resetData.email
      });

    } else {
      return res.status(405).json({ error: 'Método não permitido' });
    }

  } catch (error) {
    console.error('Erro na API de reset de senha:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: isDevelopment ? error.message : undefined
    });
  }
}
