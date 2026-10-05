import React, { useState } from 'react';
import {
  Team,
  CurrentMatch,
  MatchRecord,
  CategoryKey,
  BanPickStatus,
  GameItem,
  CategoryInfo,
} from '../types';
import { GameIcon } from './GameIcons';
import { sound } from '../utils/audio';
import {
  broadcastMessage,
  DEFAULT_ARENA_COLUMN_GAMES,
  saveArenaColumnGames,
} from '../utils/storage';
import { DEFAULT_GAMES } from '../data/defaultGames';
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
  Flame,
  Swords,
  Timer,
  Play,
  Pause,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Tv,
  Shuffle,
} from 'lucide-react';

interface MobileRemoteControllerProps {
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  categories: CategoryInfo[];
  cardStates: Record<string, { gameId: string; status: BanPickStatus }>;
  arenaColumnGames: Record<string, string[]>;
  onUpdateScore: (team: 'A' | 'B', delta: number) => void;
  onChangeTeam: (slot: 'A' | 'B', teamId: string) => void;
  onFinishMatch: () => void;
  onResetCurrentMatch: () => void;
  onSetCardStatus: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame: (gameId: string | null) => void;
  onResetAllBansPicks: () => void;
  onChangeColumnGame?: (categoryId: string, slotIndex: number, newGameId: string) => void;
  onClose?: () => void;
}

