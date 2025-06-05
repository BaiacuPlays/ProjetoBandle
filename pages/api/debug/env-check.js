// API para verificar variáveis de ambiente
export default function handler(req, res) {
  // Temporariamente sem autenticação para debug
  // const authHeader = req.headers.authorization;
  // if (process.env.NODE_ENV === 'production' && (!authHeader || !authHeader.startsWith('Bearer '))) {
  //   return res.status(401).json({ error: 'Não autorizado' });
  // }

  try {
    // Verificar variáveis de ambiente KV
    const kvUrl = process.env.KV_REST_API_URL;
    const kvToken = process.env.KV_REST_API_TOKEN;
    const kvUrlAlt = process.env.KV_URL;
    const nodeEnv = process.env.NODE_ENV;

    // Informações sobre as variáveis (sem expor valores sensíveis)
    const envInfo = {
      NODE_ENV: nodeEnv,
      KV_REST_API_URL: kvUrl ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_TOKEN: kvToken ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_URL: kvUrlAlt ? 'DEFINIDA' : 'NÃO DEFINIDA',
      KV_REST_API_URL_PREFIX: kvUrl ? kvUrl.substring(0, 30) + '...' : 'N/A',
      KV_REST_API_TOKEN_PREFIX: kvToken ? kvToken.substring(0, 15) + '...' : 'N/A',
      VERCEL: process.env.VERCEL ? 'SIM' : 'NÃO',
      VERCEL_ENV: process.env.VERCEL_ENV || 'N/A',
      hasKVConfig: !!(kvUrl && kvToken)
    };

    // Verificar se as variáveis estão no formato correto
    const validations = {
      kvUrlFormat: kvUrl ? (kvUrl.startsWith('https://') ? 'VÁLIDO' : 'INVÁLIDO - deve começar com https://') : 'NÃO DEFINIDA',
      kvTokenFormat: kvToken ? (kvToken.length > 10 ? 'VÁLIDO' : 'INVÁLIDO - muito curto') : 'NÃO DEFINIDA',
      expectedKvUrl: 'https://concise-spaniel-34484.upstash.io',
      kvUrlMatches: kvUrl === 'https://concise-spaniel-34484.upstash.io' ? 'SIM' : 'NÃO'
    };

    return res.status(200).json({
      success: true,
      environment: envInfo,
      validations,
      timestamp: new Date().toISOString(),
      message: 'Verificação de variáveis de ambiente'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
