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

app.use(express.json());

// In-memory synced state store for real-time mobile controller sync
let syncedState: Record<string, unknown> = {};

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
]);

function recordStateOrCommand(type: string, payload: unknown, cmdId?: string) {
  if (PERSISTENT_STATE_TYPES.has(type)) {
    syncedState[type] = payload;
  } else {
    syncedState.__LAST_COMMAND__ = {
      type,
      payload,
      cmdId: cmdId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };
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
    if (k !== '__LAST_COMMAND__') {
      initialSync[k] = v;
    }
  });
  ws.send(JSON.stringify({ type: 'FULL_STATE_SYNC', payload: initialSync }));

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

  ws.on('error', (err) => {
    console.error('WebSocket client error:', err);
  });
});

// REST API fallback endpoints for mobile devices
app.get('/api/state', (_req, res) => {
  const responseState: Record<string, unknown> = {};
  Object.entries(syncedState).forEach(([k, v]) => {
    if (k === '__LAST_COMMAND__') {
      const cmd = v as { timestamp?: number } | undefined;
      if (cmd && typeof cmd.timestamp === 'number' && Date.now() - cmd.timestamp < 5000) {
        responseState[k] = v;
      }
    } else {
      responseState[k] = v;
    }
  });
  res.json(responseState);
});

app.post('/api/state', (req, res) => {
  const { type, payload, cmdId } = req.body;
  if (type) {
    recordStateOrCommand(type, payload, cmdId);
    broadcast(JSON.stringify({ type, payload, cmdId }));
  }
  res.json({ success: true, updated: type });
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', clientsCount: wss.clients.size });
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
