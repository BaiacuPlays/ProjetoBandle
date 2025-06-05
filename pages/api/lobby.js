import songs from '../../data/music.json';
import { safeKV } from '../../utils/kv-fix';

// Fallback para desenvolvimento local - armazenamento em memória
const localLobbies = new Map();

// Verificar se estamos em ambiente de desenvolvimento
const isDevelopment = process.env.NODE_ENV === 'development';
const hasKVConfig = (process.env.KV_REST_API_URL || process.env.KV_URL) && process.env.KV_REST_API_TOKEN;

// Funções auxiliares para gerenciar dados com fallback
async function getLobby(roomCode) {
  const key = `lobby:${roomCode}`;

  if (isDevelopment && !hasKVConfig) {
    return localLobbies.get(key);
  }

  try {
    return await safeKV.get(key);
  } catch (error) {
    console.error('Erro ao acessar KV:', error);
    return null;
  }
}

async function setLobby(roomCode, data) {
  const key = `lobby:${roomCode}`;

  if (isDevelopment && !hasKVConfig) {
    localLobbies.set(key, data);
    return;
  }

  try {
    await safeKV.set(key, data);
  } catch (error) {
    console.error('Erro ao salvar no KV:', error);
  }
}

async function deleteLobby(roomCode) {
  const key = `lobby:${roomCode}`;

  if (isDevelopment && !hasKVConfig) {
    localLobbies.delete(key);
    return;
  }

  try {
    await safeKV.del(key);
  } catch (error) {
    console.error('Erro ao deletar do KV:', error);
  }
}
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
  // 🚨 CORS SIMPLIFICADO PARA RESOLVER PROBLEMAS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
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

      if (!nickname) {
        return res.status(400).json({ error: 'Nickname é obrigatório.' });
      }

      let roomCode;
      let existingLobby;
      do {
        roomCode = generateRoomCode();
        existingLobby = await getLobby(roomCode);
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

      await setLobby(roomCode, lobby);
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

      if (!nickname || !roomCode) {
        return res.status(400).json({ error: 'Nickname e código da sala são obrigatórios.' });
      }
      const lobby = await getLobby(roomCode);

      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }

      if (!lobby.players.includes(nickname)) {
        lobby.players.push(nickname);
        await setLobby(roomCode, lobby);
      }

      return res.status(200).json({ success: true, lobbyData: lobby });
    }



    if (req.method === 'PATCH') {
      let body;
      try {
        body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      } catch (e) {
        return res.status(400).json({ error: 'JSON inválido.' });
      }

      const { roomCode, action, nickname } = body;

      if (!roomCode) {
        return res.status(400).json({ error: 'Código da sala é obrigatório.' });
      }

      const lobby = await getLobby(roomCode);
      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }

      if (action === 'start') {
        if (!lobby.players || lobby.players.length < 2) {
          return res.status(400).json({ error: 'Mínimo 2 jogadores para iniciar.' });
        }

        // Obter número de rodadas (padrão: 10)
        const totalRounds = req.body.totalRounds || 10;

        // Inicializar o jogo
        lobby.gameStarted = true;
        const selectedSongs = selectGameSongs(roomCode, totalRounds);

        // Inicializar pontuações
        const scores = {};
        lobby.players.forEach(player => {
          scores[player] = 0;
        });

        // Criar gameState estruturado
        lobby.gameState = {
          currentRound: 1,
          totalRounds: totalRounds,
          songs: selectedSongs,
          scores: scores,
          currentSong: selectedSongs[0] || null, // Armazenar objeto completo em vez de só o título
          roundStartTime: Date.now(),
          roundWinners: [], // Array de vencedores em vez de um único
          roundFinished: false, // Flag para indicar se a rodada terminou
          gameFinished: false,
          attempts: {},
          guesses: {}
        };

        await setLobby(roomCode, lobby);
        return res.status(200).json({ success: true });
      }

      if (action === 'leave_game') {
        if (!nickname) {
          return res.status(400).json({ error: 'Nickname é obrigatório.' });
        }
        lobby.players = lobby.players.filter(p => p !== nickname);
        if (lobby.players.length === 0) {
          await deleteLobby(roomCode);
          return res.status(200).json({ success: true, message: 'Sala fechada.' });
        }
        if (nickname === lobby.host) {
          lobby.host = lobby.players[0];
        }
        await setLobby(roomCode, lobby);
        return res.status(200).json({ success: true });
      }

      if (action === 'guess') {
        const { nickname, guess } = body;

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

        // Função melhorada para verificar títulos genéricos
        const isGenericTitle = (title) => {
          const genericTitles = [
            'main title', 'main theme', 'title theme', 'opening theme', 'intro',
            'menu theme', 'title screen', 'main menu', 'theme song', 'opening',
            'title', 'theme', 'main', 'intro theme', 'title music'
          ];
          const normalized = normalizeString(title);
          return genericTitles.some(generic => normalized === generic || normalized.includes(generic));
        };

        // Verificação melhorada para títulos exatos e genéricos
        let isCorrect = false;
        const normalizedGuess = normalizeString(guess);
        const normalizedCurrentTitle = normalizeString(currentSong.title);

        // Verificação exata primeiro
        isCorrect = normalizedGuess === normalizedCurrentTitle;

        // Se não acertou exato e ambos são títulos genéricos, verificar se são do mesmo jogo
        if (!isCorrect && isGenericTitle(guess) && isGenericTitle(currentSong.title)) {
          const guessedSong = songs.find(song => normalizeString(song.title) === normalizedGuess);
          if (guessedSong && normalizeString(guessedSong.game) === normalizeString(currentSong.game)) {
            // Verificar se é exatamente a mesma música usando ID
            if (guessedSong.id === currentSong.id) {
              isCorrect = true;
            }
          }
        }

        // Verificar se a rodada já terminou
        if (lobby.gameState.roundFinished) {
          return res.status(400).json({ error: 'Esta rodada já terminou.' });
        }

        // Incrementar tentativas APÓS verificações
        lobby.gameState.attempts[nickname]++;

        // Função para detectar franquia de um jogo
        const detectFranchise = (gameName) => {
          const normalized = gameName.trim().toLowerCase();

          // Mapeamento de franquias conhecidas
          const franchiseMap = {
            // Mario franchise
            'mario': [
              'super mario', 'mario kart', 'mario party', 'mario paint', 'paper mario',
              'mario tennis', 'mario golf', 'mario strikers', 'mario baseball',
              'new super mario bros', 'super mario bros', 'mario vs donkey kong'
            ],
            // Zelda franchise
            'zelda': [
              'the legend of zelda', 'legend of zelda', 'zelda'
            ],
            // Sonic franchise
            'sonic': [
              'sonic the hedgehog', 'sonic', 'sonic adventure', 'sonic unleashed',
              'sonic generations', 'sonic forces', 'sonic mania', 'sonic colors'
            ],
            // Pokemon franchise
            'pokemon': [
              'pokemon', 'pokémon'
            ],
            // Final Fantasy franchise
            'final fantasy': [
              'final fantasy'
            ],
            // Assassin's Creed franchise
            'assassins creed': [
              "assassin's creed", 'assassins creed'
            ],
            // Call of Duty franchise
            'call of duty': [
              'call of duty'
            ],
            // Grand Theft Auto franchise
            'gta': [
              'grand theft auto', 'gta'
            ],
            // Dark Souls franchise
            'souls': [
              'dark souls', 'demon souls', 'bloodborne', 'elden ring', 'sekiro'
            ],
            // Metroid franchise
            'metroid': [
              'metroid', 'super metroid'
            ],
            // Donkey Kong franchise
            'donkey kong': [
              'donkey kong'
            ],
            // Street Fighter franchise
            'street fighter': [
              'street fighter'
            ],
            // Tekken franchise
            'tekken': [
              'tekken'
            ],
            // Mortal Kombat franchise
            'mortal kombat': [
              'mortal kombat'
            ]
          };

          // Procura por correspondências nas franquias
          for (const [franchise, patterns] of Object.entries(franchiseMap)) {
            for (const pattern of patterns) {
              if (normalized.includes(pattern)) {
                return franchise;
              }
            }
          }

          // Se não encontrou uma franquia específica, usa a primeira palavra significativa
          const words = normalized.split(' ').filter(word => word.length > 2);
          return words.length > 0 ? words[0] : normalized;
        };

        // Função para verificar o tipo de acerto (igual ao jogo principal)
        const checkGuessType = (guess, currentSong) => {
          const guessedSong = songs.find(song => normalizeString(song.title) === normalizeString(guess));

          if (!guessedSong) {
            return { type: 'fail', subtype: 'not_found' };
          }

          // Acertou a música exata
          if (isCorrect) {
            return { type: 'success', subtype: 'exact' };
          }

          const currentGameNormalized = normalizeString(currentSong.game);
          const guessedGameNormalized = normalizeString(guessedSong.game);

          // Verificação para mesmo jogo (incluindo títulos genéricos)
          if (currentGameNormalized === guessedGameNormalized) {
            // Mesmo jogo, música diferente - AMARELO
            return { type: 'fail', subtype: 'same_game' };
          }

          // Verificar se são da mesma franquia usando a nova lógica
          const currentFranchise = detectFranchise(currentSong.game);
          const guessedFranchise = detectFranchise(guessedSong.game);

          if (currentFranchise === guessedFranchise && currentFranchise.length > 2) {
            // Mesma franquia, jogo diferente - LARANJA
            return { type: 'fail', subtype: 'same_franchise' };
          } else {
            // Completamente errado - VERMELHO
            return { type: 'fail', subtype: 'wrong' };
          }
        };

        const guessResult = checkGuessType(guess, currentSong);
        const isFromCorrectGame = guessResult.subtype === 'same_game';
        const isFromCorrectFranchise = guessResult.subtype === 'same_franchise';



        let correct = false;
        let winner = null;
        let gameCorrect = false;

        if (isCorrect) {
          // Jogador acertou a música!
          correct = true;
          winner = nickname;

          // Adicionar aos vencedores se ainda não estiver
          if (!lobby.gameState.roundWinners.includes(nickname)) {
            lobby.gameState.roundWinners.push(nickname);
          }

          // Sistema de pontuação baseado em dicas utilizadas
          // 6 pontos iniciais - número de tentativas usadas = pontos ganhos
          // Acertou na 1ª tentativa = 6 pontos, 2ª tentativa = 5 pontos, etc.
          const attemptsUsed = lobby.gameState.attempts[nickname];
          const pointsEarned = Math.max(0, 6 - attemptsUsed + 1); // +1 porque a tentativa atual ainda não foi contada



          lobby.gameState.scores[nickname] = (lobby.gameState.scores[nickname] || 0) + pointsEarned;
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
          franchiseCorrect: isFromCorrectFranchise,
          subtype: guessResult.subtype,
          attempt: lobby.gameState.attempts[nickname],
          tooLate: false // Não chegou tarde se chegou até aqui
        };

        lobby.gameState.guesses[nickname].push(attemptData);



        // Verificar se todos os jogadores terminaram (esgotaram tentativas OU acertaram)
        const allPlayersFinished = lobby.players.every(player => {
          const playerAttempts = lobby.gameState.attempts[player] || 0;
          const playerWon = lobby.gameState.roundWinners.includes(player);
          return playerAttempts >= 6 || playerWon;
        });



        // Determinar se a rodada deve terminar
        if (allPlayersFinished) {
          lobby.gameState.roundFinished = true;

          // Se ninguém acertou, marcar como rodada sem vencedor
          if (lobby.gameState.roundWinners.length === 0) {
            lobby.gameState.roundWinners = ['NONE'];
          }
        }

        await setLobby(roomCode, lobby);

        return res.status(200).json({
          success: true,
          correct,
          gameCorrect,
          winner,
          attempts: lobby.gameState.attempts[nickname],
          allFinished: allPlayersFinished,
          lobbyData: {
            players: lobby.players,
            host: lobby.host,
            gameStarted: lobby.gameStarted,
            gameState: lobby.gameState
          }
        });
      }

      if (action === 'skip') {
        const { nickname } = body;

        if (!nickname) {
          return res.status(400).json({ error: 'Nickname é obrigatório.' });
        }

        if (!lobby.gameStarted || !lobby.gameState) {
          return res.status(400).json({ error: 'Jogo não foi iniciado.' });
        }

        // Verificar se a rodada já terminou
        if (lobby.gameState.roundFinished) {
          return res.status(400).json({ error: 'Esta rodada já terminou.' });
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

        // Verificar se todos os jogadores terminaram (esgotaram tentativas OU acertaram)
        const allPlayersFinished = lobby.players.every(player => {
          const playerAttempts = lobby.gameState.attempts[player] || 0;
          const playerWon = lobby.gameState.roundWinners.includes(player);
          return playerAttempts >= 6 || playerWon;
        });



        // Determinar se a rodada deve terminar
        if (allPlayersFinished) {
          lobby.gameState.roundFinished = true;

          // Se ninguém acertou, marcar como rodada sem vencedor
          if (lobby.gameState.roundWinners.length === 0) {
            lobby.gameState.roundWinners = ['NONE'];
          }
        }

        await setLobby(roomCode, lobby);

        return res.status(200).json({
          success: true,
          allFinished: allPlayersFinished,
          lobbyData: {
            players: lobby.players,
            host: lobby.host,
            gameStarted: lobby.gameStarted,
            gameState: lobby.gameState
          }
        });
      }

      if (action === 'nextRound') {
        const { nickname } = body;

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
          lobby.gameState.roundWinners = []; // Resetar vencedores
          lobby.gameState.roundFinished = false; // Resetar flag de rodada terminada
          lobby.gameState.roundStartTime = Date.now();

          // Resetar tentativas e histórico para a nova rodada
          lobby.gameState.attempts = {};
          lobby.gameState.guesses = {};

          // Atualizar música atual (objeto completo, não só o título)
          const currentRoundIndex = lobby.gameState.currentRound - 1;
          if (lobby.gameState.songs[currentRoundIndex]) {
            lobby.gameState.currentSong = lobby.gameState.songs[currentRoundIndex];
          }
        }

        await setLobby(roomCode, lobby);

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

      const lobby = await getLobby(roomCode);

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
            roundWinners: [],
            roundFinished: false,
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
          // Primeiro, tentar buscar pelo ID se disponível
          if (typeof lobby.gameState.currentSong === 'object' && lobby.gameState.currentSong.id !== undefined) {
            currentSong = songs.find(song => song.id === lobby.gameState.currentSong.id);
          } else if (typeof lobby.gameState.currentSong === 'string') {
            // Fallback: buscar pelo título exato
            currentSong = songs.find(song => song.title === lobby.gameState.currentSong);

            // Se não encontrar, tentar buscar pelo título normalizado
            if (!currentSong) {
              const normalizeTitle = (title) => title.trim().toLowerCase();
              const targetTitle = normalizeTitle(lobby.gameState.currentSong);
              currentSong = songs.find(song => normalizeTitle(song.title) === targetTitle);
            }
          }
        }


      }

      // Garante que currentSong seja sempre o objeto completo da música
      if (currentSong && typeof currentSong !== 'object') {
        // Se por algum motivo currentSong não é um objeto, tenta buscar pelo título
        const normalizeTitle = (title) => title.trim().toLowerCase();
        const targetTitle = normalizeTitle(currentSong);
        currentSong = songs.find(song => normalizeTitle(song.title) === targetTitle) || null;
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
          roundWinners: [],
          roundFinished: false,
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