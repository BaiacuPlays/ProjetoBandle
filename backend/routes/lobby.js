const express = require('express');
const router = express.Router();
const songs = require('../data/music.json');

// Armazenamento em memória (em produção, usar Redis ou banco de dados)
const memoryStorage = new Map();

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

function selectGameSongs(roomCode, totalRounds = 10) {
  const shuffledSongs = shuffle([...songs]);
  const selectedSongs = shuffledSongs.slice(0, totalRounds);
  return selectedSongs;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// POST - Criar sala
router.post('/', async (req, res) => {
  try {
    const { nickname } = req.body;

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
  } catch (error) {
    console.error('Erro ao criar sala:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT - Entrar na sala
router.put('/', async (req, res) => {
  try {
    const { nickname, roomCode } = req.body;

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
  } catch (error) {
    console.error('Erro ao entrar na sala:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET - Buscar dados da sala
router.get('/', async (req, res) => {
  try {
    const { roomCode } = req.query;

    if (!roomCode) {
      return res.status(400).json({ error: 'Código da sala é obrigatório.' });
    }

    const lobby = await kv.get(`lobby:${roomCode}`);
    if (!lobby) {
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

    return res.status(200).json(lobby);
  } catch (error) {
    console.error('Erro ao buscar sala:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PATCH - Ações do jogo
router.patch('/', async (req, res) => {
  try {
    const { roomCode, action, nickname } = req.body;

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

      lobby.gameStarted = true;
      const selectedSongs = selectGameSongs(roomCode, 10);

      const scores = {};
      lobby.players.forEach(player => {
        scores[player] = 0;
      });

      lobby.gameState = {
        currentRound: 1,
        totalRounds: 10,
        songs: selectedSongs,
        scores: scores,
        currentSong: selectedSongs[0]?.title || null,
        roundStartTime: Date.now(),
        roundWinners: [],
        roundFinished: false,
        gameFinished: false,
        attempts: {},
        guesses: {}
      };

      await kv.set(`lobby:${roomCode}`, lobby);
      return res.status(200).json({ success: true });
    }

    if (action === 'guess') {
      const { guess } = req.body;

      if (!nickname || !guess) {
        return res.status(400).json({ error: 'Nickname e tentativa são obrigatórios.' });
      }

      if (!lobby.gameStarted || !lobby.gameState) {
        return res.status(400).json({ error: 'Jogo não foi iniciado.' });
      }

      if (lobby.gameState.roundFinished) {
        return res.status(400).json({ error: 'Esta rodada já terminou.' });
      }

      if (!lobby.gameState.attempts[nickname]) {
        lobby.gameState.attempts[nickname] = 0;
      }

      if (lobby.gameState.attempts[nickname] >= 6) {
        return res.status(400).json({ error: 'Você esgotou suas tentativas para esta rodada.' });
      }

      const currentRoundIndex = (lobby.gameState.currentRound || 1) - 1;
      const currentSong = lobby.gameState.songs[currentRoundIndex];

      const normalizeString = (str) => str.trim().toLowerCase().replace(/\s+/g, ' ');
      const isCorrect = normalizeString(guess) === normalizeString(currentSong.title);

      lobby.gameState.attempts[nickname]++;

      const guessedSong = songs.find(song => normalizeString(song.title) === normalizeString(guess));
      const isFromCorrectGame = guessedSong && normalizeString(guessedSong.game) === normalizeString(currentSong.game);

      let correct = false;
      let winner = null;
      let gameCorrect = false;

      if (isCorrect) {
        correct = true;
        winner = nickname;

        if (!lobby.gameState.roundWinners.includes(nickname)) {
          lobby.gameState.roundWinners.push(nickname);
        }

        const attemptsUsed = lobby.gameState.attempts[nickname];
        const pointsEarned = Math.max(0, 6 - attemptsUsed + 1);
        lobby.gameState.scores[nickname] = (lobby.gameState.scores[nickname] || 0) + pointsEarned;
      } else if (isFromCorrectGame) {
        gameCorrect = true;
      }

      if (!lobby.gameState.guesses[nickname]) {
        lobby.gameState.guesses[nickname] = [];
      }

      lobby.gameState.guesses[nickname].push({
        guess: guess,
        correct: correct,
        gameCorrect: gameCorrect,
        attempt: lobby.gameState.attempts[nickname],
        tooLate: false
      });

      const allPlayersExhausted = lobby.players.every(player =>
        (lobby.gameState.attempts[player] || 0) >= 6
      );

      const allPlayersWon = lobby.players.every(player =>
        lobby.gameState.roundWinners.includes(player)
      );

      if (allPlayersExhausted || allPlayersWon) {
        lobby.gameState.roundFinished = true;
        if (lobby.gameState.roundWinners.length === 0) {
          lobby.gameState.roundWinners = ['NONE'];
        }
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

    if (action === 'next_round') {
      if (!nickname || nickname !== lobby.host) {
        return res.status(400).json({ error: 'Apenas o host pode avançar rodadas.' });
      }

      if (!lobby.gameStarted || !lobby.gameState) {
        return res.status(400).json({ error: 'Jogo não foi iniciado.' });
      }

      if (lobby.gameState.currentRound >= lobby.gameState.totalRounds) {
        lobby.gameState.gameFinished = true;
      } else {
        lobby.gameState.currentRound++;
        lobby.gameState.roundWinners = [];
        lobby.gameState.roundFinished = false;
        lobby.gameState.roundStartTime = Date.now();
        lobby.gameState.attempts = {};
        lobby.gameState.guesses = {};

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

    if (action === 'leave') {
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

    if (action === 'reset_game') {
      if (!nickname || nickname !== lobby.host) {
        return res.status(400).json({ error: 'Apenas o host pode resetar o jogo.' });
      }

      lobby.gameStarted = false;
      lobby.gameState = null;
      lobby.currentRound = 1;
      lobby.songs = [];
      lobby.scores = {};
      lobby.currentSong = null;

      await kv.set(`lobby:${roomCode}`, lobby);
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Ação inválida.' });
  } catch (error) {
    console.error('Erro na ação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
