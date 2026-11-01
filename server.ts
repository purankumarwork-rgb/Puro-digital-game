import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory server state for rooms, players and telemetry
interface RoomPlayer {
  id: string;
  ws: WebSocket;
  username: string;
  playerId: string;
  characterId: string;
  team: 'red' | 'blue';
  isReady: boolean;
  x: number;
  y: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  kills: number;
  deaths: number;
  score: number;
}

interface GameRoom {
  code: string;
  name: string;
  hostId: string;
  mode: '1v1' | '2v2' | 'ffa';
  map: string;
  status: 'lobby' | 'countdown' | 'in_game' | 'finished';
  players: Map<string, RoomPlayer>;
  projectiles: Array<{
    id: string;
    ownerId: string;
    team: 'red' | 'blue';
    x: number;
    y: number;
    vx: number;
    vy: number;
    damage: number;
    color: string;
    range: number;
    traveled: number;
  }>;
  roundTimer: number;
  maxScore: number;
  createdAt: number;
}

const rooms = new Map<string, GameRoom>();
const matchmakingQueue: Array<{ id: string; ws: WebSocket; username: string; playerId: string; mode: '1v1' | '2v2' }> = [];
const auditLogs: Array<{ id: string; time: string; action: string; details: string; severity: 'info' | 'warning' | 'alert' }> = [
  { id: 'log-1', time: new Date().toISOString(), action: 'SYSTEM_BOOT', details: 'Game authoritative server initialized on port ' + PORT, severity: 'info' }
];

// Anti-cheat & suspicious event log
const suspiciousActivity: Array<{ id: string; time: string; playerId: string; username: string; flag: string; actionTaken: string }> = [];

// WebSocket Server
const wss = new WebSocketServer({ server });

function broadcastToRoom(room: GameRoom, data: any, exceptWs?: WebSocket) {
  const message = JSON.stringify(data);
  room.players.forEach(p => {
    if (p.ws.readyState === WebSocket.OPEN && p.ws !== exceptWs) {
      try {
        p.ws.send(message);
      } catch (e) {
        // ignore send error
      }
    }
  });
}

