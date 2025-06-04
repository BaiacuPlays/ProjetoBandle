import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const errorData = req.body;
    
    // Validar dados básicos
    if (!errorData.type || !errorData.timestamp) {
      return res.status(400).json({ error: 'Invalid error data' });
    }

    // Preparar log entry
    const logEntry = {
      ...errorData,
      id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      serverTimestamp: new Date().toISOString()
    };

    // Salvar no arquivo de log (em produção, usar serviço de logging adequado)
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, 'error-reports.log');

    // Criar diretório se não existir
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    // Adicionar ao arquivo de log
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(logFile, logLine);

    // Em produção, também enviar para serviço externo de monitoramento
    if (process.env.NODE_ENV === 'production') {
      // Aqui você pode integrar com Sentry, LogRocket, etc.
      // await sendToExternalLoggingService(logEntry);
    }

    res.status(200).json({ success: true, id: logEntry.id });
  } catch (error) {
    console.error('Error logging error:', error);
    res.status(500).json({ error: 'Failed to log error' });
  }
}
