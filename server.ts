import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Full CORS headers BEFORE body parsing so preflight and cross-domain requests always succeed
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '2mb' }));

// In-memory synced state store for real-time mobile controller sync
let syncedState: Record<string, unknown> = {};
let hostLastHeartbeatByRoom: Record<string, number> = {};
let recentCommands: Array<{
  type: string;
  payload: unknown;
  cmdId: string;
  roomCode?: string;
  timestamp: number;
}> = [];

const PERSISTENT_STATE_TYPES = new Set([
  'TEAMS_UPDATED',
  'MATCH_UPDATED',
  'HISTORY_UPDATED',
  'CATEGORIES_UPDATED',
  'CARDS_UPDATED',
  'GAMES_UPDATED',
  'ARENA_GAMES_UPDATED',
  'LEAGUE_SETTINGS_UPDATED',
  'TIMER_SYNC',
  'BROADCAST_VIEW_UPDATED',
  'REMOTE_RULES_MODAL',
  'REMOTE_GAME_MODAL',
  'HOST_ROOM_CODE',
]);

function recordStateOrCommand(type: string, payload: unknown, cmdId?: string, roomCode?: string) {
  const now = Date.now();
  if (roomCode && (type === 'BULK_STATE_SYNC' || type === 'HOST_HEARTBEAT')) {
    hostLastHeartbeatByRoom[roomCode] = now;
    syncedState['HOST_ROOM_CODE'] = roomCode;
  }

  if (type === 'state' && payload && typeof payload === 'object') {
    Object.entries(payload as Record<string, unknown>).forEach(([k, v]) => {
      if (PERSISTENT_STATE_TYPES.has(k)) {
        syncedState[k] = v;
      }
    });
    return;
  }

  if (type === 'remote_action' && payload && typeof payload === 'object') {
    const act = payload as { action?: string; payload?: unknown; cmdId?: string };
    if (act.action) {
      recordStateOrCommand(act.action, act.payload, act.cmdId || cmdId, roomCode);
    }
    return;
  }

  if (type === 'BULK_STATE_SYNC' && payload && typeof payload === 'object') {
    Object.entries(payload as Record<string, unknown>).forEach(([k, v]) => {
      if (PERSISTENT_STATE_TYPES.has(k)) {
        syncedState[k] = v;
      }
    });
    if (typeof (payload as Record<string, unknown>).HOST_ROOM_CODE === 'string') {
      const rc = (payload as Record<string, string>).HOST_ROOM_CODE;
      hostLastHeartbeatByRoom[rc] = now;
    }
    return;
  }

  if (PERSISTENT_STATE_TYPES.has(type)) {
    syncedState[type] = payload;
    if (type === 'HOST_ROOM_CODE' && typeof payload === 'string') {
      hostLastHeartbeatByRoom[payload] = now;
    }
  } else if (type !== 'HOST_HEARTBEAT') {
    recentCommands = recentCommands.filter((c) => now - c.timestamp < 8000);
    const id = cmdId || `${now}-${Math.random().toString(36).slice(2, 8)}`;
    if (!recentCommands.some((c) => c.cmdId === id)) {
      recentCommands.push({
        type,
        payload,
        cmdId: id,
        roomCode,
        timestamp: now,
      });
      if (recentCommands.length > 40) {
        recentCommands = recentCommands.slice(-40);
      }
    }
  }
}

// Broadcast message to all connected WebSocket clients
function broadcast(message: string, senderWs?: WebSocket) {
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  const initialSync: Record<string, unknown> = { ...syncedState };
  ws.send(
    JSON.stringify({
      type: 'FULL_STATE_SYNC',
      payload: initialSync,
      clientsCount: wss.clients.size,
    })
  );

  broadcast(JSON.stringify({ type: 'CLIENTS_COUNT_UPDATED', payload: wss.clients.size }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type) {
        recordStateOrCommand(parsed.type, parsed.payload, parsed.cmdId, parsed.roomCode);
        broadcast(data.toString(), ws);
      }
    } catch (e) {
      console.error('Error handling WebSocket message:', e);
    }
  });

  ws.on('close', () => {
    broadcast(JSON.stringify({ type: 'CLIENTS_COUNT_UPDATED', payload: wss.clients.size }));
  });

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// REST API backup channel for mobile & cross-domain devices (/api/state)
app.get('/api/state', (req, res) => {
  const now = Date.now();
  recentCommands = recentCommands.filter((c) => now - c.timestamp < 8000);
  const requestedRoom = typeof req.query.room === 'string' ? req.query.room.trim() : '';
  const activeHostRoom = typeof syncedState.HOST_ROOM_CODE === 'string' ? syncedState.HOST_ROOM_CODE : '';
  const roomToCheck = requestedRoom || activeHostRoom;
  const lastHb = roomToCheck ? hostLastHeartbeatByRoom[roomToCheck] || 0 : 0;

  const responseState: Record<string, unknown> = {
    ...syncedState,
    __RECENT_COMMANDS__: recentCommands,
    __CLIENTS_COUNT__: wss.clients.size,
    __HOST_ACTIVE_FOR_ROOM__: Boolean(lastHb && now - lastHb < 10000),
    __HOST_ROOM_CODE__: activeHostRoom,
  };
  res.json(responseState);
});

app.post('/api/state', (req, res) => {
  const { type, action, payload, cmdId, roomCode } = req.body || {};
  const effectiveType = type === 'remote_action' && action ? action : type;
  if (effectiveType) {
    recordStateOrCommand(effectiveType, payload, cmdId, roomCode);
    broadcast(JSON.stringify({ type: effectiveType, payload, cmdId, roomCode }));
  }
  res.json({
    success: true,
    updated: effectiveType,
    clientsCount: wss.clients.size,
    hostRoomCode: syncedState.HOST_ROOM_CODE || null,
  });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    clientsCount: wss.clients.size,
    roomCode: syncedState.HOST_ROOM_CODE || null,
  });
});

async function start() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = Number(process.env.PORT) || 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start();
