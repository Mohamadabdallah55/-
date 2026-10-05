import { Peer, DataConnection } from 'peerjs';

type MessageHandler = (type: string, payload: unknown) => void;

class WebRTCSyncManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private roomCode: string = '';
  private isHost: boolean = true;
  private isConnected: boolean = false;
  private fullStateProvider: (() => Record<string, unknown>) | null = null;

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
      // Remote opened without room in query: check storage or default room
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

  public getIsConnected(): boolean {
    return this.isConnected;
  }

  public setRoomCode(newRoomCode: string) {
    this.roomCode = newRoomCode.toUpperCase().trim();
    localStorage.setItem('tahadi5_host_room', this.roomCode);
    localStorage.setItem('tahadi5_active_room', this.roomCode);
    this.cleanup();
    this.initPeer();
  }

  private initPeer() {
    try {
      if (this.isHost) {
        // Host tries to register its clean roomCode directly
        const peerId = `tahadi5-${this.roomCode.toLowerCase()}`;
        this.peer = new Peer(peerId);

        this.peer.on('open', () => {
          this.isConnected = true;
        });

        this.peer.on('connection', (conn) => {
          this.setupHostConnection(conn);
        });

        this.peer.on('error', (err) => {
          // If ID is already taken or broker busy, fallback to random ID
          if (err.type === 'unavailable-id') {
            this.peer?.destroy();
            this.peer = new Peer();
            this.peer.on('open', (assignedId) => {
              this.isConnected = true;
              this.peer?.on('connection', (conn) => this.setupHostConnection(conn));
            });
          }
        });
      } else {
        // Client (Phone Remote)
        this.peer = new Peer();
        this.peer.on('open', () => {
          this.connectToHost();
        });

        this.peer.on('error', () => {
          setTimeout(() => this.connectToHost(), 3000);
        });
      }
    } catch (e) {
      console.warn('WebRTC initialization skipped:', e);
    }
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);

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
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
    });
  }

  private connectToHost() {
    if (!this.peer || this.peer.destroyed) return;

    try {
      const targetPeerId = `tahadi5-${this.roomCode.toLowerCase()}`;
      const conn = this.peer.connect(targetPeerId, { reliable: true });

      conn.on('open', () => {
        this.hostConnection = conn;
        this.isConnected = true;
      });

      conn.on('data', (data) => {
        this.handleIncomingData(data);
      });

      conn.on('close', () => {
        this.hostConnection = null;
        this.isConnected = false;
        setTimeout(() => this.connectToHost(), 3000);
      });

      conn.on('error', () => {
        this.hostConnection = null;
        this.isConnected = false;
        setTimeout(() => this.connectToHost(), 3000);
      });
    } catch {}
  }

  private handleIncomingData(data: unknown, senderPeerId?: string) {
    try {
      const str = typeof data === 'string' ? data : JSON.stringify(data);
      const parsed = JSON.parse(str);

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
      this.connections.forEach((conn) => conn.close());
      this.connections.clear();
      this.hostConnection?.close();
      this.hostConnection = null;
      this.peer?.destroy();
      this.peer = null;
      this.isConnected = false;
    } catch {}
  }
}

export const webrtcSync = new WebRTCSyncManager();
