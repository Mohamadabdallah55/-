import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Team,
  CurrentMatch,
  MatchRecord,
  CategoryKey,
  BanPickStatus,
  GameItem,
  CategoryInfo,
  LeagueRow,
  LeagueSettings,
} from '../types';
import { GameIcon } from './GameIcons';
import { sound } from '../utils/audio';
import {
  broadcastMessage,
  subscribeToBroadcast,
  DEFAULT_ARENA_COLUMN_GAMES,
  saveArenaColumnGames,
  subscribeToConnectionStatus,
  forceReconnectAll,
} from '../utils/storage';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { webrtcSync } from '../utils/webrtcSync';
import {
  Smartphone,
  Trophy,
  Plus,
  Minus,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Ban,
  Check,
  Eye,
  EyeOff,
  Swords,
  Timer,
  Play,
  Pause,
  RefreshCw,
  Tv,
  Shuffle,
  Scale,
  Search,
  Maximize2,
  Volume2,
  Bell,
  Zap,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  ChevronsDown,
  X,
  Settings,
  Users,
  History,
  Trash2,
  Edit3,
  Layers,
  Dices,
  ArrowLeftRight,
  Radio,
  Target,
  Lock,
} from 'lucide-react';

interface MobileRemoteControllerProps {
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  categories: CategoryInfo[];
  selectedCategories?: CategoryKey[];
  cardStates: Record<string, { gameId: string; status: BanPickStatus }>;
  arenaColumnGames: Record<string, string[]>;
  standings?: LeagueRow[];
  matchesHistory?: MatchRecord[];
  leagueSettings?: LeagueSettings;
  onUpdateScore: (team: 'A' | 'B', delta: number) => void;
  onChangeTeam: (slot: 'A' | 'B', teamId: string) => void;
  onSwapTeams?: () => void;
  onFinishMatch: () => void;
  onResetCurrentMatch: () => void;
  onSetCardStatus: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame: (gameId: string | null) => void;
  onResetAllBansPicks: () => void;
  onChangeColumnGame?: (categoryId: string, slotIndex: number, newGameId: string) => void;
  onResetColumnGames?: () => void;
  onSelectCategories?: (cats: CategoryKey[]) => void;
  onSaveTeams?: (teams: Team[]) => void;
  onSaveGame?: (game: GameItem) => void;
  onSaveLeagueSettings?: (settings: LeagueSettings) => void;
  onDeleteMatch?: (matchId: string) => void;
  onResetLeague?: () => void;
  onClose?: () => void;
}

type RemoteTab = 'games' | 'score' | 'timer' | 'director' | 'league';

