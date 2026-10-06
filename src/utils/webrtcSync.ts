import { Peer, DataConnection } from 'peerjs';

type MessageHandler = (type: string, payload: unknown) => void;
type StatusHandler = (status: 'connected' | 'connecting' | 'disconnected', clientCount: number) => void;

// High-reliability Google STUN servers for NAT / Firewall traversal on mobile 4G/5G carriers
const PEER_ICE_CONFIG = {
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ],
  },
};

class WebRTCSyncManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private roomCode: string = '';
  private isHost: boolean = true;
  private status: 'connected' | 'connecting' | 'disconnected' = 'connecting';
  private fullStateProvider: (() => Record<string, unknown>) | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;

  constructor() {
    if (typeof window === 'undefined') return;

    // Check if URL has a room query parameter (e.g. from QR scan on phone)
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    const isRemote =
      window.location.hash === '#remote' ||
      window.location.pathname.startsWith('/remote') ||
      params.get('mode') === 'remote' ||
      params.get('remote') === 'true';

    if (roomFromUrl) {
      this.roomCode = roomFromUrl.toUpperCase();
      this.isHost = false;
    } else if (isRemote) {
      const saved = localStorage.getItem('tahadi5_active_room');
      this.roomCode = saved || 'ELITE-ARENA';
      this.isHost = false;
    } else {
      // Host screen (Laptop / PC): generate or reuse persistent room code
      let hostCode = localStorage.getItem('tahadi5_host_room');
      if (!hostCode) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        hostCode = `ELITE-${rand}`;
        localStorage.setItem('tahadi5_host_room', hostCode);
      }
      this.roomCode = hostCode;
      this.isHost = true;
    }

    this.initPeer();
    this.startHeartbeat();
  }

  public setFullStateProvider(provider: () => Record<string, unknown>) {
    this.fullStateProvider = provider;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.status;
  }

  public getClientCount(): number {
    return this.connections.size;
  }

  public setRoomCode(newRoomCode: string) {
    this.roomCode = newRoomCode.toUpperCase().trim();
    localStorage.setItem('tahadi5_host_room', this.roomCode);
    localStorage.setItem('tahadi5_active_room', this.roomCode);
    this.cleanup();
    this.initPeer();
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status, this.isHost ? this.connections.size : (this.status === 'connected' ? 1 : 0));
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  private updateStatus(newStatus: 'connected' | 'connecting' | 'disconnected') {
    this.status = newStatus;
    const count = this.isHost ? this.connections.size : (newStatus === 'connected' ? 1 : 0);
    this.statusHandlers.forEach((handler) => {
      try {
        handler(newStatus, count);
      } catch {}
    });
  }

  private initPeer() {
    try {
      this.updateStatus('connecting');

      if (this.isHost) {
        // Host tries to register fixed room ID
        const peerId = `tahadi5-${this.roomCode.toLowerCase()}`;
        this.peer = new Peer(peerId, PEER_ICE_CONFIG);

        this.peer.on('open', () => {
          this.updateStatus(this.connections.size > 0 ? 'connected' : 'connecting');
        });

        this.peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          if (err.type === 'unavailable-id') {
            // If ID busy, fallback to dynamic peer and advertise
            this.peer?.destroy();
            this.peer = new Peer(PEER_ICE_CONFIG);
            this.peer.on('open', () => {
              this.peer?.on('connection', (conn) => this.setupHostConnection(conn));
            });
          } else {
            this.updateStatus('disconnected');
          }
        });
      } else {
        // Client (Phone Remote)
        this.peer = new Peer(PEER_ICE_CONFIG);

        this.peer.on('open', () => {
          this.connectToHost();
        });

        this.peer.on('error', () => {
          this.updateStatus('disconnected');
          this.scheduleReconnect();
        });
      }
    } catch (e) {
      console.warn('WebRTC peer error:', e);
      this.updateStatus('disconnected');
    }
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.updateStatus('connected');

      // Send initial full state to newly connected smartphone
      if (this.fullStateProvider) {
        try {
          const state = this.fullStateProvider();
          conn.send(JSON.stringify({ type: 'FULL_STATE_SYNC', payload: state }));
        } catch {}
      }
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updateStatus(this.connections.size > 0 ? 'connected' : 'connecting');
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.updateStatus(this.connections.size > 0 ? 'connected' : 'connecting');
    });
  }

  private connectToHost() {
    if (!this.peer || this.peer.destroyed) return;

    try {
      this.updateStatus('connecting');
      const targetPeerId = `tahadi5-${this.roomCode.toLowerCase()}`;
      const conn = this.peer.connect(targetPeerId, { reliable: true });

      conn.on('open', () => {
        this.hostConnection = conn;
        this.updateStatus('connected');
      });

      conn.on('data', (data) => {
        this.handleIncomingData(data);
      });

      conn.on('close', () => {
        this.hostConnection = null;
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      });

      conn.on('error', () => {
        this.hostConnection = null;
        this.updateStatus('disconnected');
        this.scheduleReconnect();
      });
    } catch {
      this.updateStatus('disconnected');
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isHost && (!this.hostConnection || !this.hostConnection.open)) {
        this.connectToHost();
      }
    }, 2000);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.isHost && this.hostConnection && this.hostConnection.open) {
        try {
          this.hostConnection.send(JSON.stringify({ type: 'PING' }));
        } catch {}
      }
    }, 5000);
  }

  private handleIncomingData(data: unknown, senderPeerId?: string) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const parsed = JSON.parse(str);

      if (parsed?.type === 'PING') {
        if (this.isHost && senderPeerId) {
          const conn = this.connections.get(senderPeerId);
          conn?.send(JSON.stringify({ type: 'PONG' }));
        }
        return;
      }

      if (parsed?.type === 'PONG') {
        this.updateStatus('connected');
        return;
      }

      if (parsed && parsed.type) {
        // Dispatch to local subscribers
        this.messageHandlers.forEach((handler) => {
          try {
            handler(parsed.type, parsed.payload);
          } catch {}
        });

        // If host, rebroadcast to all other connected clients
        if (this.isHost) {
          this.connections.forEach((conn, peerId) => {
            if (peerId !== senderPeerId && conn.open) {
              try {
                conn.send(str);
              } catch {}
            }
          });
        }
      }
    } catch {}
  }

  public broadcast(type: string, payload: unknown) {
    const message = JSON.stringify({ type, payload });

    if (this.isHost) {
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(message);
          } catch {}
        }
      });
    } else if (this.hostConnection && this.hostConnection.open) {
      try {
        this.hostConnection.send(message);
      } catch {}
    }
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => {
      this.messageHandlers.delete(handler);
    };
  }

  private cleanup() {
    try {
      if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.connections.forEach((conn) => conn.close());
      this.connections.clear();
      this.hostConnection?.close();
      this.hostConnection = null;
      this.peer?.destroy();
      this.peer = null;
      this.updateStatus('disconnected');
    } catch {}
  }
}

export const webrtcSync = new WebRTCSyncManager();