export const MobileRemoteController: React.FC<MobileRemoteControllerProps> = ({
  currentMatch,
  teams,
  games,
  categories,
  cardStates,
  arenaColumnGames,
  onUpdateScore,
  onChangeTeam,
  onFinishMatch,
  onResetCurrentMatch,
  onSetCardStatus,
  onSetActiveGame,
  onResetAllBansPicks,
  onChangeColumnGame,
  onClose,
}) => {
  const [activeRemoteTab, setActiveRemoteTab] = useState<'games' | 'score' | 'timer'>('games');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('digital');
  const [editingGameSlot, setEditingGameSlot] = useState<{ catId: string; slotIdx: number } | null>(null);
  const [remoteFeedback, setRemoteFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setRemoteFeedback(msg);
    setTimeout(() => setRemoteFeedback(null), 2500);
  };

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];
  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);

  // Column games for the currently selected category
  let activeColGameIds =
    arenaColumnGames[selectedCategory] ||
    DEFAULT_ARENA_COLUMN_GAMES[selectedCategory] ||
    [];

  if (
    selectedCategory === '1v1' &&
    (!activeColGameIds ||
      activeColGameIds.length < 3 ||
      activeColGameIds.includes('g-box-of-liars') ||
      !activeColGameIds.includes('g-fatal-fury'))
  ) {
    activeColGameIds = DEFAULT_ARENA_COLUMN_GAMES['1v1'];
  }

  if (selectedCategory === 'fan_vote' && (!activeColGameIds || activeColGameIds.length < 3)) {
    activeColGameIds = DEFAULT_ARENA_COLUMN_GAMES['fan_vote'];
  }

  let currentCategoryGames = activeColGameIds
    .map((gId) => games.find((g) => g.id === gId) || DEFAULT_GAMES.find((g) => g.id === gId))
    .filter(Boolean) as GameItem[];

  if (currentCategoryGames.length < 3) {
    const fallback = DEFAULT_GAMES.filter((g) => g.categoryId === selectedCategory);
    const extra = fallback
      .filter((g) => !currentCategoryGames.some((cg) => cg.id === g.id))
      .slice(0, 3 - currentCategoryGames.length);
    currentCategoryGames = [...currentCategoryGames, ...extra];
  }

  // Spare games from this category (for swapping)
  const categorySpareGames = games.filter(
    (g) => g.categoryId === selectedCategory && !activeColGameIds.includes(g.id)
  );

  const handleResetCardsFromPhone = () => {
    sound.playTick();
    onResetAllBansPicks();
    showFeedback('✓ تم إرسال أمر تصفير وإعادة ضبط جميع البطاقات للشاشة!');
  };

  const handleRestoreDefaultGamesFromPhone = () => {
    sound.playTick();
    saveArenaColumnGames(DEFAULT_ARENA_COLUMN_GAMES);
    showFeedback('✓ تم استعادة التشكيلة الافتراضية للألعاب على الشاشة!');
  };

  return (
    <div className="min-h-screen bg-[#060914] text-slate-100 flex flex-col font-cairo pb-24 select-none">
      {/* Top Mobile Bar */}
      <header className="sticky top-0 z-50 bg-[#0A0F24]/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-purple-600/30">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <h1 className="font-changa font-bold text-sm text-white flex items-center gap-1.5">
              <span>ريموت التحكم المباشر</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </h1>
            <p className="text-[10px] text-slate-400">أوامر فورية للابتوب عبر الهاتف</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full font-bold">
            متصل 🟢
          </span>
          {onClose && (
            <button
              onClick={onClose}
              className="px-2.5 py-1 text-xs font-bold text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
            >
              عرض الشاشة
            </button>
          )}
        </div>
      </header>

      {/* Screen Director Remote Bar (توجيه شاشة اللابتوب عن بُعد) */}
      <div className="p-3 bg-[#070B1E] border-b border-indigo-900/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
            <Tv className="w-3.5 h-3.5 text-cyan-400" />
            <span>توجيه شاشة اللابتوب (أوامر فورية):</span>
          </span>
          <span className="text-[9px] text-emerald-400 font-mono font-bold">LIVE SYNC</span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => {
              sound.playTick();
              broadcastMessage('SWITCH_TAB_COMMAND', 'match');
              showFeedback('تم تحويل شاشة اللابتوب إلى لوحة المباراة!');
            }}
            className="py-1.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold font-changa flex items-center justify-center gap-1 shadow-sm active:scale-95"
          >
            <span>المواجهة 📊</span>
          </button>

          <button
            onClick={() => {
              sound.playTick();
              broadcastMessage('SWITCH_TAB_COMMAND', 'arena');
              showFeedback('تم تحويل شاشة اللابتوب إلى شاشة الألعاب Ban & Pick!');
            }}
            className="py-1.5 px-2 rounded-xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-600/70 text-indigo-200 text-xs font-bold font-changa flex items-center justify-center gap-1 shadow-sm active:scale-95"
          >
            <span>الألعاب 🎮</span>
          </button>

          <button
            onClick={() => {
              sound.playTick();
              broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
              showFeedback('تم فتح شاشة البث المباشر على اللابتوب!');
            }}
            className="py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/70 text-cyan-200 text-xs font-bold font-changa flex items-center justify-center gap-1 shadow-sm active:scale-95"
          >
            <span>شاشة البث 📺</span>
          </button>
        </div>

        {/* Broadcast view switcher from phone */}
        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[11px]">
          <span className="text-slate-400 font-semibold">في شاشة البث اعرض:</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                sound.playTick();
                broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                broadcastMessage('BROADCAST_VIEW_UPDATED', 'games');
                showFeedback('شاشة البث تعرض الآن شاشة الألعاب (Ban & Pick)!');
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-bold active:scale-95"
            >
              الألعاب (Ban & Pick)
            </button>
            <button
              onClick={() => {
                sound.playTick();
                broadcastMessage('SWITCH_TAB_COMMAND', 'broadcast');
                broadcastMessage('BROADCAST_VIEW_UPDATED', 'scoreboard');
                showFeedback('شاشة البث تعرض الآن لوحة النتيجة الحية!');
              }}
              className="px-2.5 py-1 rounded-lg bg-purple-950 border border-purple-500/60 text-purple-300 font-bold active:scale-95"
            >
              النتيجة الحية
            </button>
          </div>
        </div>
      </div>

      {/* Instant Action Feedback Toast */}
      {remoteFeedback && (
        <div className="p-2.5 bg-emerald-950/95 border-b border-emerald-500 text-emerald-200 text-xs font-bold text-center animate-fade-in flex items-center justify-center gap-2 shadow-lg">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>{remoteFeedback}</span>
        </div>
      )}

      {/* Main Remote Navigation Switcher */}
      <div className="p-3 bg-[#0A0F24]/60 border-b border-slate-800 flex items-center justify-around gap-1">
        <button
          onClick={() => {
            sound.playTick();
            setActiveRemoteTab('games');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-changa flex items-center justify-center gap-1.5 transition-all ${
            activeRemoteTab === 'games'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/40 border border-purple-400'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Swords className="w-4 h-4" />
          <span>الألعاب و Ban/Pick</span>
        </button>

        <button
          onClick={() => {
            sound.playTick();
            setActiveRemoteTab('score');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold font-changa flex items-center justify-center gap-1.5 transition-all ${
            activeRemoteTab === 'score'
              ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/40 border border-cyan-400'
              : 'bg-slate-900 text-slate-400 border border-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>النتيجة والفرق</span>
        </button>
      </div>

      {/* TAB 1: REMOTE GAMES & BAN/PICK & REVEAL CONTROLS */}
      {activeRemoteTab === 'games' && (
        <div className="p-4 space-y-4">
          {/* Quick Global Action Buttons (Reset Cards & Restore Defaults) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleResetCardsFromPhone}
              className="py-2 px-3 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-700/60 text-rose-300 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة ضبط البطاقات</span>
            </button>

            <button
              onClick={handleRestoreDefaultGamesFromPhone}
              className="py-2 px-3 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 font-bold font-changa text-xs flex items-center justify-center gap-1.5 active:scale-95 shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>استعادة التشكيلة</span>
            </button>
          </div>
          {/* Active Live Game Indicator */}
          <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-cyan-950/60 border border-slate-700">
            <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1.5">
              <span>اللعبة المعروضة حالياً على الشاشة:</span>
              {activeGame && (
                <button
                  onClick={() => {
                    sound.playTick();
                    onSetActiveGame(null);
                  }}
                  className="text-rose-400 hover:text-rose-300 font-bold text-[10px] underline"
                >
                  إلغاء العرض
                </button>
              )}
            </div>
            {activeGame ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                  <GameIcon name={activeGame.iconType} className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-changa font-bold text-white text-base">{activeGame.nameAr}</h3>
                  <span className="text-[11px] text-cyan-400 font-mono">{activeGame.nameEn}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-amber-300/80 font-medium">لم يتم تحديد لعبة بعد. اختر لعبة من القائمة بالأسفل واضغط "إظهار على الشاشة".</p>
            )}
          </div>

          {/* Category Chips Bar */}
          <div>
            <div className="text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
              <span>اختر الفئة لإدارة ألعابها:</span>
              <button
                onClick={handleResetCardsFromPhone}
                className="text-slate-400 hover:text-rose-300 text-[11px] flex items-center gap-1 font-bold"
              >
                <RotateCcw className="w-3 h-3 text-rose-400" />
                <span>تصفير الاختيارات</span>
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      sound.playTick();
                      setSelectedCategory(cat.id);
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold font-changa text-center truncate transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-md border border-purple-400 scale-102'
                        : 'bg-slate-900/90 text-slate-400 border border-slate-800'
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Games of this category with Remote Actions */}
          <div className="space-y-3">
            {currentCategoryGames.map((game, slotIdx) => {
              const state = cardStates[game.id]?.status || 'available';
              const isCurrent = currentMatch.activeGameId === game.id;
              const isBannedA = state === 'banned_team_a';
              const isBannedB = state === 'banned_team_b';
              const isPickedA = state === 'picked_team_a';
              const isPickedB = state === 'picked_team_b';

              return (
                <div
                  key={game.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isCurrent
                      ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.3)]'
                      : isBannedA || isBannedB
                      ? 'bg-rose-950/20 border-rose-900/60'
                      : isPickedA || isPickedB
                      ? 'bg-emerald-950/20 border-emerald-900/60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  {/* Game Title & Current Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-slate-200">
                        <GameIcon name={game.iconType} className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="font-changa font-bold text-sm text-white">{game.nameAr}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">{game.nameEn}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isCurrent ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-600 text-white font-bold text-[10px] animate-pulse">
                          معروضة الآن
                        </span>
                      ) : isBannedA ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 font-bold text-[10px]">
                          محظورة من {teamA.shortName}
                        </span>
                      ) : isBannedB ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-950 border border-rose-600 text-rose-300 font-bold text-[10px]">
                          محظورة من {teamB.shortName}
                        </span>
                      ) : isPickedA ? (
                        <span className="px-2 py-0.5 rounded-full bg-purple-950 border border-purple-600 text-purple-300 font-bold text-[10px]">
                          اختيار {teamA.shortName}
                        </span>
                      ) : isPickedB ? (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-600 text-cyan-300 font-bold text-[10px]">
                          اختيار {teamB.shortName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-medium text-[10px]">
                          متاحة
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Primary Remote Action: Reveal on Screen */}
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                      onClick={() => {
                        sound.playPick('pick');
                        onSetActiveGame(game.id);
                      }}
                      className={`py-2 px-3 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-cyan-950/70 hover:bg-cyan-900/80 border border-cyan-700/60 text-cyan-200'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{isCurrent ? 'معروضة على الشاشة 🌟' : '📢 إظهار على الشاشة'}</span>
                    </button>

                    {/* Swap / Change Game Button */}
                    <button
                      onClick={() => {
                        sound.playTick();
                        setEditingGameSlot({ catId: selectedCategory, slotIdx });
                      }}
                      className="py-2 px-3 rounded-xl font-bold font-changa text-xs flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                      <span>تبديل اللعبة</span>
                    </button>
                  </div>

                  {/* Ban & Pick Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 text-[11px] font-bold font-changa">
                    {/* Pick Team A */}
                    <button
                      onClick={() => {
                        sound.playPick('pick');
                        onSetCardStatus(game.id, 'picked_team_a');
                      }}
                      className="py-1.5 px-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-600/60 text-purple-200 flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3 text-purple-300" />
                      <span>اختيار A</span>
                    </button>

                    {/* Ban Team A */}
                    <button
                      onClick={() => {
                        sound.playPick('ban');
                        onSetCardStatus(game.id, 'banned_team_a');
                      }}
                      className="py-1.5 px-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300 flex items-center justify-center gap-1"
                    >
                      <Ban className="w-3 h-3 text-rose-400" />
                      <span>حظر A</span>
                    </button>

                    {/* Pick Team B */}
                    <button
                      onClick={() => {
                        sound.playPick('pick');
                        onSetCardStatus(game.id, 'picked_team_b');
                      }}
                      className="py-1.5 px-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-600/60 text-cyan-200 flex items-center justify-center gap-1"
                    >
                      <Check className="w-3 h-3 text-cyan-300" />
                      <span>اختيار B</span>
                    </button>

                    {/* Ban Team B */}
                    <button
                      onClick={() => {
                        sound.playPick('ban');
                        onSetCardStatus(game.id, 'banned_team_b');
                      }}
                      className="py-1.5 px-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-600/60 text-rose-300 flex items-center justify-center gap-1"
                    >
                      <Ban className="w-3 h-3 text-rose-400" />
                      <span>حظر B</span>
                    </button>
                  </div>

                  {/* Reset Single Game Status */}
                  {state !== 'available' && (
                    <div className="mt-2 pt-2 border-t border-slate-800/60 flex justify-end">
                      <button
                        onClick={() => {
                          sound.playTick();
                          onSetCardStatus(game.id, 'available');
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 font-semibold"
                      >
                        <RotateCcw className="w-2.5 h-2.5" />
                        <span>إلغاء الحظر / الاختيار (إعادة متاح)</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Modal to pick replacement game from library */}
          {editingGameSlot && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-sm w-full p-4 text-right">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="font-changa font-bold text-sm text-white">اختر لعبة بديلة لوضعها في الشاشة:</h3>
                  <button
                    onClick={() => setEditingGameSlot(null)}
                    className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-800 rounded-lg"
                  >
                    إلغاء
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {categorySpareGames.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">لا توجد ألعاب احتياطية أخرى في هذه الفئة.</p>
                  ) : (
                    categorySpareGames.map((spare) => (
                      <button
                        key={spare.id}
                        onClick={() => {
                          if (onChangeColumnGame) {
                            sound.playPick('pick');
                            onChangeColumnGame(
                              editingGameSlot.catId,
                              editingGameSlot.slotIdx,
                              spare.id
                            );
                          }
                          setEditingGameSlot(null);
                        }}
                        className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-right flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <GameIcon name={spare.iconType} className="w-4 h-4 text-amber-400" />
                          <span className="font-bold text-xs text-white">{spare.nameAr}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{spare.nameEn}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REMOTE SCORE & TEAMS & MATCH FINISH */}
      {activeRemoteTab === 'score' && (
        <div className="p-4 space-y-4">
          {/* Team Selectors */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-900/60">
              <label className="text-[10px] text-purple-300 font-bold block mb-1">الفريق الأول (A):</label>
              <select
                value={currentMatch.teamAId}
                onChange={(e) => {
                  sound.playTick();
                  onChangeTeam('A', e.target.value);
                }}
                className="w-full bg-[#070B19] text-white text-xs font-bold rounded-lg p-1.5 border border-purple-600/40"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamBId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-900/60">
              <label className="text-[10px] text-cyan-300 font-bold block mb-1">الفريق الثاني (B):</label>
              <select
                value={currentMatch.teamBId}
                onChange={(e) => {
                  sound.playTick();
                  onChangeTeam('B', e.target.value);
                }}
                className="w-full bg-[#070B19] text-white text-xs font-bold rounded-lg p-1.5 border border-cyan-600/40"
              >
                {teams.map((t) => (
                  <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamAId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Big Score Remote Steppers */}
          <div className="grid grid-cols-2 gap-4 my-2">
            {/* Team A Stepper */}
            <div className="p-4 rounded-3xl bg-[#0B0F24] border-2 border-purple-500/50 flex flex-col items-center shadow-lg">
              <h3 className="font-changa font-bold text-sm text-purple-200 uppercase mb-2">
                {teamA.shortName}
              </h3>
              <div className="text-5xl font-orbitron font-black text-white my-1">
                {currentMatch.teamAScore}
              </div>
              <div className="flex items-center gap-2 mt-3 w-full">
                <button
                  onClick={() => {
                    sound.playTick();
                    onUpdateScore('A', -1);
                  }}
                  disabled={currentMatch.teamAScore <= 0}
                  className="flex-1 py-3 rounded-xl bg-slate-800 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    sound.playTick();
                    onUpdateScore('A', 1);
                  }}
                  disabled={currentMatch.teamAScore >= 3}
                  className="flex-1 py-3 rounded-xl bg-purple-600 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-purple-600/40"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Team B Stepper */}
            <div className="p-4 rounded-3xl bg-[#0B0F24] border-2 border-cyan-500/50 flex flex-col items-center shadow-lg">
              <h3 className="font-changa font-bold text-sm text-cyan-200 uppercase mb-2">
                {teamB.shortName}
              </h3>
              <div className="text-5xl font-orbitron font-black text-white my-1">
                {currentMatch.teamBScore}
              </div>
              <div className="flex items-center gap-2 mt-3 w-full">
                <button
                  onClick={() => {
                    sound.playTick();
                    onUpdateScore('B', -1);
                  }}
                  disabled={currentMatch.teamBScore <= 0}
                  className="flex-1 py-3 rounded-xl bg-slate-800 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {
                    sound.playTick();
                    onUpdateScore('B', 1);
                  }}
                  disabled={currentMatch.teamBScore >= 3}
                  className="flex-1 py-3 rounded-xl bg-cyan-600 disabled:opacity-30 text-white font-bold text-lg flex items-center justify-center shadow-lg shadow-cyan-600/40"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Primary Match Finish Action */}
          <div className="space-y-2 pt-2">
            <button
              onClick={() => {
                onFinishMatch();
              }}
              disabled={currentMatch.teamAScore === 0 && currentMatch.teamBScore === 0}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white font-black font-changa text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>إنهاء المباراة وتحديث الترتيب على الشاشة</span>
            </button>

            <button
              onClick={onResetCurrentMatch}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تصفير النتيجة (0 - 0)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
