import React, { useState, useEffect } from 'react';
import { GameItem, BanPickStatus, Team, CategoryInfo } from '../types';
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
  Flame,
  Search,
  BookOpen,
  Scale,
  Crown,
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

  // Column games map: { digital: [...3 ids], mental: [...3 ids], physical: [...3 ids], '1v1': [...3 ids], fan_vote: [...3 ids] }
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

  // Cross-tab broadcast listener for column games
  useEffect(() => {
    const unsub = subscribeToBroadcast((type, payload) => {
      if (type === 'ARENA_GAMES_UPDATED') {
        setColumnGamesMap(payload as Record<string, string[]>);
      }
    });
    return unsub;
  }, []);

  // 5 Arena Categories Setup
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
      glowColor: 'rgba(56, 189, 248, 0.5)',
    },
    {
      catId: 'mental',
      label: 'MENTAL',
      subLabel: 'ذكاء',
      headerColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.5)',
    },
    {
      catId: 'physical',
      label: 'PHYSICAL',
      subLabel: 'بدني',
      headerColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.5)',
    },
    {
      catId: 'captains',
      label: 'CAPTAINS',
      subLabel: 'تحدي الكباتن',
      headerColor: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.6)',
      isCaptains: true,
    },
    {
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      isFanVote: true,
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
    }
    setSelectedGameForModal(null);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  // Open library picker for any slot in any of the 5 categories
  const handleOpenLibraryPicker = (catId: string, catLabel: string, slotIndex: number, currentGameId?: string) => {
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
      : [...(DEFAULT_ARENA_COLUMN_GAMES[catId] || [])];

    currentSlots[slotIndex] = chosenGame.id;

    const nextMap = {
      ...columnGamesMap,
      [catId]: currentSlots,
    };

    setColumnGamesMap(nextMap);
    saveArenaColumnGames(nextMap);
    setPickerTarget(null);
    setSelectedGameForModal(null);
    sound.playPick('pick');
  };

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Reset arena column games to defaults (instant, no blocking window.confirm)
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
      libraryFilterCategory === 'all' || game.categoryId === libraryFilterCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="w-full min-h-[780px] bg-[#0A0720] border-2 border-indigo-900/60 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-[0_0_80px_rgba(79,70,229,0.25)] relative overflow-hidden select-none flex flex-col justify-between">
      {/* Outer Stadium Glow & Curved Contour Arches */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Left Arena Arch */}
        <div className="absolute -left-48 top-1/2 -translate-y-1/2 w-96 h-[90%] rounded-[100%] border-4 border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.2)]" />
        <div className="absolute -left-36 top-1/2 -translate-y-1/2 w-80 h-[80%] rounded-[100%] border-2 border-purple-500/30" />

        {/* Right Arena Arch */}
        <div className="absolute -right-48 top-1/2 -translate-y-1/2 w-96 h-[90%] rounded-[100%] border-4 border-indigo-500/20 shadow-[0_0_60px_rgba(99,102,241,0.2)]" />
        <div className="absolute -right-36 top-1/2 -translate-y-1/2 w-80 h-[80%] rounded-[100%] border-2 border-cyan-500/30" />

        {/* Top & Bottom Ambient Lights */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-64 bg-indigo-600/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[700px] h-64 bg-purple-600/15 rounded-full blur-3xl" />
      </div>

      {/* Top Controls Bar */}
      <div className="relative z-10 flex items-center justify-between mb-5 pb-3 border-b border-indigo-900/40 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-orbitron font-bold text-indigo-300 uppercase tracking-widest text-[11px] sm:text-xs">
            ARENA STAGE · 5 CATEGORIES BAN & PICK
          </span>
          <span className="px-2 py-0.5 rounded-full bg-pink-900/50 text-pink-300 border border-pink-700/50 text-[10px] font-bold">
            متاح تغيير اللعبة لجميع الفئات الـ 5
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefaultGames}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/60 text-indigo-200 transition-all active:scale-95 shadow-sm"
            title="استعادة الألعاب الافتراضية للفئات"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">استعادة الألعاب الافتراضية</span>
          </button>

          <button
            onClick={handleResetAllCards}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900/70 border border-rose-700/60 text-rose-200 transition-all active:scale-95 shadow-sm"
            title="تصفير جميع البطاقات وإعادتها متاحة"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">إعادة ضبط البطاقات</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
            title="ملء الشاشة للعرض الميداني"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Success Feedback Banner */}
      {actionFeedback && (
        <div className="relative z-20 mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* 5 CATEGORY COLUMNS GRID (إلكتروني، ذكاء، بدني، تحدي الكباتن، تصويت الجمهور) */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 my-auto max-w-7xl mx-auto w-full">
        {arenaColumns.map((col) => {
          // Resolve games for this column
          const configuredKeys = columnGamesMap[col.catId] || DEFAULT_ARENA_COLUMN_GAMES[col.catId] || [];
          
          let colGames = configuredKeys
            .map((k) => games.find((g) => g.id === k))
            .filter(Boolean) as GameItem[];

          // Fallback if games were deleted or missing
          const targetCount = col.catId === 'captains' ? 2 : 3;
          if (colGames.length < targetCount) {
            const fallbackPool = games.filter((g) => g.categoryId === col.catId || col.isFanVote);
            const extra = fallbackPool.filter((g) => !colGames.some((cg) => cg.id === g.id)).slice(0, targetCount - colGames.length);
            colGames = [...colGames, ...extra];
          }

          return (
            <div key={col.catId} className="flex flex-col items-center">
              {/* Category Header Capsule Pill */}
              <div
                className="w-full py-2 px-2.5 rounded-full text-center font-orbitron font-extrabold text-xs sm:text-sm tracking-wider uppercase border-2 shadow-lg mb-4 sm:mb-6 transition-transform hover:scale-105 relative group cursor-default"
                style={{
                  backgroundColor: '#090B1E',
                  borderColor: col.headerColor,
                  color: '#FFFFFF',
                  boxShadow: `0 0 18px ${col.glowColor}`,
                }}
              >
                <div className="flex items-center justify-center gap-1">
                  {col.isCaptains && <Crown className="w-3.5 h-3.5 text-rose-400" />}
                  {col.isFanVote && <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />}
                  <span>{col.label}</span>
                </div>
                <span className="block text-[9px] font-changa text-slate-400 font-normal">
                  {col.subLabel}
                </span>
              </div>

              {/* 3 Hexagonal Game Cards Stack */}
              <div className="space-y-4 sm:space-y-6 w-full flex flex-col items-center">
                {colGames.slice(0, 3).map((game, slotIdx) => {
                  const cardState = cardStates[game.id]?.status || 'available';
                  const isCurrent = activeGameId === game.id || cardState === 'current';
                  const isBannedA = cardState === 'banned_team_a';
                  const isBannedB = cardState === 'banned_team_b';
                  const isPickedA = cardState === 'picked_team_a';
                  const isPickedB = cardState === 'picked_team_b';

                  return (
                    <div
                      key={`${col.catId}-${slotIdx}-${game.id}`}
                      className="flex flex-col items-center group relative w-full max-w-[140px]"
                    >
                      {/* Rounded Hexagonal Card Container */}
                      <div
                        onClick={() => handleCardClick(game)}
                        className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-[24px] sm:rounded-[30px] flex items-center justify-center p-2.5 relative transition-all border-2 cursor-pointer duration-200 group-hover:scale-105 ${
                          isPickedA
                            ? 'bg-purple-600/90 border-purple-300 shadow-[0_0_35px_rgba(168,85,247,0.8)] ring-4 ring-purple-500'
                            : isPickedB
                            ? 'bg-cyan-500/90 border-cyan-200 shadow-[0_0_35px_rgba(6,182,212,0.8)] ring-4 ring-cyan-400'
                            : isCurrent
                            ? 'bg-amber-600/80 border-amber-300 shadow-[0_0_35px_rgba(251,191,36,0.8)] ring-4 ring-amber-400 animate-pulse'
                            : isBannedA || isBannedB
                            ? 'bg-[#0E0C22]/80 border-slate-700/80 opacity-70'
                            : col.isCaptains
                            ? 'bg-[#1C0A0E] border-rose-500/60 hover:border-rose-300 shadow-[0_0_20px_rgba(239,68,68,0.3)]'
                            : col.isFanVote
                            ? 'bg-[#180A1A] border-pink-500/60 hover:border-pink-300 shadow-[0_0_20px_rgba(236,72,153,0.3)]'
                            : 'bg-[#0B0D24] border-indigo-500/50 hover:border-indigo-300 shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                        }`}
                      >
                        {/* Emblem Icon */}
                        <div className="w-full h-full flex items-center justify-center">
                          <GameIcon
                            name={game.iconType}
                            className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 drop-shadow-md text-white"
                          />
                        </div>

                        {/* Rules Button on Top Corner of the Card */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRulesGame({
                              game,
                              category: categories.find((c) => c.id === game.categoryId),
                            });
                          }}
                          className={`absolute -top-2.5 -right-2.5 z-20 w-7 h-7 rounded-full border shadow-lg transition-transform hover:scale-115 active:scale-90 flex items-center justify-center ${
                            game.rules && game.rules.trim() !== ''
                              ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.7)]'
                              : 'bg-slate-900/95 text-slate-300 border-slate-700 hover:border-amber-400 hover:text-amber-300'
                          }`}
                          title={game.rules ? 'عرض وتعديل قوانين اللعبة' : 'إضافة قوانين وشروط اللعبة'}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                        </button>

                        {/* Ban Cross Overlay */}
                        {isBannedA && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-purple-400 drop-shadow-[0_0_12px_rgba(168,85,247,1)] select-none">
                              ✕
                            </span>
                          </div>
                        )}
                        {isBannedB && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-5xl sm:text-6xl md:text-7xl font-black text-cyan-400 drop-shadow-[0_0_12px_rgba(6,182,212,1)] select-none">
                              ✕
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Game Label Below Card */}
                      <span className="mt-2 text-[11px] sm:text-xs font-bold font-orbitron tracking-wider text-slate-200 text-center max-w-[120px] uppercase drop-shadow group-hover:text-white transition-colors line-clamp-1">
                        {game.nameEn || game.nameAr}
                      </span>

                      {/* ACTION BUTTONS: القوانين + تغيير اللعبة */}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRulesGame({
                              game,
                              category: categories.find((c) => c.id === game.categoryId),
                            });
                          }}
                          className={`text-[9px] font-changa font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                            game.rules && game.rules.trim() !== ''
                              ? 'bg-amber-950/80 hover:bg-amber-900 border-amber-500/80 text-amber-300'
                              : 'bg-slate-900/80 hover:bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                          }`}
                          title="قوانين وشروط هذه اللعبة"
                        >
                          <BookOpen className="w-2.5 h-2.5" />
                          <span>{game.rules && game.rules.trim() !== '' ? 'القوانين ✓' : '+ القوانين'}</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenLibraryPicker(col.catId, col.label, slotIdx, game.id);
                          }}
                          className={`text-[9px] font-changa font-bold px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 shadow-sm active:scale-95 ${
                            col.isCaptains
                              ? 'bg-rose-950/70 hover:bg-rose-900 border-rose-600/70 text-rose-300 hover:text-white'
                              : col.isFanVote
                              ? 'bg-pink-950/70 hover:bg-pink-900 border-pink-600/70 text-pink-300 hover:text-white'
                              : 'bg-slate-900/80 hover:bg-indigo-950 border-indigo-700/60 text-indigo-300 hover:text-white'
                          }`}
                          title={`تغيير اللعبة في خانة ${col.label} #${slotIdx + 1}`}
                        >
                          <Shuffle className="w-2.5 h-2.5" />
                          <span>تغيير</span>
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

      {/* BOTTOM ARENA MATCH BATTLE BANNER */}
      <div className="relative z-10 mt-6 pt-3">
        <div className="max-w-3xl mx-auto bg-[#07091B]/95 rounded-2xl border-2 border-indigo-700/60 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 sm:p-4 flex items-center justify-between gap-4">
          
          {/* Left Team (ABO SHAIF) */}
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white border-2 border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.5)] font-orbitron font-extrabold text-xl"
              style={{ backgroundColor: teamA.color || '#A855F7' }}
            >
              <GameIcon name={teamA.logo || 'crown'} className="w-7 h-7" />
            </div>
            <div className="text-right">
              <h3 className="text-base sm:text-2xl font-black font-orbitron tracking-wider text-white uppercase">
                {teamA.shortName || teamA.name}
              </h3>
              <p className="text-[10px] text-purple-300 font-changa">{teamA.name}</p>
            </div>
          </div>

          {/* Center VS Badge */}
          <div className="flex flex-col items-center">
            <div className="px-4 py-1 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 border border-white/30 shadow-[0_0_25px_rgba(99,102,241,0.6)]">
              <span className="font-orbitron font-black text-lg sm:text-2xl text-white tracking-widest drop-shadow-md">
                VS
              </span>
            </div>
            <div className="text-[9px] font-orbitron uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-1.5">
              <span>5 فئات معتمدة</span>
              <span>·</span>
              <span className="text-amber-300 font-bold">دوري صراع النخبة</span>
            </div>
          </div>

          {/* Right Team (YAZEED) */}
          <div className="flex items-center gap-3">
            <div className="text-left">
              <h3 className="text-base sm:text-2xl font-black font-orbitron tracking-wider text-white uppercase">
                {teamB.shortName || teamB.name}
              </h3>
              <p className="text-[10px] text-cyan-300 font-changa">{teamB.name}</p>
            </div>
            <div
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-white border-2 border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] font-orbitron font-extrabold text-xl"
              style={{ backgroundColor: teamB.color || '#06B6D4' }}
            >
              <GameIcon name={teamB.logo || 'shield'} className="w-7 h-7" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Modal on clicking any card in the arena */}
      {selectedGameForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-right">
          <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedGameForModal(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border-2 border-indigo-400 flex items-center justify-center p-2 shrink-0 shadow-lg">
                <GameIcon name={selectedGameForModal.iconType} className="w-12 h-12" />
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
            <p className="text-xs font-semibold text-slate-300 mb-3">
              حدد قرار الفريقين في هذه الجولة:
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {/* Ban Team A */}
              <button
                onClick={() => handleAction('banned_team_a')}
                className="p-3 rounded-xl border border-purple-700 bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamA.shortName})</span>
              </button>

              {/* Ban Team B */}
              <button
                onClick={() => handleAction('banned_team_b')}
                className="p-3 rounded-xl border border-cyan-700 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamB.shortName})</span>
              </button>

              {/* Pick Team A */}
              <button
                onClick={() => handleAction('picked_team_a')}
                className="p-3 rounded-xl border border-purple-500 bg-purple-600/40 hover:bg-purple-600/60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-purple-200" />
                <span>اختيار ({teamA.shortName})</span>
              </button>

              {/* Pick Team B */}
              <button
                onClick={() => handleAction('picked_team_b')}
                className="p-3 rounded-xl border border-cyan-500 bg-cyan-600/40 hover:bg-cyan-600/60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-cyan-200" />
                <span>اختيار ({teamB.shortName})</span>
              </button>
            </div>

            {/* Set Current Playing Game */}
            <button
              onClick={() => handleAction('current')}
              className="w-full py-3 px-4 rounded-xl border border-amber-500/80 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 mb-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-amber-300" />
              <span>تعيين كلعبة الجولة الحالية للمباراة (Live Round)</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => handleAction('available')}
              className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors mb-2"
            >
              إلغاء التحديد وإرجاعها للمتاح
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL LIBRARY VAULT PICKER MODAL (FOR ALL 5 CATEGORIES) */}
      {pickerTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fade-in text-right">
          <div className="bg-[#0C1226] border border-indigo-500/50 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setPickerTarget(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="mb-4 pb-3 border-b border-slate-800">
              <h2 className="text-lg sm:text-xl font-bold font-changa text-white flex items-center gap-2">
                <Shuffle className="w-5 h-5 text-indigo-400" />
                <span>
                  تغيير لعبة: {pickerTarget.catLabel} (الخانة #{pickerTarget.slotIndex + 1})
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                اختر أي لعبة من كامل مكتبة الألعاب لتوضع مكان هذه الخانة في شاشة المواجهة المعتمدة.
              </p>
            </div>

            {/* Search and Category Filters */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              {/* Search Bar */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن لعبة بالاسم أو الوصف..."
                  className="w-full bg-[#070D1F] text-white text-xs pl-3 pr-9 py-2 rounded-xl border border-slate-700 focus:border-indigo-400 focus:outline-none"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setLibraryFilterCategory('all')}
                  className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                    libraryFilterCategory === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  الكل ({games.length})
                </button>
                {categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setLibraryFilterCategory(c.id)}
                    className={`px-2 py-1 text-xs rounded-lg whitespace-nowrap font-medium transition-colors ${
                      libraryFilterCategory === c.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {c.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Games Grid from entire library */}
            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-1 min-h-[300px]">
              {filteredLibraryGames.map((game) => {
                const isCurrentlySelected = pickerTarget.currentGameId === game.id;

                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGameForSlot(game)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-right transition-all group border ${
                      isCurrentlySelected
                        ? 'bg-indigo-950/70 border-indigo-400 ring-2 ring-indigo-400'
                        : 'bg-slate-900/80 hover:bg-indigo-950/40 border-slate-800 hover:border-indigo-500/60'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#070D1F] border border-slate-700 group-hover:border-indigo-400 flex items-center justify-center shrink-0 p-1">
                      <GameIcon name={game.iconType} className="w-7 h-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white font-changa truncate group-hover:text-indigo-300">
                          {game.nameAr}
                        </h4>
                        {isCurrentlySelected && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-400">
                            الحالية
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 uppercase truncate font-mono">
                        {game.nameEn}
                      </p>
                    </div>
                  </button>
                );
              })}

              {filteredLibraryGames.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                  <p>لا توجد نتائج مطابقة لاسم اللعبة المبحوث عنها.</p>
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