export const MobileRemoteController: React.FC<MobileRemoteControllerProps> = ({
  currentMatch,
  teams,
  games,
  categories,
  selectedCategories = [],
  cardStates,
  arenaColumnGames,
  standings = [],
  matchesHistory = [],
  leagueSettings = { currentWeek: 2, pointsByWeek: { 1: 3, 2: 4, 3: 5 } },
  onUpdateScore,
  onChangeTeam,
  onSwapTeams,
  onFinishMatch,
  onResetCurrentMatch,
  onSetCardStatus,
  onSetActiveGame,
  onResetAllBansPicks,
  onChangeColumnGame,
  onResetColumnGames,
  onSelectCategories,
  onSaveTeams,
  onSaveGame,
  onSaveLeagueSettings,
  onDeleteMatch,
  onResetLeague,
  onClose,
}) => {
  const [activeRemoteTab, setActiveRemoteTab] = useState<RemoteTab>('games');
  const [selectedCategory, setSelectedCategory] = useState<string>('digital');
  const [librarySearchQuery, setLibrarySearchQuery] = useState<string>('');
  const [editingGameSlot, setEditingGameSlot] = useState<{ catId: string; slotIdx: number } | null>(null);
  const [swapSearchQuery, setSwapSearchQuery] = useState<string>('');
  const [swapCategoryFilter, setSwapCategoryFilter] = useState<string>('all');

  // Rules editor modal on phone
  const [editingRulesGame, setEditingRulesGame] = useState<GameItem | null>(null);
  const [rulesDraft, setRulesDraft] = useState<string>('');

  // Quick Screen Bar toggle
  const [showQuickScreenBar, setShowQuickScreenBar] = useState<boolean>(true);
  const [remoteFeedback, setRemoteFeedback] = useState<string | null>(null);

  // Timer & Buzzer states
  const [remoteTimerSeconds, setRemoteTimerSeconds] = useState<number>(60);
  const [targetSeconds, setTargetSeconds] = useState<number>(10);
  const [isBlindMode, setIsBlindMode] = useState<boolean>(true);
  const [fullScreenBuzzer, setFullScreenBuzzer] = useState<'none' | 'A' | 'B' | 'dual'>('none');

  // High-precision 2-Tap Stopwatch states on Phone (Tap 1 = Start, Tap 2 = Stop & Lock)
  const [duelPhaseA, setDuelPhaseA] = useState<'idle' | 'running' | 'finished'>('idle');
  const [duelPhaseB, setDuelPhaseB] = useState<'idle' | 'running' | 'finished'>('idle');
  const [duelMsA, setDuelMsA] = useState<number>(0);
  const [duelMsB, setDuelMsB] = useState<number>(0);

  const duelPhaseARef = useRef<'idle' | 'running' | 'finished'>('idle');
  const duelPhaseBRef = useRef<'idle' | 'running' | 'finished'>('idle');
  const perfStartARef = useRef<number>(0);
  const perfStartBRef = useRef<number>(0);
  const lastTapGuardARef = useRef<number>(0);
  const lastTapGuardBRef = useRef<number>(0);

  // Keep refs synced with state
  duelPhaseARef.current = duelPhaseA;
  duelPhaseBRef.current = duelPhaseB;

  // 60fps requestAnimationFrame loop on phone while either team stopwatch is running
  useEffect(() => {
    let rafId: number | null = null;
    if (duelPhaseA === 'running' || duelPhaseB === 'running') {
      const tick = () => {
        const now = performance.now();
        if (duelPhaseARef.current === 'running') {
          setDuelMsA(Math.max(0, Math.round(now - perfStartARef.current)));
        }
        if (duelPhaseBRef.current === 'running') {
          setDuelMsB(Math.max(0, Math.round(now - perfStartBRef.current)));
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }
    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [duelPhaseA, duelPhaseB]);

  // Listen to DUEL_STATE_SYNC and TIMER_COMMAND so phone stays 100% synced with computer actions
  useEffect(() => {
    return subscribeToBroadcast((type, payload) => {
      if (type === 'DUEL_STATE_SYNC' && payload && typeof payload === 'object') {
        const sync = payload as {
          targetSeconds?: number;
          isBlindChallenge?: boolean;
          teamAActive?: boolean;
          teamAFinished?: boolean;
          teamAMs?: number;
          teamBActive?: boolean;
          teamBFinished?: boolean;
          teamBMs?: number;
        };
        if (typeof sync.targetSeconds === 'number') {
          setTargetSeconds(sync.targetSeconds);
        }
        if (typeof sync.isBlindChallenge === 'boolean') {
          setIsBlindMode(sync.isBlindChallenge);
        }
        // Sync Team A phase if triggered from computer
        if (sync.teamAActive && duelPhaseARef.current !== 'running') {
          perfStartARef.current = performance.now();
          duelPhaseARef.current = 'running';
          setDuelMsA(0);
          setDuelPhaseA('running');
        } else if (sync.teamAFinished && duelPhaseARef.current !== 'finished') {
          duelPhaseARef.current = 'finished';
          if (typeof sync.teamAMs === 'number' && sync.teamAMs > 0) {
            setDuelMsA(sync.teamAMs);
          }
          setDuelPhaseA('finished');
        } else if (!sync.teamAActive && !sync.teamAFinished && duelPhaseARef.current !== 'idle') {
          duelPhaseARef.current = 'idle';
          setDuelMsA(0);
          setDuelPhaseA('idle');
        }

        // Sync Team B phase if triggered from computer
        if (sync.teamBActive && duelPhaseBRef.current !== 'running') {
          perfStartBRef.current = performance.now();
          duelPhaseBRef.current = 'running';
          setDuelMsB(0);
          setDuelPhaseB('running');
        } else if (sync.teamBFinished && duelPhaseBRef.current !== 'finished') {
          duelPhaseBRef.current = 'finished';
          if (typeof sync.teamBMs === 'number' && sync.teamBMs > 0) {
            setDuelMsB(sync.teamBMs);
          }
          setDuelPhaseB('finished');
        } else if (!sync.teamBActive && !sync.teamBFinished && duelPhaseBRef.current !== 'idle') {
          duelPhaseBRef.current = 'idle';
          setDuelMsB(0);
          setDuelPhaseB('idle');
        }
      }
    });
  }, []);

  // League & Team management states
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamDraft, setTeamDraft] = useState<Team | null>(null);
  const [confirmResetLeague, setConfirmResetLeague] = useState<boolean>(false);

  // Connection state
  const [connStatus, setConnStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [roomCode, setRoomCodeState] = useState<string>(() => webrtcSync.getRoomCode());
  const [isEditingRoom, setIsEditingRoom] = useState<boolean>(false);
  const [showRoomModal, setShowRoomModal] = useState<boolean>(false);
  const [roomInputDraft, setRoomInputDraft] = useState<string>(() => webrtcSync.getRoomCode());
  const [hasDismissedModalOnce, setHasDismissedModalOnce] = useState<boolean>(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    webrtcSync.setRole('remote', roomFromUrl || undefined);
    setRoomCodeState(webrtcSync.getRoomCode());
    setRoomInputDraft(webrtcSync.getRoomCode());

    const unsub = subscribeToConnectionStatus((status) => {
      setConnStatus(status);
      setRoomCodeState(webrtcSync.getRoomCode());
      if (status === 'connected') {
        setShowRoomModal(false);
        setIsEditingRoom(false);
      }
    });

    return () => {
      unsub();
    };
  }, []);

  // Requirement #3: If phone does not connect within 2 seconds, automatically show the clear 4-digit room code input box
  useEffect(() => {
    if (connStatus === 'connected' || hasDismissedModalOnce) return;
    const timer = window.setTimeout(() => {
      if (webrtcSync.getStatus() !== 'connected') {
        setRoomInputDraft(webrtcSync.getRoomCode());
        setShowRoomModal(true);
      }
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [connStatus, hasDismissedModalOnce]);

  const handleConnectToFourDigitRoom = (codeToUse?: string) => {
    const raw = (codeToUse ?? roomInputDraft).replace(/\D/g, '').slice(0, 4);
    if (raw.length !== 4) {
      showFeedback('⚠️ يرجى إدخال رمز الغرفة المكون من 4 أرقام (مثال: 1234)');
      return;
    }
    triggerHaptic([25, 40]);
    sound.playTick();
    webrtcSync.setRole('remote', raw);
    webrtcSync.setRoomCode(raw);
    setRoomCodeState(raw);
    setRoomInputDraft(raw);
    forceReconnectAll();
    setShowRoomModal(false);
    setIsEditingRoom(false);
    showFeedback(`⚡ جاري الربط المباشر مع الغرفة #${raw}...`);
  };

  const triggerHaptic = (ms: number | number[] = 30) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(ms);
      } catch {}
    }
  };

  const showFeedback = (msg: string) => {
    setRemoteFeedback(msg);
    setTimeout(() => setRemoteFeedback(null), 2200);
  };

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];
  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);

  // Resolve games for the selected category (or all games when 'all' is selected)
  const displayedGames = useMemo(() => {
    if (selectedCategory === 'all') {
      const q = librarySearchQuery.trim().toLowerCase();
      return games.filter(
        (g) =>
          !q ||
          g.nameAr.toLowerCase().includes(q) ||
          g.nameEn.toLowerCase().includes(q) ||
          (g.description && g.description.toLowerCase().includes(q))
      );
    }

    const activeColGameIds =
      arenaColumnGames[selectedCategory] ||
      DEFAULT_ARENA_COLUMN_GAMES[selectedCategory] ||
      [];

    let list = activeColGameIds
      .map((gId) => games.find((g) => g.id === gId) || DEFAULT_GAMES.find((g) => g.id === gId))
      .filter(Boolean) as GameItem[];

    if (list.length < 3) {
      const fallback = DEFAULT_GAMES.filter((g) => g.categoryId === selectedCategory);
      const extra = fallback
        .filter((g) => !list.some((cg) => cg.id === g.id))
        .slice(0, 3 - list.length);
      list = [...list, ...extra];
    }
    return list;
  }, [selectedCategory, arenaColumnGames, games, librarySearchQuery]);

  // Filtered games for slot replacement modal
  const filteredSwapGames = useMemo(() => {
    const q = swapSearchQuery.trim().toLowerCase();
    return games.filter((g) => {
      const matchesCat = swapCategoryFilter === 'all' || g.categoryId === swapCategoryFilter;
      const matchesQuery =
        !q ||
        g.nameAr.toLowerCase().includes(q) ||
        g.nameEn.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [games, swapSearchQuery, swapCategoryFilter]);

  const handleResetCardsFromPhone = () => {
    triggerHaptic(35);
    sound.playTick();
    onResetAllBansPicks();
    showFeedback('✓ تم تصفير وإعادة ضبط جميع البطاقات على الشاشة');
  };

  const handleRestoreDefaultGamesFromPhone = () => {
    triggerHaptic(35);
    sound.playTick();
    if (onResetColumnGames) {
      onResetColumnGames();
    } else {
      saveArenaColumnGames(DEFAULT_ARENA_COLUMN_GAMES);
    }
    showFeedback('✓ تم استعادة التشكيلة الافتراضية للألعاب على الشاشة');
  };

  const handleRandomPickAvailableGame = () => {
    triggerHaptic([30, 40, 60]);
    const pool = displayedGames.filter((g) => {
      const st = cardStates[g.id]?.status || 'available';
      return st === 'available';
    });
    const targetPool = pool.length > 0 ? pool : displayedGames;
    if (targetPool.length === 0) return;
    const chosen = targetPool[Math.floor(Math.random() * targetPool.length)];
    sound.playPick('pick');
    onSetCardStatus(chosen.id, 'current');
    onSetActiveGame(chosen.id);
    showFeedback(`🎲 القرعة اختارت: ${chosen.nameAr}`);
  };

  const handleSwapTeamsPositions = () => {
    triggerHaptic(35);
    sound.playTick();
    if (onSwapTeams) {
      onSwapTeams();
    } else {
      const nextMatch: CurrentMatch = {
        ...currentMatch,
        teamAId: currentMatch.teamBId,
        teamBId: currentMatch.teamAId,
        teamAScore: currentMatch.teamBScore,
        teamBScore: currentMatch.teamAScore,
      };
      broadcastMessage('MATCH_UPDATED', nextMatch);
    }
    showFeedback('⇄ تم تبديل طرفي الفريقين على الشاشة');
  };

  // Instantaneous 2-Tap Buzzer Handler for Team A (1st Tap = Start, 2nd Tap = Stop & Lock)
  const handleBuzzerTapP1 = (e?: React.PointerEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const now = performance.now();
    if (now - lastTapGuardARef.current < 80) return;
    lastTapGuardARef.current = now;

    const currentPhase = duelPhaseARef.current;

    if (currentPhase === 'idle') {
      // 1ST TAP: Instant Start
      perfStartARef.current = now;
      duelPhaseARef.current = 'running';
      setDuelMsA(0);
      setDuelPhaseA('running');
      triggerHaptic(30);
      sound.playPick('pick');
      broadcastMessage('SWITCH_TAB_COMMAND', 'timer');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_start_a' });
    } else if (currentPhase === 'running') {
      // 2ND TAP: Instant Stop & Sub-Millisecond Precision Lock
      const exactMs = Math.max(10, Math.round(now - perfStartARef.current));
      duelPhaseARef.current = 'finished';
      setDuelMsA(exactMs);
      setDuelPhaseA('finished');
      triggerHaptic([40, 30, 60]);
      sound.playPick('ban');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_stop_a', exactMs });
      showFeedback(`🛑 ${teamA.shortName}: ${(exactMs / 1000).toFixed(2)}s (تم القفل 🔒)`);
    } else {
      // 3RD+ TAP: Locked to protect result!
      triggerHaptic(15);
      showFeedback(`🔒 نتيجة ${teamA.shortName} مثبتة — اضغط تصفير لإعادة المحاولة`);
    }
  };

  // Instantaneous 2-Tap Buzzer Handler for Team B (1st Tap = Start, 2nd Tap = Stop & Lock)
  const handleBuzzerTapP2 = (e?: React.PointerEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const now = performance.now();
    if (now - lastTapGuardBRef.current < 80) return;
    lastTapGuardBRef.current = now;

    const currentPhase = duelPhaseBRef.current;

    if (currentPhase === 'idle') {
      // 1ST TAP: Instant Start
      perfStartBRef.current = now;
      duelPhaseBRef.current = 'running';
      setDuelMsB(0);
      setDuelPhaseB('running');
      triggerHaptic(30);
      sound.playPick('pick');
      broadcastMessage('SWITCH_TAB_COMMAND', 'timer');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_start_b' });
    } else if (currentPhase === 'running') {
      // 2ND TAP: Instant Stop & Sub-Millisecond Precision Lock
      const exactMs = Math.max(10, Math.round(now - perfStartBRef.current));
      duelPhaseBRef.current = 'finished';
      setDuelMsB(exactMs);
      setDuelPhaseB('finished');
      triggerHaptic([40, 30, 60]);
      sound.playPick('ban');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_stop_b', exactMs });
      showFeedback(`🛑 ${teamB.shortName}: ${(exactMs / 1000).toFixed(2)}s (تم القفل 🔒)`);
    } else {
      // 3RD+ TAP: Locked to protect result!
      triggerHaptic(15);
      showFeedback(`🔒 نتيجة ${teamB.shortName} مثبتة — اضغط تصفير لإعادة المحاولة`);
    }
  };

  const handleStartBothFromPhone = () => {
    const now = performance.now();
    perfStartARef.current = now;
    perfStartBRef.current = now;
    duelPhaseARef.current = 'running';
    duelPhaseBRef.current = 'running';
    setDuelMsA(0);
    setDuelMsB(0);
    setDuelPhaseA('running');
    setDuelPhaseB('running');
    triggerHaptic(40);
    sound.playPick('pick');
    broadcastMessage('SWITCH_TAB_COMMAND', 'timer');
    broadcastMessage('TIMER_COMMAND', { action: 'duel_start_both' });
    showFeedback('⚡ انطلق العداد للفريقين معاً! الضغطة القادمة لكل فريق ستوقف عداده');
  };

  const handleResetBothFromPhone = () => {
    duelPhaseARef.current = 'idle';
    duelPhaseBRef.current = 'idle';
    setDuelMsA(0);
    setDuelMsB(0);
    setDuelPhaseA('idle');
    setDuelPhaseB('idle');
    triggerHaptic(25);
    sound.playTick();
    broadcastMessage('TIMER_COMMAND', { action: 'duel_reset_both' });
    showFeedback('✓ تم تصفير العدادين وفك القفل');
  };

  const handleResetSingleTeamFromPhone = (team: 'A' | 'B', e?: React.MouseEvent | React.PointerEvent) => {
    if (e) e.stopPropagation();
    triggerHaptic(20);
    sound.playTick();
    if (team === 'A') {
      duelPhaseARef.current = 'idle';
      setDuelMsA(0);
      setDuelPhaseA('idle');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_reset_a' });
    } else {
      duelPhaseBRef.current = 'idle';
      setDuelMsB(0);
      setDuelPhaseB('idle');
      broadcastMessage('TIMER_COMMAND', { action: 'duel_reset_b' });
    }
  };

  const secsA = duelMsA / 1000;
  const secsB = duelMsB / 1000;
  const diffA = secsA - targetSeconds;
  const diffB = secsB - targetSeconds;
  const bothFinishedOnPhone = duelPhaseA === 'finished' && duelPhaseB === 'finished';
  const winnerOnPhone =
    bothFinishedOnPhone
      ? Math.abs(diffA) < Math.abs(diffB)
        ? 'A'
        : Math.abs(diffB) < Math.abs(diffA)
        ? 'B'
        : 'draw'
      : null;

  // FULL-SCREEN BUZZER MODE FOR PLAYERS (Touch anywhere with hand or head: 1st Tap = Start, 2nd Tap = Stop & Lock)
  if (fullScreenBuzzer !== 'none') {
    return (
      <div className="fixed inset-0 z-[100] bg-[#05070F] flex flex-col select-none overflow-hidden font-cairo touch-manipulation">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-changa text-white">
              تحدي الـ {targetSeconds}ث
            </span>
            <button
              onClick={() => {
                triggerHaptic(20);
                const next = !isBlindMode;
                setIsBlindMode(next);
                broadcastMessage('TIMER_COMMAND', { action: 'set_blind', blind: next });
              }}
              className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center gap-1 ${
                isBlindMode
                  ? 'bg-purple-950/80 border-purple-500/60 text-purple-200'
                  : 'bg-slate-900 border-slate-700 text-cyan-300'
              }`}
            >
              {isBlindMode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span>{isBlindMode ? 'أعمى 🙈' : 'ظاهر 👁️'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStartBothFromPhone}
              className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs active:scale-95"
            >
              ⚡ انطلاق الاثنين
            </button>
            <button
              onClick={handleResetBothFromPhone}
              className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-600 text-slate-100 font-bold text-xs flex items-center gap-1 active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>تصفير</span>
            </button>
            <button
              onClick={() => setFullScreenBuzzer('none')}
              className="px-2.5 py-1 rounded-lg bg-rose-900 text-white font-bold text-xs flex items-center gap-1 active:scale-95"
            >
              <X className="w-3.5 h-3.5" />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* Toast inside fullscreen buzzer */}
        {remoteFeedback && (
          <div className="bg-amber-500 text-slate-950 text-center py-1 px-3 text-xs font-black font-changa">
            {remoteFeedback}
          </div>
        )}

        {/* Full-Screen Single Player A */}
        {fullScreenBuzzer === 'A' && (
          <div
            onPointerDown={handleBuzzerTapP1}
            role="button"
            tabIndex={0}
            className={`flex-1 w-full flex flex-col items-center justify-center p-6 transition-all border-8 relative cursor-pointer ${
              duelPhaseA === 'running'
                ? 'bg-[#991B1B] active:bg-[#DC2626] border-rose-400 animate-pulse'
                : duelPhaseA === 'finished'
                ? 'bg-slate-900 border-amber-400'
                : 'bg-[#5B21B6] active:bg-[#7C3AED] border-purple-400/60'
            }`}
          >
            {duelPhaseA === 'finished' && (
              <button
                onPointerDown={(e) => handleResetSingleTeamFromPhone('A', e)}
                onClick={(e) => handleResetSingleTeamFromPhone('A', e)}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 z-10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            )}

            <div className="w-24 h-24 rounded-full bg-black/25 border-4 border-white/40 flex items-center justify-center mb-3">
              <GameIcon name={teamA.logo || 'crown'} className="w-14 h-14 text-white" />
            </div>
            <span className="text-3xl sm:text-4xl font-black font-changa tracking-wide uppercase text-white">
              {teamA.name}
            </span>

            {duelPhaseA === 'idle' && (
              <>
                <div className="mt-4 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black font-changa text-2xl flex items-center gap-2 shadow-xl">
                  <Play className="w-6 h-6 fill-slate-950" />
                  <span>الضغطة 1: ابدأ المؤقت</span>
                </div>
                <span className="mt-2 text-sm font-bold text-purple-200">
                  الهدف: {targetSeconds}.00 ثانية
                </span>
              </>
            )}

            {duelPhaseA === 'running' && (
              <>
                <div className="my-3">
                  {isBlindMode ? (
                    <div className="flex flex-col items-center">
                      <span className="text-5xl mb-1">🙈</span>
                      <span className="text-lg font-black font-changa text-rose-200">
                        العداد يعمل (الوضع الأعمى)
                      </span>
                    </div>
                  ) : (
                    <span className="font-orbitron font-black text-6xl text-white tabular-nums">
                      {secsA.toFixed(2)}s
                    </span>
                  )}
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white text-rose-900 font-black font-changa text-2xl shadow-xl">
                  🛑 الضغطة 2: أوقف الآن!
                </div>
              </>
            )}

            {duelPhaseA === 'finished' && (
              <>
                <span className="font-orbitron font-black text-6xl text-amber-400 tabular-nums mt-3">
                  {secsA.toFixed(2)}s
                </span>
                <span className="text-base font-mono font-bold text-slate-200 mt-1">
                  الفارق عن {targetSeconds}ث: {diffA >= 0 ? '+' : ''}{diffA.toFixed(2)}s
                </span>
                <div className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>تم قفل الزر لحماية النتيجة — اضغط تصفير للإعادة</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Full-Screen Single Player B */}
        {fullScreenBuzzer === 'B' && (
          <div
            onPointerDown={handleBuzzerTapP2}
            role="button"
            tabIndex={0}
            className={`flex-1 w-full flex flex-col items-center justify-center p-6 transition-all border-8 relative cursor-pointer ${
              duelPhaseB === 'running'
                ? 'bg-[#991B1B] active:bg-[#DC2626] border-rose-400 animate-pulse'
                : duelPhaseB === 'finished'
                ? 'bg-slate-900 border-amber-400'
                : 'bg-[#0E7490] active:bg-[#0891B2] border-cyan-400/60'
            }`}
          >
            {duelPhaseB === 'finished' && (
              <button
                onPointerDown={(e) => handleResetSingleTeamFromPhone('B', e)}
                onClick={(e) => handleResetSingleTeamFromPhone('B', e)}
                className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-600 text-white text-xs font-bold flex items-center gap-1.5 z-10"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة المحاولة</span>
              </button>
            )}

            <div className="w-24 h-24 rounded-full bg-black/25 border-4 border-white/40 flex items-center justify-center mb-3">
              <GameIcon name={teamB.logo || 'shield'} className="w-14 h-14 text-white" />
            </div>
            <span className="text-3xl sm:text-4xl font-black font-changa tracking-wide uppercase text-white">
              {teamB.name}
            </span>

            {duelPhaseB === 'idle' && (
              <>
                <div className="mt-4 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-black font-changa text-2xl flex items-center gap-2 shadow-xl">
                  <Play className="w-6 h-6 fill-slate-950" />
                  <span>الضغطة 1: ابدأ المؤقت</span>
                </div>
                <span className="mt-2 text-sm font-bold text-cyan-200">
                  الهدف: {targetSeconds}.00 ثانية
                </span>
              </>
            )}

            {duelPhaseB === 'running' && (
              <>
                <div className="my-3">
                  {isBlindMode ? (
                    <div className="flex flex-col items-center">
                      <span className="text-5xl mb-1">🙈</span>
                      <span className="text-lg font-black font-changa text-rose-200">
                        العداد يعمل (الوضع الأعمى)
                      </span>
                    </div>
                  ) : (
                    <span className="font-orbitron font-black text-6xl text-white tabular-nums">
                      {secsB.toFixed(2)}s
                    </span>
                  )}
                </div>
                <div className="px-6 py-3 rounded-2xl bg-white text-rose-900 font-black font-changa text-2xl shadow-xl">
                  🛑 الضغطة 2: أوقف الآن!
                </div>
              </>
            )}

            {duelPhaseB === 'finished' && (
              <>
                <span className="font-orbitron font-black text-6xl text-amber-400 tabular-nums mt-3">
                  {secsB.toFixed(2)}s
                </span>
                <span className="text-base font-mono font-bold text-slate-200 mt-1">
                  الفارق عن {targetSeconds}ث: {diffB >= 0 ? '+' : ''}{diffB.toFixed(2)}s
                </span>
                <div className="mt-3 px-4 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>تم قفل الزر لحماية النتيجة — اضغط تصفير للإعادة</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* SPLIT-SCREEN DUAL BUZZER (شاشة مقسومة للفريقين: ضغطة 1 للبدء، ضغطة 2 للإيقاف والقفل) */}
        {fullScreenBuzzer === 'dual' && (
          <div className="flex-1 flex flex-col">
            {/* TEAM A HALF */}
            <div
              onPointerDown={handleBuzzerTapP1}
              role="button"
              tabIndex={0}
              className={`flex-1 w-full flex flex-col items-center justify-center p-4 border-b-4 border-slate-950 relative transition-all cursor-pointer ${
                duelPhaseA === 'running'
                  ? 'bg-[#B91C1C] active:bg-[#EF4444]'
                  : duelPhaseA === 'finished'
                  ? winnerOnPhone === 'A'
                    ? 'bg-[#3B0764] ring-4 ring-inset ring-amber-400'
                    : 'bg-slate-900/95'
                  : 'bg-[#5B21B6] active:bg-[#7C3AED]'
              }`}
            >
              {duelPhaseA === 'finished' && (
                <button
                  onPointerDown={(e) => handleResetSingleTeamFromPhone('A', e)}
                  onClick={(e) => handleResetSingleTeamFromPhone('A', e)}
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 z-10"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إعادة</span>
                </button>
              )}

              <div className="flex items-center gap-2 mb-1">
                <GameIcon name={teamA.logo || 'crown'} className="w-7 h-7 text-white" />
                <span className="text-2xl sm:text-3xl font-black font-changa text-white">
                  {teamA.name}
                </span>
              </div>

              {duelPhaseA === 'idle' && (
                <>
                  <div className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-400 text-slate-950 font-black font-changa text-lg sm:text-xl flex items-center gap-2 shadow-lg">
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>الضغطة 1: ابدأ المؤقت</span>
                  </div>
                  <span className="text-xs font-bold text-purple-200 mt-1.5">
                    الهدف: {targetSeconds}.00 ثانية
                  </span>
                </>
              )}

              {duelPhaseA === 'running' && (
                <>
                  <div className="my-1.5">
                    {isBlindMode ? (
                      <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-rose-300/30">
                        <span className="text-2xl">🙈</span>
                        <span className="text-sm font-black font-changa text-rose-100">
                          العداد يعمل.. خمّن الـ {targetSeconds}ث!
                        </span>
                      </div>
                    ) : (
                      <span className="font-orbitron font-black text-4xl sm:text-5xl text-white tabular-nums">
                        {secsA.toFixed(2)}s
                      </span>
                    )}
                  </div>
                  <div className="mt-1 px-5 py-2 rounded-2xl bg-white text-rose-900 font-black font-changa text-lg sm:text-xl shadow-lg animate-pulse">
                    🛑 الضغطة 2: أوقف الآن!
                  </div>
                </>
              )}

              {duelPhaseA === 'finished' && (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-orbitron font-black text-4xl sm:text-5xl text-amber-400 tabular-nums">
                      {secsA.toFixed(2)}s
                    </span>
                    <span className="text-xs font-mono font-bold text-purple-200 bg-black/40 px-2 py-0.5 rounded-lg">
                      الفارق: {diffA >= 0 ? '+' : ''}{diffA.toFixed(2)}ث
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {winnerOnPhone === 'A' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black font-changa text-xs">
                        👑 الأقرب للهدف!
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>النتيجة مقفلة لحمايتها</span>
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* TEAM B HALF */}
            <div
              onPointerDown={handleBuzzerTapP2}
              role="button"
              tabIndex={0}
              className={`flex-1 w-full flex flex-col items-center justify-center p-4 relative transition-all cursor-pointer ${
                duelPhaseB === 'running'
                  ? 'bg-[#B91C1C] active:bg-[#EF4444]'
                  : duelPhaseB === 'finished'
                  ? winnerOnPhone === 'B'
                    ? 'bg-[#083344] ring-4 ring-inset ring-amber-400'
                    : 'bg-slate-900/95'
                  : 'bg-[#0E7490] active:bg-[#0891B2]'
              }`}
            >
              {duelPhaseB === 'finished' && (
                <button
                  onPointerDown={(e) => handleResetSingleTeamFromPhone('B', e)}
                  onClick={(e) => handleResetSingleTeamFromPhone('B', e)}
                  className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-slate-800 border border-slate-600 text-slate-200 text-[11px] font-bold flex items-center gap-1 z-10"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>إعادة</span>
                </button>
              )}

              <div className="flex items-center gap-2 mb-1">
                <GameIcon name={teamB.logo || 'shield'} className="w-7 h-7 text-white" />
                <span className="text-2xl sm:text-3xl font-black font-changa text-white">
                  {teamB.name}
                </span>
              </div>

              {duelPhaseB === 'idle' && (
                <>
                  <div className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-400 text-slate-950 font-black font-changa text-lg sm:text-xl flex items-center gap-2 shadow-lg">
                    <Play className="w-5 h-5 fill-slate-950" />
                    <span>الضغطة 1: ابدأ المؤقت</span>
                  </div>
                  <span className="text-xs font-bold text-cyan-200 mt-1.5">
                    الهدف: {targetSeconds}.00 ثانية
                  </span>
                </>
              )}

              {duelPhaseB === 'running' && (
                <>
                  <div className="my-1.5">
                    {isBlindMode ? (
                      <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-rose-300/30">
                        <span className="text-2xl">🙈</span>
                        <span className="text-sm font-black font-changa text-rose-100">
                          العداد يعمل.. خمّن الـ {targetSeconds}ث!
                        </span>
                      </div>
                    ) : (
                      <span className="font-orbitron font-black text-4xl sm:text-5xl text-white tabular-nums">
                        {secsB.toFixed(2)}s
                      </span>
                    )}
                  </div>
                  <div className="mt-1 px-5 py-2 rounded-2xl bg-white text-rose-900 font-black font-changa text-lg sm:text-xl shadow-lg animate-pulse">
                    🛑 الضغطة 2: أوقف الآن!
                  </div>
                </>
              )}

              {duelPhaseB === 'finished' && (
                <>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="font-orbitron font-black text-4xl sm:text-5xl text-amber-400 tabular-nums">
                      {secsB.toFixed(2)}s
                    </span>
                    <span className="text-xs font-mono font-bold text-cyan-200 bg-black/40 px-2 py-0.5 rounded-lg">
                      الفارق: {diffB >= 0 ? '+' : ''}{diffB.toFixed(2)}ث
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {winnerOnPhone === 'B' && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black font-changa text-xs">
                        👑 الأقرب للهدف!
                      </span>
                    )}
                    <span className="px-2.5 py-1 rounded-xl bg-slate-800/90 border border-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>النتيجة مقفلة لحمايتها</span>
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mobile-remote-shell min-h-screen bg-[#060913] text-slate-100 flex flex-col font-cairo pb-24 select-none">
      {/* Top Sticky Master Bar with Instant Score & Connection */}
      <header className="sticky top-0 z-40 bg-[#0A0F22] border-b border-slate-800/90 px-3 py-2.5 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => {
                triggerHaptic(25);
                sound.playTick();
                forceReconnectAll();
                setRoomCodeState(webrtcSync.getRoomCode());
                showFeedback('🔄 تم تحديث الاتصال والمزامنة مع الشاشة مباشرة');
              }}
              className="w-8 h-8 rounded-xl bg-indigo-600 active:bg-indigo-500 flex items-center justify-center text-white shrink-0"
              title="اضغط لإعادة تنشيط الاتصال فوراً"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-changa font-bold text-xs sm:text-sm text-white truncate">
                  ريموت التحكم الشامل
                </h1>
                <button
                  onClick={() => {
                    triggerHaptic(15);
                    setRoomInputDraft(roomCode);
                    setShowRoomModal(true);
                  }}
                  className="text-[11px] font-mono text-cyan-200 font-black bg-cyan-950/90 border border-cyan-400/60 px-2 py-0.5 rounded-lg active:scale-95 flex items-center gap-1 shadow-sm"
                  title="اضغط لإدخال رمز الغرفة المكون من 4 أرقام"
                >
                  <span>غرفة #{roomCode}</span>
                </button>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  if (connStatus !== 'connected') {
                    setRoomInputDraft(roomCode);
                    setShowRoomModal(true);
                  } else {
                    forceReconnectAll();
                    setRoomCodeState(webrtcSync.getRoomCode());
                    showFeedback('🔄 تم تحديث الاتصال والمزامنة بنجاح');
                  }
                }}
                className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-white"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    connStatus === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : connStatus === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-400'
                  }`}
                />
                <span className={connStatus === 'connected' ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  {connStatus === 'connected'
                    ? `متصل بالكمبيوتر مباشرة 🟢 (#${roomCode})`
                    : 'غير متصل — اضغط لإدخال الـ 4 أرقام ⚡'}
                </span>
              </button>
            </div>
          </div>

          {/* Mini Live Score Strip in Header (Always Accessible) */}
          <div className="flex items-center gap-1.5 bg-[#060913] px-2.5 py-1 rounded-xl border border-slate-800">
            <button
              onClick={() => {
                triggerHaptic(25);
                sound.playScorePoint(true);
                onUpdateScore('A', 1);
                showFeedback(`+1 نقطة لـ ${teamA.shortName}`);
              }}
              className="px-1.5 py-0.5 rounded bg-purple-600/30 border border-purple-500/50 text-purple-200 text-[10px] font-bold active:scale-95"
              title="إضافة نقطة سريعة للفريق A"
            >
              +A
            </button>
            <span className="font-orbitron font-black text-xs text-purple-300 tabular-nums">
              {currentMatch.teamAScore}
            </span>
            <span className="text-[9px] text-slate-500 font-mono">:</span>
            <span className="font-orbitron font-black text-xs text-cyan-300 tabular-nums">
              {currentMatch.teamBScore}
            </span>
            <button
              onClick={() => {
                triggerHaptic(25);
                sound.playScorePoint(false);
                onUpdateScore('B', 1);
                showFeedback(`+1 نقطة لـ ${teamB.shortName}`);
              }}
              className="px-1.5 py-0.5 rounded bg-cyan-600/30 border border-cyan-500/50 text-cyan-200 text-[10px] font-bold active:scale-95"
              title="إضافة نقطة سريعة للفريق B"
            >
              +B
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowQuickScreenBar((prev) => !prev)}
              className={`px-2 py-1.5 rounded-lg text-[11px] font-bold border transition-colors flex items-center gap-1 ${
                showQuickScreenBar
                  ? 'bg-indigo-600 text-white border-indigo-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">الشاشة</span>
            </button>
            {onClose && (
              <button
                onClick={() => {
                  triggerHaptic(15);
                  webrtcSync.setRole('host');
                  onClose();
                }}
                className="p-1.5 text-slate-300 bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800"
                title="العودة لعرض اللابتوب"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Inline 4-Digit Quick Connect Bar whenever not connected or when editing room */}
        {(connStatus !== 'connected' || isEditingRoom) && (
          <div className="mt-2 pt-2 border-t border-cyan-500/30 flex items-center gap-2 bg-cyan-950/20 px-2 py-1.5 rounded-xl">
            <span className="text-[11px] font-black text-cyan-300 shrink-0">رمز الـ 4 أرقام:</span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              dir="ltr"
              value={roomInputDraft}
              onChange={(e) => setRoomInputDraft(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="1234"
              className="w-24 bg-[#050814] border-2 border-cyan-400/80 rounded-xl px-2 py-1 text-base font-black font-mono text-center text-white tracking-[0.25em] focus:outline-none"
            />
            <button
              onClick={() => handleConnectToFourDigitRoom()}
              className="flex-1 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 active:from-emerald-500 active:to-cyan-500 text-white text-xs font-black font-changa shadow-md active:scale-95 flex items-center justify-center gap-1"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>اتصال فوري ⚡</span>
            </button>
            <button
              onClick={() => {
                triggerHaptic(15);
                setRoomInputDraft(roomCode);
                setShowRoomModal(true);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 text-cyan-300 text-[11px] font-bold border border-slate-700"
            >
              لوحة الأرقام
            </button>
          </div>
        )}

        {/* Prominent 2-Second Auto-Popup Modal for 4-Digit Room Code Entry */}
        {showRoomModal && (
          <div className="fixed inset-0 z-[90] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-[#0B122B] border-2 border-cyan-400/80 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-center relative">
              <button
                onClick={() => {
                  setShowRoomModal(false);
                  setHasDismissedModalOnce(true);
                }}
                className="absolute top-3.5 left-3.5 p-2 rounded-xl bg-slate-800/90 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white mx-auto mb-3 shadow-lg shadow-cyan-500/30">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-black font-changa text-white">
                ربط الهاتف بشاشة الكمبيوتر
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                أدخل رمز الغرفة المكون من <span className="text-cyan-300 font-black">4 أرقام</span> الظاهر في نافذة (ربط الهاتف) على الكمبيوتر:
              </p>

              {/* 4-Digit Display / Input */}
              <div className="my-4">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  dir="ltr"
                  value={roomInputDraft}
                  onChange={(e) => {
                    const next = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setRoomInputDraft(next);
                  }}
                  placeholder="1234"
                  className="w-full bg-[#050814] border-2 border-cyan-400 rounded-2xl py-3 px-4 text-4xl font-black font-mono text-center text-white tracking-[0.45em] shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              {/* Built-in Fast Touch Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 mb-4" dir="ltr">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => {
                      triggerHaptic(15);
                      setRoomInputDraft((prev) => (prev.length >= 4 ? digit : (prev + digit).slice(0, 4)));
                    }}
                    className="py-2.5 rounded-xl bg-slate-900 active:bg-cyan-900 border border-slate-700 text-xl font-black font-mono text-white active:scale-95"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setRoomInputDraft('');
                  }}
                  className="py-2.5 rounded-xl bg-rose-950/70 active:bg-rose-900 border border-rose-700/50 text-xs font-bold text-rose-200 active:scale-95"
                >
                  مسح الكل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setRoomInputDraft((prev) => (prev.length >= 4 ? '0' : (prev + '0').slice(0, 4)));
                  }}
                  className="py-2.5 rounded-xl bg-slate-900 active:bg-cyan-900 border border-slate-700 text-xl font-black font-mono text-white active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic(15);
                    setRoomInputDraft((prev) => prev.slice(0, -1));
                  }}
                  className="py-2.5 rounded-xl bg-slate-800 active:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 active:scale-95"
                >
                  ⌫ حذف
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleConnectToFourDigitRoom()}
                disabled={roomInputDraft.replace(/\D/g, '').length !== 4}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-40 text-slate-950 font-black font-changa text-base shadow-lg shadow-emerald-500/25 active:scale-95 flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5 fill-current" />
                <span>اتصال فوري بالغرفة #{roomInputDraft.padEnd(4, '•')}</span>
              </button>
            </div>
          </div>
        )}

        {/* Collapsible Quick Screen Switcher Bar (التنقل الكامل بين صفحات الموقع بدون ماوس) */}
        {showQuickScreenBar && (
          <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-2">
            <div className="grid grid-cols-6 gap-1">
              {[
                { id: 'match', label: 'المواجهة' },
                { id: 'arena', label: 'الألعاب' },
                { id: 'timer', label: 'المؤقت' },
                { id: 'standings', label: 'الترتيب' },
                { id: 'library', label: 'المكتبة' },
                { id: 'broadcast', label: 'البث' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    triggerHaptic(20);
                    sound.playTick();
                    broadcastMessage('SWITCH_TAB_COMMAND', tab.id);
                    showFeedback(`الشاشة تعرض الآن: ${tab.label}`);
                  }}
                  className="py-1.5 px-1 rounded-lg bg-[#11172E] hover:bg-indigo-950 border border-slate-700/80 text-slate-200 text-[10px] font-bold font-changa truncate active:scale-95"
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Quick Stage, Scroll & Modal Close Strip */}
            <div className="flex items-center justify-between gap-1">
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('STAGE_VIEW_COMMAND', true);
                  showFeedback('تم فتح شاشة المسرح الكاملة على اللابتوب');
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold truncate active:scale-95"
              >
                شاشة المسرح
              </button>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('BROADCAST_VIEW_UPDATED', 'scoreboard');
                  broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                  showFeedback('البث يعرض الآن: لوحة النتيجة');
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-200 text-[10px] font-bold truncate active:scale-95"
              >
                بث النتيجة
              </button>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('BROADCAST_VIEW_UPDATED', 'games');
                  broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                  showFeedback('البث يعرض الآن: ساحة الألعاب');
                }}
                className="flex-1 py-1 px-2 rounded-lg bg-cyan-950/80 border border-cyan-600/50 text-cyan-300 text-[10px] font-bold truncate active:scale-95"
              >
                بث الألعاب
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  sound.playTick();
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'up');
                  showFeedback('▲ تم تمرير الشاشة لأعلى');
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold active:scale-95"
                title="تمرير شاشة اللابتوب لأعلى"
              >
                ▲
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  sound.playTick();
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'down');
                  showFeedback('▼ تم تمرير الشاشة لأسفل');
                }}
                className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 text-[10px] font-bold active:scale-95"
                title="تمرير شاشة اللابتوب لأسفل"
              >
                ▼
              </button>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('CLOSE_ALL_MODALS', true);
                  showFeedback('تم إغلاق النوافذ المنبثقة على اللابتوب');
                }}
                className="px-2 py-1 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-300 text-[10px] font-bold active:scale-95"
                title="إغلاق أي نافذة مفتوحة على اللابتوب"
              >
                إغلاق ✕
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Instant Action Feedback Toast */}
      {remoteFeedback && (
        <div className="sticky top-[54px] z-30 px-3 py-2 bg-emerald-950 border-b border-emerald-500/80 text-emerald-200 text-xs font-bold text-center flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{remoteFeedback}</span>
          </div>
          {onClose && (
            <button
              onClick={() => {
                triggerHaptic(15);
                onClose();
              }}
              className="px-2 py-0.5 rounded-lg bg-emerald-800/80 border border-emerald-400/50 text-white text-[10px] font-bold shrink-0"
            >
              معاينة الشاشة ↗
            </button>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 1: GAMES, BAN/PICK, SWAP & RULES REMOTE CONTROL
         ===================================================================== */}
      {activeRemoteTab === 'games' && (
        <div className="p-3.5 space-y-3.5 flex-1">
          {/* Top Quick Action Bar */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleRandomPickAvailableGame}
              className="py-2.5 px-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Dices className="w-4 h-4" />
              <span>قرعة عشوائية</span>
            </button>

            <button
              onClick={handleResetCardsFromPhone}
              className="py-2.5 px-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير البطاقات</span>
            </button>

            <button
              onClick={handleRestoreDefaultGamesFromPhone}
              className="py-2.5 px-2 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>استعادة التشكيلة</span>
            </button>
          </div>

          {/* Active Live Game Status & Remote Rules Trigger */}
          <div className="p-3 rounded-2xl bg-[#0D132A] border border-indigo-500/40">
            <div className="text-[11px] text-slate-400 flex items-center justify-between mb-2">
              <span>اللعبة الجارية على الشاشة الآن:</span>
              {activeGame && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      broadcastMessage('SWITCH_TAB_COMMAND', 'arena');
                      broadcastMessage('REMOTE_RULES_MODAL', activeGame.id);
                      showFeedback(`تم فتح قوانين ${activeGame.nameAr} على الشاشة`);
                    }}
                    className="text-amber-300 font-bold text-[10px] bg-amber-950/70 border border-amber-500/50 px-2 py-0.5 rounded-lg"
                  >
                    عرض القوانين على الشاشة
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(20);
                      sound.playTick();
                      onSetActiveGame(null);
                      showFeedback('تم إلغاء عرض اللعبة الحالية');
                    }}
                    className="text-rose-400 font-bold text-[10px] bg-rose-950/60 border border-rose-700/50 px-2 py-0.5 rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>
            {activeGame ? (
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 shrink-0">
                  <GameIcon name={activeGame.iconType} className="w-6 h-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-changa font-bold text-white text-sm sm:text-base truncate">
                    {activeGame.nameAr}
                  </h3>
                  <span className="text-[11px] text-cyan-400 font-mono block truncate">
                    {activeGame.nameEn}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                لا توجد لعبة محددة للجولة الحالية. اختر أي لعبة بالأسفل واضغط «تعيين للجولة».
              </p>
            )}
          </div>

          {/* Category Filter Tabs (5 Arena Columns + All Games Library) */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    triggerHaptic(15);
                    sound.playTick();
                    setSelectedCategory(cat.id);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold font-changa text-center truncate transition-all border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-md'
                      : 'bg-[#0D1326] text-slate-400 border-slate-800'
                  }`}
                >
                  {cat.nameAr}
                </button>
              );
            })}
            <button
              onClick={() => {
                triggerHaptic(15);
                sound.playTick();
                setSelectedCategory('all');
              }}
              className={`py-2 px-2 rounded-xl text-xs font-bold font-changa text-center truncate transition-all border ${
                selectedCategory === 'all'
                  ? 'bg-cyan-600 text-white border-cyan-400 shadow-md'
                  : 'bg-[#0D1326] text-slate-400 border-slate-800'
              }`}
            >
              كل المكتبة ({games.length})
            </button>
          </div>

          {/* Search input when viewing entire library */}
          {selectedCategory === 'all' && (
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={librarySearchQuery}
                onChange={(e) => setLibrarySearchQuery(e.target.value)}
                placeholder="ابحث في كامل مكتبة الألعاب..."
                className="w-full bg-[#0D1326] text-white text-xs pr-9 pl-3 py-2.5 rounded-xl border border-slate-700 focus:border-cyan-400 focus:outline-none"
              />
            </div>
          )}

          {/* Games Cards List */}
          <div className="space-y-3">
            {displayedGames.map((game, slotIdx) => {
              const state = cardStates[game.id]?.status || 'available';
              const isCurrent = currentMatch.activeGameId === game.id || state === 'current';
              const isBannedA = state === 'banned_team_a';
              const isBannedB = state === 'banned_team_b';
              const isPickedA = state === 'picked_team_a';
              const isPickedB = state === 'picked_team_b';

              return (
                <div
                  key={`${selectedCategory}-${slotIdx}-${game.id}`}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-amber-950/30 border-amber-400'
                      : isBannedA || isBannedB
                      ? 'bg-rose-950/20 border-rose-800/70'
                      : isPickedA
                      ? 'bg-purple-950/30 border-purple-500/80'
                      : isPickedB
                      ? 'bg-cyan-950/30 border-cyan-500/80'
                      : 'bg-[#0D1326] border-slate-800'
                  }`}
                >
                  {/* Game Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0">
                        <GameIcon name={game.iconType} className="w-6 h-6 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-changa font-bold text-sm text-white truncate">
                          {game.nameAr}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {game.nameEn}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold shrink-0">
                      {isCurrent ? (
                        <span className="text-amber-300">اللعبة الحالية</span>
                      ) : isBannedA ? (
                        <span className="text-purple-300">حظر {teamA.shortName} ✕</span>
                      ) : isBannedB ? (
                        <span className="text-cyan-300">حظر {teamB.shortName} ✕</span>
                      ) : isPickedA ? (
                        <span className="text-purple-300">اختيار {teamA.shortName} ✓</span>
                      ) : isPickedB ? (
                        <span className="text-cyan-300">اختيار {teamB.shortName} ✓</span>
                      ) : (
                        <span className="text-slate-400">متاحة</span>
                      )}
                    </div>
                  </div>

                  {/* Row 1: Set Live Game + Show Rules on Laptop + Edit Rules + Swap Slot */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mb-2">
                    <button
                      onClick={() => {
                        triggerHaptic(30);
                        sound.playPick('pick');
                        onSetCardStatus(game.id, 'current');
                        onSetActiveGame(game.id);
                        showFeedback(`تم تعيين «${game.nameAr}» كلعبة الجولة الحالية`);
                      }}
                      className={`py-2 px-2.5 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 ${
                        isCurrent
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>{isCurrent ? 'جارية الآن' : 'تعيين للجولة'}</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        broadcastMessage('SWITCH_TAB_COMMAND', 'arena');
                        broadcastMessage('REMOTE_RULES_MODAL', game.id);
                        showFeedback(`تم إظهار قوانين «${game.nameAr}» على شاشة اللابتوب`);
                      }}
                      className="py-2 px-2.5 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 bg-indigo-950/80 border border-indigo-500/50 text-indigo-200"
                    >
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      <span>عرض القوانين</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic(20);
                        setEditingRulesGame(game);
                        setRulesDraft(game.rules || '');
                      }}
                      className="py-2 px-2.5 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-300"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>تعديل القوانين</span>
                    </button>

                    {selectedCategory !== 'all' && (
                      <button
                        onClick={() => {
                          triggerHaptic(20);
                          sound.playTick();
                          setSwapSearchQuery('');
                          setSwapCategoryFilter('all');
                          setEditingGameSlot({ catId: selectedCategory, slotIdx });
                        }}
                        className="py-2 px-2.5 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 bg-slate-900 border border-slate-700 text-slate-200"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>تغيير اللعبة</span>
                      </button>
                    )}
                  </div>

                  {/* Row 2: 4 Direct Ban / Pick Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-bold font-changa">
                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        sound.playPick('pick');
                        onSetCardStatus(game.id, 'picked_team_a');
                        showFeedback(`اختيار ${teamA.shortName}: ${game.nameAr}`);
                      }}
                      className="py-2 px-1 rounded-xl bg-purple-950/90 border border-purple-500/60 text-purple-200 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Check className="w-3 h-3" />
                      <span>اختيار {teamA.shortName}</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        sound.playPick('ban');
                        onSetCardStatus(game.id, 'banned_team_a');
                        showFeedback(`حظر ${teamA.shortName}: ${game.nameAr}`);
                      }}
                      className="py-2 px-1 rounded-xl bg-purple-950/50 border border-purple-800 text-purple-300 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Ban className="w-3 h-3" />
                      <span>حظر {teamA.shortName}</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        sound.playPick('pick');
                        onSetCardStatus(game.id, 'picked_team_b');
                        showFeedback(`اختيار ${teamB.shortName}: ${game.nameAr}`);
                      }}
                      className="py-2 px-1 rounded-xl bg-cyan-950/90 border border-cyan-500/60 text-cyan-200 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Check className="w-3 h-3" />
                      <span>اختيار {teamB.shortName}</span>
                    </button>

                    <button
                      onClick={() => {
                        triggerHaptic(25);
                        sound.playPick('ban');
                        onSetCardStatus(game.id, 'banned_team_b');
                        showFeedback(`حظر ${teamB.shortName}: ${game.nameAr}`);
                      }}
                      className="py-2 px-1 rounded-xl bg-cyan-950/50 border border-cyan-800 text-cyan-300 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <Ban className="w-3 h-3" />
                      <span>حظر {teamB.shortName}</span>
                    </button>
                  </div>

                  {/* Reset Single Card */}
                  {state !== 'available' && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                      <button
                        onClick={() => {
                          triggerHaptic(15);
                          sound.playTick();
                          onSetCardStatus(game.id, 'available');
                          if (currentMatch.activeGameId === game.id) onSetActiveGame(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 font-bold"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>إرجاع البطاقة متاحة</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal: Swap Game in Slot (Full Library Search & Category Filter) */}
          {editingGameSlot && (
            <div className="arena-orig-modal fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90">
              <div className="bg-[#0C1226] border border-indigo-500/50 rounded-3xl max-w-md w-full p-4 text-right flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="font-changa font-bold text-sm text-white">
                    تبديل اللعبة (الخانة #{editingGameSlot.slotIdx + 1})
                  </h3>
                  <button
                    onClick={() => setEditingGameSlot(null)}
                    className="text-xs text-slate-300 px-2.5 py-1 bg-slate-800 rounded-lg"
                  >
                    إغلاق
                  </button>
                </div>

                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={swapSearchQuery}
                    onChange={(e) => setSwapSearchQuery(e.target.value)}
                    placeholder="ابحث عن اللعبة بالاسم..."
                    className="w-full bg-[#070D1F] text-white text-xs pr-9 pl-3 py-2 rounded-xl border border-slate-700 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2">
                  <button
                    onClick={() => setSwapCategoryFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                      swapCategoryFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400'
                    }`}
                  >
                    الكل
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSwapCategoryFilter(c.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap ${
                        swapCategoryFilter === c.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400'
                      }`}
                    >
                      {c.nameAr}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5 overflow-y-auto flex-1 pr-1">
                  {filteredSwapGames.map((spare) => (
                    <button
                      key={spare.id}
                      onClick={() => {
                        triggerHaptic(30);
                        if (onChangeColumnGame) {
                          sound.playPick('pick');
                          onChangeColumnGame(
                            editingGameSlot.catId,
                            editingGameSlot.slotIdx,
                            spare.id
                          );
                          showFeedback(`تم وضع «${spare.nameAr}» في الخانة #${editingGameSlot.slotIdx + 1}`);
                        }
                        setEditingGameSlot(null);
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 text-right flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <GameIcon name={spare.iconType} className="w-5 h-5 text-indigo-400 shrink-0" />
                        <span className="font-bold text-xs text-white truncate">{spare.nameAr}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{spare.nameEn}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Modal: Edit Game Rules Directly From Phone */}
          {editingRulesGame && (
            <div className="arena-orig-modal fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90">
              <div className="bg-[#0C1226] border border-indigo-500/50 rounded-3xl max-w-md w-full p-4 text-right space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="font-changa font-bold text-sm text-white">
                    قوانين لعبة: {editingRulesGame.nameAr}
                  </h3>
                  <button
                    onClick={() => setEditingRulesGame(null)}
                    className="text-xs text-slate-300 px-2.5 py-1 bg-slate-800 rounded-lg"
                  >
                    إغلاق
                  </button>
                </div>

                <textarea
                  rows={6}
                  value={rulesDraft}
                  onChange={(e) => setRulesDraft(e.target.value)}
                  placeholder="اكتب بنود وقوانين اللعبة هنا ليتم حفظها وعرضها على الشاشة..."
                  className="w-full bg-[#070A18] border border-slate-700 rounded-2xl p-3 text-white text-xs leading-relaxed focus:outline-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic(30);
                      if (onSaveGame) {
                        onSaveGame({ ...editingRulesGame, rules: rulesDraft.trim() });
                      }
                      broadcastMessage('REMOTE_RULES_MODAL', editingRulesGame.id);
                      setEditingRulesGame(null);
                      showFeedback('تم حفظ القوانين وعرضها على شاشة اللابتوب');
                    }}
                    className="py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                  >
                    حفظ وعرض على الشاشة
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic(25);
                      if (onSaveGame) {
                        onSaveGame({ ...editingRulesGame, rules: rulesDraft.trim() });
                      }
                      setEditingRulesGame(null);
                      showFeedback('تم حفظ القوانين بنجاح');
                    }}
                    className="py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
                  >
                    حفظ فقط
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: SCORE, TEAMS, CATEGORIES & MATCH FINISH
         ===================================================================== */}
      {activeRemoteTab === 'score' && (
        <div className="p-3.5 space-y-4 flex-1">
          {/* Team Selectors + Swap Sides */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <div className="p-2.5 rounded-2xl bg-purple-950/30 border border-purple-800/60">
              <label className="text-[10px] text-purple-300 font-bold block mb-1">
                الفريق الأول (A):
              </label>
              <select
                value={currentMatch.teamAId}
                onChange={(e) => {
                  triggerHaptic(20);
                  sound.playTick();
                  onChangeTeam('A', e.target.value);
                }}
                className="w-full bg-[#070B19] text-white text-xs font-bold rounded-xl p-2 border border-purple-600/40"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamBId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSwapTeamsPositions}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 active:scale-95 mb-0.5"
              title="تبديل طرفي الفريقين"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>

            <div className="p-2.5 rounded-2xl bg-cyan-950/30 border border-cyan-800/60">
              <label className="text-[10px] text-cyan-300 font-bold block mb-1">
                الفريق الثاني (B):
              </label>
              <select
                value={currentMatch.teamBId}
                onChange={(e) => {
                  triggerHaptic(20);
                  sound.playTick();
                  onChangeTeam('B', e.target.value);
                }}
                className="w-full bg-[#070B19] text-white text-xs font-bold rounded-xl p-2 border border-cyan-600/40"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamAId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Giant Tactile Score Steppers */}
          <div className="grid grid-cols-2 gap-3">
            {/* Team A */}
            <div className="p-4 rounded-3xl bg-[#0B0F24] border-2 border-purple-500/60 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-purple-950 border border-purple-500/50 flex items-center justify-center text-purple-300 mb-1.5">
                <GameIcon name={teamA.logo || 'crown'} className="w-6 h-6" />
              </div>
              <h3 className="font-changa font-bold text-sm text-purple-200 uppercase truncate max-w-full">
                {teamA.name}
              </h3>
              <div className="text-6xl font-orbitron font-black text-white my-2 tabular-nums">
                {currentMatch.teamAScore}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    sound.playTick();
                    onUpdateScore('A', -1);
                  }}
                  disabled={currentMatch.teamAScore <= 0}
                  className="py-3.5 rounded-2xl bg-slate-800 disabled:opacity-30 text-white font-bold flex items-center justify-center active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(35);
                    sound.playScorePoint(true);
                    onUpdateScore('A', 1);
                  }}
                  disabled={currentMatch.teamAScore >= 3}
                  className="py-3.5 rounded-2xl bg-purple-600 disabled:opacity-30 text-white font-bold flex items-center justify-center active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Team B */}
            <div className="p-4 rounded-3xl bg-[#0B0F24] border-2 border-cyan-500/60 flex flex-col items-center">
              <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300 mb-1.5">
                <GameIcon name={teamB.logo || 'shield'} className="w-6 h-6" />
              </div>
              <h3 className="font-changa font-bold text-sm text-cyan-200 uppercase truncate max-w-full">
                {teamB.name}
              </h3>
              <div className="text-6xl font-orbitron font-black text-white my-2 tabular-nums">
                {currentMatch.teamBScore}
              </div>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    sound.playTick();
                    onUpdateScore('B', -1);
                  }}
                  disabled={currentMatch.teamBScore <= 0}
                  className="py-3.5 rounded-2xl bg-slate-800 disabled:opacity-30 text-white font-bold flex items-center justify-center active:scale-95"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(35);
                    sound.playScorePoint(false);
                    onUpdateScore('B', 1);
                  }}
                  disabled={currentMatch.teamBScore >= 3}
                  className="py-3.5 rounded-2xl bg-cyan-600 disabled:opacity-30 text-white font-bold flex items-center justify-center active:scale-95"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Match Categories Selection from Phone */}
          {onSelectCategories && (
            <div className="p-3.5 rounded-2xl bg-[#0D1326] border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">
                  فئات المواجهة المعتمدة ({selectedCategories.length}/5):
                </span>
                <button
                  onClick={() => {
                    triggerHaptic(20);
                    onSelectCategories(categories.map((c) => c.id));
                    showFeedback('تم تحديد جميع الفئات الـ 5');
                  }}
                  className="text-[10px] text-indigo-300 font-bold"
                >
                  تحديد الكل
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                {categories.map((cat) => {
                  const active = selectedCategories.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        triggerHaptic(15);
                        const next = active
                          ? selectedCategories.filter((id) => id !== cat.id)
                          : [...selectedCategories, cat.id];
                        onSelectCategories(next);
                      }}
                      className={`py-2 px-2 rounded-xl text-[11px] font-bold font-changa border transition-colors ${
                        active
                          ? 'bg-indigo-600/40 border-indigo-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                      }`}
                    >
                      {cat.nameAr}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Finish Match & Reset Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              onClick={() => {
                triggerHaptic([40, 60, 80]);
                const winner =
                  currentMatch.teamAScore > currentMatch.teamBScore ? teamA : teamB;
                const loser =
                  currentMatch.teamAScore > currentMatch.teamBScore ? teamB : teamA;
                onFinishMatch();
                broadcastMessage('VICTORY_CELEBRATION_COMMAND', { winner, loser });
                showFeedback(`🏆 تم اعتماد فوز ${winner.name} وتحديث جدول الترتيب!`);
              }}
              disabled={
                (currentMatch.teamAScore === 0 && currentMatch.teamBScore === 0) ||
                currentMatch.teamAScore === currentMatch.teamBScore
              }
              className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-35 text-white font-black font-changa text-sm flex items-center justify-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>اعتماد النتيجة النهائية وإطلاق احتفالية الفوز</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic(35);
                onResetCurrentMatch();
                showFeedback('تم تصفير نتيجة المواجهة الحالية (0 - 0)');
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير النتيجة الحالية (0 - 0)</span>
            </button>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: TIMER & MOBILE BUZZER (STOP THE TIMER + COUNTDOWN)
         ===================================================================== */}
      {activeRemoteTab === 'timer' && (
        <div className="p-3.5 space-y-4 flex-1">
          {/* SECTION A: STOP THE TIMER CHALLENGE & GIANT MOBILE BUZZERS */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-indigo-500/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>بازر تحدي وقف المؤقت (Stop The Timer)</span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  إيقاف لحظي لعداد كل فريق مع حساب الفارق تلقائياً على الشاشة
                </p>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('SWITCH_TAB_COMMAND', 'timer');
                  broadcastMessage('TIMER_COMMAND', { action: 'expand', mode: 'stopwatch' });
                  showFeedback('تم فتح شاشة تحدي وقف المؤقت على اللابتوب');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 border border-indigo-400/60 text-indigo-200 text-[11px] font-bold"
              >
                عرض على الشاشة
              </button>
            </div>

            {/* Target Time & Blind Mode Controls */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-1">
                  الوقت المستهدف (ثانية):
                </span>
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((t) => (
                    <button
                      key={t}
                      onClick={() => {
                        triggerHaptic(15);
                        setTargetSeconds(t);
                        broadcastMessage('TIMER_COMMAND', { action: 'set_target', target: t });
                        showFeedback(`الوقت المستهدف: ${t}.00 ثانية`);
                      }}
                      className={`flex-1 py-1 rounded-lg text-xs font-mono font-bold ${
                        targetSeconds === t
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {t}s
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  const next = !isBlindMode;
                  setIsBlindMode(next);
                  broadcastMessage('TIMER_COMMAND', { action: 'set_blind', blind: next });
                  showFeedback(next ? 'تم تفعيل الوضع الأعمى (إخفاء الأجزاء)' : 'تم إظهار العداد بالكامل');
                }}
                className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1 font-bold text-xs ${
                  isBlindMode
                    ? 'bg-purple-950/60 border-purple-500/60 text-purple-200'
                    : 'bg-slate-900 border-slate-800 text-slate-300'
                }`}
              >
                {isBlindMode ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-cyan-400" />}
                <span>{isBlindMode ? 'الوضع الأعمى: مفعّل' : 'الوضع الأعمى: متوقف'}</span>
              </button>
            </div>

            {/* Start Both Simultaneously & Reset Both */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleStartBothFromPhone}
                className="py-3 px-3 rounded-2xl bg-amber-500 text-slate-950 font-black font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>⚡ انطلاق الاثنين معاً</span>
              </button>

              <button
                onClick={handleResetBothFromPhone}
                className="py-3 px-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>تصفير وفك القفل</span>
              </button>
            </div>

            {/* Two Giant Team Buzzers (2-Tap: 1st Tap Starts, 2nd Tap Stops & Locks) */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onPointerDown={handleBuzzerTapP1}
                className={`min-h-[144px] p-3.5 rounded-3xl border-2 text-white flex flex-col items-center justify-center gap-1.5 transition-all touch-manipulation ${
                  duelPhaseA === 'running'
                    ? 'bg-rose-700 border-rose-300 animate-pulse'
                    : duelPhaseA === 'finished'
                    ? 'bg-slate-900 border-amber-400'
                    : 'border-purple-400 active:scale-95'
                }`}
                style={
                  duelPhaseA === 'idle'
                    ? { backgroundColor: teamA.color || '#7E22CE' }
                    : undefined
                }
              >
                <GameIcon name={teamA.logo || 'crown'} className="w-7 h-7 text-white" />
                <span className="font-changa font-black text-sm uppercase text-center leading-tight">
                  {teamA.name}
                </span>
                {duelPhaseA === 'idle' && (
                  <span className="text-[11px] font-black bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-xl">
                    ▶ ضغطة 1: ابدأ
                  </span>
                )}
                {duelPhaseA === 'running' && (
                  <>
                    <span className="font-orbitron font-black text-sm text-rose-100 tabular-nums">
                      {isBlindMode ? '🙈 مخفي' : `${secsA.toFixed(2)}s`}
                    </span>
                    <span className="text-[11px] font-black bg-white text-rose-900 px-2.5 py-1 rounded-xl">
                      🛑 ضغطة 2: إيقاف!
                    </span>
                  </>
                )}
                {duelPhaseA === 'finished' && (
                  <>
                    <span className="font-orbitron font-black text-lg text-amber-400 tabular-nums">
                      {secsA.toFixed(2)}s
                    </span>
                    <span className="text-[10px] font-bold text-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>مقفل ({diffA >= 0 ? '+' : ''}{diffA.toFixed(2)}ث)</span>
                    </span>
                  </>
                )}
              </button>

              <button
                onPointerDown={handleBuzzerTapP2}
                className={`min-h-[144px] p-3.5 rounded-3xl border-2 text-white flex flex-col items-center justify-center gap-1.5 transition-all touch-manipulation ${
                  duelPhaseB === 'running'
                    ? 'bg-rose-700 border-rose-300 animate-pulse'
                    : duelPhaseB === 'finished'
                    ? 'bg-slate-900 border-amber-400'
                    : 'border-cyan-300 active:scale-95'
                }`}
                style={
                  duelPhaseB === 'idle'
                    ? { backgroundColor: teamB.color || '#0891B2' }
                    : undefined
                }
              >
                <GameIcon name={teamB.logo || 'shield'} className="w-7 h-7 text-white" />
                <span className="font-changa font-black text-sm uppercase text-center leading-tight">
                  {teamB.name}
                </span>
                {duelPhaseB === 'idle' && (
                  <span className="text-[11px] font-black bg-emerald-400 text-slate-950 px-2.5 py-1 rounded-xl">
                    ▶ ضغطة 1: ابدأ
                  </span>
                )}
                {duelPhaseB === 'running' && (
                  <>
                    <span className="font-orbitron font-black text-sm text-rose-100 tabular-nums">
                      {isBlindMode ? '🙈 مخفي' : `${secsB.toFixed(2)}s`}
                    </span>
                    <span className="text-[11px] font-black bg-white text-rose-900 px-2.5 py-1 rounded-xl">
                      🛑 ضغطة 2: إيقاف!
                    </span>
                  </>
                )}
                {duelPhaseB === 'finished' && (
                  <>
                    <span className="font-orbitron font-black text-lg text-amber-400 tabular-nums">
                      {secsB.toFixed(2)}s
                    </span>
                    <span className="text-[10px] font-bold text-amber-200 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>مقفل ({diffB >= 0 ? '+' : ''}{diffB.toFixed(2)}ث)</span>
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Full-Screen Player Buzzer Mode Launchers */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[11px] text-slate-400 font-bold block mb-2">
                تحويل الهاتف لزر بازر أحمر يملأ كامل الشاشة للاعب:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => {
                    triggerHaptic(30);
                    setFullScreenBuzzer('A');
                  }}
                  className="py-2 px-2 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-[11px] font-bold font-changa active:scale-95"
                >
                  بازر كامل: {teamA.shortName}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(30);
                    setFullScreenBuzzer('B');
                  }}
                  className="py-2 px-2 rounded-xl bg-rose-950/80 border border-rose-600/60 text-rose-200 text-[11px] font-bold font-changa active:scale-95"
                >
                  بازر كامل: {teamB.shortName}
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(30);
                    setFullScreenBuzzer('dual');
                  }}
                  className="py-2 px-2 rounded-xl bg-indigo-950/80 border border-indigo-500/60 text-indigo-200 text-[11px] font-bold font-changa active:scale-95"
                >
                  شاشة مقسومة للفريقين
                </button>
              </div>
            </div>
          </div>

          {/* SECTION B: STANDARD COUNTDOWN TIMER REMOTE */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-cyan-400" />
                <span>مؤقت العد التنازلي العام (Countdown)</span>
              </h3>
              <span className="font-orbitron font-bold text-sm text-cyan-300 tabular-nums">
                {remoteTimerSeconds}s
              </span>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {[15, 30, 45, 60, 90, 120].map((seconds) => (
                <button
                  key={seconds}
                  onClick={() => {
                    triggerHaptic(15);
                    sound.playTick();
                    setRemoteTimerSeconds(seconds);
                    broadcastMessage('TIMER_COMMAND', { action: 'set', seconds });
                    showFeedback(`تم ضبط العد التنازلي على ${seconds} ثانية`);
                  }}
                  className={`py-2 rounded-xl font-mono text-xs font-bold border ${
                    remoteTimerSeconds === seconds
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-slate-900 text-slate-300 border-slate-800'
                  }`}
                >
                  {seconds}ث
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic(35);
                  sound.playPick('pick');
                  broadcastMessage('SWITCH_TAB_COMMAND', 'timer');
                  broadcastMessage('TIMER_COMMAND', { action: 'start', seconds: remoteTimerSeconds });
                  showFeedback(`بدأ العد التنازلي (${remoteTimerSeconds} ثانية)`);
                }}
                className="py-3 rounded-2xl bg-emerald-600 text-white font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Play className="w-4 h-4" />
                <span>تشغيل العد التنازلي</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('TIMER_COMMAND', { action: 'pause' });
                  showFeedback('تم إيقاف العد التنازلي مؤقتاً');
                }}
                className="py-3 rounded-2xl bg-amber-600/30 border border-amber-500/50 text-amber-200 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Pause className="w-4 h-4" />
                <span>إيقاف مؤقت</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              <button
                onClick={() => {
                  triggerHaptic(15);
                  sound.playTick();
                  broadcastMessage('TIMER_COMMAND', { action: 'resume' });
                  showFeedback('تم استئناف العد التنازلي');
                }}
                className="py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-bold"
              >
                استئناف
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  sound.playTick();
                  broadcastMessage('TIMER_COMMAND', { action: 'adjust', delta: 10 });
                  showFeedback('+10 ثوانٍ للمؤقت');
                }}
                className="py-2 rounded-xl bg-slate-900 border border-slate-700 text-emerald-300 text-[11px] font-bold"
              >
                +10 ثوانٍ
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  sound.playTick();
                  broadcastMessage('TIMER_COMMAND', { action: 'adjust', delta: -10 });
                  showFeedback('-10 ثوانٍ من المؤقت');
                }}
                className="py-2 rounded-xl bg-slate-900 border border-slate-700 text-rose-300 text-[11px] font-bold"
              >
                -10 ثوانٍ
              </button>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  sound.playTick();
                  broadcastMessage('TIMER_COMMAND', { action: 'reset', seconds: remoteTimerSeconds });
                  showFeedback('تمت إعادة ضبط المؤقت');
                }}
                className="py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold"
              >
                تصفير
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: SCREEN DIRECTOR, MODALS, SCROLL & STAGE SOUNDBOARD FX
         ===================================================================== */}
      {activeRemoteTab === 'director' && (
        <div className="p-3.5 space-y-4 flex-1">
          {/* Full Screen & Overlay Switcher */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-3">
            <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
              <Tv className="w-4 h-4 text-cyan-400" />
              <span>التحكم الكامل بشاشة العرض والنوافذ</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic(25);
                  sound.playTick();
                  broadcastMessage('STAGE_VIEW_COMMAND', true);
                  showFeedback('تم فتح شاشة المسرح (Arena Stage View)');
                }}
                className="py-3 px-3 rounded-2xl bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Maximize2 className="w-4 h-4" />
                <span>فتح شاشة المسرح</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(25);
                  sound.playTick();
                  broadcastMessage('STAGE_VIEW_COMMAND', false);
                  broadcastMessage('CLOSE_ALL_MODALS', true);
                  showFeedback('تم إغلاق شاشة المسرح وجميع النوافذ');
                }}
                className="py-3 px-3 rounded-2xl bg-rose-950/80 border border-rose-600/60 text-rose-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <X className="w-4 h-4" />
                <span>إغلاق أي نافذة مفتوحة (ESC)</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(25);
                  sound.playTick();
                  broadcastMessage('BROADCAST_VIEW_UPDATED', 'scoreboard');
                  broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                  showFeedback('تم فتح شاشة البث: لوحة النتيجة المباشرة');
                }}
                className="py-3 px-3 rounded-2xl bg-purple-950/70 border border-purple-500/60 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Trophy className="w-4 h-4 text-purple-400" />
                <span>بث لوحة النتيجة</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(25);
                  sound.playTick();
                  broadcastMessage('BROADCAST_VIEW_UPDATED', 'games');
                  broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                  showFeedback('تم فتح شاشة البث: جدول الألعاب');
                }}
                className="py-3 px-3 rounded-2xl bg-cyan-950/70 border border-cyan-500/60 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>بث شاشة الألعاب</span>
              </button>
            </div>

            {/* Open Specific Modals on Laptop */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('OPEN_MODAL_COMMAND', 'teams');
                  showFeedback('تم فتح نافذة الفرق على الشاشة');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5 text-purple-400" />
                <span>نافذة إدارة الفرق</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('OPEN_MODAL_COMMAND', 'history');
                  showFeedback('تم فتح سجل المباريات على الشاشة');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>نافذة سجل المباريات</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('OPEN_MODAL_COMMAND', 'settings');
                  showFeedback('تم فتح إعدادات الدوري على الشاشة');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5 text-amber-400" />
                <span>نافذة إعدادات الأسبوع</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('OPEN_MODAL_COMMAND', 'connect');
                  showFeedback('تم إظهار رمز QR لربط الهواتف على الشاشة');
                }}
                className="py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>إظهار باركود الربط QR</span>
              </button>
            </div>
          </div>

          {/* Remote Page Scroll Pad (لا حاجة لعجلة الماوس) */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-2.5">
            <h3 className="font-changa font-bold text-sm text-white">
              تحريك وتمرير شاشة اللابتوب (Scroll Pad)
            </h3>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => {
                  triggerHaptic(15);
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'top');
                }}
                className="py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 active:scale-95"
              >
                <ChevronsUp className="w-4 h-4 text-cyan-400" />
                <span>أعلى الصفحة</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'up');
                }}
                className="py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 active:scale-95"
              >
                <ArrowUp className="w-4 h-4 text-indigo-400" />
                <span>تمرير لأعلى</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'down');
                }}
                className="py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 active:scale-95"
              >
                <ArrowDown className="w-4 h-4 text-indigo-400" />
                <span>تمرير لأسفل</span>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(15);
                  broadcastMessage('SCROLL_PAGE_COMMAND', 'bottom');
                }}
                className="py-3 rounded-2xl bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold flex flex-col items-center gap-1 active:scale-95"
              >
                <ChevronsDown className="w-4 h-4 text-cyan-400" />
                <span>أسفل الصفحة</span>
              </button>
            </div>
          </div>

          {/* Stage Soundboard & Visual FX */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-2.5">
            <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-amber-400" />
              <span>لوحة المؤثرات الصوتية والبصرية للمسرح</span>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  triggerHaptic(35);
                  sound.playRoundBell();
                  broadcastMessage('STAGE_FX_COMMAND', 'bell');
                  showFeedback('🔔 تم إطلاق جرس الجولة!');
                }}
                className="py-3 px-3 rounded-2xl bg-amber-500/20 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>🔔 جرس بداية الجولة</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(45);
                  sound.playBuzzer();
                  broadcastMessage('STAGE_FX_COMMAND', 'buzzer');
                  showFeedback('🚨 تم إطلاق صافرة النهاية!');
                }}
                className="py-3 px-3 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Radio className="w-4 h-4" />
                <span>🚨 بوق انتهاء الوقت</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(35);
                  broadcastMessage('STAGE_FX_COMMAND', 'confetti');
                  showFeedback('🎉 تم إطلاق الورق المتطاير على الشاشة!');
                }}
                className="py-3 px-3 rounded-2xl bg-purple-600/25 border border-purple-500/50 text-purple-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>🎉 إطلاق احتفالية Confetti</span>
              </button>

              <button
                onClick={() => {
                  triggerHaptic(35);
                  broadcastMessage('STAGE_FX_COMMAND', 'shake');
                  showFeedback('💥 تم تفعيل هزّة الشاشة الحماسية!');
                }}
                className="py-3 px-3 rounded-2xl bg-cyan-600/25 border border-cyan-500/50 text-cyan-200 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4" />
                <span>💥 هزّة الشاشة الحماسية</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: LEAGUE SETTINGS, STANDINGS, TEAMS EDITOR & HISTORY
         ===================================================================== */}
      {activeRemoteTab === 'league' && (
        <div className="p-3.5 space-y-4 flex-1">
          {/* Week & Points Settings directly on Phone */}
          {onSaveLeagueSettings && (
            <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                  <Settings className="w-4 h-4 text-amber-400" />
                  <span>إعدادات الأسبوع ونقاط الفوز</span>
                </h3>
                <span className="text-xs font-bold text-amber-300">
                  الأسبوع الحالي: {leagueSettings.currentWeek}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((weekNum) => {
                  const isCurrentWeek = leagueSettings.currentWeek === weekNum;
                  const pts = leagueSettings.pointsByWeek[weekNum] ?? (weekNum + 2);
                  return (
                    <div
                      key={weekNum}
                      className={`p-2.5 rounded-2xl border text-center ${
                        isCurrentWeek
                          ? 'bg-indigo-950/70 border-indigo-400'
                          : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <button
                        onClick={() => {
                          triggerHaptic(20);
                          onSaveLeagueSettings({
                            ...leagueSettings,
                            currentWeek: weekNum,
                          });
                          showFeedback(`تم تفعيل الأسبوع ${weekNum}`);
                        }}
                        className="w-full text-xs font-bold font-changa text-white mb-1.5"
                      >
                        الأسبوع {weekNum} {isCurrentWeek ? '✓' : ''}
                      </button>
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => {
                            triggerHaptic(15);
                            onSaveLeagueSettings({
                              ...leagueSettings,
                              pointsByWeek: {
                                ...leagueSettings.pointsByWeek,
                                [weekNum]: Math.max(1, pts - 1),
                              },
                            });
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="font-orbitron font-bold text-xs text-amber-300 tabular-nums">
                          {pts}ن
                        </span>
                        <button
                          onClick={() => {
                            triggerHaptic(15);
                            onSaveLeagueSettings({
                              ...leagueSettings,
                              pointsByWeek: {
                                ...leagueSettings.pointsByWeek,
                                [weekNum]: pts + 1,
                              },
                            });
                          }}
                          className="w-6 h-6 rounded bg-slate-800 text-white text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live Standings Mini Table */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>جدول الترتيب الحالي</span>
              </h3>
              <button
                onClick={() => {
                  triggerHaptic(20);
                  broadcastMessage('SWITCH_TAB_COMMAND', 'standings');
                  showFeedback('تم عرض جدول الترتيب على شاشة اللابتوب');
                }}
                className="text-[11px] text-cyan-300 font-bold"
              >
                عرض على الشاشة
              </button>
            </div>

            <div className="space-y-1.5">
              {standings.map((row, idx) => (
                <div
                  key={row.team.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 text-center font-orbitron font-bold text-slate-400 tabular-nums">
                      {idx + 1}
                    </span>
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: row.team.color }}
                    />
                    <span className="font-changa font-bold text-white">{row.team.name}</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">
                      فوز:{row.won} خ:{row.lost}
                    </span>
                    <span className="font-orbitron font-black text-amber-300 tabular-nums">
                      {row.points} ن
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Teams Quick Editor from Phone */}
          {onSaveTeams && (
            <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-2.5">
              <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                <Users className="w-4 h-4 text-purple-400" />
                <span>تعديل بيانات وأسماء الفرق من الهاتف</span>
              </h3>
              <div className="space-y-2">
                {teams.map((t) => (
                  <div key={t.id} className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800">
                    {editingTeamId === t.id && teamDraft ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={teamDraft.name}
                            onChange={(e) => setTeamDraft({ ...teamDraft, name: e.target.value })}
                            placeholder="اسم الفريق"
                            className="bg-[#070B19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          />
                          <input
                            type="text"
                            value={teamDraft.shortName}
                            onChange={(e) =>
                              setTeamDraft({ ...teamDraft, shortName: e.target.value })
                            }
                            placeholder="الاختصار"
                            className="bg-[#070B19] border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={teamDraft.color}
                            onChange={(e) => setTeamDraft({ ...teamDraft, color: e.target.value })}
                            className="w-10 h-8 rounded bg-transparent border-0"
                          />
                          <button
                            onClick={() => {
                              triggerHaptic(25);
                              const updated = teams.map((item) =>
                                item.id === t.id ? teamDraft : item
                              );
                              onSaveTeams(updated);
                              setEditingTeamId(null);
                              setTeamDraft(null);
                              showFeedback(`تم تحديث بيانات ${teamDraft.name}`);
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => {
                              setEditingTeamId(null);
                              setTeamDraft(null);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="font-bold text-xs text-white">{t.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ({t.shortName})
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setEditingTeamId(t.id);
                            setTeamDraft({ ...t });
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-indigo-300 text-[11px] font-bold flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>تعديل</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matches History & League Reset */}
          <div className="p-4 rounded-3xl bg-[#0D1326] border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
                <History className="w-4 h-4 text-cyan-400" />
                <span>سجل المواجهات ({matchesHistory.length})</span>
              </h3>
            </div>

            {matchesHistory.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">لا توجد مباريات مسجلة حتى الآن.</p>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto">
                {matchesHistory.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">
                        {m.teamAName} ({m.teamAScore}) - ({m.teamBScore}) {m.teamBName}
                      </span>
                      <span className="block text-[10px] text-slate-400">{m.date}</span>
                    </div>
                    {onDeleteMatch && (
                      <button
                        onClick={() => {
                          triggerHaptic(25);
                          onDeleteMatch(m.id);
                          showFeedback('تم حذف المباراة من السجل');
                        }}
                        className="p-1.5 rounded-lg bg-rose-950/70 text-rose-300"
                        title="حذف المباراة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {onResetLeague && (
              <div className="pt-2 border-t border-slate-800">
                {!confirmResetLeague ? (
                  <button
                    onClick={() => setConfirmResetLeague(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-950/60 border border-rose-800/70 text-rose-300 text-xs font-bold"
                  >
                    تصفير الدوري بالكامل
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        triggerHaptic(50);
                        onResetLeague();
                        setConfirmResetLeague(false);
                        showFeedback('تم تصفير الدوري بالكامل');
                      }}
                      className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
                    >
                      تأكيد التصفير النهائي
                    </button>
                    <button
                      onClick={() => setConfirmResetLeague(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                    >
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          BOTTOM PINNED 5-TAB NAVIGATION DOCK (THUMB-FRIENDLY)
         ===================================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#0A0F22] border-t border-slate-800 px-2 py-1.5 grid grid-cols-5 gap-1 shadow-2xl">
        {[
          { id: 'games', label: 'الألعاب', icon: Swords },
          { id: 'score', label: 'النتيجة', icon: Trophy },
          { id: 'timer', label: 'المؤقت/بازر', icon: Timer },
          { id: 'director', label: 'المخرج', icon: Tv },
          { id: 'league', label: 'الدوري', icon: Settings },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeRemoteTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic(15);
                sound.playTick();
                setActiveRemoteTab(item.id as RemoteTab);
              }}
              className={`py-2 px-1 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[10px] font-changa leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
