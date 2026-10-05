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

// Broadcast message to all connected clients
function broadcast(message: string, senderWs?: WebSocket) {
  wss.clients.forEach((client) => {
    if (client !== senderWs && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws) => {
  // Send existing state to newly connected client (e.g. phone)
  ws.send(JSON.stringify({ type: 'FULL_STATE_SYNC', payload: syncedState }));

  ws.on('message', (data) => {
    try {
      const parsed = JSON.parse(data.toString());
      if (parsed.type) {
        syncedState[parsed.type] = parsed.payload;
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
  res.json(syncedState);
});

app.post('/api/state', (req, res) => {
  const { type, payload } = req.body;
  if (type) {
    syncedState[type] = payload;
    broadcast(JSON.stringify({ type, payload }));
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
