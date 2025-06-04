// API para validar se usuário já jogou o jogo diário hoje
import fs from 'fs';
import path from 'path';
import { verifyAuthentication } from '../../utils/auth';
import { isDevelopment, hasKVConfig, kvGet, kvSet } from '../../utils/kv-config';

// Fallback para desenvolvimento local
const localDailyGames = new Map();

// Arquivo para persistir dados em desenvolvimento local
const LOCAL_DATA_FILE = path.join(process.cwd(), 'temp', 'daily-games.json');

// Função para carregar dados locais do arquivo
const loadLocalData = () => {
  if (!isDevelopment || hasKVConfig) return;

  try {
    // Criar diretório temp se não existir
    const tempDir = path.dirname(LOCAL_DATA_FILE);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    if (fs.existsSync(LOCAL_DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DATA_FILE, 'utf8'));
      Object.entries(data).forEach(([key, value]) => {
        localDailyGames.set(key, value);
      });
      console.log('📁 Dados locais de jogos diários carregados:', localDailyGames.size, 'registros');
    }
  } catch (error) {
    console.warn('⚠️ Erro ao carregar dados locais:', error);
  }
};

// Função para salvar dados locais no arquivo
const saveLocalData = () => {
  if (!isDevelopment || hasKVConfig) return;

  try {
    const data = Object.fromEntries(localDailyGames);
    fs.writeFileSync(LOCAL_DATA_FILE, JSON.stringify(data, null, 2));
    console.log('💾 Dados locais de jogos diários salvos:', localDailyGames.size, 'registros');
  } catch (error) {
    console.warn('⚠️ Erro ao salvar dados locais:', error);
  }
};

// Carregar dados na inicialização
loadLocalData();



export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    // Verificar autenticação
    const authResult = await verifyAuthentication(req);
    if (!authResult.authenticated) {
      console.log('❌ Falha na autenticação:', authResult.error);
      return res.status(401).json({ error: authResult.error });
    }

    // Suporte para GET e POST
    const { date, gameStats } = req.method === 'GET' ? req.query : req.body;
    const userId = authResult.userId;

    console.log('🔍 Validação de jogo diário:', {
      method: req.method,
      userId,
      username: authResult.username,
      date,
      hasGameStats: !!gameStats
    });

    if (!date) {
      console.log('❌ Data não fornecida');
      return res.status(400).json({ error: 'Data é obrigatória' });
    }

    // Validar formato da data
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      console.log('❌ Formato de data inválido:', date);
      return res.status(400).json({ error: 'Formato de data inválido. Use YYYY-MM-DD' });
    }

    // Para GET, apenas verificar se pode jogar
    if (req.method === 'GET') {
      const dailyGameKey = `daily_game:${userId}:${date}`;
      const existingGame = await kvGet(dailyGameKey, localDailyGames);

      return res.status(200).json({
        success: true,
        canPlay: !existingGame,
        existingGame: existingGame || null
      });
    }

    // Para POST, validar gameStats
    if (!gameStats) {
      console.log('❌ Estatísticas do jogo não fornecidas');
      return res.status(400).json({ error: 'Estatísticas do jogo são obrigatórias' });
    }

    // Verificar se é apenas uma verificação (não salvar)
    const isCheckOnly = gameStats.song?.title === 'check_only';

    console.log('🎮 Tipo de operação:', isCheckOnly ? 'Verificação' : 'Registro de jogo');

    // 🔒 VERIFICAÇÃO DUPLA DE SEGURANÇA PARA JOGO DIÁRIO
    // Chave principal por userId (auth_username)
    const dailyGameKey = `daily_game:${userId}:${date}`;
    // Chave secundária por username (backup de segurança)
    const dailyGameByUsernameKey = `daily_game_by_user:${authResult.username}:${date}`;

    // Verificar se usuário já jogou hoje (verificação principal)
    const existingGame = await kvGet(dailyGameKey, localDailyGames);

    // 🔒 VERIFICAÇÃO ADICIONAL POR USERNAME (camada extra de segurança)
    const existingGameByUsername = await kvGet(dailyGameByUsernameKey, localDailyGames);

    // Se qualquer uma das verificações encontrar um jogo existente, bloquear
    const gameAlreadyPlayed = existingGame || existingGameByUsername;

    if (gameAlreadyPlayed) {
      console.log(`🚫 SEGURANÇA: Usuário ${authResult.username} (${userId}) já jogou em ${date}:`, gameAlreadyPlayed);
      console.log(`🔍 Verificação por userId: ${existingGame ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);
      console.log(`🔍 Verificação por username: ${existingGameByUsername ? 'ENCONTRADO' : 'NÃO ENCONTRADO'}`);

      return res.status(400).json({
        error: 'Jogo diário já completado hoje',
        existingGame: {
          date: gameAlreadyPlayed.date,
          won: gameAlreadyPlayed.won,
          attempts: gameAlreadyPlayed.attempts,
          completedAt: gameAlreadyPlayed.completedAt
        }
      });
    }

    // Se é apenas verificação e não há jogo existente, retornar sucesso
    if (isCheckOnly) {
      console.log(`✅ Usuário ${userId} pode jogar em ${date}`);
      return res.status(200).json({
        success: true,
        message: 'Usuário pode jogar hoje',
        canPlay: true
      });
    }

    // Registrar o jogo atual
    const gameRecord = {
      userId: userId,
      username: authResult.username, // 🔒 Adicionar username para auditoria
      date: date,
      won: gameStats.won,
      attempts: gameStats.attempts,
      mode: gameStats.mode,
      song: gameStats.song ? {
        title: gameStats.song.title,
        game: gameStats.song.game,
        id: gameStats.song.id
      } : null,
      playTime: gameStats.playTime || 0,
      completedAt: new Date().toISOString(),
      timestamp: Date.now()
    };

    // 🔒 SALVAR EM AMBAS AS CHAVES PARA MÁXIMA SEGURANÇA
    // Salvar por userId (chave principal)
    await kvSet(dailyGameKey, gameRecord, { ex: 86400 * 7 }, localDailyGames);
    // Salvar por username (chave de segurança)
    await kvSet(dailyGameByUsernameKey, gameRecord, { ex: 86400 * 7 }, localDailyGames);

    if (isDevelopment && !hasKVConfig) {
      saveLocalData(); // Persistir no arquivo apenas em desenvolvimento
    }

    console.log(`✅ Jogo diário registrado com SEGURANÇA DUPLA para ${authResult.username} (${userId}) em ${date}:`, {
      won: gameRecord.won,
      attempts: gameRecord.attempts,
      song: gameRecord.song?.title,
      savedKeys: [dailyGameKey, dailyGameByUsernameKey]
    });

    return res.status(200).json({
      success: true,
      message: 'Jogo diário validado e registrado',
      gameRecord: {
        date: gameRecord.date,
        won: gameRecord.won,
        attempts: gameRecord.attempts,
        completedAt: gameRecord.completedAt
      }
    });

  } catch (error) {
    console.error('❌ Erro na validação do jogo diário:', {
      error: error.message,
      stack: error.stack,
      method: req.method,
      body: req.body,
      query: req.query,
      headers: {
        authorization: req.headers.authorization ? 'Bearer [REDACTED]' : 'None',
        'content-type': req.headers['content-type']
      }
    });
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
