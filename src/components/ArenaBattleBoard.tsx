import './TimerArena.css';
import React, { useState, useEffect } from 'react';
import {
  CategoryInfo,
  CategoryKey,
  GameItem,
  CardState,
  BanPickStatus,
  Team,
} from '../types';
import { GameIcon } from './GameIcons';
import { GameRulesModal } from './GameRulesModal';
import {
  X,
  Check,
  Play,
  RotateCcw,
  Maximize2,
  Minimize2,
  Flame,
  Shuffle,
  Search,
  Sparkles,
  Swords,
  Scale,
} from 'lucide-react';
import { sound } from '../utils/audio';
import {
  loadArenaColumnGames,
  saveArenaColumnGames,
  DEFAULT_ARENA_COLUMN_GAMES,
  subscribeToBroadcast,
} from '../utils/storage';
import { DEFAULT_GAMES } from '../data/defaultGames';

interface ArenaBattleBoardProps {
  games: GameItem[];
  categories: CategoryInfo[];
  cardStates: Record<string, CardState>;
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
  const [rulesModalTarget, setRulesModalTarget] = useState<{
    game: GameItem;
    category?: CategoryInfo;
  } | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Persisted 3 games for each of the 5 columns
  const [columnGamesMap, setColumnGamesMap] = useState<Record<string, string[]>>(() =>
    loadArenaColumnGames()
  );

  // Listen for real-time updates from Mobile Remote Controller or other tabs
  useEffect(() => {
    return subscribeToBroadcast((type: string, payload: unknown) => {
      if (type === 'ARENA_GAMES_UPDATED') {
        setColumnGamesMap(payload as Record<string, string[]>);
      }
      if (type === 'REMOTE_GAME_MODAL') {
        const gameId = payload as string | null;
        if (!gameId) {
          setSelectedGameForModal(null);
        } else {
          const found = games.find((g) => g.id === gameId) || DEFAULT_GAMES.find((g) => g.id === gameId);
          if (found) setSelectedGameForModal(found);
        }
      }
      if (type === 'CLOSE_ALL_MODALS') {
        setSelectedGameForModal(null);
        setRulesModalTarget(null);
        setPickerTarget(null);
      }
    });
  }, [games, categories]);

