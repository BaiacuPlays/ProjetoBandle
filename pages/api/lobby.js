import songs from '../../data/music.json';

// Armazenamento em memória para desenvolvimento local
const memoryStorage = new Map();

// Fallback para desenvolvimento local
const kv = {
  async get(key) {
    return memoryStorage.get(key) || null;
  },
  async set(key, value) {
    memoryStorage.set(key, value);
    return 'OK';
  },
  async del(key) {
    return memoryStorage.delete(key) ? 1 : 0;
  }
};
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Função para selecionar músicas aleatórias para o jogo
function selectGameSongs(roomCode, totalRounds = 10) {
  // Embaralhar as músicas e selecionar as primeiras
  const shuffledSongs = shuffle([...songs]);
  const selectedSongs = shuffledSongs.slice(0, totalRounds);
  return selectedSongs;
}

function shuffle(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function sortearNicks(players) {
  let sorteados;
  let tentativas = 0;
  do {
    sorteados = shuffle([...players]);
    tentativas++;
    // Garante que ninguém sorteie a si mesmo
  } while (players.some((p, i) => p === sorteados[i]) && tentativas < 10);
  // Se não conseguir em 10 tentativas, faz um swap manual
  if (players.some((p, i) => p === sorteados[i])) {
    for (let i = 0; i < players.length; i++) {
      if (players[i] === sorteados[i]) {
        const j = (i + 1) % players.length;
        [sorteados[i], sorteados[j]] = [sorteados[j], sorteados[i]];
      }
    }
  }
  // Retorna um objeto: { jogador: sorteado }
  const resultado = {};
  players.forEach((p, i) => {
    resultado[p] = sorteados[i];
  });
  return resultado;
}

// Configuração para permitir parsing do body
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
}

