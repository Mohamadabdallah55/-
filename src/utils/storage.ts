import {
  CurrentMatch,
  MatchRecord,
  Team,
  LeagueRow,
  CategoryKey,
  CardState,
  GameItem,
  DualTimerSyncState,
  LeagueSettings,
} from '../types';
import { INITIAL_TEAMS, DEFAULT_GAMES } from '../data/defaultGames';
import { webrtcSync } from './webrtcSync';

const STORAGE_KEYS = {
  TEAMS: 'tahadi5_teams_v1',
  GAMES: 'tahadi5_games_v1',
  CURRENT_MATCH: 'tahadi5_current_match_v1',
  MATCHES_HISTORY: 'tahadi5_matches_history_v1',
  SELECTED_CATEGORIES: 'tahadi5_selected_categories_v1',
  CARD_STATES: 'tahadi5_card_states_v1',
  TIMER_SYNC: 'tahadi5_timer_sync_v1',
  ARENA_COLUMN_GAMES: 'tahadi5_arena_column_games_v1',
  LEAGUE_SETTINGS: 'tahadi5_league_settings_v1',
};

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = { currentWeek: 2, pointsByWeek: { 1: 3, 2: 4, 3: 5 } };
export const WEEK_ONE_RESULTS: MatchRecord[] = [
  { id: 'week-1-team-d', date: 'الأسبوع الأول', timestamp: 1, teamAId: 'team-4', teamBId: 'team-1', teamAName: 'الفريق D', teamBName: 'الفريق A', teamAScore: 1, teamBScore: 0, winnerId: 'team-4', loserId: 'team-1', weekNumber: 1, pointsAwarded: 3 },
  { id: 'week-1-team-c', date: 'الأسبوع الأول', timestamp: 2, teamAId: 'team-3', teamBId: 'team-6', teamAName: 'الفريق C', teamBName: 'الفريق F', teamAScore: 1, teamBScore: 0, winnerId: 'team-3', loserId: 'team-6', weekNumber: 1, pointsAwarded: 3 },
  { id: 'week-1-team-e', date: 'الأسبوع الأول', timestamp: 3, teamAId: 'team-5', teamBId: 'team-2', teamAName: 'الفريق E', teamBName: 'الفريق B', teamAScore: 1, teamBScore: 0, winnerId: 'team-5', loserId: 'team-2', weekNumber: 1, pointsAwarded: 3 },
];

// Cross-tab broadcast channel & WebSocket real-time network sync
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('tahadi_5_channel');
  } catch {
    broadcastChannel = null;
  }
}

// Active subscribers registry
const subscribers = new Set<(type: string, payload: unknown) => void>();

// Real-Time WebSocket client for remote mobile controller
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connectWebSocket() {
  if (typeof window === 'undefined' || typeof WebSocket === 'undefined') return;
  try {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'FULL_STATE_SYNC' && data.payload) {
          Object.entries(data.payload).forEach(([type, payload]) => {
            syncIncomingUpdate(type, payload);
          });
        } else if (data.type) {
          syncIncomingUpdate(data.type, data.payload);
        }
      } catch (err) {
        console.error('Error parsing remote message:', err);
      }
    };

    socket.onclose = () => {
      socket = null;
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          reconnectTimer = null;
          connectWebSocket();
        }, 3000);
      }
    };

    socket.onerror = () => {
      socket?.close();
    };
  } catch {
    // Ignore in unsupported environments
  }
}

// Initialize socket immediately on client
if (typeof window !== 'undefined') {
  connectWebSocket();

  // Also fetch initial cached state from server on startup
  fetch('/api/state')
    .then((r) => r.json())
    .then((cachedState) => {
      if (cachedState && typeof cachedState === 'object') {
        Object.entries(cachedState).forEach(([type, payload]) => {
          syncIncomingUpdate(type, payload);
        });
      }
    })
    .catch(() => {});

  // Fallback periodic poll if WebSocket is disconnected or blocked by CDN/proxy
  setInterval(() => {
    if (!socket || socket.readyState !== 1) { // 1 = WebSocket.OPEN
      fetch('/api/state')
        .then((r) => r.json())
        .then((cachedState) => {
          if (cachedState && typeof cachedState === 'object') {
            Object.entries(cachedState).forEach(([type, payload]) => {
              syncIncomingUpdate(type, payload);
            });
          }
        })
        .catch(() => {});
    }
  }, 1500);
}