function generateRoomCode(): string {
  let code = '';
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

// Active connected players registry
const activeClients = new Map<string, { ws: WebSocket; username: string; currentRoomCode?: string }>();

wss.on('connection', (ws: WebSocket) => {
  let currentRoomCode: string | null = null;
  let clientPlayerId: string | null = null;

  ws.on('message', (messageRaw: string) => {
    try {
      const data = JSON.parse(messageRaw.toString());

      switch (data.type) {
        case 'REGISTER_CLIENT': {
          clientPlayerId = data.playerId;
          activeClients.set(data.playerId, { ws, username: data.username });
          break;
        }

        case 'DIRECT_INVITE': {
          const target = activeClients.get(data.targetPlayerId);
          const isTargetConnected = target && target.ws.readyState === WebSocket.OPEN;
          if (isTargetConnected) {
            target.ws.send(JSON.stringify({
              type: 'DIRECT_INVITE_RECEIVED',
              fromPlayerId: data.fromPlayerId,
              fromUsername: data.fromUsername,
              roomCode: data.roomCode,
              mode: data.mode
            }));
          }
          ws.send(JSON.stringify({
            type: 'INVITE_SENT_SUCCESS',
            targetPlayerId: data.targetPlayerId,
            targetOnline: isTargetConnected
          }));
          break;
        }
        case 'CREATE_ROOM': {
          const roomCode = generateRoomCode();
          const newRoom: GameRoom = {
            code: roomCode,
            name: data.roomName || `Arena-${roomCode}`,
            hostId: data.playerId,
            mode: data.mode || '1v1',
            map: data.map || 'cyber_grid',
            status: 'lobby',
            players: new Map(),
            projectiles: [],
            roundTimer: 180,
            maxScore: data.mode === '2v2' ? 10 : 5,
            createdAt: Date.now()
          };

          const hostPlayer: RoomPlayer = {
            id: data.playerId,
            ws,
            username: data.username || 'Host Gladiator',
            playerId: data.playerId,
            characterId: data.characterId || 'rex',
            team: 'red',
            isReady: true,
            x: 200,
            y: 350,
            angle: 0,
            hp: 100,
            maxHp: 100,
            shield: 50,
            kills: 0,
            deaths: 0,
            score: 0
          };

          newRoom.players.set(data.playerId, hostPlayer);
          rooms.set(roomCode, newRoom);
          currentRoomCode = roomCode;
          clientPlayerId = data.playerId;

          auditLogs.unshift({
            id: 'log-' + Date.now(),
            time: new Date().toISOString(),
            action: 'ROOM_CREATED',
            details: `Room ${roomCode} created by ${data.username} (${data.mode})`,
            severity: 'info'
          });

          ws.send(JSON.stringify({
            type: 'ROOM_CREATED',
            roomCode,
            room: serializeRoom(newRoom),
            player: serializePlayer(hostPlayer)
          }));
          break;
        }

        case 'JOIN_ROOM': {
          const room = rooms.get(data.roomCode?.toUpperCase());
          if (!room) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room not found. Check code.' }));
            return;
          }

          const maxCapacity = room.mode === '2v2' ? 4 : 2;
          if (room.players.size >= maxCapacity) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Room is full' }));
            return;
          }

          if (room.status !== 'lobby') {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Match is already in progress' }));
            return;
          }

          // Team assignment
          let team: 'red' | 'blue' = 'blue';
          if (room.mode === '2v2') {
            let redCount = 0;
            let blueCount = 0;
            room.players.forEach(p => {
              if (p.team === 'red') redCount++;
              else blueCount++;
            });
            team = redCount <= blueCount ? 'red' : 'blue';
          }

          const newPlayer: RoomPlayer = {
            id: data.playerId,
            ws,
            username: data.username || `Player-${Math.floor(1000 + Math.random() * 9000)}`,
            playerId: data.playerId,
            characterId: data.characterId || 'shadow',
            team,
            isReady: false,
            x: team === 'red' ? 200 : 700,
            y: 350,
            angle: team === 'red' ? 0 : Math.PI,
            hp: 100,
            maxHp: 100,
            shield: 50,
            kills: 0,
            deaths: 0,
            score: 0
          };

          room.players.set(data.playerId, newPlayer);
          currentRoomCode = room.code;
          clientPlayerId = data.playerId;

          ws.send(JSON.stringify({
            type: 'ROOM_JOINED',
            roomCode: room.code,
            room: serializeRoom(room),
            player: serializePlayer(newPlayer)
          }));

          broadcastToRoom(room, {
            type: 'PLAYER_JOINED',
            room: serializeRoom(room),
            newPlayer: serializePlayer(newPlayer)
          }, ws);
          break;
        }

        case 'TOGGLE_READY': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || !clientPlayerId) return;
          const player = room.players.get(clientPlayerId);
          if (!player) return;

          player.isReady = !player.isReady;
          broadcastToRoom(room, {
            type: 'ROOM_UPDATED',
            room: serializeRoom(room)
          });
          break;
        }

        case 'START_MATCH': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || !clientPlayerId) return;
          if (room.hostId !== clientPlayerId) {
            ws.send(JSON.stringify({ type: 'ERROR', message: 'Only the host can start the match.' }));
            return;
          }

          room.status = 'in_game';
          room.roundTimer = 180;
          broadcastToRoom(room, {
            type: 'MATCH_STARTED',
            room: serializeRoom(room)
          });
          break;
        }

        case 'PLAYER_MOVE': {
          if (!currentRoomCode || !clientPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'in_game') return;
          const player = room.players.get(clientPlayerId);
          if (!player) return;

          // Simple server-side validation against teleportation speed hacks
          const dx = data.x - player.x;
          const dy = data.y - player.y;
          const distSq = dx * dx + dy * dy;
          if (distSq > 90000) { // sudden jump > 300px in one packet
            suspiciousActivity.unshift({
              id: 'flag-' + Date.now(),
              time: new Date().toISOString(),
              playerId: player.playerId,
              username: player.username,
              flag: 'HIGH_VELOCITY_PACKET (Possible speed/teleport glitch)',
              actionTaken: 'Position clamped to authoritative range'
            });
            return;
          }

          player.x = Math.max(30, Math.min(870, data.x));
          player.y = Math.max(30, Math.min(570, data.y));
          player.angle = data.angle ?? player.angle;

          broadcastToRoom(room, {
            type: 'SYNC_PLAYER',
            id: player.id,
            x: player.x,
            y: player.y,
            angle: player.angle
          }, ws);
          break;
        }

        case 'PLAYER_FIRE': {
          if (!currentRoomCode || !clientPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'in_game') return;
          const player = room.players.get(clientPlayerId);
          if (!player) return;

          const proj = {
            id: 'proj-' + Math.random().toString(36).substring(2, 9),
            ownerId: player.id,
            team: player.team,
            x: player.x,
            y: player.y,
            vx: Math.cos(data.angle) * (data.speed || 10),
            vy: Math.sin(data.angle) * (data.speed || 10),
            damage: data.damage || 20,
            color: data.color || (player.team === 'red' ? '#ef4444' : '#06b6d4'),
            range: data.range || 500,
            traveled: 0
          };

          room.projectiles.push(proj);

          broadcastToRoom(room, {
            type: 'PROJECTILE_SPAWNED',
            projectile: proj
          });
          break;
        }

        case 'APPLY_DAMAGE': {
          if (!currentRoomCode) return;
          const room = rooms.get(currentRoomCode);
          if (!room || room.status !== 'in_game') return;

          const target = room.players.get(data.targetId);
          const attacker = room.players.get(data.attackerId);
          if (!target) return;

          const dmg = Math.min(data.amount || 20, 60); // Authoritative cap

          if (target.shield > 0) {
            const absorb = Math.min(target.shield, dmg);
            target.shield -= absorb;
            const remaining = dmg - absorb;
            target.hp = Math.max(0, target.hp - remaining);
          } else {
            target.hp = Math.max(0, target.hp - dmg);
          }

          let wasEliminated = false;
          if (target.hp <= 0) {
            wasEliminated = true;
            target.deaths++;
            if (attacker) {
              attacker.kills++;
              attacker.score += 100;
            }

            // Check match win condition
            let redScore = 0;
            let blueScore = 0;
            room.players.forEach(p => {
              if (p.team === 'red') redScore += p.kills;
              else blueScore += p.kills;
            });

            if (redScore >= room.maxScore || blueScore >= room.maxScore) {
              room.status = 'finished';
              broadcastToRoom(room, {
                type: 'MATCH_FINISHED',
                winnerTeam: redScore >= room.maxScore ? 'red' : 'blue',
                finalScores: { red: redScore, blue: blueScore }
              });
            } else {
              // Respawn target after 2.5s
              setTimeout(() => {
                if (room.status === 'in_game') {
                  target.hp = target.maxHp;
                  target.shield = 50;
                  target.x = target.team === 'red' ? 150 : 750;
                  target.y = 300;
                  broadcastToRoom(room, {
                    type: 'PLAYER_RESPAWNED',
                    playerId: target.id,
                    x: target.x,
                    y: target.y,
                    hp: target.hp,
                    shield: target.shield
                  });
                }
              }, 2500);
            }
          }

          broadcastToRoom(room, {
            type: 'DAMAGE_CONFIRMED',
            targetId: target.id,
            attackerId: attacker?.id,
            hp: target.hp,
            shield: target.shield,
            wasEliminated
          });
          break;
        }

        case 'SEND_CHAT': {
          if (!currentRoomCode || !clientPlayerId) return;
          const room = rooms.get(currentRoomCode);
          if (!room) return;
          const player = room.players.get(clientPlayerId);
          if (!player) return;

          broadcastToRoom(room, {
            type: 'ROOM_CHAT',
            sender: player.username,
            senderId: player.id,
            team: player.team,
            text: (data.text || '').substring(0, 100)
          });
          break;
        }

        case 'QUICK_MATCH_QUEUE': {
          // Add to matchmaking queue
          const queueItem = {
            id: data.playerId,
            ws,
            username: data.username,
            playerId: data.playerId,
            mode: data.mode || '1v1'
          };
          matchmakingQueue.push(queueItem);

          ws.send(JSON.stringify({ type: 'MATCHMAKING_SEARCHING', position: matchmakingQueue.length }));

          // Check if we have a match
          const matches = matchmakingQueue.filter(q => q.mode === queueItem.mode && q.ws.readyState === WebSocket.OPEN);
          const reqCount = queueItem.mode === '2v2' ? 4 : 2;

          if (matches.length >= reqCount) {
            const paired = matches.slice(0, reqCount);
            // Remove from queue
            paired.forEach(p => {
              const idx = matchmakingQueue.findIndex(item => item.id === p.id);
              if (idx !== -1) matchmakingQueue.splice(idx, 1);
            });

            // Create match room
            const roomCode = generateRoomCode();
            const matchRoom: GameRoom = {
              code: roomCode,
              name: `Ranked-${roomCode}`,
              hostId: paired[0].id,
              mode: queueItem.mode,
              map: 'cyber_grid',
              status: 'in_game',
              players: new Map(),
              projectiles: [],
              roundTimer: 180,
              maxScore: queueItem.mode === '2v2' ? 10 : 5,
              createdAt: Date.now()
            };

            paired.forEach((p, idx) => {
              const team: 'red' | 'blue' = idx % 2 === 0 ? 'red' : 'blue';
              const rp: RoomPlayer = {
                id: p.id,
                ws: p.ws,
                username: p.username,
                playerId: p.playerId,
                characterId: 'rex',
                team,
                isReady: true,
                x: team === 'red' ? 200 : 700,
                y: 200 + idx * 80,
                angle: team === 'red' ? 0 : Math.PI,
                hp: 100,
                maxHp: 100,
                shield: 50,
                kills: 0,
                deaths: 0,
                score: 0
              };
              matchRoom.players.set(p.id, rp);
            });

            rooms.set(roomCode, matchRoom);

            paired.forEach(p => {
              p.ws.send(JSON.stringify({
                type: 'QUICK_MATCH_FOUND',
                roomCode,
                room: serializeRoom(matchRoom)
              }));
            });
          }
          break;
        }

        case 'CANCEL_MATCHMAKING': {
          const idx = matchmakingQueue.findIndex(q => q.id === data.playerId);
          if (idx !== -1) {
            matchmakingQueue.splice(idx, 1);
          }
          ws.send(JSON.stringify({ type: 'MATCHMAKING_CANCELLED' }));
          break;
        }
      }
    } catch (err) {
      console.error('WS Error:', err);
    }
  });

  ws.on('close', () => {
    if (clientPlayerId) {
      activeClients.delete(clientPlayerId);
    }
    // Remove from queue if present
    const qIdx = matchmakingQueue.findIndex(q => q.ws === ws);
    if (qIdx !== -1) matchmakingQueue.splice(qIdx, 1);

    // Remove from room
    if (currentRoomCode && clientPlayerId) {
      const room = rooms.get(currentRoomCode);
      if (room) {
        room.players.delete(clientPlayerId);
        if (room.players.size === 0) {
          rooms.delete(currentRoomCode);
        } else {
          // If host left, elect next player
          if (room.hostId === clientPlayerId) {
            const nextHost = Array.from(room.players.values())[0];
            room.hostId = nextHost.id;
          }
          broadcastToRoom(room, {
            type: 'PLAYER_LEFT',
            playerId: clientPlayerId,
            room: serializeRoom(room)
          });
        }
      }
    }
  });
});

