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

app.use(express.json({ limit: '2mb' }));

// Allow cross-origin sync between ais-dev / ais-pre / custom domains
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// In-memory synced state store for real-time mobile controller sync
let syncedState: Record<string, unknown> = {};
let recentCommands: Array<{
  type: string;
  payload: unknown;
  cmdId: string;
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

function recordStateOrCommand(type: string, payload: unknown, cmdId?: string) {
  if (type === 'BULK_STATE_SYNC' && payload && typeof payload === 'object') {
    Object.entries(payload as Record<string, unknown>).forEach(([k, v]) => {
      if (PERSISTENT_STATE_TYPES.has(k)) {
        syncedState[k] = v;
      }
    });
    return;
  }

  if (PERSISTENT_STATE_TYPES.has(type)) {
    syncedState[type] = payload;
  } else {
    const now = Date.now();
    recentCommands = recentCommands.filter((c) => now - c.timestamp < 6000);
    const id = cmdId || `${now}-${Math.random().toString(36).slice(2, 8)}`;
    if (!recentCommands.some((c) => c.cmdId === id)) {
      recentCommands.push({
        type,
        payload,
        cmdId: id,
        timestamp: now,
      });
      if (recentCommands.length > 30) {
        recentCommands = recentCommands.slice(-30);
      }
    }
  }
}

// Broadcast message to all connected clients
function broadcast(message: string, senderWs?: WebSocket) {
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  // Send existing persistent state to newly connected client (e.g. phone)
  const initialSync: Record<string, unknown> = {};
  Object.entries(syncedState).forEach(([k, v]) => {
    initialSync[k] = v;
  });
  ws.send(
    JSON.stringify({
      type: 'FULL_STATE_SYNC',
      payload: initialSync,
      clientsCount: wss.clients.size,
    })
  );

  // Notify all clients of updated connection count
  broadcast(JSON.stringify({ type: 'CLIENTS_COUNT_UPDATED', payload: wss.clients.size }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type) {
        recordStateOrCommand(parsed.type, parsed.payload, parsed.cmdId);
        // Broadcast to all other connected devices (e.g. PC/TV screen)
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

// REST API fallback endpoints for mobile devices
app.get('/api/state', (_req, res) => {
  const now = Date.now();
  recentCommands = recentCommands.filter((c) => now - c.timestamp < 6000);
  const responseState: Record<string, unknown> = {
    ...syncedState,
    __RECENT_COMMANDS__: recentCommands,
    __CLIENTS_COUNT__: wss.clients.size,
  };
  res.json(responseState);
});

app.post('/api/state', (req, res) => {
  const { type, payload, cmdId } = req.body;
  if (type) {
    recordStateOrCommand(type, payload, cmdId);
    broadcast(JSON.stringify({ type, payload, cmdId }));
  }
  res.json({ success: true, updated: type, clientsCount: wss.clients.size });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', clientsCount: wss.clients.size, roomCode: syncedState.HOST_ROOM_CODE || null });
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
