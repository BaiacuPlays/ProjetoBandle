// API para diagnosticar problemas de sessão
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { sessionToken } = req.body;

    if (!sessionToken) {
      return res.status(400).json({
        error: 'Token de sessão não fornecido',
        diagnostic: {
          hasToken: false,
          tokenLength: 0,
          tokenFormat: 'invalid'
        }
      });
    }

    // Análise básica do token
    const tokenAnalysis = {
      hasToken: true,
      tokenLength: sessionToken.length,
      tokenFormat: sessionToken.includes('.') ? 'jwt-like' : 'simple',
      startsWithAuth: sessionToken.startsWith('auth_'),
      containsSpecialChars: /[^a-zA-Z0-9._-]/.test(sessionToken)
    };

    // Tentar validar o token
    let validationResult = null;
    try {
      // Simular validação (você pode implementar validação real aqui)
      const response = await fetch(`${req.headers.origin || 'http://localhost:3000'}/api/auth?sessionToken=${sessionToken}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'SessionDiagnostic/1.0'
        }
      });

      const data = await response.json();
      
      validationResult = {
        status: response.status,
        success: data.success || false,
        error: data.error || null,
        hasUser: !!(data.user),
        username: data.user?.username || null
      };

    } catch (error) {
      validationResult = {
        status: 'error',
        success: false,
        error: error.message,
        hasUser: false,
        username: null
      };
    }

    // Informações do ambiente
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasKVConfig: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
      timestamp: new Date().toISOString(),
      userAgent: req.headers['user-agent'] || 'unknown'
    };

    // Sugestões baseadas no diagnóstico
    const suggestions = [];
    
    if (!validationResult.success) {
      suggestions.push('Token inválido ou expirado - faça login novamente');
    }
    
    if (tokenAnalysis.tokenLength < 10) {
      suggestions.push('Token muito curto - pode estar corrompido');
    }
    
    if (tokenAnalysis.containsSpecialChars) {
      suggestions.push('Token contém caracteres especiais - pode estar mal codificado');
    }
    
    if (!environmentInfo.hasKVConfig && environmentInfo.nodeEnv === 'production') {
      suggestions.push('KV não configurado em produção - verificar variáveis de ambiente');
    }

    if (suggestions.length === 0) {
      suggestions.push('Token parece válido - problema pode ser temporário');
    }

    return res.status(200).json({
      success: true,
      diagnostic: {
        token: tokenAnalysis,
        validation: validationResult,
        environment: environmentInfo,
        suggestions,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Erro no diagnóstico de sessão:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