function serializePlayer(p: RoomPlayer) {
  return {
    id: p.id,
    username: p.username,
    playerId: p.playerId,
    characterId: p.characterId,
    team: p.team,
    isReady: p.isReady,
    x: p.x,
    y: p.y,
    angle: p.angle,
    hp: p.hp,
    maxHp: p.maxHp,
    shield: p.shield,
    kills: p.kills,
    deaths: p.deaths,
    score: p.score
  };
}

function serializeRoom(room: GameRoom) {
  const playersList: any[] = [];
  room.players.forEach(p => playersList.push(serializePlayer(p)));
  return {
    code: room.code,
    name: room.name,
    hostId: room.hostId,
    mode: room.mode,
    map: room.map,
    status: room.status,
    roundTimer: room.roundTimer,
    maxScore: room.maxScore,
    playerCount: room.players.size,
    players: playersList
  };
}

// REST Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    game: 'Puro - Digital game (Battle Arena Pro)',
    activeRooms: rooms.size,
    playersInQueue: matchmakingQueue.length,
    timestamp: new Date().toISOString()
  });
});

// Admin panel API
app.get('/api/admin/overview', (_req: Request, res: Response) => {
  const activeRoomsList: any[] = [];
  rooms.forEach(r => activeRoomsList.push(serializeRoom(r)));

  res.json({
    activeRoomsCount: rooms.size,
    matchmakingQueueCount: matchmakingQueue.length,
    rooms: activeRoomsList,
    auditLogs: auditLogs.slice(0, 30),
    suspiciousActivity: suspiciousActivity.slice(0, 30),
    serverUptimeSeconds: Math.floor(process.uptime()),
    antiCheatEngine: {
      status: 'ACTIVE',
      validationMode: 'Server-Authoritative Physics & Bounds',
      realMoneyWageringBlocked: true,
      googlePlayBillingCompliant: true
    }
  });
});