export default async function handler(req, res) {
  console.log('🔄 API - Método:', req.method);
  console.log('🔄 API - Headers:', req.headers);
  console.log('🔄 API - Body raw:', req.body);
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido.' });
      }

      const { nickname } = body;
      console.log('🔄 API - POST body recebido:', body);

      if (!nickname) {
        return res.status(400).json({ error: 'Nickname é obrigatório.' });
      }

      let roomCode;
      let existingLobby;
      do {
        roomCode = generateRoomCode();
        existingLobby = await kv.get(`lobby:${roomCode}`);
      } while (existingLobby);

      const lobby = {
        players: [nickname],
        created: Date.now(),
        host: nickname,
        gameStarted: false,
        currentRound: 1,
        songs: [],
        scores: {},
        currentSong: null
      };

      await kv.set(`lobby:${roomCode}`, lobby);
      return res.status(200).json({ roomCode });
    }

    if (req.method === 'PUT') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido.' });
      }

      const { nickname, roomCode } = body;
      console.log('🔄 API - PUT body recebido:', body);

      if (!nickname || !roomCode) {
        return res.status(400).json({ error: 'Nickname e código da sala são obrigatórios.' });
      }
      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }
      if (!lobby.players.includes(nickname)) {
        lobby.players.push(nickname);
        await kv.set(`lobby:${roomCode}`, lobby);
      }
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido.' });
      }

      const { roomCode, action, nickname } = body;
      console.log('🔄 API - PATCH body recebido:', body);

      if (!roomCode) {
        return res.status(400).json({ error: 'Código da sala é obrigatório.' });
      }

      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }

      if (action === 'start') {
        if (!lobby.players || lobby.players.length < 2) {
          return res.status(400).json({ error: 'Mínimo 2 jogadores para iniciar.' });
        }

        // Inicializar o jogo
        lobby.gameStarted = true;
        const selectedSongs = selectGameSongs(roomCode, 10);

        // Inicializar pontuações
        const scores = {};
        lobby.players.forEach(player => {
          scores[player] = 0;
        });

        // Criar gameState estruturado
        lobby.gameState = {
          currentRound: 1,
          totalRounds: 10,
          songs: selectedSongs,
          scores: scores,
          currentSong: selectedSongs[0]?.title || null,
          roundStartTime: Date.now(),
          roundWinner: null,
          gameFinished: false,
          attempts: {},
          guesses: {}
        };

        await kv.set(`lobby:${roomCode}`, lobby);
        return res.status(200).json({ success: true });
      }

      if (action === 'leave_game') {
        if (!nickname) {
          return res.status(400).json({ error: 'Nickname é obrigatório.' });
        }
        lobby.players = lobby.players.filter(p => p !== nickname);
        if (lobby.players.length === 0) {
          await kv.del(`lobby:${roomCode}`);
          return res.status(200).json({ success: true, message: 'Sala fechada.' });
        }
        if (nickname === lobby.host) {
          lobby.host = lobby.players[0];
        }
        await kv.set(`lobby:${roomCode}`, lobby);
        return res.status(200).json({ success: true });
      }

      if (action === 'guess') {
        const { nickname, guess } = req.body;

        if (!nickname || !guess) {
          return res.status(400).json({ error: 'Nickname e tentativa são obrigatórios.' });
        }

        if (!lobby.gameStarted || !lobby.gameState) {
          return res.status(400).json({ error: 'Jogo não foi iniciado.' });
        }

        // VERIFICAÇÃO CRÍTICA: Verificar se a rodada já tem um vencedor ANTES de processar
        if (lobby.gameState.roundWinner) {
          return res.status(400).json({ error: 'Esta rodada já foi vencida.' });
        }

        // Inicializar tentativas do jogador se não existir
        if (!lobby.gameState.attempts[nickname]) {
          lobby.gameState.attempts[nickname] = 0;
        }

        // Verificar se o jogador ainda pode fazer tentativas
        if (lobby.gameState.attempts[nickname] >= 6) {
          return res.status(400).json({ error: 'Você esgotou suas tentativas para esta rodada.' });
        }

        // Verificar se a tentativa está correta ANTES de incrementar tentativas
        const currentRoundIndex = (lobby.gameState.currentRound || 1) - 1;
        const currentSong = lobby.gameState.songs[currentRoundIndex];

        const normalizeString = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');
        const isCorrect = normalizeString(guess) === normalizeString(currentSong.title);

        // PROTEÇÃO CONTRA RACE CONDITION: Se acertou, verificar novamente se não há vencedor
        if (isCorrect && lobby.gameState.roundWinner) {
          // Alguém já ganhou enquanto processávamos - tratar como tentativa normal
          lobby.gameState.attempts[nickname]++;

          // Salvar tentativa (mas não como vencedora)
          if (!lobby.gameState.guesses[nickname]) {
            lobby.gameState.guesses[nickname] = [];
          }
          lobby.gameState.guesses[nickname].push({
            guess: guess,
            correct: true, // Era correto, mas chegou tarde
            gameCorrect: false,
            attempt: lobby.gameState.attempts[nickname],
            tooLate: true // Flag para indicar que chegou tarde
          });

          await kv.set(`lobby:${roomCode}`, lobby);

          return res.status(200).json({
            success: true,
            correct: true,
            gameCorrect: false,
            winner: null, // Não é o vencedor
            attempts: lobby.gameState.attempts[nickname],
            tooLate: true, // Informar que chegou tarde
            message: `${lobby.gameState.roundWinner} já havia acertado primeiro!`,
            lobbyData: {
              players: lobby.players,
              host: lobby.host,
              gameStarted: lobby.gameStarted,
              gameState: lobby.gameState
            }
          });
        }

        // Incrementar tentativas APÓS verificações
        lobby.gameState.attempts[nickname]++;

        // Verificar se acertou o jogo (mas não a música)
        const guessedSong = songs.find(song => normalizeString(song.title) === normalizeString(guess));
        const isFromCorrectGame = guessedSong && normalizeString(guessedSong.game) === normalizeString(currentSong.game);

        console.log('🎮 API - Verificação de tentativa:', {
          guess: guess,
          currentSong: currentSong.title,
          currentGame: currentSong.game,
          guessedSong: guessedSong?.title,
          guessedGame: guessedSong?.game,
          isCorrect: isCorrect,
          isFromCorrectGame: isFromCorrectGame,
          nickname: nickname,
          currentAttempts: lobby.gameState.attempts[nickname]
        });

        let correct = false;
        let winner = null;
        let gameCorrect = false;

        if (isCorrect) {
          // ÚLTIMA VERIFICAÇÃO: Garantir que ainda não há vencedor
          if (!lobby.gameState.roundWinner) {
            // Jogador acertou a música e é o primeiro!
            correct = true;
            winner = nickname;
            lobby.gameState.roundWinner = nickname;
            lobby.gameState.roundWinTime = Date.now(); // Timestamp do acerto

            // Sistema de pontuação baseado em dicas utilizadas
            // 6 pontos iniciais - número de tentativas usadas = pontos ganhos
            // Acertou na 1ª tentativa = 6 pontos, 2ª tentativa = 5 pontos, etc.
            const attemptsUsed = lobby.gameState.attempts[nickname];
            const pointsEarned = Math.max(0, 6 - attemptsUsed + 1); // +1 porque a tentativa atual ainda não foi contada

            console.log('🏆 PONTOS - Calculando pontuação:', {
              nickname: nickname,
              attemptsUsed: attemptsUsed,
              pointsEarned: pointsEarned,
              currentScore: lobby.gameState.scores[nickname] || 0
            });

            lobby.gameState.scores[nickname] = (lobby.gameState.scores[nickname] || 0) + pointsEarned;
          }
        } else if (isFromCorrectGame) {
          // Jogador acertou o jogo mas não a música
          gameCorrect = true;
        }

        // Salvar tentativa
        if (!lobby.gameState.guesses[nickname]) {
          lobby.gameState.guesses[nickname] = [];
        }
        const attemptData = {
          guess: guess,
          correct: correct,
          gameCorrect: gameCorrect,
          attempt: lobby.gameState.attempts[nickname],
          tooLate: false // Não chegou tarde se chegou até aqui
        };

        lobby.gameState.guesses[nickname].push(attemptData);

        console.log('🎮 API - Tentativa salva:', {
          nickname: nickname,
          attemptData: attemptData,
          totalGuesses: lobby.gameState.guesses[nickname].length
        });

        // Verificar se todos os jogadores esgotaram suas tentativas
        const allPlayersExhausted = lobby.players.every(player =>
          (lobby.gameState.attempts[player] || 0) >= 6
        );

        // Se todos esgotaram tentativas e ninguém ganhou, marcar como "rodada sem vencedor"
        if (allPlayersExhausted && !lobby.gameState.roundWinner) {
          lobby.gameState.roundWinner = 'NONE'; // Marca que a rodada acabou sem vencedor
        }

        await kv.set(`lobby:${roomCode}`, lobby);

        return res.status(200).json({
          success: true,
          correct,
          gameCorrect,
          winner,
          attempts: lobby.gameState.attempts[nickname],
          allExhausted: allPlayersExhausted,
          lobbyData: {
            players: lobby.players,
            host: lobby.host,
            gameStarted: lobby.gameStarted,
            gameState: lobby.gameState
          }
        });
      }

      if (action === 'skip') {
        const { nickname } = req.body;

        if (!nickname) {
          return res.status(400).json({ error: 'Nickname é obrigatório.' });
        }

        if (!lobby.gameStarted || !lobby.gameState) {
          return res.status(400).json({ error: 'Jogo não foi iniciado.' });
        }

        // Verificar se a rodada já tem um vencedor
        if (lobby.gameState.roundWinner) {
          return res.status(400).json({ error: 'Esta rodada já foi vencida.' });
        }

        // Inicializar tentativas do jogador se não existir
        if (!lobby.gameState.attempts[nickname]) {
          lobby.gameState.attempts[nickname] = 0;
        }

        // Verificar se o jogador ainda pode fazer tentativas
        if (lobby.gameState.attempts[nickname] >= 6) {
          return res.status(400).json({ error: 'Você já esgotou suas tentativas para esta rodada.' });
        }

        // IGUAL AO JOGO NORMAL - incrementar tentativas e adicionar ao histórico
        lobby.gameState.attempts[nickname]++;

        // Salvar skip no histórico
        if (!lobby.gameState.guesses[nickname]) {
          lobby.gameState.guesses[nickname] = [];
        }
        lobby.gameState.guesses[nickname].push({
          guess: 'SKIP',
          correct: false,
          gameCorrect: false,
          attempt: lobby.gameState.attempts[nickname],
          type: 'skipped',
          tooLate: false
        });

        // Verificar se todos os jogadores esgotaram suas tentativas após o skip
        const allPlayersExhausted = lobby.players.every(player =>
          (lobby.gameState.attempts[player] || 0) >= 6
        );

        // Se todos esgotaram tentativas e ninguém ganhou, marcar como "rodada sem vencedor"
        if (allPlayersExhausted && !lobby.gameState.roundWinner) {
          lobby.gameState.roundWinner = 'NONE'; // Marca que a rodada acabou sem vencedor
        }

        await kv.set(`lobby:${roomCode}`, lobby);

        return res.status(200).json({
          success: true,
          allExhausted: allPlayersExhausted,
          lobbyData: {
            players: lobby.players,
            host: lobby.host,
            gameStarted: lobby.gameStarted,
            gameState: lobby.gameState
          }
        });
      }

      if (action === 'nextRound') {
        const { nickname } = req.body;

        if (!nickname || nickname !== lobby.host) {
          return res.status(400).json({ error: 'Apenas o host pode avançar rodadas.' });
        }

        if (!lobby.gameStarted || !lobby.gameState) {
          return res.status(400).json({ error: 'Jogo não foi iniciado.' });
        }

        // Verificar se é a última rodada
        if (lobby.gameState.currentRound >= lobby.gameState.totalRounds) {
          lobby.gameState.gameFinished = true;
        } else {
          // Avançar para próxima rodada
          lobby.gameState.currentRound++;
          lobby.gameState.roundWinner = null;
          lobby.gameState.roundStartTime = Date.now();

          // Resetar tentativas e histórico para a nova rodada
          lobby.gameState.attempts = {};
          lobby.gameState.guesses = {};

          // Atualizar música atual
          const currentRoundIndex = lobby.gameState.currentRound - 1;
          if (lobby.gameState.songs[currentRoundIndex]) {
            lobby.gameState.currentSong = lobby.gameState.songs[currentRoundIndex].title;
          }
        }

        await kv.set(`lobby:${roomCode}`, lobby);

        return res.status(200).json({
          success: true,
          lobbyData: {
            players: lobby.players,
            host: lobby.host,
            gameStarted: lobby.gameStarted,
            gameState: lobby.gameState
          }
        });
      }

      return res.status(400).json({ error: 'Ação inválida.' });
    }

    if (req.method === 'GET') {
      const { roomCode } = req.query;
      if (!roomCode) {
        return res.status(400).json({ error: 'Código da sala é obrigatório.' });
      }
      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        // Retornar dados vazios em vez de erro para evitar spam no console
        return res.status(200).json({
          players: [],
          host: null,
          gameStarted: false,
          roomNotFound: true,
          gameState: {
            currentRound: 0,
            totalRounds: 10,
            songs: [],
            scores: {},
            currentSong: null,
            roundStartTime: null,
            roundWinner: null,
            gameFinished: false,
            attempts: {},
            guesses: {}
          },
          currentSong: null
        });
      }

      // Se o jogo foi iniciado, buscar a música atual
      let currentSong = null;
      if (lobby.gameStarted && lobby.gameState) {
        // Primeiro, tentar pegar da lista de músicas do jogo pela rodada atual
        if (lobby.gameState.songs && lobby.gameState.songs.length > 0) {
          const currentRoundIndex = (lobby.gameState.currentRound || 1) - 1;
          if (lobby.gameState.songs[currentRoundIndex]) {
            currentSong = lobby.gameState.songs[currentRoundIndex];
          }
        }

        // Se não encontrar e temos currentSong no gameState, tentar buscar
        if (!currentSong && lobby.gameState.currentSong) {
          // Primeiro, tentar buscar pelo título exato
          currentSong = songs.find(song => song.title === lobby.gameState.currentSong);

          // Se não encontrar, tentar buscar pelo título normalizado
          if (!currentSong) {
            const normalizeTitle = (title) => title.trim().toLowerCase();
            const targetTitle = normalizeTitle(lobby.gameState.currentSong);
            currentSong = songs.find(song => normalizeTitle(song.title) === targetTitle);
          }
        }

        console.log('🎵 API - Música atual encontrada:', {
          currentRound: lobby.gameState.currentRound,
          currentSongTitle: currentSong?.title,
          gameStateCurrentSong: lobby.gameState.currentSong
        });
      }

      const response = {
        players: lobby.players,
        host: lobby.host,
        gameStarted: lobby.gameStarted || false,
        gameState: lobby.gameState || {
          currentRound: 0,
          totalRounds: 10,
          songs: [],
          scores: {},
          currentSong: null,
          roundStartTime: null,
          roundWinner: null,
          gameFinished: false,
          attempts: {},
          guesses: {}
        },
        currentSong: currentSong
      };



      return res.status(200).json(response);
    }

    return res.status(405).json({ error: 'Método não permitido.' });
  } catch (error) {
    console.error('Erro na API de lobby:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
}