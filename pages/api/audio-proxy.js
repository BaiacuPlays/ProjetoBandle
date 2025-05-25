import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { audioPath } = req.query;
  
  if (!audioPath) {
    return res.status(400).json({ error: 'Caminho do áudio não fornecido' });
  }

  try {
    // Decodificar o caminho
    const decodedPath = decodeURIComponent(audioPath);
    
    // Construir o caminho completo
    const fullPath = path.join(process.cwd(), 'public', decodedPath);
    
    // Verificar se o arquivo existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Arquivo não encontrado' });
    }

    // Obter informações do arquivo
    const stats = fs.statSync(fullPath);
    const fileSize = stats.size;
    
    // Definir headers apropriados
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Suporte para Range requests (importante para áudio)
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      
      const stream = fs.createReadStream(fullPath, { start, end });
      stream.pipe(res);
    } else {
      const stream = fs.createReadStream(fullPath);
      stream.pipe(res);
    }
    
  } catch (error) {
    console.error('Erro no proxy de áudio:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
}
