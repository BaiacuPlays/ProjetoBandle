import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    // Testar se o arquivo existe no sistema de arquivos
    const audioPath = path.join(process.cwd(), 'public', 'audio', 'banjo-kazooie', 'banjo-kazooie-1', '002 Main Title.mp3');
    
    console.log('🔍 Testando caminho:', audioPath);
    console.log('🔍 Arquivo existe:', fs.existsSync(audioPath));
    
    if (fs.existsSync(audioPath)) {
      const stats = fs.statSync(audioPath);
      console.log('📊 Tamanho do arquivo:', stats.size, 'bytes');
      
      res.status(200).json({
        success: true,
        path: audioPath,
        exists: true,
        size: stats.size,
        message: 'Arquivo encontrado no sistema de arquivos'
      });
    } else {
      // Listar o que existe na pasta
      const dirPath = path.join(process.cwd(), 'public', 'audio', 'banjo-kazooie', 'banjo-kazooie-1');
      let files = [];
      
      if (fs.existsSync(dirPath)) {
        files = fs.readdirSync(dirPath);
      }
      
      res.status(404).json({
        success: false,
        path: audioPath,
        exists: false,
        directory: dirPath,
        filesInDirectory: files,
        message: 'Arquivo não encontrado'
      });
    }
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Erro interno do servidor'
    });
  }
}
