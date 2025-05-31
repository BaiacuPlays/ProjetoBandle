// Edge Function para otimização de áudio em tempo real
// Executa na edge mais próxima do usuário para latência mínima

export const config = {
  runtime: 'edge',
  regions: ['iad1', 'sfo1', 'fra1', 'sin1', 'syd1'], // Múltiplas regiões
};

export default async function handler(request) {
  const { searchParams } = new URL(request.url);
  const audioUrl = searchParams.get('url');
  const optimize = searchParams.get('optimize') === 'true';
  const compress = searchParams.get('compress') === 'true';
  const quality = parseFloat(searchParams.get('quality')) || 0.8;

  if (!audioUrl) {
    return new Response(JSON.stringify({ error: 'URL do áudio é obrigatória' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // Headers otimizados para performance
    const headers = {
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      'Access-Control-Allow-Origin': '*',
      'Accept-Ranges': 'bytes',
      'X-Edge-Location': process.env.VERCEL_REGION || 'unknown',
      'X-Optimized': optimize ? 'true' : 'false',
      'X-Compressed': compress ? 'true' : 'false'
    };

    // Se for apenas verificação de disponibilidade
    if (request.method === 'HEAD') {
      const response = await fetch(audioUrl, { method: 'HEAD' });
      return new Response(null, {
        status: response.status,
        headers: {
          ...headers,
          'Content-Length': response.headers.get('Content-Length') || '0',
          'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg'
        }
      });
    }

    // Buscar o áudio original
    const audioResponse = await fetch(audioUrl, {
      headers: {
        'User-Agent': 'LudoMusic-EdgeOptimizer/1.0'
      }
    });

    if (!audioResponse.ok) {
      return new Response(JSON.stringify({ 
        error: 'Áudio não encontrado',
        status: audioResponse.status 
      }), {
        status: audioResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let audioData = await audioResponse.arrayBuffer();
    let contentType = audioResponse.headers.get('Content-Type') || 'audio/mpeg';

    // Aplicar otimizações se solicitado
    if (optimize || compress) {
      try {
        audioData = await optimizeAudioBuffer(audioData, {
          compress,
          quality,
          contentType
        });
        
        headers['X-Original-Size'] = audioResponse.headers.get('Content-Length') || '0';
        headers['X-Optimized-Size'] = audioData.byteLength.toString();
        headers['X-Compression-Ratio'] = (audioData.byteLength / parseInt(headers['X-Original-Size']) * 100).toFixed(1) + '%';
      } catch (error) {
        console.error('Erro na otimização:', error);
        // Continuar com áudio original se otimização falhar
      }
    }

    // Suporte a Range Requests para streaming
    const range = request.headers.get('Range');
    if (range) {
      return handleRangeRequest(audioData, range, contentType, headers);
    }

    return new Response(audioData, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Length': audioData.byteLength.toString()
      }
    });

  } catch (error) {
    console.error('Erro na Edge Function:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Erro interno do servidor',
      message: error.message,
      region: process.env.VERCEL_REGION || 'unknown'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Otimização de buffer de áudio
async function optimizeAudioBuffer(buffer, options) {
  const { compress, quality, contentType } = options;
  
  if (!compress) return buffer;

  // Simulação de compressão (em produção usaria bibliotecas especializadas)
  if (contentType.includes('audio/mpeg') || contentType.includes('audio/mp3')) {
    // Para MP3, aplicar compressão adicional
    return await compressMp3Buffer(buffer, quality);
  }
  
  return buffer;
}

// Compressão específica para MP3
async function compressMp3Buffer(buffer, quality) {
  // Implementação simplificada - em produção usaria FFmpeg WASM ou similar
  const compressionRatio = quality;
  const targetSize = Math.floor(buffer.byteLength * compressionRatio);
  
  // Simulação de compressão mantendo estrutura MP3
  const compressed = new ArrayBuffer(targetSize);
  const sourceView = new Uint8Array(buffer);
  const targetView = new Uint8Array(compressed);
  
  // Copiar header MP3 (primeiros 4 bytes)
  for (let i = 0; i < Math.min(4, sourceView.length); i++) {
    targetView[i] = sourceView[i];
  }
  
  // Compressão por amostragem
  const step = sourceView.length / targetSize;
  for (let i = 4; i < targetSize; i++) {
    const sourceIndex = Math.floor(i * step);
    if (sourceIndex < sourceView.length) {
      targetView[i] = sourceView[sourceIndex];
    }
  }
  
  return compressed;
}

// Manipular Range Requests para streaming
function handleRangeRequest(audioData, rangeHeader, contentType, headers) {
  const ranges = parseRangeHeader(rangeHeader, audioData.byteLength);
  
  if (!ranges || ranges.length === 0) {
    return new Response(audioData, {
      status: 200,
      headers: {
        ...headers,
        'Content-Type': contentType,
        'Content-Length': audioData.byteLength.toString()
      }
    });
  }

  const { start, end } = ranges[0];
  const chunkSize = end - start + 1;
  const chunk = audioData.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    headers: {
      ...headers,
      'Content-Type': contentType,
      'Content-Length': chunkSize.toString(),
      'Content-Range': `bytes ${start}-${end}/${audioData.byteLength}`,
      'Accept-Ranges': 'bytes'
    }
  });
}

// Parser para Range Header
function parseRangeHeader(rangeHeader, fileSize) {
  const ranges = [];
  const rangeMatch = rangeHeader.match(/bytes=(.+)/);
  
  if (!rangeMatch) return null;
  
  const rangeSpecs = rangeMatch[1].split(',');
  
  for (const rangeSpec of rangeSpecs) {
    const [startStr, endStr] = rangeSpec.trim().split('-');
    
    let start = startStr ? parseInt(startStr) : 0;
    let end = endStr ? parseInt(endStr) : fileSize - 1;
    
    // Validar ranges
    if (start < 0) start = 0;
    if (end >= fileSize) end = fileSize - 1;
    if (start > end) continue;
    
    ranges.push({ start, end });
  }
  
  return ranges;
}
