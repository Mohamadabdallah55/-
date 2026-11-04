import { Peer, DataConnection } from 'peerjs';

type MessageHandler = (type: string, payload: unknown, cmdId?: string) => void;
type StatusHandler = (status: 'connected' | 'connecting' | 'disconnected', clientCount: number) => void;

// Fast, reliable STUN servers (no dead TURN servers that stall ICE gathering)
const PEER_ICE_CONFIG = {
  debug: 0,
  config: {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:stun.cloudflare.com:3478' },
    ],
  },
};

const HOST_SLOTS = ['', '-b', '-c'];

export function normalizeFourDigitCode(raw?: string | null): string {
  if (!raw) return '';
  const digits = raw.replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  return '';
}

export function generateFourDigitCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

class WebRTCSyncManager {
  // Host can hold up to 3 slot Peers for the same 4-digit room code so page reloads never get blocked by unavailable-id
  private hostPeers: Map<string, Peer> = new Map();
  private clientPeer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private clientSlotConnections: Map<string, DataConnection> = new Map();
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private roomCode: string = '';
  private isHost: boolean = true;
  private status: 'connected' | 'connecting' | 'disconnected' = 'connecting';
  private fullStateProvider: (() => Record<string, unknown>) | null = null;
  private reconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private lastPongAt: number = 0;
  private reconnectAttempts: number = 0;
  private hostOpenSlots: Set<string> = new Set();

  constructor() {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = normalizeFourDigitCode(params.get('room'));
    const isRemoteRoute =
      window.location.hash === '#remote' ||
      window.location.pathname.startsWith('/remote') ||
      params.get('mode') === 'remote' ||
      params.get('remote') === 'true' ||
      params.get('tab') === 'remote';

    if (isRemoteRoute || roomFromUrl) {
      const saved =
        normalizeFourDigitCode(localStorage.getItem('tahadi5_active_room')) ||
        normalizeFourDigitCode(localStorage.getItem('tahadi5_host_room'));
      this.roomCode = roomFromUrl || saved || '1234';
      this.saveRoomToStorage(this.roomCode);
      this.isHost = !isRemoteRoute && !roomFromUrl ? true : false;
      // Wait: if URL has ?room=XXXX but not #remote, check if mode=remote
      if (isRemoteRoute || params.has('room')) {
        this.isHost = false;
      }
    } else {
      let hostCode =
        normalizeFourDigitCode(localStorage.getItem('tahadi5_host_room')) ||
        normalizeFourDigitCode(localStorage.getItem('tahadi5_active_room'));
      if (!hostCode) {
        hostCode = generateFourDigitCode();
      }
      this.roomCode = hostCode;
      this.saveRoomToStorage(this.roomCode);
      this.isHost = true;
    }

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    this.initPeer();
    this.startHeartbeat();
  }

  private saveRoomToStorage(code: string) {
    try {
      localStorage.setItem('tahadi5_host_room', code);
      localStorage.setItem('tahadi5_active_room', code);
    } catch {}
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

  public isHostCloudReady(): boolean {
    return this.hostOpenSlots.size > 0;
  }

  public getStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.status;
  }

  public getClientCount(): number {
    if (this.isHost) {
      let openCount = 0;
      this.connections.forEach((conn) => {
        if (conn.open) openCount += 1;
      });
      return openCount;
    }
    return this.hasOpenClientConnection() ? 1 : 0;
  }

  private hasOpenClientConnection(): boolean {
    for (const conn of this.clientSlotConnections.values()) {
      if (conn && conn.open) return true;
    }
    return false;
  }

  /**
   * Explicitly switches role between 'host' (Computer screen) and 'remote' (Phone controller).
   * Guarantees that even if the user opens the main site on their phone and taps "Remote", it switches to client mode.
   */
  public setRole(role: 'host' | 'remote', optionalRoomCode?: string) {
    const wantHost = role === 'host';
    const normalizedNewRoom = normalizeFourDigitCode(optionalRoomCode);
    const roomChanged = Boolean(normalizedNewRoom && normalizedNewRoom !== this.roomCode);

    if (this.isHost === wantHost && !roomChanged) {
      return;
    }

    this.isHost = wantHost;
    if (normalizedNewRoom) {
      this.roomCode = normalizedNewRoom;
      this.saveRoomToStorage(this.roomCode);
    }
    this.reconnectNow();
  }