  // Universal Library Picker Modal State (for changing ANY slot in ANY of the 5 categories)
  const [pickerTarget, setPickerTarget] = useState<{
    catId: string;
    catLabel: string;
    slotIndex: number;
    currentGameId: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [libraryFilterCategory, setLibraryFilterCategory] = useState<string>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // The 5 Arena Columns (with 1v1 placed as the last column as requested)
  const arenaColumns: {
    catId: CategoryKey | 'fan_vote';
    label: string;
    subLabel: string;
    headerColor: string;
    glowColor: string;
    isCaptains?: boolean;
    isFanVote?: boolean;
  }[] = [
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
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      isFanVote: true,
    },
    {
      catId: '1v1',
      label: '1V1',
      subLabel: '1 ضد 1',
      headerColor: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.6)',
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

  // Open Library Picker for ANY category and ANY slot
  const handleOpenLibraryPicker = (
    catId: string,
    catLabel: string,
    slotIndex: number,
    currentGameId: string
  ) => {
    setPickerTarget({ catId, catLabel, slotIndex, currentGameId });
    setSearchQuery('');
    setLibraryFilterCategory('all');
    sound.playTick();
  };

  // Replace the game at the selected slot with any game from the library
  const handleSelectGameForSlot = (newGame: GameItem) => {
    if (!pickerTarget) return;
    const { catId, slotIndex } = pickerTarget;
    if(Object.entries(columnGamesMap).some(([cat,ids])=>ids.some((id,i)=>id===newGame.id&&(cat!==catId||i!==slotIndex)))){setToastMessage('هذه اللعبة موجودة بخانة أخرى. اختر لعبة مختلفة.');setTimeout(()=>setToastMessage(null),3000);return;}
    const currentList = columnGamesMap[catId]
      ? [...columnGamesMap[catId]]
      : [...(DEFAULT_ARENA_COLUMN_GAMES[catId] || [])];

    currentList[slotIndex] = newGame.id;

    const updatedMap = {
      ...columnGamesMap,
      [catId]: currentList,
    };

    setColumnGamesMap(updatedMap);
    saveArenaColumnGames(updatedMap);
    setPickerTarget(null);
    setSelectedGameForModal(null);
    sound.playPick('pick');
  };

  // Restore default 3 games for all 5 columns
  const handleResetToDefaultGames = () => {
    sound.playTick();
    setColumnGamesMap(DEFAULT_ARENA_COLUMN_GAMES);
    saveArenaColumnGames(DEFAULT_ARENA_COLUMN_GAMES);
    setToastMessage('✓ تم استعادة التشكيلة الافتراضية لجميع ألعاب الفئات الـ 5 بنجاح!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleResetCards = () => {
    sound.playTick();
    onResetAllBansPicks();
    setToastMessage('✓ تم تصفير وإعادة ضبط جميع بطاقات واستبعادات الألعاب بنجاح!');
    setTimeout(() => setToastMessage(null), 3000);
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
    <div className="arena-battle-board-orig w-full min-h-[780px] bg-[#0A0720] border-2 border-indigo-900/60 rounded-3xl p-3 sm:p-6 lg:p-8 shadow-[0_0_80px_rgba(79,70,229,0.25)] relative overflow-hidden select-none flex flex-col justify-between">
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
            onClick={handleResetCards}
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

      {/* Feedback Toast Banner */}
      {toastMessage && (
        <div className="relative z-20 mb-4 p-3 rounded-2xl bg-gradient-to-r from-emerald-950/90 via-slate-900 to-emerald-950/90 border border-emerald-500/60 text-emerald-300 text-xs font-bold text-center shadow-lg animate-fade-in flex items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 5 CATEGORY COLUMNS GRID */}
      <div className="ce-control-grid relative z-10 my-auto mx-auto w-full">
        {arenaColumns.map((col) => {
          // Resolve 3 games for this column without forcing resets on custom user choices
          const rawKeys = columnGamesMap[col.catId];
          const configuredKeys =
            Array.isArray(rawKeys) && rawKeys.length > 0
              ? rawKeys
              : DEFAULT_ARENA_COLUMN_GAMES[col.catId] || [];

          let colGames = configuredKeys
            .map((k) => games.find((g) => g.id === k) || DEFAULT_GAMES.find((g) => g.id === k))
            .filter(Boolean) as GameItem[];

          // Fallback if games were deleted or missing
          if (colGames.length < 3) {
            const fallbackPool = DEFAULT_GAMES.filter((g) => g.categoryId === col.catId);
            const extra = fallbackPool
              .filter((g) => !colGames.some((cg) => cg.id === g.id))
              .slice(0, 3 - colGames.length);
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
                <div className="flex items-center justify-center gap-1.5">
                  {col.isCaptains && <Swords className="w-3.5 h-3.5 text-rose-400" />}
                  {col.isFanVote && <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />}
                  <span className="font-changa font-bold text-xs sm:text-sm text-white">
                    {col.subLabel}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-orbitron text-slate-400 uppercase font-semibold">
                    ({col.label})
                  </span>
                </div>
              </div>

              {/* 3 Hexagonal / Rounded Square Game Cards Stack */}
              <div className="space-y-4 sm:space-y-6 w-full flex flex-col items-center">
                {colGames.slice(0, 3).map((game, slotIdx) => {
                  const cardState = cardStates[game.id]?.status || 'available';
                  const isCurrent = activeGameId === game.id || cardState === 'current';
                  const isBannedA = cardState === 'banned_team_a';
                  const isBannedB = cardState === 'banned_team_b';
                  const isPickedA = cardState === 'picked_team_a';
                  const isPickedB = cardState === 'picked_team_b';

                  const actor=isBannedA||isPickedA?teamA:isBannedB||isPickedB?teamB:undefined;
                  const banned=isBannedA||isBannedB,picked=isPickedA||isPickedB;
                  const completed=cardState==='completed';
                  const label=isCurrent?'الجارية الآن':banned?'حظر بواسطة '+actor?.name:picked?'اختارها '+actor?.name:completed?'انتهت':'متاحة';
                  return <article key={`${col.catId}-${slotIdx}-${game.id}`} className={'ce-control-card '+(banned?'is-banned':'')} style={{'--card-accent':actor?.color|| (isCurrent?'#edcf80':col.headerColor)} as React.CSSProperties}>
                    <button type="button" className="ce-control-art" onClick={()=>handleCardClick(game)}><div className="ce-control-icon"><GameIcon name={game.iconType} className="w-full h-full"/>{game.customImage&&<img src={game.customImage} alt="" onError={e=>{e.currentTarget.style.display='none'}}/>}</div><h3>{game.nameAr}</h3><span className="ce-control-state">{banned?'✕ ':picked?'✓ ':''}{label}</span></button>
                    <div className="ce-control-tools"><button onClick={()=>setRulesModalTarget({game,category:categories.find(c=>c.id===game.categoryId)})}><Scale size={14}/> القوانين</button><button onClick={()=>handleOpenLibraryPicker(col.catId,col.label,slotIdx,game.id)}><Shuffle size={14}/> تغيير</button></div>
                  </article>;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM ARENA MATCH BATTLE BANNER */}
      <div className="relative z-10 mt-6 pt-3">
        <div className="max-w-3xl mx-auto bg-[#07091B]/95 rounded-2xl border-2 border-indigo-700/60 shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 sm:p-4 flex items-center justify-between gap-4">
          {/* Left Team */}
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

          {/* Right Team */}
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
        <div className="arena-orig-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in text-right">
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

            <p className="text-xs font-semibold text-slate-300 mb-3">
              حدد قرار الفريقين في هذه الجولة:
            </p>

            <div className="ce-decision-grid">{([teamA,teamB] as const).map((team,i)=><section key={team.id} style={{'--card-accent':team.color} as React.CSSProperties}><strong><GameIcon name={team.logo} className="w-9 h-9"/>{team.name}</strong><button onClick={()=>handleAction(i===0?'banned_team_a':'banned_team_b')}>✕ حظر بواسطة {team.shortName}</button><button onClick={()=>handleAction(i===0?'picked_team_a':'picked_team_b')}><Check size={16}/> اختيار بواسطة {team.shortName}</button></section>)}</div>

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
        <div className="arena-orig-modal fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in text-right">
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
      {rulesModalTarget && (
        <GameRulesModal
          game={rulesModalTarget.game}
          category={rulesModalTarget.category}
          onSaveRules={(gameId, rules) => {
            onSaveGameRules?.(gameId, rules);
            setRulesModalTarget((prev) =>
              prev ? { ...prev, game: { ...prev.game, rules } } : null
            );
          }}
          onClose={() => setRulesModalTarget(null)}
        />
      )}
    </div>
  );
};
