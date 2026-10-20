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
  Flame,
  Search,
  BookOpen,
  Scale,
  Crown,
  Swords,
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
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      isFanVote: true,
    },
    {
      catId: '1v1',
      label: 'CAPTAINS DUEL',
      subLabel: 'تحدي الكباتن · 1 ضد 1',
      headerColor: '#F0C56E',
      glowColor: 'rgba(240, 197, 110, 0.72)',
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

    const replacedGameId = currentSlots[slotIndex];
    currentSlots[slotIndex] = chosenGame.id;

    const nextMap = {
      ...columnGamesMap,
      [catId]: currentSlots,
    };

    setColumnGamesMap(nextMap);
    saveArenaColumnGames(nextMap);
    if (activeGameId === replacedGameId) onSetActiveGame(chosenGame.id);
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

    const matchesCategory = libraryFilterCategory === 'all' ||
      (libraryFilterCategory === '1v1'
        ? game.categoryId === '1v1' || game.categoryId === 'captains'
        : game.categoryId === libraryFilterCategory);

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="arena-shell arena-shell-redesigned w-full relative select-none">
      {actionFeedback && <div className="arena-feedback"><Sparkles /><span>{actionFeedback}</span></div>}

      {/* Five category columns: compare every game at once, with the 1v1 duel last */}
      {(() => {
        const decisions = Object.values(cardStates).filter((card) => card.status !== 'available').length;
        const statusLabel = (gameId: string) => {
          const status = cardStates[gameId]?.status || 'available';
          if (activeGameId === gameId || status === 'current') return { label: 'اللعبة الحالية', code: 'LIVE', state: 'current' };
          if (status === 'picked_team_a') return { label: `اختارها ${teamA.shortName}`, code: 'PICKED', state: 'picked-a' };
          if (status === 'picked_team_b') return { label: `اختارها ${teamB.shortName}`, code: 'PICKED', state: 'picked-b' };
          if (status === 'banned_team_a') return { label: `حظرها ${teamA.shortName}`, code: 'BANNED', state: 'banned' };
          if (status === 'banned_team_b') return { label: `حظرها ${teamB.shortName}`, code: 'BANNED', state: 'banned' };
          return { label: 'متاحة للاختيار', code: 'AVAILABLE', state: 'available' };
        };
        return (
          <div className="arena-console" style={{ '--arena-accent': '#d8f27a' } as React.CSSProperties}>
            <div className="arena-console-topline">
              <div><span className="arena-live-dot" /><span>نظام اختيار المواجهة</span><small>ELITE DRAFT SYSTEM · 01</small></div>
              <div className="arena-console-tools">
                <button onClick={handleResetToDefaultGames} title="استعادة التشكيلة الافتراضية"><Shuffle /><span>استعادة التشكيلة</span></button>
                <button onClick={handleResetAllCards} title="إعادة ضبط حالات الاختيار"><RotateCcw /><span>تصفير الاختيارات</span></button>
                <button onClick={toggleFullscreen} title="ملء الشاشة">{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
              </div>
            </div>

            <div className="arena-duel-strip">
              <div className="arena-duel-team"><span className="arena-team-mark" style={{ '--team-color': teamA.color || '#adcb58' } as React.CSSProperties}><GameIcon name={teamA.logo || 'crown'} /></span><span><small>الفريق الأول · A</small><strong>{teamA.name}</strong><em>{teamA.shortName}</em></span></div>
              <div className="arena-duel-center"><span>مواجهة مباشرة</span><strong>VS</strong><small>{decisions} قرار مسجل</small></div>
              <div className="arena-duel-team is-team-b"><span className="arena-team-mark" style={{ '--team-color': teamB.color || '#d8bbff' } as React.CSSProperties}><GameIcon name={teamB.logo || 'shield'} /></span><span><small>الفريق الثاني · B</small><strong>{teamB.name}</strong><em>{teamB.shortName}</em></span></div>
            </div>

            <div className="arena-columns-heading"><div><span className="arena-section-kicker">ELITE DRAFT SYSTEM · 05 CATEGORIES</span><h2>ميدان الاختيار</h2><p>كل الفئات أمامك في أعمدة مستقلة — وتحدي 1 ضد 1 في العمود الأخير.</p></div><span className="arena-stage-badge"><span /> مرحلة الاختيار</span></div>

            <div className="arena-columns-scroll"><div className="arena-column-grid">
              {arenaColumns.map((column, columnIndex) => {
                const configuredIds = columnGamesMap[column.catId] || DEFAULT_ARENA_COLUMN_GAMES[column.catId] || [];
                let columnGames = configuredIds.map((id) => games.find((game) => game.id === id) || DEFAULT_GAMES.find((game) => game.id === id)).filter(Boolean) as GameItem[];
                const fallback = DEFAULT_GAMES.filter((game) => game.categoryId === column.catId && !columnGames.some((item) => item.id === game.id));
                columnGames = [...columnGames, ...fallback.slice(0, Math.max(0, 3 - columnGames.length))].slice(0, 3);
                const accent = column.isCaptains ? '#d8f27a' : column.headerColor;
                const marked = columnGames.filter((game) => statusLabel(game.id).state !== 'available').length;
                return <section key={column.catId} className={`arena-category-column ${column.isCaptains ? 'captains-column' : ''}`} style={{ '--column-accent': accent, '--stagger-index': columnIndex } as React.CSSProperties}>
                  <header className="arena-column-header"><span className="arena-column-number">0{columnIndex + 1}</span><span className="arena-column-name"><strong>{column.subLabel}</strong><small>{column.label}</small></span><span className="arena-column-count">{marked}/3</span></header>
                  <div className="arena-column-games">
                    {columnGames.map((game, slotIndex) => {
                      const status = statusLabel(game.id);
                      return <article key={`${column.catId}-${slotIndex}-${game.id}`} className={`arena-column-game rb-spring-hover state-${status.state}`} style={{ '--stagger-index': slotIndex } as React.CSSProperties}>
                        <button className="arena-column-art" onClick={() => handleCardClick(game)} aria-label={`إدارة ${game.nameAr}`}><span className="arena-column-art-index">0{slotIndex + 1}</span><GameIcon name={game.iconType} /><span className="arena-column-art-code">CE</span>{status.state === 'banned' && <span className="arena-ban-overlay">×</span>}{status.state === 'current' && <span className="arena-live-pill">LIVE</span>}</button>
                        <div className="arena-column-game-info"><strong>{game.nameAr}</strong><small>{game.nameEn}</small><div className={`arena-state-line ${status.state}`}><i /><span>{status.label}</span></div>
                          <div className="arena-column-actions"><button onClick={() => handleCardClick(game)} title="إدارة الحظر والاختيار"><Swords /><span>إدارة</span></button><button onClick={() => handleOpenLibraryPicker(column.catId, column.label, slotIndex, game.id)} title="تبديل اللعبة"><Shuffle /><span>تبديل</span></button><button onClick={() => setSelectedRulesGame({ game, category: categories.find((item) => item.id === game.categoryId) })} title="قوانين اللعبة"><BookOpen /></button></div>
                        </div>
                      </article>;
                    })}
                  </div>
                </section>;
              })}
            </div></div>

            <div className="arena-console-footer"><div><span className="arena-footer-mark">{String(decisions).padStart(2, '0')}</span><span><strong>قرارات الجولة</strong><small>اختيارات وحالات الحظر المسجلة</small></span></div><span className="arena-footer-hint">حدّد أي لعبة لتعيينها أو حظرها أو اختيارها للفريقين</span></div>
          </div>
        );
      })()}

      {/* Action Modal on clicking any card in the arena */}
      {selectedGameForModal && (
        <div className="arena-action-modal fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in text-right">
          <div className="arena-action-panel bg-[#0C1226] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
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
                data-action="ban-a"
                className="p-3 rounded-xl border border-purple-700 bg-purple-950/60 hover:bg-purple-900/70 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamA.shortName})</span>
              </button>

              {/* Ban Team B */}
              <button
                onClick={() => handleAction('banned_team_b')}
                data-action="ban-b"
                className="p-3 rounded-xl border border-cyan-700 bg-cyan-950/60 hover:bg-cyan-900/70 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamB.shortName})</span>
              </button>

              {/* Pick Team A */}
              <button
                onClick={() => handleAction('picked_team_a')}
                data-action="pick-a"
                className="p-3 rounded-xl border border-purple-500 bg-purple-600/40 hover:bg-purple-600/60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-purple-200" />
                <span>اختيار ({teamA.shortName})</span>
              </button>

              {/* Pick Team B */}
              <button
                onClick={() => handleAction('picked_team_b')}
                data-action="pick-b"
                className="p-3 rounded-xl border border-cyan-500 bg-cyan-600/40 hover:bg-cyan-600/60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Check className="w-4 h-4 text-cyan-200" />
                <span>اختيار ({teamB.shortName})</span>
              </button>
            </div>

            {/* Set Current Playing Game */}
            <button
              onClick={() => handleAction('current')}
              data-action="set-current"
              className="w-full py-3 px-4 rounded-xl border border-amber-500/80 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 mb-2 transition-colors shadow-sm"
            >
              <Play className="w-4 h-4 fill-amber-300" />
              <span>تعيين كلعبة الجولة الحالية للمباراة (Live Round)</span>
            </button>

            {/* Reset */}
            <button
              onClick={() => handleAction('available')}
              data-action="reset-state"
              className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-xl transition-colors mb-2"
            >
              إلغاء التحديد وإرجاعها للمتاح
            </button>
          </div>
        </div>
      )}

      {/* UNIVERSAL LIBRARY VAULT PICKER MODAL (FOR ALL 5 CATEGORIES) */}
      {pickerTarget && (
        <div className="arena-library-picker fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/90 animate-fade-in text-right">
          <div className="arena-picker-panel bg-[#0C1226] border border-indigo-500/50 rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
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
                اختر أي لعبة من كامل المكتبة؛ فئتها الأصلية لا تمنع وضعها في هذا العمود. فلتر الفئات للتصفح فقط.
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
                  كل الفئات · الكل ({games.length})
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
