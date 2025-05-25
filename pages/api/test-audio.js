import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    const audioPath = path.join(process.cwd(), 'public', 'audio');
    
    // Função recursiva para listar todos os arquivos de áudio
    function getAllAudioFiles(dir, baseDir = '') {
      const files = [];
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(baseDir, item);
        
        if (fs.statSync(fullPath).isDirectory()) {
          files.push(...getAllAudioFiles(fullPath, relativePath));
        } else if (item.endsWith('.mp3') || item.endsWith('.wav')) {
          const stats = fs.statSync(fullPath);
          files.push({
            path: `/audio/${relativePath.replace(/\\/g, '/')}`,
            size: stats.size,
            exists: true
          });
        }
      }
      
      return files;
    }
    
    const audioFiles = getAllAudioFiles(audioPath);
    
    res.status(200).json({
      success: true,
      totalFiles: audioFiles.length,
      files: audioFiles.slice(0, 50), // Primeiros 50 arquivos para teste
      message: 'Arquivos de áudio encontrados'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro ao verificar arquivos de áudio'
    });
  }
}
