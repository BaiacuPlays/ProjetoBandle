const express = require('express');
const router = express.Router();

// Simulação de banco de dados em memória
let lobbies = new Map();

// Dados das músicas (copiado do projeto principal)
const songs = [
  // Aqui você deve copiar todo o array de músicas do arquivo data/songs.js
  // Por enquanto, vou colocar algumas músicas de exemplo
  {
    id: 1,
    title: "Summer (Nature's Crescendo)",
    game: "Stardew Valley",
    artist: "ConcernedApe",
    year: 2016,
    console: "PC",
    audioUrl: "/audio/stardew valley/13. Summer (Nature's Crescendo).mp3"
  },
  {
    id: 2,
    title: "Gusty Garden Galaxy",
    game: "Super Mario Galaxy",
    artist: "Nintendo",
    year: 2007,
    console: "Wii",
    audioUrl: "/audio/mario galaxy/1-17. Gusty Garden Galaxy.mp3"
  }
  // Adicione mais músicas conforme necessário
];

// Função para normalizar strings
function normalizeString(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Função para gerar código de sala
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Função para selecionar músicas aleatórias
function selectRandomSongs(count = 10) {
  const shuffled = [...songs].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, songs.length));
}

// Rota principal do lobby
router.all('/', async (req, res) => {
  const { method } = req;
  
  try {
    if (method === 'POST') {
      // Criar nova sala
      const { nickname } = req.body;
      
      if (!nickname) {
        return res.status(400).json({ error: 'Nickname é obrigatório.' });
      }
      
      const roomCode = generateRoomCode();
      const lobby = {
        roomCode,
        host: nickname,
        players: [nickname],
        gameStarted: false,
        gameState: null,
        createdAt: new Date()
      };
      
      lobbies.set(roomCode, lobby);
      
      return res.json({
        success: true,
        roomCode,
        lobbyData: lobby
      });
      
    } else if (method === 'PATCH') {
      // Ações do lobby (join, start, guess, etc.)
      const { roomCode, action, nickname } = req.body;
      
      if (!roomCode || !action || !nickname) {
        return res.status(400).json({ error: 'Dados incompletos.' });
      }
      
      const lobby = lobbies.get(roomCode);
      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }
      
      // Implementar ações específicas
      if (action === 'join') {
        if (!lobby.players.includes(nickname)) {
          lobby.players.push(nickname);
        }
        return res.json({ success: true, lobbyData: lobby });
        
      } else if (action === 'start') {
        if (lobby.host !== nickname) {
          return res.status(403).json({ error: 'Apenas o anfitrião pode iniciar o jogo.' });
        }
        
        const selectedSongs = selectRandomSongs(10);
        lobby.gameStarted = true;
        lobby.gameState = {
          currentRound: 1,
          totalRounds: 10,
          songs: selectedSongs,
          currentSong: selectedSongs[0],
          scores: {},
          attempts: {},
          guesses: {},
          roundWinners: [],
          roundFinished: false,
          gameFinished: false
        };
        
        // Inicializar scores e attempts para todos os jogadores
        lobby.players.forEach(player => {
          lobby.gameState.scores[player] = 0;
          lobby.gameState.attempts[player] = 0;
          lobby.gameState.guesses[player] = [];
        });
        
        return res.json({ success: true, lobbyData: lobby });
        
      } else if (action === 'guess') {
        // Implementar lógica de tentativa
        const { guess } = req.body;
        
        if (!lobby.gameStarted || !lobby.gameState) {
          return res.status(400).json({ error: 'Jogo não foi iniciado.' });
        }
        
        if (lobby.gameState.roundFinished) {
          return res.status(400).json({ error: 'Esta rodada já terminou.' });
        }
        
        // Incrementar tentativas
        lobby.gameState.attempts[nickname]++;
        
        // Verificar se acertou
        const currentSong = lobby.gameState.currentSong;
        const isCorrect = normalizeString(guess) === normalizeString(currentSong.title);
        
        let correct = false;
        let gameCorrect = false;
        
        if (isCorrect) {
          correct = true;
          if (!lobby.gameState.roundWinners.includes(nickname)) {
            lobby.gameState.roundWinners.push(nickname);
            
            // Calcular pontos
            const attemptsUsed = lobby.gameState.attempts[nickname];
            const pointsEarned = Math.max(0, 6 - attemptsUsed + 1);
            lobby.gameState.scores[nickname] = (lobby.gameState.scores[nickname] || 0) + pointsEarned;
          }
        } else {
          // Verificar se acertou o jogo
          const guessedSong = songs.find(song => normalizeString(song.title) === normalizeString(guess));
          if (guessedSong && normalizeString(guessedSong.game) === normalizeString(currentSong.game)) {
            gameCorrect = true;
          }
        }
        
        // Salvar tentativa
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
        
        // Verificar se a rodada terminou
        const allPlayersFinished = lobby.players.every(player =>
          lobby.gameState.roundWinners.includes(player) || 
          (lobby.gameState.attempts[player] || 0) >= 6
        );
        
        if (allPlayersFinished) {
          lobby.gameState.roundFinished = true;
        }
        
        return res.json({
          success: true,
          correct: correct,
          gameCorrect: gameCorrect,
          lobbyData: lobby
        });
        
      } else if (action === 'nextRound') {
        if (lobby.host !== nickname) {
          return res.status(403).json({ error: 'Apenas o anfitrião pode avançar rodadas.' });
        }
        
        if (!lobby.gameState.roundFinished) {
          return res.status(400).json({ error: 'A rodada atual ainda não terminou.' });
        }
        
        lobby.gameState.currentRound++;
        
        if (lobby.gameState.currentRound > lobby.gameState.totalRounds) {
          lobby.gameState.gameFinished = true;
        } else {
          // Próxima música
          const nextSongIndex = lobby.gameState.currentRound - 1;
          lobby.gameState.currentSong = lobby.gameState.songs[nextSongIndex];
          
          // Reset da rodada
          lobby.gameState.roundWinners = [];
          lobby.gameState.roundFinished = false;
          
          // Reset das tentativas para a nova rodada
          lobby.players.forEach(player => {
            lobby.gameState.attempts[player] = 0;
            lobby.gameState.guesses[player] = [];
          });
        }
        
        return res.json({ success: true, lobbyData: lobby });
      }
      
    } else if (method === 'GET') {
      // Buscar sala
      const { roomCode } = req.query;
      
      if (!roomCode) {
        return res.status(400).json({ error: 'Código da sala é obrigatório.' });
      }
      
      const lobby = lobbies.get(roomCode);
      if (!lobby) {
        return res.status(404).json({ error: 'Sala não encontrada.' });
      }
      
      return res.json({ success: true, lobbyData: lobby });
    }
    
    return res.status(405).json({ error: 'Método não permitido.' });
    
  } catch (error) {
    console.error('Erro na API do lobby:', error);
    return res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

module.exports = router;
