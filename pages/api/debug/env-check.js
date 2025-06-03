// API para verificar variáveis de ambiente (apenas desenvolvimento)
export default function handler(req, res) {
  // Apenas permitir em desenvolvimento
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const envVars = {
    NODE_ENV: process.env.NODE_ENV,
    KV_REST_API_URL: process.env.KV_REST_API_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN ? 'DEFINIDA' : 'NÃO DEFINIDA',
    KV_URL: process.env.KV_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    REDIS_URL: process.env.REDIS_URL ? 'DEFINIDA' : 'NÃO DEFINIDA',
    hasKVConfig: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  };

  return res.status(200).json({
    success: true,
    environment: envVars,
    message: 'Verificação de variáveis de ambiente'
  });
}