// Throttled local storage writer with in-memory batching to eliminate synchronous frame drops
const pendingWrites = new Map<string, string>();
let writeBatchScheduled = false;

function batchSetLocalStorage(key: string, value: string) {
  pendingWrites.set(key, value);
  if (!writeBatchScheduled && typeof window !== 'undefined') {
    writeBatchScheduled = true;
    requestAnimationFrame(() => {
      try {
        pendingWrites.forEach((v, k) => {
          localStorage.setItem(k, v);
        });
        pendingWrites.clear();
      } catch {}
      writeBatchScheduled = false;
    });
  }
}

function syncIncomingUpdate(type: string, payload: unknown) {
  // Sync to local storage with throttled batching
  try {
    if (type === 'TEAMS_UPDATED') batchSetLocalStorage(STORAGE_KEYS.TEAMS, JSON.stringify(payload));
    if (type === 'MATCH_UPDATED') batchSetLocalStorage(STORAGE_KEYS.CURRENT_MATCH, JSON.stringify(payload));
    if (type === 'HISTORY_UPDATED') batchSetLocalStorage(STORAGE_KEYS.MATCHES_HISTORY, JSON.stringify(payload));
    if (type === 'CATEGORIES_UPDATED') batchSetLocalStorage(STORAGE_KEYS.SELECTED_CATEGORIES, JSON.stringify(payload));
    if (type === 'CARDS_UPDATED') batchSetLocalStorage(STORAGE_KEYS.CARD_STATES, JSON.stringify(payload));
    if (type === 'GAMES_UPDATED') batchSetLocalStorage(STORAGE_KEYS.GAMES, JSON.stringify(payload));
    if (type === 'ARENA_GAMES_UPDATED') batchSetLocalStorage(STORAGE_KEYS.ARENA_COLUMN_GAMES, JSON.stringify(payload));
    if (type === 'LEAGUE_SETTINGS_UPDATED') batchSetLocalStorage(STORAGE_KEYS.LEAGUE_SETTINGS, JSON.stringify(payload));
  } catch {}

  // Notify registered React hooks
  subscribers.forEach((handler) => {
    try {
      handler(type, payload);
    } catch {}
  });
}

// Initialize WebRTC listener & provider for serverless peer sync (GitHub Pages & custom domains)
if (typeof window !== 'undefined') {
  webrtcSync.onMessage((type, payload) => {
    syncIncomingUpdate(type, payload);
  });

  webrtcSync.setFullStateProvider(() => {
    const fullState: Record<string, unknown> = {};
    try {
      const teams = localStorage.getItem(STORAGE_KEYS.TEAMS);
      if (teams) fullState['TEAMS_UPDATED'] = JSON.parse(teams);
      const settings = localStorage.getItem(STORAGE_KEYS.LEAGUE_SETTINGS);
      if (settings) fullState['LEAGUE_SETTINGS_UPDATED'] = JSON.parse(settings);
      const match = localStorage.getItem(STORAGE_KEYS.CURRENT_MATCH);
      if (match) fullState['MATCH_UPDATED'] = JSON.parse(match);
      const history = localStorage.getItem(STORAGE_KEYS.MATCHES_HISTORY);
      if (history) fullState['HISTORY_UPDATED'] = JSON.parse(history);
      const cards = localStorage.getItem(STORAGE_KEYS.CARD_STATES);
      if (cards) fullState['CARDS_UPDATED'] = JSON.parse(cards);
      const games = localStorage.getItem(STORAGE_KEYS.GAMES);
      if (games) fullState['GAMES_UPDATED'] = JSON.parse(games);
      const categories = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORIES);
      if (categories) fullState['CATEGORIES_UPDATED'] = JSON.parse(categories);
      const arena = localStorage.getItem(STORAGE_KEYS.ARENA_COLUMN_GAMES);
      if (arena) fullState['ARENA_GAMES_UPDATED'] = JSON.parse(arena);
    } catch {}
    return fullState;
  });
}

