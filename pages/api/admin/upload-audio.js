import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Configuração para não parsear o body automaticamente
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const { method } = req;
  const adminKey = req.headers['x-admin-key'];

  try {
    if (method !== 'POST') {
      return res.status(405).json({
        error: 'Método não permitido'
      });
    }

    // Verificar autenticação admin
    if (adminKey !== 'admin123') {
      return res.status(401).json({ error: 'Acesso negado' });
    }

    // Configurar formidable para upload
    const form = formidable({
      uploadDir: './public/uploads/audio',
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      filter: ({ mimetype }) => {
        // Aceitar apenas arquivos de áudio
        return mimetype && mimetype.startsWith('audio/');
      }
    });

    // Criar diretório se não existir
    const uploadDir = './public/uploads/audio';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Processar upload
    const [fields, files] = await form.parse(req);

    const audioFile = Array.isArray(files.audio) ? files.audio[0] : files.audio;

    if (!audioFile) {
      return res.status(400).json({
        error: 'Nenhum arquivo de áudio foi enviado'
      });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    if (!allowedTypes.includes(audioFile.mimetype)) {
      // Remover arquivo inválido
      fs.unlinkSync(audioFile.filepath);
      return res.status(400).json({
        error: 'Formato de arquivo não suportado. Use MP3, WAV ou OGG.'
      });
    }

    // Gerar nome único para o arquivo
    const timestamp = Date.now();
    const originalName = audioFile.originalFilename || 'audio';
    const extension = path.extname(originalName);
    const safeName = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const newFileName = `${timestamp}_${safeName}`;
    const newFilePath = path.join(uploadDir, newFileName);

    // Mover arquivo para o local final
    fs.renameSync(audioFile.filepath, newFilePath);

    // Tentar upload para Cloudflare R2
    let finalAudioUrl;
    try {
      finalAudioUrl = await uploadToCloudflareR2(newFilePath, newFileName);
      console.log('✅ Upload para R2 realizado com sucesso:', finalAudioUrl);

      // Remover arquivo local após upload bem-sucedido
      fs.unlinkSync(newFilePath);
    } catch (r2Error) {
      console.warn('⚠️ Erro no upload para R2, usando URL local:', r2Error.message);
      // Fallback: usar URL local
      finalAudioUrl = `/uploads/audio/${newFileName}`;
    }

    return res.status(200).json({
      success: true,
      audioUrl: finalAudioUrl,
      filename: newFileName,
      originalName: audioFile.originalFilename,
      size: audioFile.size,
      mimetype: audioFile.mimetype,
      message: 'Upload realizado com sucesso',
      uploadedTo: finalAudioUrl.includes('r2.dev') ? 'Cloudflare R2' : 'Local'
    });

  } catch (error) {
    console.error('Erro no upload de áudio:', error);
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message
    });
  }
}

// Função para upload para Cloudflare R2
async function uploadToCloudflareR2(filePath, fileName) {
  try {
    // Verificar se as credenciais estão disponíveis
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || 'f0ef294a1c4bb8e90e9ee5006f374f2d';
    const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || '879ea31185c2b3db0b1479b9886b455e';
    const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY;

    if (!secretAccessKey) {
      throw new Error('CLOUDFLARE_SECRET_ACCESS_KEY não configurado');
    }

    // Importar AWS SDK dinamicamente
    const AWS = require('aws-sdk');

    // Configurar cliente S3 para Cloudflare R2
    const s3 = new AWS.S3({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      accessKeyId: accessKeyId,
      secretAccessKey: secretAccessKey,
      region: 'auto',
      signatureVersion: 'v4'
    });

    // Ler arquivo
    const fileContent = fs.readFileSync(filePath);

    // Determinar Content-Type baseado na extensão
    const getContentType = (filename) => {
      const ext = path.extname(filename).toLowerCase();
      switch (ext) {
        case '.mp3': return 'audio/mpeg';
        case '.wav': return 'audio/wav';
        case '.ogg': return 'audio/ogg';
        default: return 'audio/mpeg';
      }
    };

    // Parâmetros do upload
    const params = {
      Bucket: 'your-bucket-name', // Substitua pelo nome do seu bucket
      Key: `music/${fileName}`,
      Body: fileContent,
      ContentType: getContentType(fileName),
      ACL: 'public-read' // Tornar arquivo público
    };

    console.log('📤 Fazendo upload para Cloudflare R2...');
    const result = await s3.upload(params).promise();

    // Construir URL pública
    const publicUrl = `https://pub-4d254faec6ec408ab584ea82049c2f79.r2.dev/music/${fileName}`;

    console.log('✅ Upload para R2 concluído:', publicUrl);
    return publicUrl;

  } catch (error) {
    console.error('❌ Erro no upload para R2:', error);

    // Se for erro de credenciais, dar dica
    if (error.message.includes('SECRET_ACCESS_KEY')) {
      console.warn('💡 Dica: Configure CLOUDFLARE_SECRET_ACCESS_KEY nas variáveis de ambiente');
    }

    throw error;
  }
}
