// Configurações centralizadas de segurança
export const SECURITY_CONFIG = {
  // Origens permitidas para CORS
  ALLOWED_ORIGINS: [
    'http://localhost:3000',
    'https://ludomusic.xyz',
    'https://www.ludomusic.xyz',
    'https://projeto-bandle.vercel.app'
  ],

  // Rate limiting padrão
  RATE_LIMITS: {
    DEFAULT: { requests: 60, window: 60000 }, // 60 req/min
    AUTH: { requests: 5, window: 60000 },     // 5 req/min para auth
    BUG_REPORT: { requests: 3, window: 60000 }, // 3 req/min para bug reports
    ADMIN: { requests: 10, window: 60000 }    // 10 req/min para admin
  },

  // Headers de segurança
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-XSS-Protection': '1; mode=block',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  },

  // Configurações de sessão
  SESSION: {
    EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 dias
    TOKEN_LENGTH: 32,
    SECURE_COOKIES: process.env.NODE_ENV === 'production'
  },

  // Validações
  VALIDATION: {
    USERNAME: {
      MIN_LENGTH: 3,
      MAX_LENGTH: 20,
      PATTERN: /^[a-zA-Z0-9_]+$/
    },
    PASSWORD: {
      MIN_LENGTH: 6,
      MAX_LENGTH: 128
    },
    EMAIL: {
      PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      MAX_LENGTH: 100
    },
    DESCRIPTION: {
      MIN_LENGTH: 5,
      MAX_LENGTH: 2000
    }
  }
};

// Função para configurar CORS seguro
export function setupSecureCORS(req, res) {
  const origin = req.headers.origin;

  if (SECURITY_CONFIG.ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Adicionar headers de segurança
  Object.entries(SECURITY_CONFIG.SECURITY_HEADERS).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

// Função para validar entrada de forma segura
export function validateInput(input, type) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Entrada inválida' };
  }

  const config = SECURITY_CONFIG.VALIDATION[type.toUpperCase()];
  if (!config) {
    return { valid: false, error: 'Tipo de validação desconhecido' };
  }

  const trimmed = input.trim();

  // Verificar tamanho
  if (config.MIN_LENGTH && trimmed.length < config.MIN_LENGTH) {
    return { valid: false, error: `Mínimo ${config.MIN_LENGTH} caracteres` };
  }

  if (config.MAX_LENGTH && trimmed.length > config.MAX_LENGTH) {
    return { valid: false, error: `Máximo ${config.MAX_LENGTH} caracteres` };
  }

  // Verificar padrão
  if (config.PATTERN && !config.PATTERN.test(trimmed)) {
    return { valid: false, error: 'Formato inválido' };
  }

  return { valid: true, value: trimmed };
}

// Função para sanitizar logs (remover informações sensíveis)
export function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'session'];
  const sanitized = { ...data };

  Object.keys(sanitized).forEach(key => {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
      if (typeof sanitized[key] === 'string' && sanitized[key].length > 0) {
        sanitized[key] = sanitized[key].substring(0, 4) + '[REDACTED]';
      } else {
        sanitized[key] = '[REDACTED]';
      }
    }
  });

  return sanitized;
}

// Função para verificar se uma requisição é suspeita
export function isSuspiciousRequest(req) {
  const suspiciousPatterns = [
    /\.php$/i,
    /\.asp$/i,
    /\.jsp$/i,
    /admin/i,
    /wp-admin/i,
    /phpmyadmin/i,
    /\.env/i,
    /\.git/i,
    /config/i,
    /backup/i,
    /sql/i,
    /database/i
  ];

  const url = req.url || '';
  const userAgent = req.headers['user-agent'] || '';

  // Verificar URL suspeita
  if (suspiciousPatterns.some(pattern => pattern.test(url))) {
    return { suspicious: true, reason: 'URL suspeita' };
  }

  // Verificar User-Agent suspeito
  const suspiciousUserAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scanner/i,
    /hack/i,
    /exploit/i
  ];

  if (suspiciousUserAgents.some(pattern => pattern.test(userAgent))) {
    return { suspicious: true, reason: 'User-Agent suspeito' };
  }

  // Verificar headers suspeitos
  const suspiciousHeaders = req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
  if (suspiciousHeaders && suspiciousHeaders.includes('127.0.0.1')) {
    return { suspicious: true, reason: 'Headers suspeitos' };
  }

  return { suspicious: false };
}

// Middleware de segurança universal
export function universalSecurityMiddleware(req, res, next) {
  // Configurar CORS seguro
  setupSecureCORS(req, res);

  // Verificar requisições suspeitas
  const suspiciousCheck = isSuspiciousRequest(req);
  if (suspiciousCheck.suspicious) {
    // Log de segurança removido para produção

    return res.status(403).json({
      error: 'Acesso negado',
      code: 'SUSPICIOUS_REQUEST'
    });
  }

  // Adicionar informações de segurança ao request
  req.security = {
    timestamp: Date.now(),
    ip: req.headers['x-forwarded-for'] || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent']
  };

  if (next) {
    next();
  }
}

// Função para gerar token seguro
export function generateSecureToken(length = 32) {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

// Função para hash de senha (se necessário no futuro)
export async function hashPassword(password) {
  const crypto = require('crypto');
  const salt = crypto.randomBytes(16).toString('hex');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(salt + ':' + derivedKey.toString('hex'));
    });
  });
}

// Função para verificar hash de senha
export async function verifyPassword(password, hash) {
  const crypto = require('crypto');
  const [salt, key] = hash.split(':');

  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 10000, 64, 'sha512', (err, derivedKey) => {
      if (err) reject(err);
      resolve(key === derivedKey.toString('hex'));
    });
  });
}

export default SECURITY_CONFIG;
