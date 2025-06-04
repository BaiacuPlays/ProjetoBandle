// Proxy para arquivos de áudio com CORS configurado
export default async function handler(req, res) {
  // Permitir apenas GET requests
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Endpoint de teste
  if (req.query.test === 'true') {
    return res.status(200).json({
      status: 'ok',
      message: 'Proxy funcionando',
      timestamp: new Date().toISOString()
    });
  }

  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validar se é uma URL do Cloudflare R2
    const validDomains = [
      'pub-4d254faec6ec408ab584ea82049c2f79.r2.dev',
      'f0ef294a1c4bb8e90e9ee5006f374f2d.r2.cloudflarestorage.com'
    ];
    
    const urlObj = new URL(url);
    if (!validDomains.includes(urlObj.hostname)) {
      return res.status(400).json({ error: 'Invalid audio URL domain' });
    }

    // Configurar headers CORS otimizados
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type, Accept');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges, Content-Type');
    
    // Headers de cache agressivo
    res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
    res.setHeader('CDN-Cache-Control', 'public, max-age=86400');
    res.setHeader('Vercel-CDN-Cache-Control', 'public, max-age=86400');

    // Headers para o request
    const requestHeaders = {
      'User-Agent': 'LudoMusic-AudioProxy/1.0',
      'Accept': 'audio/*,*/*;q=0.9',
      'Accept-Encoding': 'identity' // Evitar compressão que pode causar problemas
    };

    // Adicionar range header se existir
    if (req.headers.range) {
      requestHeaders['Range'] = req.headers.range;
    }

    const audioResponse = await fetch(url, {
      headers: requestHeaders,
      // Timeout mais longo para arquivos grandes
      signal: AbortSignal.timeout(30000) // 30 segundos
    });

    if (!audioResponse.ok) {
      return res.status(audioResponse.status).json({
        error: 'Failed to fetch audio file',
        status: audioResponse.status
      });
    }

    // Copiar headers importantes do response original
    const contentType = audioResponse.headers.get('content-type') || 'audio/mpeg';
    const contentLength = audioResponse.headers.get('content-length');
    const acceptRanges = audioResponse.headers.get('accept-ranges');
    const contentRange = audioResponse.headers.get('content-range');
    const etag = audioResponse.headers.get('etag');
    const lastModified = audioResponse.headers.get('last-modified');

    // Definir headers de resposta
    res.setHeader('Content-Type', contentType);
    if (contentLength) res.setHeader('Content-Length', contentLength);
    if (acceptRanges) res.setHeader('Accept-Ranges', acceptRanges);
    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (etag) res.setHeader('ETag', etag);
    if (lastModified) res.setHeader('Last-Modified', lastModified);

    // Definir status code correto (206 para partial content, 200 para completo)
    const statusCode = audioResponse.status;
    res.status(statusCode);

    // Stream do áudio usando método otimizado para arquivos grandes
    if (audioResponse.body) {
      try {
        // Verificar se a conexão ainda está ativa antes de começar
        if (res.destroyed || res.closed) {
          return;
        }

        // Para arquivos pequenos (< 1MB), usar buffer completo
        const contentLength = parseInt(audioResponse.headers.get('content-length') || '0');

        if (contentLength < 1024 * 1024) { // < 1MB
          const arrayBuffer = await audioResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          if (!res.destroyed && !res.closed) {
            res.write(buffer);
            res.end();
          }
        } else {
          // Para arquivos grandes, usar streaming por chunks
          const reader = audioResponse.body.getReader();
          let bytesStreamed = 0;

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Verificar se a conexão ainda está ativa
              if (res.destroyed || res.closed) {
                reader.releaseLock();
                return;
              }

              res.write(Buffer.from(value));
              bytesStreamed += value.length;
            }

            reader.releaseLock();
            res.end();
          } catch (readerError) {
            reader.releaseLock();
            if (!res.headersSent) {
              res.status(500).json({ error: 'Streaming error' });
            }
          }
        }

      } catch (streamError) {
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Streaming error',
            message: streamError.message
          });
        }
      }
    } else {
      res.end();
    }

  } catch (error) {
    // Se já enviamos headers, não podemos enviar JSON
    if (res.headersSent) {
      res.end();
    } else {
      res.status(500).json({
        error: 'Internal server error'
      });
    }
  }
}

// Configuração para permitir streaming de arquivos grandes
export const config = {
  api: {
    responseLimit: false, // Permitir responses grandes
    bodyParser: false     // Não precisamos fazer parse do body
  }
};
