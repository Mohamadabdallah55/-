import React, { useState } from 'react';
import {
  CategoryInfo,
  CategoryKey,
  CategorySelectedGames,
  GameItem,
  CardState,
  BanPickStatus,
  Team,
} from '../types';
import { GameIcon } from './GameIcons';
import {
  X,
  Check,
  Play,
  RotateCcw,
  Plus,
  Sliders,
  HelpCircle,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface BanPickEngineProps {
  categories: CategoryInfo[];
  games: GameItem[];
  selectedGamesPerCategory: CategorySelectedGames;
  cardStates: Record<string, CardState>;
  teamA: Team;
  teamB: Team;
  activeGameId: string | null;
  onSetCardStatus: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame: (gameId: string | null) => void;
  onResetAllBansPicks: () => void;
  onAddNewGame: (game: Partial<GameItem>) => void;
  onOpenSetupModal?: () => void;
}

export const BanPickEngine: React.FC<BanPickEngineProps> = ({
  categories,
  games,
  selectedGamesPerCategory,
  cardStates,
  teamA,
  teamB,
  activeGameId,
  onSetCardStatus,
  onSetActiveGame,
  onResetAllBansPicks,
  onAddNewGame,
  onOpenSetupModal,
}) => {
  const [selectedGameForModal, setSelectedGameForModal] = useState<GameItem | null>(null);
  const [showAddGameModal, setShowAddGameModal] = useState(false);
  const [newGameCat, setNewGameCat] = useState<CategoryKey>('digital');
  const [newGameNameAr, setNewGameNameAr] = useState('');
  const [newGameNameEn, setNewGameNameEn] = useState('');
  const [newGameDesc, setNewGameDesc] = useState('');

  // 5 Active Categories
  const activeCategoriesList = categories;

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

  const handleCreateNewGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGameNameAr.trim()) return;
    onAddNewGame({
      categoryId: newGameCat,
      nameAr: newGameNameAr.trim(),
      nameEn: newGameNameEn.trim() || newGameNameAr.trim(),
      description: newGameDesc.trim(),
      iconType: 'gamepad',
      isCustom: true,
    });
    setNewGameNameAr('');
    setNewGameNameEn('');
    setNewGameDesc('');
    setShowAddGameModal(false);
  };

  return (
    <div className="w-full bg-[#0C1226]/80 border border-slate-800/80 rounded-2xl p-4 sm:p-6 shadow-2xl relative">
      {/* Top Banner and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold font-changa text-white">
              مرحلة الحظر والاختيار (Ban & Pick Engine)
            </h2>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 border border-indigo-700/50">
              تحكم يدوي دائم 100%
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            اضغط على أي لعبة لتحديد حظرها أو اختيارها. لا يتم إخفاء أو استبعاد أي لعبة تلقائياً أبداً.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSetupModal && (
            <button
              onClick={onOpenSetupModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-lg transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>تخصيص ألعاب الفئات (3 لكل فئة)</span>
            </button>
          )}

          <button
            onClick={() => setShowAddGameModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-800/60 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة لعبة للبنك</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('هل أنت متأكد من إعادة ضبط جميع بطاقات الحظر والاختيار لهذه المباراة؟')) {
                onResetAllBansPicks();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط البطاقات</span>
          </button>
        </div>
      </div>

      {/* Legend & Instructions */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-6 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
        <span className="font-semibold text-slate-300">دليل الحالات:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-purple-500/80" />
          <span>اختيار {teamA.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-cyan-500/80" />
          <span>اختيار {teamB.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm flex items-center justify-center font-black text-purple-400 text-xs font-mono">
            ✕
          </span>
          <span>استبعاد {teamA.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm flex items-center justify-center font-black text-cyan-400 text-xs font-mono">
            ✕
          </span>
          <span>استبعاد {teamB.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-amber-400 animate-pulse" />
          <span>اللعبة الجارية الآن</span>
        </div>
      </div>

      {/* Categories Columns (Matching screenshot IMG_3937 & Screenshot 2026-09-23 at 7.04.48 AM) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {activeCategoriesList.map((category) => {
          const gameIds = selectedGamesPerCategory[category.id] || [];
          const categoryGames = gameIds
            .map((id: string) => games.find((g) => g.id === id))
            .filter(Boolean) as GameItem[];

          return (
            <div
              key={category.id}
              className="flex flex-col bg-slate-900/40 rounded-2xl p-3 sm:p-4 border border-slate-800/80 shadow-inner"
            >
              {/* Category Header Badge */}
              <div
                className="w-full py-2.5 px-3 rounded-xl mb-4 text-center font-bold tracking-wider uppercase font-orbitron border shadow-md flex items-center justify-center gap-2"
                style={{
                  backgroundColor: `${category.accentColor}18`,
                  borderColor: `${category.accentColor}40`,
                  color: category.accentColor,
                  boxShadow: `0 0 15px ${category.accentColor}25`,
                }}
              >
                <GameIcon name={category.icon} className="w-4 h-4" />
                <span className="font-extrabold text-sm">{category.nameEn}</span>
                <span className="text-xs opacity-75 font-changa font-normal">({category.nameAr})</span>
              </div>

              {/* 3 Games Stack in this Category */}
              <div className="flex flex-col gap-3.5 flex-1 content-start">
                {categoryGames.map((game) => {
                  const cardState = cardStates[game.id]?.status || 'available';
                  const isCurrent = activeGameId === game.id || cardState === 'current';
                  const isBannedA = cardState === 'banned_team_a';
                  const isBannedB = cardState === 'banned_team_b';
                  const isPickedA = cardState === 'picked_team_a';
                  const isPickedB = cardState === 'picked_team_b';
                  const isCompleted = cardState === 'completed';

                  return (
                    <button
                      key={game.id}
                      onClick={() => handleCardClick(game)}
                      className={`relative group p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-between min-h-[140px] cursor-pointer focus:outline-none ${
                        isCurrent
                          ? 'bg-amber-950/30 border-amber-400 ring-2 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                          : isPickedA
                          ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/70 shadow-[0_0_20px_rgba(168,85,247,0.4)]'
                          : isPickedB
                          ? 'bg-cyan-950/40 border-cyan-500 ring-2 ring-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.4)]'
                          : isBannedA || isBannedB
                          ? 'bg-slate-900/90 border-slate-700/80 opacity-60 hover:opacity-100'
                          : isCompleted
                          ? 'bg-slate-900/60 border-emerald-800/60 opacity-75'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'
                      }`}
                    >
                      {/* Hexagonal Inner Badge Container */}
                      <div className="relative my-1">
                        <div
                          className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 border ${
                            isCurrent
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                              : isPickedA
                              ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                              : isPickedB
                              ? 'bg-cyan-600/30 border-cyan-400 text-cyan-200'
                              : 'bg-slate-800/90 border-slate-700 text-slate-200'
                          }`}
                        >
                          <GameIcon name={game.iconType} className="w-8 h-8" />
                        </div>

                        {/* Ban Cross Overlay (MATCHING SCREENSHOT 2026-09-23 AT 7.04.48 AM) */}
                        {isBannedA && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-5xl font-black text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] select-none">
                              ✕
                            </span>
                          </div>
                        )}
                        {isBannedB && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="text-5xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] select-none">
                              ✕
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Status Details */}
                      <div className="w-full mt-2">
                        <div className="font-bold text-xs sm:text-sm text-white font-changa line-clamp-1">
                          {game.nameAr}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tracking-wider uppercase line-clamp-1 mt-0.5">
                          {game.nameEn}
                        </div>

                        {/* Dynamic Status Badge */}
                        <div className="mt-1.5 flex justify-center">
                          {isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold animate-pulse">
                              تلعب الآن
                            </span>
                          )}
                          {isPickedA && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold">
                              اختيار {teamA.shortName}
                            </span>
                          )}
                          {isPickedB && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 font-bold">
                              اختيار {teamB.shortName}
                            </span>
                          )}
                          {isBannedA && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-400 border border-purple-800 font-medium">
                              حظر {teamA.shortName}
                            </span>
                          )}
                          {isBannedB && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-800 font-medium">
                              حظر {teamB.shortName}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800 font-medium">
                              مكتملة
                            </span>
                          )}
                          {cardState === 'available' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded text-slate-500 font-mono">
                              متاحة
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Action Modal on clicking any game card */}
      {selectedGameForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in">
          <div className="bg-[#0C1226] border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-right">
            {/* Close button */}
            <button
              onClick={() => setSelectedGameForModal(null)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Game Info */}
            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-purple-900/40 border border-purple-500/50 flex items-center justify-center text-purple-300">
                <GameIcon name={selectedGameForModal.iconType} className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-changa">
                  {selectedGameForModal.nameAr}
                </h3>
                <p className="text-xs text-slate-400 font-mono uppercase">
                  {selectedGameForModal.nameEn}
                </p>
                {selectedGameForModal.description && (
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedGameForModal.description}
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs font-semibold text-slate-300 mb-3">
              حدد إجراء المنظم للعبة في هذه المواجهة:
            </p>

            {/* Action Grid */}
            <div className="grid grid-cols-2 gap-2.5 mb-4">
              {/* Ban by Team A */}
              <button
                onClick={() => handleAction('banned_team_a')}
                className="p-2.5 rounded-xl border border-purple-700/60 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamA.name})</span>
              </button>

              {/* Ban by Team B */}
              <button
                onClick={() => handleAction('banned_team_b')}
                className="p-2.5 rounded-xl border border-cyan-700/60 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <span className="font-mono text-base font-black">✕</span>
                <span>استبعاد ({teamB.name})</span>
              </button>

              {/* Pick by Team A */}
              <button
                onClick={() => handleAction('picked_team_a')}
                className="p-2.5 rounded-xl border border-purple-500/60 bg-purple-600/30 hover:bg-purple-600/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4 text-purple-300" />
                <span>اختيار ({teamA.name})</span>
              </button>

              {/* Pick by Team B */}
              <button
                onClick={() => handleAction('picked_team_b')}
                className="p-2.5 rounded-xl border border-cyan-500/60 bg-cyan-600/30 hover:bg-cyan-600/50 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Check className="w-4 h-4 text-cyan-300" />
                <span>اختيار ({teamB.name})</span>
              </button>

              {/* Set Current Playing Game */}
              <button
                onClick={() => handleAction('current')}
                className="col-span-2 p-3 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Play className="w-4 h-4 fill-amber-300" />
                <span>تعيين كلعبة الجولة الحالية (Live Match)</span>
              </button>

              {/* Mark as Completed */}
              <button
                onClick={() => handleAction('completed')}
                className="p-2.5 rounded-xl border border-emerald-800/80 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>تم الانتهاء منها</span>
              </button>

              {/* Reset to Available */}
              <button
                onClick={() => handleAction('available')}
                className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>إعادة للمتاح (متاحة)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Game Modal */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in">
          <form
            onSubmit={handleCreateNewGame}
            className="bg-[#0C1226] border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl relative text-right"
          >
            <button
              type="button"
              onClick={() => setShowAddGameModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white font-changa mb-4 pb-2 border-b border-slate-800">
              إضافة لعبة جديدة لبنك ألعاب التحدي
            </h3>

            <div className="space-y-3.5 mb-5 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">الفئة التابعة لها:</label>
                <select
                  value={newGameCat}
                  onChange={(e) => setNewGameCat(e.target.value as CategoryKey)}
                  className="w-full bg-[#070B19] text-white border border-slate-700 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nameAr} ({c.nameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم اللعبة بالعربي:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سباق المتاهة"
                  value={newGameNameAr}
                  onChange={(e) => setNewGameNameAr(e.target.value)}
                  className="w-full bg-[#070B19] text-white border border-slate-700 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">اسم اللعبة بالإنجليزي (اختياري):</label>
                <input
                  type="text"
                  placeholder="e.g. MAZE RACE"
                  value={newGameNameEn}
                  onChange={(e) => setNewGameNameEn(e.target.value)}
                  className="w-full bg-[#070B19] text-white border border-slate-700 rounded-lg p-2 focus:border-cyan-400 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">وصف اللعبة أو شروطها:</label>
                <textarea
                  rows={2}
                  placeholder="شرح موجز للتحدي للمنظمين والمتسابقين..."
                  value={newGameDesc}
                  onChange={(e) => setNewGameDesc(e.target.value)}
                  className="w-full bg-[#070B19] text-white border border-slate-700 rounded-lg p-2 focus:border-cyan-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddGameModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg shadow-md"
              >
                حفظ اللعبة في البنك
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