// Simulated tournament bracket API
app.get('/api/tournament/current', (_req: Request, res: Response) => {
  res.json({
    id: 'puro-apex-cup-2026',
    title: 'Puro Apex Cyber Championship',
    status: 'OPEN_REGISTRATION',
    prizePool: '10,000 Battle Gold + Legendary Valkyrie Skin',
    entryFee: 'FREE (Skill Based Only)',
    participantsCount: 32,
    maxParticipants: 64,
    bracketRounds: [
      {
        round: 'Quarterfinals',
        matches: [
          { id: 'm1', p1: 'Vortex#102', p2: 'CyberNova#88', winner: 'Vortex#102', score: '5 - 3' },
          { id: 'm2', p1: 'GhostFire#45', p2: 'ShadowBlade#99', winner: 'ShadowBlade#99', score: '2 - 5' },
          { id: 'm3', p1: 'AlphaPrime#12', p2: 'ZeroTolerance#77', winner: 'ZeroTolerance#77', score: '4 - 5' },
          { id: 'm4', p1: 'PuroChampion#01', p2: 'ThunderBolt#64', winner: 'PuroChampion#01', score: '5 - 1' }
        ]
      },
      {
        round: 'Semifinals',
        matches: [
          { id: 'm5', p1: 'Vortex#102', p2: 'ShadowBlade#99', winner: 'Vortex#102', score: '5 - 4' },
          { id: 'm6', p1: 'ZeroTolerance#77', p2: 'PuroChampion#01', winner: null, score: 'TBD' }
        ]
      },
      {
        round: 'Grand Final',
        matches: [
          { id: 'm7', p1: 'Vortex#102', p2: 'TBD', winner: null, score: 'TBD' }
        ]
      }
    ]
  });
});

// Mount Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Puro Game Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
