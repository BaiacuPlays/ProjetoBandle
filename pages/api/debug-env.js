// API para debug das variáveis de ambiente
export default function handler(req, res) {
  const kvUrl = process.env.KV_REST_API_URL;
  const kvToken = process.env.KV_REST_API_TOKEN;
  
  return res.status(200).json({
    nodeEnv: process.env.NODE_ENV,
    hasKvUrl: !!kvUrl,
    hasKvToken: !!kvToken,
    kvUrlPrefix: kvUrl ? kvUrl.substring(0, 30) + '...' : 'undefined',
    kvTokenPrefix: kvToken ? kvToken.substring(0, 10) + '...' : 'undefined',
    allEnvKeys: Object.keys(process.env).filter(key => key.includes('KV')),
    timestamp: new Date().toISOString()
  });
}
