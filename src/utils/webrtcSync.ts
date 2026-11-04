import { Peer, DataConnection } from 'peerjs';

type MessageHandler = (type: string, payload: unknown, cmdId?: string) => void;
type StatusHandler = (status: 'connected' | 'connecting' | 'disconnected', clientCount: number) => void;

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

// Compact state keys that always fit well under the 4KB inline limit of cloud pub/sub relays
const COMPACT_SYNC_KEYS = [
  'TEAMS_UPDATED',
  'LEAGUE_SETTINGS_UPDATED',
  'MATCH_UPDATED',
  'CARDS_UPDATED',
  'CATEGORIES_UPDATED',
  'ARENA_GAMES_UPDATED',
];

class WebRTCSyncManager {
  private instanceId: string = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  private hostPeers: Map<string, Peer> = new Map();
  private clientPeer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private hostConnection: DataConnection | null = null;
  private cloudWs: WebSocket | null = null;
  private cloudConnected: boolean = false;
  private cloudRemotePeers: Map<string, number> = new Map();
  private cloudHostSeenAt: number = 0;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private seenCmdIds: Set<string> = new Set();
  private roomCode: string = '';
  private isHost: boolean = true;
  private status: 'connected' | 'connecting' | 'disconnected' = 'connecting';
  private fullStateProvider: (() => Record<string, unknown>) | null = null;
  private reconnectTimer: number | null = null;
  private cloudReconnectTimer: number | null = null;
  private heartbeatTimer: number | null = null;
  private hostOpenCount: number = 0;

  constructor() {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = normalizeFourDigitCode(params.get('room'));
    const isRemote =
      window.location.hash === '#remote' ||
      window.location.pathname.startsWith('/remote') ||
      params.get('mode') === 'remote' ||
      params.get('remote') === 'true' ||
      params.get('tab') === 'remote';

    if (roomFromUrl) {
      this.roomCode = roomFromUrl;
      this.saveRoomToStorage(this.roomCode);
      this.isHost = false;
    } else if (isRemote) {
      const saved =
        normalizeFourDigitCode(localStorage.getItem('tahadi5_active_room')) ||
        normalizeFourDigitCode(localStorage.getItem('tahadi5_host_room'));
      this.roomCode = saved || '1234';
      this.saveRoomToStorage(this.roomCode);
      this.isHost = false;
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
    this.initCloudRelay();
    this.startHeartbeat();
  }

  private saveRoomToStorage(code: string) {
    try {
      localStorage.setItem('tahadi5_host_room', code);
      localStorage.setItem('tahadi5_active_room', code);
    } catch {}
  }

  private getCloudTopic(): string {
    return `elite-clash-v5-${this.roomCode}`;
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
    return this.hostOpenCount > 0 || this.cloudConnected;
  }

  public getStatus(): 'connected' | 'connecting' | 'disconnected' {
    return this.status;
  }

  public getClientCount(): number {
    if (this.isHost) {
      let rtcCount = 0;
      this.connections.forEach((c) => {
        if (c.open) rtcCount += 1;
      });
      // Prune stale cloud remote peers older than 45s
      const now = Date.now();
      this.cloudRemotePeers.forEach((ts, id) => {
        if (now - ts > 45000) this.cloudRemotePeers.delete(id);
      });
      return Math.max(rtcCount, this.cloudRemotePeers.size);
    }
    const rtcConnected = Boolean(this.hostConnection && this.hostConnection.open);
    const cloudVerified = this.cloudConnected && (this.cloudHostSeenAt > 0 || this.status === 'connected');
    return rtcConnected || cloudVerified ? 1 : 0;
  }

  public setRole(role: 'host' | 'remote', optionalRoomCode?: string) {
    const wantHost = role === 'host';
    const cleaned = normalizeFourDigitCode(optionalRoomCode);
    const roomChanged = Boolean(cleaned && cleaned !== this.roomCode);

    if (this.isHost === wantHost && !roomChanged) {
      return;
    }

    this.isHost = wantHost;
    if (cleaned) {
      this.roomCode = cleaned;
      this.saveRoomToStorage(this.roomCode);
    }
    this.reconnectNow();
  }

  public setRoomCode(newRoomCode: string) {
    const cleaned = normalizeFourDigitCode(newRoomCode);
    if (!cleaned) return;
    this.roomCode = cleaned;
    this.saveRoomToStorage(this.roomCode);

    if (typeof window !== 'undefined' && !this.isHost) {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('room', this.roomCode);
        window.history.replaceState(null, '', url.toString());
      } catch {}
    }

    this.reconnectNow();
  }

  public generateNewRoomCode(): string {
    const nextCode = generateFourDigitCode();
    this.setRoomCode(nextCode);
    return nextCode;
  }

