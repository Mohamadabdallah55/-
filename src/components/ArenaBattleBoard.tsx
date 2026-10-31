import React, { useState, useEffect } from 'react';
import { GameItem, BanPickStatus, Team, CategoryInfo } from '../types';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { GameIcon } from './GameIcons';
import { sound } from '../utils/audio';
import {
  loadArenaColumnGames,
  saveArenaColumnGames,
  DEFAULT_ARENA_COLUMN_GAMES,
  subscribeToBroadcast,
} from '../utils/storage';
import {
  Check,
  RotateCcw,
  Play,
  Maximize2,
  Minimize2,
  Sparkles,
  X,
  Shuffle,
  Search,
  BookOpen,
  Crown,
  Swords,
  ShieldAlert,
} from 'lucide-react';
import { GameRulesModal } from './GameRulesModal';

interface ArenaBattleBoardProps {
  games: GameItem[];
  categories: CategoryInfo[];
  cardStates: Record<string, { gameId: string; status: BanPickStatus }>;
  teamA: Team;
  teamB: Team;
  activeGameId: string | null;
  onSetCardStatus: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame: (gameId: string | null) => void;
  onResetAllBansPicks: () => void;
  onSaveGameRules?: (gameId: string, rules: string) => void;
}

export const ArenaBattleBoard: React.FC<ArenaBattleBoardProps> = ({
  games,
  categories,
  cardStates,
  teamA,
  teamB,
  activeGameId,
  onSetCardStatus,
  onSetActiveGame,
  onResetAllBansPicks,
  onSaveGameRules,
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameItem | null>(null);
  const [selectedRulesGame, setSelectedRulesGame] = useState<{
    game: GameItem;
    category?: CategoryInfo;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Column games map: { digital: [...3 ids], mental: [...3 ids], physical: [...3 ids], fan_vote: [...3 ids], '1v1': [...3 ids] }
  const [columnGamesMap, setColumnGamesMap] = useState<Record<string, string[]>>(() =>
    loadArenaColumnGames()
  );

  // Library picker target: which category and which slot (0, 1, or 2)
  const [pickerTarget, setPickerTarget] = useState<{
    catId: string;
    catLabel: string;
    slotIndex: number;
    currentGameId?: string;
  } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [libraryFilterCategory, setLibraryFilterCategory] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Cross-tab broadcast listener for column games
  useEffect(() => {
    const unsub = subscribeToBroadcast((type, payload) => {
      if (type === 'ARENA_GAMES_UPDATED') {
        setColumnGamesMap(payload as Record<string, string[]>);
      }
    });
    return unsub;
  }, []);

  // 5 Arena Categories Setup in exact order: Digital, Mental, Physical, Fan Vote, 1v1 Captains Duel (last)
  const arenaColumns: Array<{
    catId: string;
    label: string;
    subLabel: string;
    headerColor: string;
    glowColor: string;
    isCaptains?: boolean;
    isFanVote?: boolean;
  }> = [
    {
      catId: 'digital',
      label: 'DIGITAL',
      subLabel: 'إلكتروني',
      headerColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.4)',
    },
    {
      catId: 'mental',
      label: 'MENTAL',
      subLabel: 'ذكاء',
      headerColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.4)',
    },
    {
      catId: 'physical',
      label: 'PHYSICAL',
      subLabel: 'بدني',
      headerColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.4)',
    },
    {
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.45)',
      isFanVote: true,
    },
    {
      catId: '1v1',
      label: 'CAPTAINS DUEL',
      subLabel: 'تحدي الكباتن · 1 ضد 1',
      headerColor: '#F59E0B',
      glowColor: 'rgba(245, 158, 11, 0.5)',
      isCaptains: true,
    },
  ];

  const handleCardClick = (game: GameItem) => {
    sound.playTick();
    setSelectedGameForModal(game);
  };

  const handleAction = (status: BanPickStatus) => {
    if (!selectedGameForModal) return;
    if (status.startsWith('banned')) {
      sound.playPick('ban');
    } else {
      sound.playPick('pick');
    }
    onSetCardStatus(selectedGameForModal.id, status);
    if (status === 'current') {
      onSetActiveGame(selectedGameForModal.id);
    } else if (activeGameId === selectedGameForModal.id) {
      onSetActiveGame(null);
    }
    setSelectedGameForModal(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Open library picker for any slot in any category
  const handleOpenLibraryPicker = (
    catId: string,
    catLabel: string,
    slotIndex: number,
    currentGameId?: string
  ) => {
    setPickerTarget({ catId, catLabel, slotIndex, currentGameId });
    setSearchQuery('');
    setLibraryFilterCategory('all');
    sound.playTick();
  };

  // Select a new game from library to replace that slot
  const handleSelectGameForSlot = (chosenGame: GameItem) => {
    if (!pickerTarget) return;
    const { catId, slotIndex } = pickerTarget;

    const currentSlots = columnGamesMap[catId]
      ? [...columnGamesMap[catId]]
      : columnGamesMap['captains'] && catId === '1v1'
      ? [...columnGamesMap['captains']]
      : [...(DEFAULT_ARENA_COLUMN_GAMES[catId] || DEFAULT_ARENA_COLUMN_GAMES['captains'] || [])];

    const replacedGameId = currentSlots[slotIndex];
    currentSlots[slotIndex] = chosenGame.id;

    const nextMap: Record<string, string[]> = {
      ...columnGamesMap,
      [catId]: currentSlots,
      ...(catId === '1v1' ? { captains: currentSlots, '1v1': currentSlots } : {}),
      ...(catId === 'captains' ? { '1v1': currentSlots, captains: currentSlots } : {}),
    };

    setColumnGamesMap(nextMap);
    saveArenaColumnGames(nextMap);
    if (activeGameId === replacedGameId) onSetActiveGame(chosenGame.id);
    setPickerTarget(null);
    setSelectedGameForModal(null);
    sound.playPick('pick');
    setActionFeedback(`✓ تم تعيين لعبة "${chosenGame.nameAr}" في خانة ${pickerTarget.catLabel}!`);
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Reset arena column games to defaults
  const handleResetToDefaultGames = () => {
    sound.playTick();
    setColumnGamesMap(DEFAULT_ARENA_COLUMN_GAMES);
    saveArenaColumnGames(DEFAULT_ARENA_COLUMN_GAMES);
    setActionFeedback('✓ تم استعادة التشكيلة الافتراضية لجميع ألعاب الفئات الـ 5 بنجاح!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleResetAllCards = () => {
    sound.playTick();
    onResetAllBansPicks();
    setActionFeedback('✓ تم تصفير وإعادة ضبط جميع بطاقات واستبعادات الألعاب بنجاح!');
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Filtered games list in the picker modal
  const filteredLibraryGames = games.filter((game) => {
    const matchesSearch =
      game.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.description && game.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      libraryFilterCategory === 'all' ||
      (libraryFilterCategory === '1v1'
        ? game.categoryId === '1v1' || game.categoryId === 'captains'
        : game.categoryId === libraryFilterCategory);

    return matchesSearch && matchesCategory;
  });

  const decisionsCount = Object.values(cardStates).filter(
    (card) => card.status !== 'available'
  ).length;

  const getCardStatus = (gameId: string) => {
    const status = cardStates[gameId]?.status || 'available';
    if (activeGameId === gameId || status === 'current') {
      return { label: 'تلعب الآن', code: 'LIVE', state: 'current' as const };
    }
    if (status === 'picked_team_a') {
      return { label: `اختيار ${teamA.shortName}`, code: 'PICKED', state: 'picked-a' as const };
    }
    if (status === 'picked_team_b') {
      return { label: `اختيار ${teamB.shortName}`, code: 'PICKED', state: 'picked-b' as const };
    }
    if (status === 'banned_team_a') {
      return { label: `حظر ${teamA.shortName}`, code: 'BANNED', state: 'banned-a' as const };
    }
    if (status === 'banned_team_b') {
      return { label: `حظر ${teamB.shortName}`, code: 'BANNED', state: 'banned-b' as const };
    }
    return { label: 'متاحة للاختيار', code: 'AVAILABLE', state: 'available' as const };
  };

  return (
    <div className="w-full relative select-none font-cairo">
      {/* Toast Notification */}
      {actionFeedback && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-emerald-950/95 border border-emerald-500/80 text-emerald-200 text-sm font-bold shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full bg-[#0C1226]/90 border border-slate-800 rounded-3xl p-4 sm:p-7 shadow-2xl backdrop-blur-md">
        {/* Top Header & Action Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
              <h2 className="text-xl sm:text-2xl font-black font-changa text-white">
                ميدان الحظر والاختيار (Arena Draft & Pick)
              </h2>
              <span className="text-[11px] font-mono px-3 py-1 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 font-bold">
                5 جولات متكاملة
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              اختر أو احظر ألعاب المواجهة لكل فئة، أو حدد لعبة الجولة الحالية للمباراة.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetToDefaultGames}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="استعادة التشكيلة الافتراضية لجميع الألعاب"
            >
              <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
              <span>استعادة التشكيلة</span>
            </button>

            <button
              onClick={handleResetAllCards}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-xl transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              title="تصفير حالات الحظر والاختيار"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
              <span>تصفير الاختيارات</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Duel Matchup Banner */}
        <div className="w-full bg-[#080E20] border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 flex items-center justify-between gap-4 shadow-inner">
          {/* Team A Badge */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-lg"
              style={{
                backgroundColor: `${teamA.color || '#A855F7'}22`,
                borderColor: teamA.color || '#A855F7',
                color: teamA.color || '#A855F7',
                boxShadow: `0 0 20px ${teamA.color || '#A855F7'}40`,
              }}
            >
              <GameIcon name={teamA.logo || 'crown'} className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 block">
                الفريق الأول (A) {teamA.captain && `· الكابتن: ${teamA.captain}`}
              </span>
              <h3 className="text-base sm:text-xl font-black font-changa text-white truncate">
                {teamA.name}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 inline-block font-bold">
                {teamA.shortName}
              </span>
            </div>
          </div>

          {/* VS Center */}
          <div className="flex flex-col items-center justify-center shrink-0 px-2 sm:px-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg">
              <div className="w-full h-full bg-[#080E20] rounded-[14px] flex items-center justify-center">
                <span className="font-orbitron font-black text-sm text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-300">
                  VS
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono font-bold text-slate-400 mt-1 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
              {decisionsCount} قرار مسجل
            </span>
          </div>

          {/* Team B Badge */}
          <div className="flex items-center gap-3 min-w-0 flex-row-reverse text-left">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 shadow-lg"
              style={{
                backgroundColor: `${teamB.color || '#06B6D4'}22`,
                borderColor: teamB.color || '#06B6D4',
                color: teamB.color || '#06B6D4',
                boxShadow: `0 0 20px ${teamB.color || '#06B6D4'}40`,
              }}
            >
              <GameIcon name={teamB.logo || 'shield'} className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-400 block">
                الفريق الثاني (B) {teamB.captain && `· الكابتن: ${teamB.captain}`}
              </span>
              <h3 className="text-base sm:text-xl font-black font-changa text-white truncate">
                {teamB.name}
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-block font-bold">
                {teamB.shortName}
              </span>
            </div>
          </div>
        </div>

        {/* Legend Bar */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mb-6 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800/80">
          <span className="font-bold text-white font-changa">دليل الحالات:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
            <span>اختيار {teamA.shortName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
            <span>اختيار {teamB.shortName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded flex items-center justify-center font-black text-purple-400 text-xs font-mono bg-purple-950 border border-purple-800">
              ✕
            </span>
            <span>استبعاد {teamA.shortName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded flex items-center justify-center font-black text-cyan-400 text-xs font-mono bg-cyan-950 border border-cyan-800">
              ✕
            </span>
            <span>استبعاد {teamB.shortName}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
            <span>تلعب الآن</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-600" />
            <span>متاحة</span>
          </div>
        </div>

        {/* The 5 Columns Grid (with horizontal scroll on smaller screens) */}
        <div className="w-full overflow-x-auto pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 min-w-[950px] lg:min-w-0">
            {arenaColumns.map((col, colIdx) => {
              const configuredIds =
                columnGamesMap[col.catId] ||
                (col.catId === '1v1' ? columnGamesMap['captains'] : undefined) ||
                DEFAULT_ARENA_COLUMN_GAMES[col.catId] ||
                (col.catId === '1v1' ? DEFAULT_ARENA_COLUMN_GAMES['captains'] : undefined) ||
                [];

              let colGames = configuredIds
                .map(
                  (id) =>
                    games.find((g) => g.id === id) || DEFAULT_GAMES.find((g) => g.id === id)
                )
                .filter(Boolean) as GameItem[];

              // Fallback filling if missing
              if (colGames.length < 3) {
                const fallback = DEFAULT_GAMES.filter(
                  (g) =>
                    (col.catId === '1v1'
                      ? g.categoryId === '1v1' || g.categoryId === 'captains'
                      : g.categoryId === col.catId) &&
                    !colGames.some((item) => item.id === g.id)
                );
                colGames = [...colGames, ...fallback.slice(0, 3 - colGames.length)];
              }

              const markedCount = colGames.filter(
                (g) => getCardStatus(g.id).state !== 'available'
              ).length;

              return (
                <div
                  key={col.catId}
                  className={`flex flex-col rounded-3xl p-3.5 sm:p-4 border transition-all ${
                    col.isCaptains
                      ? 'bg-amber-950/20 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.12)]'
                      : 'bg-slate-900/60 border-slate-800 shadow-lg'
                  }`}
                  style={{
                    borderColor: col.isCaptains ? undefined : `${col.headerColor}35`,
                  }}
                >
                  {/* Category Pillar Header */}
                  <div
                    className="w-full py-3 px-3.5 rounded-2xl mb-4 border flex items-center justify-between gap-2 shadow-md"
                    style={{
                      backgroundColor: `${col.headerColor}18`,
                      borderColor: `${col.headerColor}50`,
                      boxShadow: `0 0 20px ${col.glowColor}`,
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-7 h-7 rounded-xl flex items-center justify-center font-orbitron font-black text-xs shrink-0 text-slate-950"
                        style={{ backgroundColor: col.headerColor }}
                      >
                        0{colIdx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-extrabold text-sm sm:text-base font-changa text-white truncate flex items-center gap-1.5">
                          {col.isCaptains && <Crown className="w-4 h-4 text-amber-400 shrink-0" />}
                          <span>{col.subLabel}</span>
                        </div>
                        <div
                          className="text-[10px] font-mono tracking-wider uppercase font-bold truncate"
                          style={{ color: col.headerColor }}
                        >
                          {col.label}
                        </div>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-black/40 text-white shrink-0 border border-white/10">
                      {markedCount}/3
                    </span>
                  </div>

                  {/* 3 Game Cards Stack */}
                  <div className="flex flex-col gap-3.5 flex-1">
                    {colGames.slice(0, 3).map((game, slotIndex) => {
                      const status = getCardStatus(game.id);
                      const isCurrent = status.state === 'current';
                      const isPickedA = status.state === 'picked-a';
                      const isPickedB = status.state === 'picked-b';
                      const isBannedA = status.state === 'banned-a';
                      const isBannedB = status.state === 'banned-b';
                      const isBanned = isBannedA || isBannedB;

                      return (
                        <div
                          key={`${col.catId}-${slotIndex}-${game.id}`}
                          className={`relative group rounded-2xl p-3.5 border transition-all flex flex-col justify-between min-h-[175px] ${
                            isCurrent
                              ? 'bg-amber-950/40 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_25px_rgba(251,191,36,0.45)]'
                              : isPickedA
                              ? 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/70 shadow-[0_0_25px_rgba(168,85,247,0.4)]'
                              : isPickedB
                              ? 'bg-cyan-950/50 border-cyan-500 ring-2 ring-cyan-500/70 shadow-[0_0_25px_rgba(6,182,212,0.4)]'
                              : isBanned
                              ? 'bg-slate-950/80 border-slate-800 opacity-65 hover:opacity-100'
                              : 'bg-[#080E20] border-slate-800/90 hover:border-slate-700 hover:bg-[#0C142B]'
                          }`}
                        >
                          {/* Top row: Slot index & Live badge */}
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                              #{slotIndex + 1}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 animate-pulse">
                                LIVE 🔴
                              </span>
                            )}
                          </div>

                          {/* Center: Game Icon with Hexagonal Container & Ban Cross */}
                          <div
                            onClick={() => handleCardClick(game)}
                            className="relative my-1 flex flex-col items-center cursor-pointer group-hover:scale-105 transition-transform"
                          >
                            <div
                              className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-colors shadow-lg ${
                                isCurrent
                                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                                  : isPickedA
                                  ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                                  : isPickedB
                                  ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                                  : 'bg-slate-900/90 border-slate-700 text-slate-200'
                              }`}
                              style={{
                                borderColor:
                                  !isCurrent && !isPickedA && !isPickedB
                                    ? `${col.headerColor}40`
                                    : undefined,
                              }}
                            >
                              <GameIcon name={game.iconType} className="w-8 h-8" />
                            </div>

                            {/* Banned Giant ✕ Cross Overlay */}
                            {isBannedA && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-5xl font-black text-purple-500 drop-shadow-[0_0_12px_rgba(168,85,247,0.9)] select-none">
                                  ✕
                                </span>
                              </div>
                            )}
                            {isBannedB && (
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] select-none">
                                  ✕
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Titles & Status Pill */}
                          <div className="text-center mt-2">
                            <h4
                              onClick={() => handleCardClick(game)}
                              className="font-black text-base text-white font-changa line-clamp-1 cursor-pointer hover:text-amber-300 transition-colors"
                            >
                              {game.nameAr}
                            </h4>
                            <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider line-clamp-1">
                              {game.nameEn}
                            </p>

                            {/* Status Pill */}
                            <div className="mt-2 flex justify-center">
                              {isCurrent && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/60 font-bold animate-pulse">
                                  {status.label}
                                </span>
                              )}
                              {isPickedA && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-600/30 text-purple-200 border border-purple-500/60 font-bold">
                                  {status.label}
                                </span>
                              )}
                              {isPickedB && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-600/30 text-cyan-200 border border-cyan-500/60 font-bold">
                                  {status.label}
                                </span>
                              )}
                              {isBannedA && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-700 font-bold">
                                  {status.label}
                                </span>
                              )}
                              {isBannedB && (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-700 font-bold">
                                  {status.label}
                                </span>
                              )}
                              {status.state === 'available' && (
                                <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-mono border border-slate-800">
                                  متاحة للاختيار
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Row */}
                          <div className="grid grid-cols-3 gap-1.5 mt-3 pt-3 border-t border-slate-800/80">
                            <button
                              onClick={() => handleCardClick(game)}
                              className="py-1.5 px-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
                              title="إدارة الحظر والاختيار"
                            >
                              <Swords className="w-3.5 h-3.5 shrink-0" />
                              <span>إدارة</span>
                            </button>

                            <button
                              onClick={() =>
                                handleOpenLibraryPicker(
                                  col.catId,
                                  col.subLabel,
                                  slotIndex,
                                  game.id
                                )
                              }
                              className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700"
                              title="تبديل هذه اللعبة بأي لعبة من المكتبة"
                            >
                              <Shuffle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>تبديل</span>
                            </button>

                            <button
                              onClick={() =>
                                setSelectedRulesGame({
                                  game,
                                  category: categories.find((c) => c.id === game.categoryId),
                                })
                              }
                              className="py-1.5 px-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-700"
                              title="قوانين وتعليمات اللعبة"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span>قوانين</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Arena Footer Info */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center font-orbitron font-bold text-indigo-300 text-xs">
              05
            </span>
            <span className="font-bold text-slate-300">
              جميع الفئات متاحة أمامك بالتوازي — الجولة الخامسة مخصصة لتحدي 1 ضد 1
            </span>
          </div>
          <span className="text-slate-400 text-[11px]">
            اضغط على «إدارة» لتسجيل قرارات الفريقين، أو «تبديل» لاختيار أي لعبة من بنك الألعاب
          </span>
        </div>
      </div>

      {/* Action Modal on clicking any card in the arena */}
      {selectedGameForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in text-right">
          <div className="bg-[#0C1226] border-2 border-indigo-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedGameForModal(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-[#080E20] border-2 border-indigo-400 flex items-center justify-center p-2 shrink-0 shadow-lg">
                <GameIcon name={selectedGameForModal.iconType} className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-changa text-white">
                  {selectedGameForModal.nameAr}
                </h3>
                <p className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {selectedGameForModal.nameEn}
                </p>
                {selectedGameForModal.description && (
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedGameForModal.description}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons for Ban & Pick */}
            <p className="text-xs font-bold text-slate-300 mb-3 font-changa">
              حدد قرار الفريقين في هذه الجولة:
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Ban Team A */}
              <button
                onClick={() => handleAction('banned_team_a')}
                className="p-3.5 rounded-2xl border border-purple-700 bg-purple-950/70 hover:bg-purple-900 text-purple-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamA.shortName})</span>
              </button>

              {/* Ban Team B */}
              <button
                onClick={() => handleAction('banned_team_b')}
                className="p-3.5 rounded-2xl border border-cyan-700 bg-cyan-950/70 hover:bg-cyan-900 text-cyan-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamB.shortName})</span>
              </button>

              {/* Pick Team A */}
              <button
                onClick={() => handleAction('picked_team_a')}
                className="p-3.5 rounded-2xl border border-purple-500 bg-purple-600/50 hover:bg-purple-600/80 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <Check className="w-4 h-4 text-purple-200" />
                <span>اختيار ({teamA.shortName})</span>
              </button>

              {/* Pick Team B */}
              <button
                onClick={() => handleAction('picked_team_b')}
                className="p-3.5 rounded-2xl border border-cyan-500 bg-cyan-600/50 hover:bg-cyan-600/80 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-[1.02]"
              >
                <Check className="w-4 h-4 text-cyan-200" />
                <span>اختيار ({teamB.shortName})</span>
              </button>
            </div>

            {/* Set Current Playing Game */}
            <button
              onClick={() => handleAction('current')}
              className="w-full py-3.5 px-4 rounded-2xl border border-amber-500 bg-amber-500/25 hover:bg-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 mb-2.5 transition-all cursor-pointer shadow-md"
            >
              <Play className="w-4 h-4 fill-amber-300" />
              <span>تعيين كلعبة الجولة الحالية للمباراة (Live Round)</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => handleAction('available')}
              className="w-full py-2.5 px-3 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              إلغاء التحديد وإرجاعها للمتاح
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL LIBRARY VAULT PICKER MODAL (FOR ALL 5 CATEGORIES) */}
      {pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/90 animate-fade-in text-right">
          <div className="bg-[#0C1226] border-2 border-indigo-500/60 rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPickerTarget(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg sm:text-xl font-black font-changa text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-400" />
                <span>
                  تغيير لعبة: {pickerTarget.catLabel} (الخانة #{pickerTarget.slotIndex + 1})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 font-cairo">
                اختر أي لعبة من المكتبة الكاملة لتثبيتها في هذه الخانة. التغيير فوري وسلس للغاية.
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-4">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن أي لعبة بالاسم أو الوصف..."
                  className="w-full bg-[#070D1F] text-white text-xs pl-3 pr-10 py-2.5 rounded-xl border border-slate-700 focus:border-indigo-400 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setLibraryFilterCategory('all')}
                  className={`px-3 py-1.5 text-xs rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer ${
                    libraryFilterCategory === 'all'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  الكل ({games.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setLibraryFilterCategory(c.id)}
                    className={`px-2.5 py-1.5 text-xs rounded-xl whitespace-nowrap font-bold transition-all cursor-pointer ${
                      libraryFilterCategory === c.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Games Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3 p-1 min-h-[320px]">
              {filteredLibraryGames.map((game) => {
                const isCurrentlySelected = pickerTarget.currentGameId === game.id;

                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGameForSlot(game)}
                    className={`flex items-center gap-3 p-3 rounded-2xl text-right transition-all group border cursor-pointer ${
                      isCurrentlySelected
                        ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-400 shadow-lg'
                        : 'bg-[#080E20] hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/70 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-[#070D1F] border border-slate-700 group-hover:border-indigo-400 flex items-center justify-center shrink-0 p-1">
                      <GameIcon name={game.iconType} className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white font-changa truncate group-hover:text-indigo-300">
                          {game.nameAr}
                        </h4>
                        {isCurrentlySelected && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400 font-bold shrink-0">
                            الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase truncate font-mono mt-0.5">
                        {game.nameEn}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredLibraryGames.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <p>لا توجد ألعاب مطابقة لبحثك.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Rules Modal */}
      {selectedRulesGame && (
        <GameRulesModal
          game={selectedRulesGame.game}
          category={selectedRulesGame.category}
          onSaveRules={(gameId, rules) => {
            if (onSaveGameRules) {
              onSaveGameRules(gameId, rules);
            }
            setSelectedRulesGame((prev) =>
              prev ? { ...prev, game: { ...prev.game, rules } } : null
            );
          }}
          onClose={() => setSelectedRulesGame(null)}
        />
      )}
    </div>
  );
};