// Broadcast to local tabs, server WebSocket, server REST, and serverless WebRTC (PeerJS)
export function broadcastMessage(type: string, payload: unknown) {
  // 1. WebRTC DataChannel (direct peer-to-peer between phone & laptop, 100% serverless)
  try {
    webrtcSync.broadcast(type, payload);
  } catch {}

  // 2. BroadcastChannel (same browser tabs)
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    } catch {}
  }

  // 3. WebSocket (remote mobile phone / other devices if Node.js server available)
  if (socket && socket.readyState === WebSocket.OPEN) {
    try {
      socket.send(JSON.stringify({ type, payload }));
    } catch {}
  } else {
    // 4. Fallback POST to server if socket is reconnecting
    try {
      fetch('/api/state', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
      }).catch(() => {});
    } catch {}
  }
}

export function subscribeToBroadcast(handler: (type: string, payload: unknown) => void): () => void {
  subscribers.add(handler);

  // BroadcastChannel listener
  const bcListener = (event: MessageEvent) => {
    if (event.data && event.data.type) {
      handler(event.data.type, event.data.payload);
    }
  };
  broadcastChannel?.addEventListener('message', bcListener);

  return () => {
    subscribers.delete(handler);
    broadcastChannel?.removeEventListener('message', bcListener);
  };
}

// Teams
export function loadTeams(): Team[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEAMS);
    if (raw) {
      const saved: Team[] = JSON.parse(raw);
      const migrated = saved.map((team, index) => {
        const standard = INITIAL_TEAMS.find((item) => item.id === team.id) || INITIAL_TEAMS[index];
        return standard && !team.captain ? { ...team, name: standard.name, shortName: standard.shortName, captain: standard.captain } : team;
      });
      if (migrated.some((team, index) => team !== saved[index])) localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(migrated));
      return migrated;
    }
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(INITIAL_TEAMS));
  } catch {}
  return INITIAL_TEAMS;
}

export function saveTeams(teams: Team[]) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    broadcastMessage('TEAMS_UPDATED', teams);
  } catch {}
}

export function loadLeagueSettings(): LeagueSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAGUE_SETTINGS);
    if (raw) {
      const saved = JSON.parse(raw) as Partial<LeagueSettings>;
      return { currentWeek: Math.max(1, Number(saved.currentWeek) || 2), pointsByWeek: { ...DEFAULT_LEAGUE_SETTINGS.pointsByWeek, ...(saved.pointsByWeek || {}) } };
    }
    localStorage.setItem(STORAGE_KEYS.LEAGUE_SETTINGS, JSON.stringify(DEFAULT_LEAGUE_SETTINGS));
  } catch {}
  return DEFAULT_LEAGUE_SETTINGS;
}

export function saveLeagueSettings(settings: LeagueSettings) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.LEAGUE_SETTINGS, JSON.stringify(settings));
    broadcastMessage('LEAGUE_SETTINGS_UPDATED', settings);
  } catch {}
}

// Games library
export function loadGames(): GameItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GAMES);
    if (raw) {
      const parsed: GameItem[] = JSON.parse(raw);
      // The event list is authoritative. Keep edited rules/descriptions for approved
      // games, add newly approved games, and drop retired games left in localStorage.
      const approved = DEFAULT_GAMES.map((defaultGame) => {
        const saved = parsed.find((game) => game.id === defaultGame.id);
        return saved ? { ...defaultGame, ...saved, id: defaultGame.id } : defaultGame;
      });
      localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(approved));
      return approved;
    }
  } catch {}
  try {
    localStorage.setItem(STORAGE_KEYS.GAMES, JSON.stringify(DEFAULT_GAMES));
  } catch {}
  return DEFAULT_GAMES;
}