  public reconnectNow() {
    this.cleanup();
    this.initPeer();
    this.initCloudRelay();
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

  // ============================================================================
  // CHANNEL A: Global HTTPS/WSS Cloud Relay (ntfy.sh) — Works across ALL 4G/5G NATs & isolated Previews
  // ============================================================================
  private initCloudRelay() {
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
    try {
      if (this.cloudWs) {
        try {
          this.cloudWs.close();
        } catch {}
        this.cloudWs = null;
      }

      const topic = this.getCloudTopic();
      const ws = new WebSocket(`wss://ntfy.sh/${topic}/ws`);
      this.cloudWs = ws;

      ws.onopen = () => {
        this.cloudConnected = true;
        if (this.isHost) {
          this.updateStatus('connected');
          // Announce Host presence and push compact initial state
          this.sendCloudSnapshot();
        } else {
          // Phone connected to cloud relay room: request state from Host in this room.
          // Status will turn 'connected' as soon as the Host replies (within ~200ms if room code matches)!
          this.postToCloudRelay({
            type: 'REQUEST_FULL_SYNC',
            payload: { timestamp: Date.now() },
            cmdId: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          });
          window.setTimeout(() => {
            if (!this.isHost && this.status !== 'connected' && this.cloudConnected) {
              this.postToCloudRelay({
                type: 'REQUEST_FULL_SYNC',
                payload: { timestamp: Date.now() },
                cmdId: `sync2-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              });
            }
          }, 1000);
        }
      };

      ws.onmessage = (event) => {
        try {
          const wrapper = JSON.parse(event.data);
          if (wrapper.event !== 'message' || typeof wrapper.message !== 'string') return;
          const parsed = JSON.parse(wrapper.message);
          if (!parsed || parsed.senderId === this.instanceId) return;

          if (this.isHost) {
            // Track active remote phone on this room
            if (parsed.senderRole === 'remote' && parsed.senderId) {
              this.cloudRemotePeers.set(parsed.senderId, Date.now());
              this.updateStatus('connected');
            }
          } else if (parsed.senderRole === 'host') {
            this.cloudHostSeenAt = Date.now();
            if (this.status !== 'connected') {
              this.updateStatus('connected');
            }
          }

          if (parsed.type === 'REQUEST_FULL_SYNC') {
            if (this.isHost) {
              this.sendCloudSnapshot();
            }
            return;
          }

          this.handleIncomingData(parsed);
        } catch {}
      };

      ws.onclose = () => {
        this.cloudConnected = false;
        if (!this.cloudReconnectTimer) {
          this.cloudReconnectTimer = window.setTimeout(() => {
            this.cloudReconnectTimer = null;
            this.initCloudRelay();
          }, 2000);
        }
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {}
      };
    } catch {}
  }

  private buildCompactState(): Record<string, unknown> {
    if (!this.fullStateProvider) return {};
    const full = this.fullStateProvider();
    const compact: Record<string, unknown> = {};
    COMPACT_SYNC_KEYS.forEach((k) => {
      if (full[k] !== undefined) {
        compact[k] = full[k];
      }
    });
    return compact;
  }

  private sendCloudSnapshot() {
    if (!this.isHost || !this.fullStateProvider) return;
    const compact = this.buildCompactState();
    this.postToCloudRelay({
      type: 'FULL_STATE_SYNC',
      payload: compact,
      cmdId: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    });
  }

  private postToCloudRelay(packet: { type: string; payload: unknown; cmdId?: string }) {
    if (typeof window === 'undefined') return;
    try {
      const bodyStr = JSON.stringify({
        ...packet,
        senderId: this.instanceId,
        senderRole: this.isHost ? 'host' : 'remote',
        roomCode: this.roomCode,
      });
      // Keep below 3800 bytes so ntfy.sh always delivers inline JSON message
      if (bodyStr.length > 3800) {
        if (packet.type === 'FULL_STATE_SYNC' || packet.type === 'BULK_STATE_SYNC') {
          const compact = this.buildCompactState();
          const compactStr = JSON.stringify({
            type: 'FULL_STATE_SYNC',
            payload: compact,
            cmdId: packet.cmdId,
            senderId: this.instanceId,
            senderRole: this.isHost ? 'host' : 'remote',
            roomCode: this.roomCode,
          });
          if (compactStr.length <= 3800) {
            fetch(`https://ntfy.sh/${this.getCloudTopic()}`, {
              method: 'POST',
              body: compactStr,
            }).catch(() => {});
          }
        }
        return;
      }

      fetch(`https://ntfy.sh/${this.getCloudTopic()}`, {
        method: 'POST',
        body: bodyStr,
      }).catch(() => {});
    } catch {}
  }

  // ============================================================================
  // CHANNEL B: PeerJS WebRTC P2P DataChannel (Direct Browser-to-Browser)
  // ============================================================================
  private initPeer() {
    if (typeof window === 'undefined') return;
    try {
      if (this.isHost) {
        this.hostOpenCount = 0;
        const primaryId = `elite-clash-room-${this.roomCode}`;
        const legacyId = `tahadi5-${this.roomCode.toLowerCase()}`;

        this.registerHostPeerId(primaryId);
        // Stagger legacy ID registration by 250ms
        window.setTimeout(() => {
          if (this.isHost) {
            this.registerHostPeerId(legacyId);
          }
        }, 250);
      } else {
        this.clientPeer = new Peer(PEER_ICE_CONFIG);

        this.clientPeer.on('open', () => {
          this.connectToHost();
        });

        this.clientPeer.on('error', (err) => {
          if (err.type === 'peer-unavailable') {
            if (!this.hostConnection || !this.hostConnection.open) {
              this.scheduleReconnect();
            }
            return;
          }
          if (!this.hostConnection || !this.hostConnection.open) {
            if (!this.cloudConnected) {
              this.updateStatus('disconnected');
            }
            this.scheduleReconnect();
          }
        });

        this.clientPeer.on('disconnected', () => {
          try {
            if (this.clientPeer && !this.clientPeer.destroyed) {
              this.clientPeer.reconnect();
            }
          } catch {}
          if (!this.hostConnection || !this.hostConnection.open) {
            this.scheduleReconnect();
          }
        });
      }
    } catch (e) {
      console.warn('WebRTC peer error:', e);
    }
  }

  private registerHostPeerId(peerId: string) {
    if (!this.isHost || this.hostPeers.has(peerId)) return;
    try {
      const p = new Peer(peerId, PEER_ICE_CONFIG);
      this.hostPeers.set(peerId, p);

      p.on('open', () => {
        this.hostOpenCount += 1;
        this.updateStatus('connected');
      });

      p.on('connection', (conn) => {
        this.setupHostConnection(conn);
      });

      p.on('error', (err) => {
        try {
          p.destroy();
        } catch {}
        this.hostPeers.delete(peerId);
        if (err.type === 'unavailable-id') {
          // Retry claiming the same Peer ID once previous reload socket expires on 0.peerjs.com
          window.setTimeout(() => {
            if (this.isHost && peerId.endsWith(this.roomCode)) {
              this.registerHostPeerId(peerId);
            }
          }, 3000);
        }
      });

      p.on('disconnected', () => {
        try {
          if (!p.destroyed) p.reconnect();
        } catch {}
      });
    } catch {}
  }

  private setupHostConnection(conn: DataConnection) {
    const onOpen = () => {
      this.connections.set(conn.peer, conn);
      this.updateStatus('connected');

      if (this.fullStateProvider) {
        try {
          const state = this.fullStateProvider();
          conn.send(JSON.stringify({ type: 'FULL_STATE_SYNC', payload: state }));
        } catch {}
      }
    };

    if (conn.open) {
      onOpen();
    } else {
      conn.on('open', onOpen);
    }

    conn.on('data', (data) => {
      this.handleIncomingData(data, conn.peer);
    });

    conn.on('close', () => {
      this.connections.delete(conn.peer);
      this.updateStatus('connected');
    });

    conn.on('error', () => {
      this.connections.delete(conn.peer);
      this.updateStatus('connected');
    });
  }

  private connectToHost() {
    if (!this.clientPeer || this.clientPeer.destroyed || this.isHost) return;
    if (this.hostConnection && this.hostConnection.open) return;

    try {
      const primaryId = `elite-clash-room-${this.roomCode}`;
      const legacyId = `tahadi5-${this.roomCode.toLowerCase()}`;

      this.tryConnectToPeerId(primaryId);

      window.setTimeout(() => {
        if (!this.isHost && (!this.hostConnection || !this.hostConnection.open)) {
          this.tryConnectToPeerId(legacyId);
        }
      }, 900);
    } catch {
      this.scheduleReconnect();
    }
  }

  private tryConnectToPeerId(targetPeerId: string) {
    if (!this.clientPeer || this.clientPeer.destroyed || this.isHost) return;
    if (this.hostConnection && this.hostConnection.open) return;

    try {
      const conn = this.clientPeer.connect(targetPeerId, { reliable: true });

      const onOpen = () => {
        if (this.hostConnection && this.hostConnection.open && this.hostConnection !== conn) {
          try {
            conn.close();
          } catch {}
          return;
        }
        this.hostConnection = conn;
        this.updateStatus('connected');
        try {
          conn.send(JSON.stringify({ type: 'REQUEST_FULL_SYNC', payload: { timestamp: Date.now() } }));
        } catch {}
      };

      if (conn.open) {
        onOpen();
      } else {
        conn.on('open', onOpen);
      }

      conn.on('data', (data) => {
        if (!this.hostConnection) {
          this.hostConnection = conn;
        }
        if (this.status !== 'connected') {
          this.updateStatus('connected');
        }
        this.handleIncomingData(data);
      });

      conn.on('close', () => {
        if (this.hostConnection === conn) {
          this.hostConnection = null;
          if (!this.cloudConnected) {
            this.updateStatus('disconnected');
          }
          this.scheduleReconnect();
        }
      });

      conn.on('error', () => {
        if (this.hostConnection === conn) {
          this.hostConnection = null;
          this.scheduleReconnect();
        }
      });
    } catch {}
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.isHost) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isHost && (!this.hostConnection || !this.hostConnection.open)) {
        if (!this.clientPeer || this.clientPeer.destroyed) {
          this.initPeer();
        } else if (this.clientPeer.disconnected) {
          try {
            this.clientPeer.reconnect();
          } catch {
            this.initPeer();
          }
        } else {
          this.connectToHost();
        }
      }
    }, 2000);
  }

  private startHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = window.setInterval(() => {
      if (!this.isHost) {
        if (this.hostConnection && this.hostConnection.open) {
          try {
            this.hostConnection.send(JSON.stringify({ type: 'PING' }));
          } catch {}
        } else {
          this.connectToHost();
        }
      } else if (this.isHost && this.connections.size > 0 && this.fullStateProvider) {
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
    }, 3500);
  }

  private markCmdSeen(cmdId?: string): boolean {
    if (!cmdId) return true;
    if (this.seenCmdIds.has(cmdId)) return false;
    this.seenCmdIds.add(cmdId);
    if (this.seenCmdIds.size > 400) {
      const first = this.seenCmdIds.values().next().value;
      if (first) this.seenCmdIds.delete(first);
    }
    return true;
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
        this.updateStatus('connected');
        return;
      }

      if (parsed.type === 'REQUEST_FULL_SYNC' && this.isHost) {
        if (senderPeerId) {
          const conn = this.connections.get(senderPeerId);
          if (conn && conn.open && this.fullStateProvider) {
            conn.send(JSON.stringify({ type: 'FULL_STATE_SYNC', payload: this.fullStateProvider() }));
          }
        }
        this.sendCloudSnapshot();
        return;
      }

      if (parsed.cmdId && !this.markCmdSeen(parsed.cmdId)) {
        return;
      }

      if (parsed.type === 'remote_action' && parsed.action) {
        this.messageHandlers.forEach((handler) => {
          try {
            handler(parsed.action, parsed.payload, parsed.cmdId);
          } catch {}
        });
        return;
      }

      if (parsed.type === 'state' && parsed.payload) {
        this.messageHandlers.forEach((handler) => {
          try {
            handler('FULL_STATE_SYNC', parsed.payload, parsed.cmdId);
          } catch {}
        });
        return;
      }

      if (parsed.type) {
        this.messageHandlers.forEach((handler) => {
          try {
            handler(parsed.type, parsed.payload, parsed.cmdId);
          } catch {}
        });

        if (this.isHost && senderPeerId) {
          const str = typeof data === 'string' ? data : JSON.stringify(data);
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

  public broadcast(type: string, payload: unknown, cmdId?: string) {
    const effectiveCmdId = cmdId || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    this.markCmdSeen(effectiveCmdId);

    const message = JSON.stringify({ type, payload, cmdId: effectiveCmdId });

    // 1. Send over PeerJS WebRTC DataChannel
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

    // 2. Send over Global HTTPS/WSS Cloud Relay (ntfy.sh) so it arrives even if WebRTC UDP is blocked
    this.postToCloudRelay({
      type,
      payload,
      cmdId: effectiveCmdId,
    });
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
      if (this.cloudReconnectTimer) {
        clearTimeout(this.cloudReconnectTimer);
        this.cloudReconnectTimer = null;
      }
      if (this.heartbeatTimer) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = null;
      }
      if (this.cloudWs) {
        try {
          this.cloudWs.close();
        } catch {}
        this.cloudWs = null;
      }
      this.cloudConnected = false;
      this.connections.forEach((conn) => {
        try {
          conn.close();
        } catch {}
      });
      this.connections.clear();
      if (this.hostConnection) {
        try {
          this.hostConnection.close();
        } catch {}
        this.hostConnection = null;
      }
      this.hostPeers.forEach((p) => {
        try {
          p.destroy();
        } catch {}
      });
      this.hostPeers.clear();
      this.hostOpenCount = 0;
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
