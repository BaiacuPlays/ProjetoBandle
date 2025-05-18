import { kv } from '@vercel/kv';

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
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

export const config = {
  runtime: 'edge',
  regions: ['gru1'],
};

export default async function handler(req) {
  // Configurar CORS
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers':
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method === 'POST') {
      const body = await req.json();
      const { nickname } = body;
      if (!nickname) {
        return new Response(JSON.stringify({ error: 'Nickname é obrigatório.' }), { status: 400, headers: corsHeaders });
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
        currentTurn: null,
        round: 1
      };
      await kv.set(`lobby:${roomCode}`, lobby);
      return new Response(JSON.stringify({ roomCode }), { status: 200, headers: corsHeaders });
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { nickname, roomCode } = body;
      if (!nickname || !roomCode) {
        return new Response(JSON.stringify({ error: 'Nickname e código da sala são obrigatórios.' }), { status: 400, headers: corsHeaders });
      }
      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        return new Response(JSON.stringify({ error: 'Sala não encontrada.' }), { status: 404, headers: corsHeaders });
      }
      if (!lobby.players.includes(nickname)) {
        lobby.players.push(nickname);
        await kv.set(`lobby:${roomCode}`, lobby);
      }
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
    }

    if (req.method === 'PATCH') {
      const body = await req.json();
      const { roomCode, action, nickname } = body;
      
      if (!roomCode) {
        return new Response(JSON.stringify({ error: 'Código da sala é obrigatório.' }), { status: 400, headers: corsHeaders });
      }

      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        return new Response(JSON.stringify({ error: 'Sala não encontrada.' }), { status: 404, headers: corsHeaders });
      }

      if (action === 'start') {
        if (!lobby.players || lobby.players.length < 3) {
          return new Response(JSON.stringify({ error: 'Sala inválida ou jogadores insuficientes.' }), { status: 400, headers: corsHeaders });
        }
        lobby.sorteio = sortearNicks(lobby.players);
        lobby.started = true;
        lobby.currentTurn = lobby.players[0]; // Primeiro jogador começa
        await kv.set(`lobby:${roomCode}`, lobby);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (action === 'next_turn') {
        if (!lobby.started) {
          return new Response(JSON.stringify({ error: 'Jogo não iniciado.' }), { status: 400, headers: corsHeaders });
        }
        const currentIndex = lobby.players.indexOf(lobby.currentTurn);
        const nextIndex = (currentIndex + 1) % lobby.players.length;
        lobby.currentTurn = lobby.players[nextIndex];
        await kv.set(`lobby:${roomCode}`, lobby);
        return new Response(JSON.stringify({ success: true, currentTurn: lobby.currentTurn }), { status: 200, headers: corsHeaders });
      }

      if (action === 'reset_game') {
        if (nickname !== lobby.host) {
          return new Response(JSON.stringify({ error: 'Apenas o host pode resetar o jogo.' }), { status: 403, headers: corsHeaders });
        }
        lobby.sorteio = sortearNicks(lobby.players);
        lobby.currentTurn = lobby.players[0];
        lobby.round += 1;
        await kv.set(`lobby:${roomCode}`, lobby);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      if (action === 'leave_game') {
        if (!nickname) {
          return new Response(JSON.stringify({ error: 'Nickname é obrigatório.' }), { status: 400, headers: corsHeaders });
        }
        lobby.players = lobby.players.filter(p => p !== nickname);
        if (lobby.players.length === 0) {
          await kv.del(`lobby:${roomCode}`);
          return new Response(JSON.stringify({ success: true, message: 'Sala fechada.' }), { status: 200, headers: corsHeaders });
        }
        if (nickname === lobby.host) {
          lobby.host = lobby.players[0];
        }
        if (lobby.currentTurn === nickname) {
          const currentIndex = lobby.players.indexOf(nickname);
          const nextIndex = (currentIndex + 1) % lobby.players.length;
          lobby.currentTurn = lobby.players[nextIndex];
        }
        await kv.set(`lobby:${roomCode}`, lobby);
        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
      }

      return new Response(JSON.stringify({ error: 'Ação inválida.' }), { status: 400, headers: corsHeaders });
    }

    if (req.method === 'GET') {
      const { searchParams } = new URL(req.url);
      const roomCode = searchParams.get('roomCode');
      if (!roomCode) {
        return new Response(JSON.stringify({ error: 'Código da sala é obrigatório.' }), { status: 400, headers: corsHeaders });
      }
      const lobby = await kv.get(`lobby:${roomCode}`);
      if (!lobby) {
        return new Response(JSON.stringify({ error: 'Sala não encontrada.' }), { status: 404, headers: corsHeaders });
      }
      return new Response(
        JSON.stringify({
          players: lobby.players,
          started: lobby.started || false,
          sorteio: lobby.sorteio || null,
          currentTurn: lobby.currentTurn || null,
          host: lobby.host,
          round: lobby.round || 1
        }),
        { status: 200, headers: corsHeaders }
      );
    }

    return new Response(JSON.stringify({ error: 'Método não permitido.' }), { status: 405, headers: corsHeaders });
  } catch (error) {
    console.error('Erro na API de lobby:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), { status: 500, headers: corsHeaders });
  }
} 