export function saveGames(games: GameItem[]) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.GAMES, JSON.stringify(games));
    broadcastMessage('GAMES_UPDATED', games);
  } catch {}
}

// Selected categories for match (5 categories)
export function loadSelectedCategories(): CategoryKey[] {
  const allCategories: CategoryKey[] = ['digital', 'mental', 'physical', '1v1', 'fan_vote'];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORIES);
    if (raw) {
      const parsed: CategoryKey[] = JSON.parse(raw);
      // Migrate legacy 'captains' to '1v1'
      const migrated = parsed.map((c) => (c === 'captains' ? '1v1' : c));
      const filtered = migrated.filter((c) => allCategories.includes(c as CategoryKey));
      const unique = Array.from(new Set(filtered)) as CategoryKey[];
      if (unique.length >= 3) return unique;
    }
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORIES, JSON.stringify(allCategories));
    return allCategories;
  } catch {}
  return allCategories;
}

export function saveSelectedCategories(categories: CategoryKey[]) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.SELECTED_CATEGORIES, JSON.stringify(categories));
    broadcastMessage('CATEGORIES_UPDATED', categories);
  } catch {}
}

// Current Match
export function loadCurrentMatch(teams: Team[]): CurrentMatch {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_MATCH);
    if (raw) return JSON.parse(raw);
    const initial: CurrentMatch = {
      teamAId: teams[0]?.id || 'team-1',
      teamBId: teams[1]?.id || 'team-2',
      teamAScore: 0,
      teamBScore: 0,
      activeGameId: null,
      currentRound: 1,
      rounds: [],
    };
    localStorage.setItem(STORAGE_KEYS.CURRENT_MATCH, JSON.stringify(initial));
    return initial;
  } catch {}
  return {
    teamAId: teams[0]?.id || 'team-1',
    teamBId: teams[1]?.id || 'team-2',
    teamAScore: 0,
    teamBScore: 0,
    activeGameId: null,
    currentRound: 1,
    rounds: [],
  };
}

export function saveCurrentMatch(match: CurrentMatch) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.CURRENT_MATCH, JSON.stringify(match));
    broadcastMessage('MATCH_UPDATED', match);
  } catch {}
}

// Matches History
export function loadMatchesHistory(): MatchRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MATCHES_HISTORY);
    if (raw) {
      const saved: MatchRecord[] = JSON.parse(raw);
      // An explicitly cleared history is intentional; never restore defaults over it.
      if (Array.isArray(saved)) return saved;
    }
    localStorage.setItem(STORAGE_KEYS.MATCHES_HISTORY, JSON.stringify(WEEK_ONE_RESULTS));
    return WEEK_ONE_RESULTS;
  } catch {}
  return [];
}

export function saveMatchesHistory(matches: MatchRecord[]) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.MATCHES_HISTORY, JSON.stringify(matches));
    broadcastMessage('HISTORY_UPDATED', matches);
  } catch {}
}

// Card ban/pick states
export function loadCardStates(): Record<string, CardState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARD_STATES);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

export function saveCardStates(states: Record<string, CardState>) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.CARD_STATES, JSON.stringify(states));
    broadcastMessage('CARDS_UPDATED', states);
  } catch {}
}

// Timer Sync
export function saveTimerSync(state: DualTimerSyncState) {
  try {
    batchSetLocalStorage(STORAGE_KEYS.TIMER_SYNC, JSON.stringify(state));
    broadcastMessage('TIMER_SYNC', state);
  } catch {}
}

export function loadTimerSync(): DualTimerSyncState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TIMER_SYNC);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