  public setRoomCode(newRoomCode: string) {
    const cleaned = normalizeFourDigitCode(newRoomCode);
    if (!cleaned) return;
    const changed = cleaned !== this.roomCode;
    this.roomCode = cleaned;
    this.saveRoomToStorage(this.roomCode);

    // Update URL query param ?room=XXXX without reloading so refreshes keep the code
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('room') !== this.roomCode && !this.isHost) {
          url.searchParams.set('room', this.roomCode);
          window.history.replaceState(null, '', url.toString());
        }
      } catch {}
    }

    if (changed || this.status !== 'connected') {
      this.reconnectNow();
    }
  }

  public generateNewRoomCode(): string {
    const nextCode = generateFourDigitCode();
    this.setRoomCode(nextCode);
    return nextCode;
  }

  public reconnectNow() {
    this.reconnectAttempts = 0;
    this.cleanup();
    this.initPeer();
    this.startHeartbeat();
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    handler(this.status, this.getClientCount());
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  private updateStatus(newStatus: 'connected' | 'connecting' | 'disconnected') {
    this.status = newStatus;
    const count = this.getClientCount();
    this.statusHandlers.forEach((handler) => {
      try {
        handler(newStatus, count);
      } catch {}
    });
  }

  private getPeerIdForSlot(slotSuffix: string): string {
    return `elite-clash-room-${this.roomCode}${slotSuffix}`;
  }

  private initPeer() {
    if (typeof window === 'undefined') return;
    try {
      this.updateStatus('connecting');

      if (this.isHost) {
        // Register Host on primary slot immediately, and backup slot -b so reloads are never blocked by unavailable-id
        this.initHostSlot('');
        this.initHostSlot('-b');
      } else {
        // Remote Controller (Phone)
        this.clientPeer = new Peer(PEER_ICE_CONFIG);

        this.clientPeer.on('open', () => {
          this.reconnectAttempts = 0;
          this.connectToHostSlots();
        });

        this.clientPeer.on('error', () => {
          if (!this.hasOpenClientConnection()) {
            this.updateStatus('disconnected');
            this.scheduleReconnect(true);
          }
        });

        this.clientPeer.on('disconnected', () => {
          if (!this.hasOpenClientConnection()) {
            this.updateStatus('disconnected');
            try {
              if (this.clientPeer && !this.clientPeer.destroyed) {
                this.clientPeer.reconnect();
              }
            } catch {}
            this.scheduleReconnect(false);
          }
        });
      }
    } catch (e) {
      console.warn('WebRTC peer init error:', e);
      this.updateStatus('disconnected');
    }
  }

  private initHostSlot(slotSuffix: string) {
    if (!this.isHost) return;
    const peerId = this.getPeerIdForSlot(slotSuffix);
    if (this.hostPeers.has(slotSuffix)) {
      const existing = this.hostPeers.get(slotSuffix);
      if (existing && !existing.destroyed) return;
    }

    try {
      const p = new Peer(peerId, PEER_ICE_CONFIG);
      this.hostPeers.set(slotSuffix, p);

      p.on('open', () => {
        this.hostOpenSlots.add(slotSuffix);
        this.updateStatus(this.getClientCount() > 0 ? 'connected' : 'connecting');
      });

      p.on('connection', (conn) => {
        this.setupHostConnection(conn);
      });

      p.on('error', (err) => {
        this.hostOpenSlots.delete(slotSuffix);
        try {
          p.destroy();
        } catch {}
        this.hostPeers.delete(slotSuffix);

        if (err.type === 'unavailable-id') {
          // If primary and -b are occupied by a recent page refresh, also open -c immediately
          if (slotSuffix === '' || slotSuffix === '-b') {
            this.initHostSlot('-c');
          }
          // Retry claiming this slot after 3.5s
          window.setTimeout(() => {
            if (this.isHost && !this.hostPeers.has(slotSuffix)) {
              this.initHostSlot(slotSuffix);
            }
          }, 3500);
        } else {
          window.setTimeout(() => {
            if (this.isHost && !this.hostPeers.has(slotSuffix)) {
              this.initHostSlot(slotSuffix);
            }
          }, 2500);
        }
      });

      p.on('disconnected', () => {
        this.hostOpenSlots.delete(slotSuffix);
        try {
          if (!p.destroyed) {
            p.reconnect();
          }
        } catch {}
      });
    } catch {}
  }

  private setupHostConnection(conn: DataConnection) {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn);
      this.updateStatus('connected');

      // Immediately push full state to newly connected phone over DataChannel
      this.sendFullStateToConnection(conn);
    });

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updateStatus(this.getClientCount() > 0 ? 'connected' : 'connecting');
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.updateStatus(this.getClientCount() > 0 ? 'connected' : 'connecting');
    });
  }

  private sendFullStateToConnection(conn: DataConnection) {
    if (!this.fullStateProvider || !conn.open) return;
    try {
      const state = this.fullStateProvider();
      conn.send(
        JSON.stringify({
          type: 'FULL_STATE_SYNC',
          payload: state,
        })
      );
      conn.send(
        JSON.stringify({
          type: 'state',
          payload: state,
        })
      );
    } catch {}
  }

  private connectToHostSlots() {
    if (!this.clientPeer || this.clientPeer.destroyed || this.isHost) return;

    if (!this.hasOpenClientConnection()) {
      this.updateStatus('connecting');
    }

    HOST_SLOTS.forEach((slotSuffix) => {
      const existing = this.clientSlotConnections.get(slotSuffix);
      if (existing && existing.open) return;
      try {
        existing?.close();
      } catch {}

      const targetPeerId = this.getPeerIdForSlot(slotSuffix);
      try {
        const conn = this.clientPeer!.connect(targetPeerId, {
          reliable: true,
          serialization: 'json',
        });

        this.clientSlotConnections.set(slotSuffix, conn);

        conn.on('open', () => {
          this.lastPongAt = Date.now();
          this.reconnectAttempts = 0;
          this.updateStatus('connected');
          // Request full state immediately upon DataChannel open
          try {
            conn.send(JSON.stringify({ type: 'REQUEST_FULL_SYNC', payload: { timestamp: Date.now() } }));
          } catch {}
        });

        conn.on('data', (data) => {
          this.lastPongAt = Date.now();
          if (this.status !== 'connected') {
            this.updateStatus('connected');
          }
          this.handleIncomingData(data);
        });

        conn.on('close', () => {
          this.clientSlotConnections.delete(slotSuffix);
          if (!this.hasOpenClientConnection()) {
            this.updateStatus('disconnected');
            this.scheduleReconnect(false);
          }
        });

        conn.on('error', () => {
          this.clientSlotConnections.delete(slotSuffix);
          if (!this.hasOpenClientConnection()) {
            this.scheduleReconnect(false);
          }
        });
      } catch {}
    });
  }

  private scheduleReconnect(recreatePeer = false) {
    if (this.reconnectTimer || this.isHost) return;
    const delay = Math.min(2500, 900 + (this.reconnectAttempts % 3) * 500);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts += 1;
      if (!this.isHost && !this.hasOpenClientConnection()) {
        if (
          recreatePeer ||
          !this.clientPeer ||
          this.clientPeer.destroyed ||
          this.clientPeer.disconnected ||
          this.reconnectAttempts % 4 === 0
        ) {
          this.restartClientPeer();
        } else {
          this.connectToHostSlots();
        }
      }
    }, delay);
  }

  private restartClientPeer() {
    try {
      this.clientSlotConnections.forEach((c) => c.close());
      this.clientSlotConnections.clear();
      this.clientPeer?.destroy();
    } catch {}
    this.clientPeer = null;
    window.setTimeout(() => this.initPeer(), 150);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isHost) {
        // Ensure at least one Host slot is open on PeerJS cloud
        if (this.hostOpenSlots.size === 0) {
          this.initHostSlot('');
          this.initHostSlot('-b');
        }
        // Periodically push live state snapshot to all connected phones over DataChannel
        if (this.getClientCount() > 0 && this.fullStateProvider) {
          const state = this.fullStateProvider();
          const msg = JSON.stringify({ type: 'FULL_STATE_SYNC', payload: state });
          this.connections.forEach((conn) => {
            if (conn.open) {
              try {
                conn.send(msg);
              } catch {}
            }
          });
        }
      } else {
        // Remote Phone heartbeat
        if (this.hasOpenClientConnection()) {
          this.clientSlotConnections.forEach((conn) => {
            if (conn.open) {
              try {
                conn.send(JSON.stringify({ type: 'PING' }));
              } catch {}
            }
          });
          if (this.lastPongAt > 0 && Date.now() - this.lastPongAt > 10000) {
            this.updateStatus('disconnected');
            this.scheduleReconnect(true);
          }
        } else {
          this.connectToHostSlots();
        }
      }
    }, 2000);
  }

  private handleIncomingData(data: unknown, senderPeerId?: string) {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : (data as Record<string, any>);
      if (!parsed || typeof parsed !== 'object') return;

      if (parsed.type === 'PING') {
        if (this.isHost && senderPeerId) {
          const conn = this.connections.get(senderPeerId);
          conn?.send(JSON.stringify({ type: 'PONG' }));
        }
        return;
      }

      if (parsed.type === 'PONG') {
        this.lastPongAt = Date.now();
        this.updateStatus('connected');
        return;
      }

      if (parsed.type === 'REQUEST_FULL_SYNC' && this.isHost && senderPeerId) {
        const conn = this.connections.get(senderPeerId);
        if (conn) this.sendFullStateToConnection(conn);
        return;
      }

      // Unwrap 'remote_action' or 'state' envelopes if sent in that format
      if (parsed.type === 'remote_action' && parsed.action) {
        this.dispatchToHandlers(parsed.action, parsed.payload, parsed.cmdId);
        return;
      }

      if (parsed.type === 'state' && parsed.payload) {
        this.dispatchToHandlers('FULL_STATE_SYNC', parsed.payload, parsed.cmdId);
        return;
      }

      if (parsed.type) {
        this.dispatchToHandlers(parsed.type, parsed.payload, parsed.cmdId);

        // If host received an action from a phone, rebroadcast to any other connected screens/phones
        if (this.isHost) {
          const rawStr = typeof data === 'string' ? data : JSON.stringify(data);
          this.connections.forEach((conn, peerId) => {
            if (peerId !== senderPeerId && conn.open) {
              try {
                conn.send(rawStr);
              } catch {}
            }
          });
        }
      }
    } catch {}
  }

  private dispatchToHandlers(type: string, payload: unknown, cmdId?: string) {
    this.messageHandlers.forEach((handler) => {
      try {
        handler(type, payload, cmdId);
      } catch {}
    });
  }

  public broadcast(type: string, payload: unknown, cmdId?: string) {
    const packet = JSON.stringify({
      type,
      payload,
      cmdId,
    });
    const actionPacket = JSON.stringify({
      type: this.isHost ? 'state' : 'remote_action',
      action: type,
      payload: this.isHost && this.fullStateProvider ? this.fullStateProvider() : payload,
      cmdId,
    });

    if (this.isHost) {
      this.connections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(packet);
          } catch {}
        }
      });
    } else {
      // Send on first open slot connection (or all open slot connections, deduplicated by cmdId on Host)
      this.clientSlotConnections.forEach((conn) => {
        if (conn.open) {
          try {
            conn.send(packet);
            conn.send(actionPacket);
          } catch {}
        }
      });
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
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      this.connections.forEach((conn) => {
        try {
          conn.close();
        } catch {}
      });
      this.connections.clear();
      this.clientSlotConnections.forEach((conn) => {
        try {
          conn.close();
        } catch {}
      });
      this.clientSlotConnections.clear();
      this.hostPeers.forEach((p) => {
        try {
          p.destroy();
        } catch {}
      });
      this.hostPeers.clear();
      this.hostOpenSlots.clear();
      if (this.clientPeer) {
        try {
          this.clientPeer.destroy();
        } catch {}
        this.clientPeer = null;
      }
      this.updateStatus('disconnected');
    } catch {}
  }
}

export const webrtcSync = new WebRTCSyncManager();
