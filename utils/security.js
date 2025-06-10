// Sistema de segurança e proteção anti-spam
import { kv } from '@vercel/kv';

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

// Cache local para desenvolvimento
const localBlockedIPs = new Set();
const localRateLimit = new Map();

// Padrões suspeitos para detecção de spam
export const suspiciousPatterns = [
  /spam/i,
  /test\s*test/i,
  /hack/i,
  /bot/i,
  /script/i,
  /automated/i,
  /viagra/i,
  /casino/i,
  /crypto/i,
  /bitcoin/i,
  /loan/i,
  /money/i,
  /free\s*money/i,
  /click\s*here/i,
  /visit\s*now/i,
  /http[s]?:\/\//i,
  /www\./i,
  /\.(com|net|org|info|biz)/i,
  /[a-z]{20,}/i, // Strings muito longas sem espaços
  /(.)\1{10,}/i, // Caracteres repetidos
  /\d{10,}/i, // Números muito longos
  /[^\w\s\-.,!?áéíóúàèìòùâêîôûãõç]{5,}/i // Caracteres especiais em excesso
];

// Função para obter IP do cliente
export function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

// Função para verificar se IP está bloqueado
export async function isIPBlocked(ip) {
  if (!ip || ip === 'unknown') return false;

  try {
    if (isDevelopment && !hasKVConfig) {
      return localBlockedIPs.has(ip);
    }

    const blockedIPs = await kv.get('security:blocked_ips') || [];
    return blockedIPs.includes(ip);
  } catch (error) {
    console.error('Erro ao verificar IP bloqueado:', error);
    return false;
  }
}

// Função para bloquear IP
export async function blockIP(ip, reason = 'Atividade suspeita') {
  if (!ip || ip === 'unknown') return false;

  try {
    console.warn(`🚫 Bloqueando IP ${ip}: ${reason}`);

    if (isDevelopment && !hasKVConfig) {
      localBlockedIPs.add(ip);
      return true;
    }

    const blockedIPs = await kv.get('security:blocked_ips') || [];
    if (!blockedIPs.includes(ip)) {
      blockedIPs.push(ip);
      await kv.set('security:blocked_ips', blockedIPs);

      // Salvar log do bloqueio
      const blockLog = {
        ip,
        reason,
        timestamp: new Date().toISOString(),
        id: `block_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
      };

      const logs = await kv.get('security:block_logs') || [];
      logs.push(blockLog);

      // Manter apenas os últimos 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      await kv.set('security:block_logs', logs);
    }

    return true;
  } catch (error) {
    console.error('Erro ao bloquear IP:', error);
    return false;
  }
}

// Função para verificar rate limiting
export async function checkRateLimit(ip, endpoint = 'default', maxRequests = 5, windowMs = 60000) {
  if (!ip || ip === 'unknown') return true;

  try {
    const key = `ratelimit:${endpoint}:${ip}`;
    const now = Date.now();

    if (isDevelopment && !hasKVConfig) {
      if (!localRateLimit.has(key)) {
        localRateLimit.set(key, []);
      }

      const requests = localRateLimit.get(key);
      const validRequests = requests.filter(time => now - time < windowMs);

      if (validRequests.length >= maxRequests) {
        return false;
      }

      validRequests.push(now);
      localRateLimit.set(key, validRequests);
      return true;
    }

    const requests = await kv.get(key) || [];
    const validRequests = requests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      return false;
    }

    validRequests.push(now);
    await kv.set(key, validRequests, { ex: Math.ceil(windowMs / 1000) });

    return true;
  } catch (error) {
    console.error('Erro ao verificar rate limit:', error);
    return true; // Em caso de erro, permitir a requisição
  }
}

// Função para detectar conteúdo spam
export function isSpamContent(text) {
  if (!text || typeof text !== 'string') return true;

  const cleanText = text.trim();

  // Verificar tamanho
  if (cleanText.length < 5 || cleanText.length > 2000) {
    return true;
  }

  // Verificar se é apenas espaços ou caracteres especiais
  if (!/[a-zA-Z0-9áéíóúàèìòùâêîôûãõç]/.test(cleanText)) {
    return true;
  }

  const lowerText = cleanText.toLowerCase();

  // Verificar padrões suspeitos
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(lowerText)) {
      return true;
    }
  }

  // Verificar repetição excessiva de palavras
  const words = lowerText.split(/\s+/);
  const wordCount = {};
  for (const word of words) {
    if (word.length > 2) {
      wordCount[word] = (wordCount[word] || 0) + 1;
      if (wordCount[word] > 5) {
        return true;
      }
    }
  }

  return false;
}

// Função para validar email
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim()) && email.length <= 100;
}

// Função para sanitizar entrada
export function sanitizeInput(input, maxLength = 1000) {
  if (!input || typeof input !== 'string') return '';

  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers
}

// Função para obter estatísticas de segurança (para admin)
export async function getSecurityStats() {
  try {
    if (isDevelopment && !hasKVConfig) {
      return {
        blockedIPs: Array.from(localBlockedIPs),
        rateLimitEntries: localRateLimit.size,
        environment: 'development'
      };
    }

    const blockedIPs = await kv.get('security:blocked_ips') || [];
    const blockLogs = await kv.get('security:block_logs') || [];

    return {
      blockedIPs: blockedIPs.length,
      recentBlocks: blockLogs.slice(-10),
      environment: 'production'
    };
  } catch (error) {
    return {
      error: 'Erro ao carregar estatísticas',
      environment: isDevelopment ? 'development' : 'production'
    };
  }
}

// Middleware de segurança para APIs
export function securityMiddleware(options = {}) {
  const {
    maxRequests = 5,
    windowMs = 60000,
    endpoint = 'default',
    checkSpam = false
  } = options;

  return async (req, res, next) => {
    const ip = getClientIP(req);

    // Verificar se IP está bloqueado
    if (await isIPBlocked(ip)) {
      console.warn(`🚫 Tentativa de acesso de IP bloqueado: ${ip}`);
      return res.status(429).json({
        error: 'Acesso negado',
        code: 'IP_BLOCKED'
      });
    }

    // Verificar rate limiting
    if (!await checkRateLimit(ip, endpoint, maxRequests, windowMs)) {
      console.warn(`⚠️ Rate limit excedido para IP ${ip} no endpoint ${endpoint}`);

      // Bloquear IP após muitas tentativas
      await blockIP(ip, `Rate limit excedido no endpoint ${endpoint}`);

      return res.status(429).json({
        error: 'Muitas tentativas. Tente novamente mais tarde.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Verificar spam no body se solicitado
    if (checkSpam && req.body) {
      const { description, message, content } = req.body;
      const textToCheck = description || message || content;

      if (textToCheck && isSpamContent(textToCheck)) {
        console.warn(`🚫 Conteúdo spam detectado de IP ${ip}`);
        await blockIP(ip, 'Conteúdo spam detectado');

        return res.status(400).json({
          error: 'Conteúdo inválido detectado',
          code: 'SPAM_DETECTED'
        });
      }
    }

    // Adicionar informações de segurança ao request
    req.security = {
      ip,
      rateLimitPassed: true,
      timestamp: Date.now()
    };

    if (next) {
      next();
    }
  };
}