// Compute League Standings based on completed match history
export function computeStandings(teams: Team[], matches: MatchRecord[]): LeagueRow[] {
  const map: Record<string, LeagueRow> = {};

  teams.forEach((t) => {
    map[t.id] = {
      teamId: t.id,
      team: t,
      played: 0,
      won: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      form: [],
    };
  });

  const winOrder = new Map<string, number>();
  // Sort matches chronologically to track form
  const sortedMatches = [...matches].sort((a, b) => a.timestamp - b.timestamp);

  sortedMatches.forEach((m) => {
    const rowA = map[m.teamAId];
    const rowB = map[m.teamBId];

    if (rowA && rowB) {
      rowA.played += 1;
      rowB.played += 1;

      rowA.gf += m.teamAScore;
      rowA.ga += m.teamBScore;
      rowB.gf += m.teamBScore;
      rowB.ga += m.teamAScore;

      if (m.teamAScore > m.teamBScore) {
        rowA.won += 1;
        rowA.points += m.pointsAwarded ?? 3;
        if (!winOrder.has(rowA.teamId)) winOrder.set(rowA.teamId, winOrder.size);
        rowA.form.push('W');

        rowB.lost += 1;
        rowB.form.push('L');
      } else if (m.teamBScore > m.teamAScore) {
        rowB.won += 1;
        rowB.points += m.pointsAwarded ?? 3;
        if (!winOrder.has(rowB.teamId)) winOrder.set(rowB.teamId, winOrder.size);
        rowB.form.push('W');

        rowA.lost += 1;
        rowA.form.push('L');
      }
    }
  });

  // Calculate goal/round differences
  Object.values(map).forEach((r) => {
    r.gd = r.gf - r.ga;
    // Keep last 5 matches for form
    r.form = r.form.slice(-5);
  });

  // Sort by Points DESC -> GD DESC -> GF DESC -> Won DESC
  return Object.values(map).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;
    if (b.won !== a.won) return b.won - a.won;
    return (winOrder.get(a.teamId) ?? Number.MAX_SAFE_INTEGER) - (winOrder.get(b.teamId) ?? Number.MAX_SAFE_INTEGER);
  });
}

export const DEFAULT_ARENA_COLUMN_GAMES: Record<string, string[]> = {
  digital: ['g-fc27', 'g-rocket-league', 'g-clash-royale'],
  mental: ['g-shans', 'g-photo-match', 'g-letters-game'],
  physical: ['g-penalty-shoot', 'g-football-2v2', 'g-bottle-flip-xo'],
  '1v1': ['g-fatal-fury', 'g-throw-challenge', 'g-fc27-1v1'],
  captains: ['g-fatal-fury', 'g-throw-challenge', 'g-fc27-1v1'],
  fan_vote: ['g-box-of-liars', 'g-stop-timer', 'g-family-feud'],
};

export function loadArenaColumnGames(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARENA_COLUMN_GAMES);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const categories = ['digital', 'mental', 'physical', '1v1', 'fan_vote'];
      const normalized: Record<string, string[]> = {};
      for (const category of categories) {
        const defaultSlots = DEFAULT_ARENA_COLUMN_GAMES[category] || [];
        const savedSlots = parsed[category] || (category === '1v1' ? parsed.captains : undefined);
        const validSavedSlots = Array.isArray(savedSlots)
          ? savedSlots.filter((id): id is string => typeof id === 'string' && id.length > 0).slice(0, 3)
          : [];
        normalized[category] = [0, 1, 2].map((index) => validSavedSlots[index] || defaultSlots[index]);
      }
      return normalized;
    }
  } catch {}
  try {
    localStorage.setItem(STORAGE_KEYS.ARENA_COLUMN_GAMES, JSON.stringify(DEFAULT_ARENA_COLUMN_GAMES));
  } catch {}
  return DEFAULT_ARENA_COLUMN_GAMES;
}

export function saveArenaColumnGames(gamesMap: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEYS.ARENA_COLUMN_GAMES, JSON.stringify(gamesMap));
    broadcastMessage('ARENA_GAMES_UPDATED', gamesMap);
  } catch {}
}
