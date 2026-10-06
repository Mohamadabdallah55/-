import React, { useState } from 'react';
import { GameItem, BanPickStatus, Team } from '../types';
import { GameIcon } from './GameIcons';
import { Sparkles, Play, Check, X, Info, BookOpen, Scale } from 'lucide-react';
import { sound } from '../utils/audio';

interface GamesLibraryMapProps {
  games: GameItem[];
  cardStates: Record<string, { gameId: string; status: BanPickStatus }>;
  activeGameId: string | null;
  teamA?: Team;
  teamB?: Team;
  onSetCardStatus?: (gameId: string, status: BanPickStatus) => void;
  onSetActiveGame?: (gameId: string | null) => void;
}

export const GamesLibraryMap: React.FC<GamesLibraryMapProps> = ({
  games,
  cardStates,
  activeGameId,
  teamA,
  teamB,
  onSetCardStatus,
  onSetActiveGame,
}) => {
  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);

  // Group games by category
  const digitalGames = games.filter((g) => g.categoryId === 'digital');
  const mentalGames = games.filter((g) => g.categoryId === 'mental');
  const physicalGames = games.filter((g) => g.categoryId === 'physical');
  const captainsGames = games.filter((g) => g.categoryId === '1v1' || g.categoryId === 'captains');
  const fanVoteGames = games.filter((g) => g.categoryId === 'fan_vote');

  const handleBadgeClick = (game: GameItem) => {
    sound.playTick();
    setSelectedGame(game);
  };

  const renderBadge = (game: GameItem, ringColor: string, glowColor: string) => {
    const status = cardStates[game.id]?.status || 'available';
    const isCurrent = activeGameId === game.id || status === 'current';
    const isBannedA = status === 'banned_team_a';
    const isBannedB = status === 'banned_team_b';
    const isPickedA = status === 'picked_team_a';
    const isPickedB = status === 'picked_team_b';

    return (
      <div
        key={game.id}
        onClick={() => handleBadgeClick(game)}
        className="flex flex-col items-center cursor-pointer group transition-transform hover:scale-110 relative"
      >
        {/* Circular Satellite Badge */}
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center p-1 border-2 transition-all relative shadow-lg ${
            isCurrent
              ? 'ring-4 ring-amber-400 bg-amber-950/80 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.6)]'
              : isPickedA
              ? 'ring-4 ring-purple-500 bg-purple-950/80 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6)]'
              : isPickedB
              ? 'ring-4 ring-cyan-500 bg-cyan-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.6)]'
              : isBannedA || isBannedB
              ? 'opacity-60 bg-slate-900 border-slate-700'
              : 'bg-[#0B132B] hover:border-white hover:shadow-xl'
          }`}
          style={{
            borderColor: isCurrent || isPickedA || isPickedB ? undefined : ringColor,
            boxShadow: `0 0 15px ${glowColor}`,
          }}
        >
          <div className="w-full h-full rounded-full flex items-center justify-center overflow-hidden">
            <GameIcon name={game.iconType} className="w-11 h-11 sm:w-14 sm:h-14" />
          </div>

          {/* Ban Cross Overlay */}
          {isBannedA && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)] select-none">
                ✕
              </span>
            </div>
          )}
          {isBannedB && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.9)] select-none">
                ✕
              </span>
            </div>
          )}
        </div>

        {/* Game Label Below */}
        <span className="mt-1 text-[11px] sm:text-xs font-bold font-changa text-slate-200 text-center max-w-[85px] leading-tight line-clamp-2 drop-shadow-md group-hover:text-white transition-colors">
          {game.nameAr}
        </span>
      </div>
    );
  };

  return (
    <div className="w-full bg-[#070D1F] border border-slate-800 rounded-3xl p-4 sm:p-8 shadow-2xl relative overflow-hidden select-none">
      {/* Background Ambience & Doodles */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 left-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[500px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER: مكتبة الألعاب (MATCHING IMAGE 1) */}
      <div className="flex flex-col items-center justify-center mb-8 relative z-10">
        <div className="w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-cyan-600/30 via-slate-900 to-[#070D1F] border-4 border-cyan-400/80 p-2 shadow-[0_0_50px_rgba(6,182,212,0.5)] flex flex-col items-center justify-center text-center">
          <div className="w-full h-full rounded-full border-2 border-cyan-500/40 flex flex-col items-center justify-center bg-[#08152B]/90">
            <Sparkles className="w-6 h-6 text-cyan-300 mb-1 animate-pulse" />
            <h2 className="text-2xl sm:text-3xl font-black font-changa text-white tracking-wide drop-shadow-md">
              مكتبة
            </h2>
            <h2 className="text-2xl sm:text-3xl font-black font-changa text-cyan-300 tracking-wide drop-shadow-md">
              الألعاب
            </h2>
            <span className="text-[10px] font-mono text-cyan-400/80 mt-1 uppercase tracking-widest">
              GAMES VAULT
            </span>
          </div>
        </div>
      </div>

      {/* 3 PLANETARY CATEGORY ORBITS (MATCHING IMAGE 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 relative z-10">
        
        {/* 1. الكتروني (BLUE POD - DIGITAL) */}
        <div className="flex flex-col items-center relative p-4 rounded-3xl bg-slate-900/40 border border-cyan-900/50 shadow-inner">
          {/* Central Planet */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#0C1A38] to-[#060F24] border-4 border-cyan-400 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)] my-4 relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-cyan-500/40 flex flex-col items-center justify-center text-center bg-[#071329]">
              <span className="text-xl sm:text-2xl font-black font-changa text-white drop-shadow-md">
                الكتروني
              </span>
              <span className="text-[10px] font-orbitron font-bold text-cyan-400 tracking-widest mt-0.5">
                DIGITAL
              </span>
            </div>
          </div>

          {/* Satellites Grid around Electronic */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5 sm:gap-4 mt-2 justify-items-center">
            {digitalGames.map((game) =>
              renderBadge(game, '#38BDF8', 'rgba(56, 189, 248, 0.35)')
            )}
          </div>
        </div>

        {/* 2. ذكاء (GREEN POD - MENTAL) */}
        <div className="flex flex-col items-center relative p-4 rounded-3xl bg-slate-900/40 border border-emerald-900/50 shadow-inner">
          {/* Central Planet */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#0A261C] to-[#041710] border-4 border-emerald-400 flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.4)] my-4 relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-emerald-500/40 flex flex-col items-center justify-center text-center bg-[#062017]">
              <span className="text-xl sm:text-2xl font-black font-changa text-white drop-shadow-md">
                ذكاء
              </span>
              <span className="text-[10px] font-orbitron font-bold text-emerald-400 tracking-widest mt-0.5">
                MENTAL
              </span>
            </div>
          </div>

          {/* Satellites Grid around Mental */}
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3.5 sm:gap-4 mt-2 justify-items-center">
            {mentalGames.map((game) =>
              renderBadge(game, '#34D399', 'rgba(52, 211, 153, 0.35)')
            )}
          </div>
        </div>

        {/* 3. بدني (ORANGE POD - PHYSICAL) */}
        <div className="flex flex-col items-center relative p-4 rounded-3xl bg-slate-900/40 border border-amber-900/50 shadow-inner">
          {/* Central Planet */}
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-[#2E1807] to-[#170C03] border-4 border-amber-500 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.4)] my-4 relative">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-amber-500/40 flex flex-col items-center justify-center text-center bg-[#241306]">
              <span className="text-xl sm:text-2xl font-black font-changa text-white drop-shadow-md">
                بدني
              </span>
              <span className="text-[10px] font-orbitron font-bold text-amber-400 tracking-widest mt-0.5">
                PHYSICAL
              </span>
            </div>
          </div>

          {/* Satellites Grid around Physical */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-3.5 sm:gap-4 mt-2 justify-items-center">
            {physicalGames.map((game) =>
              renderBadge(game, '#F59E0B', 'rgba(245, 158, 11, 0.35)')
            )}
          </div>
        </div>
      </div>

      {/* 4 & 5. تحدي الكباتن وتصويت الجمهور (BOTTOM PODS) */}
      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* 4. 1 ضد 1 (1V1) */}
        <div className="flex flex-col items-center p-4 rounded-3xl bg-slate-900/40 border border-rose-900/50 shadow-inner">
          <div className="px-6 py-2 rounded-full border-2 border-rose-500/80 bg-gradient-to-r from-rose-950/70 via-red-950/70 to-rose-950/70 shadow-[0_0_35px_rgba(239,68,68,0.45)] mb-4 text-center">
            <span className="text-base sm:text-lg font-black font-changa text-white">
              1 ضد 1 (1V1)
            </span>
            <span className="text-[10px] font-orbitron text-rose-300 block tracking-wider uppercase font-bold">
              مواجهات فردية مباشرة بين ممثلي الفريقين
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {captainsGames.map((game) =>
              renderBadge(game, '#EF4444', 'rgba(239, 68, 68, 0.5)')
            )}
          </div>
        </div>

        {/* 5. تصويت الجمهور (FAN VOTE) */}
        <div className="flex flex-col items-center p-4 rounded-3xl bg-slate-900/40 border border-pink-900/50 shadow-inner">
          <div className="px-6 py-2 rounded-full border-2 border-pink-500/80 bg-gradient-to-r from-pink-950/70 via-purple-950/70 to-pink-950/70 shadow-[0_0_35px_rgba(236,72,153,0.45)] mb-4 text-center">
            <span className="text-base sm:text-lg font-black font-changa text-white">
              تصويت الجمهور (FAN VOTE)
            </span>
            <span className="text-[10px] font-orbitron text-pink-300 block tracking-wider uppercase font-bold">
              متاح اختيار أي لعبة من كامل المكتبة بالتصويت
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 sm:gap-10 flex-wrap">
            {fanVoteGames.map((game) =>
              renderBadge(game, '#EC4899', 'rgba(236, 72, 153, 0.5)')
            )}
          </div>
        </div>
      </div>

      {/* Interactive Modal when clicking any game in the bank */}
      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in text-right">
          <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedGame(null)}
              className="absolute top-5 left-5 text-slate-400 hover:text-white p-1 rounded-xl bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header info */}
            <div className="flex items-center gap-4 mb-5 pb-4 border-b border-slate-800">
              <div className="w-16 h-16 rounded-full bg-slate-900 border-2 border-cyan-400 flex items-center justify-center p-1 shrink-0 shadow-lg">
                <GameIcon name={selectedGame.iconType} className="w-12 h-12" />
              </div>
              <div>
                <h3 className="text-xl font-bold font-changa text-white">
                  {selectedGame.nameAr}
                </h3>
                <p className="text-xs font-mono text-cyan-400 font-bold uppercase">
                  {selectedGame.nameEn}
                </p>
                {selectedGame.description && (
                  <p className="text-xs text-slate-300 mt-1">
                    {selectedGame.description}
                  </p>
                )}
              </div>
            </div>

            {/* Game Rules Section if present */}
            {selectedGame.rules && selectedGame.rules.trim() !== '' && (
              <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/30 to-purple-950/30 border border-amber-500/40 text-xs">
                <div className="font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-amber-400" />
                  <span>قوانين وشروط اللعبة:</span>
                </div>
                <div className="text-slate-200 whitespace-pre-line leading-relaxed font-sans text-[11px] sm:text-xs">
                  {selectedGame.rules}
                </div>
              </div>
            )}

            {/* Quick Actions if onSetCardStatus is available */}
            {onSetCardStatus && teamA && teamB && (
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-3">
                  إجراءات حظر / اختيار هذه اللعبة للمواجهة الحالية:
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <button
                    onClick={() => {
                      sound.playPick('ban');
                      onSetCardStatus(selectedGame.id, 'banned_team_a');
                      setSelectedGame(null);
                    }}
                    className="p-2.5 rounded-xl border border-purple-800 bg-purple-950/50 hover:bg-purple-900/60 text-purple-300 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>✕ استبعاد ({teamA.shortName})</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playPick('ban');
                      onSetCardStatus(selectedGame.id, 'banned_team_b');
                      setSelectedGame(null);
                    }}
                    className="p-2.5 rounded-xl border border-cyan-800 bg-cyan-950/50 hover:bg-cyan-900/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <span>✕ استبعاد ({teamB.shortName})</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playPick('pick');
                      onSetCardStatus(selectedGame.id, 'picked_team_a');
                      setSelectedGame(null);
                    }}
                    className="p-2.5 rounded-xl border border-purple-500 bg-purple-600/30 hover:bg-purple-600/50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-purple-300" />
                    <span>اختيار ({teamA.shortName})</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playPick('pick');
                      onSetCardStatus(selectedGame.id, 'picked_team_b');
                      setSelectedGame(null);
                    }}
                    className="p-2.5 rounded-xl border border-cyan-500 bg-cyan-600/30 hover:bg-cyan-600/50 text-white text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5 text-cyan-300" />
                    <span>اختيار ({teamB.shortName})</span>
                  </button>
                </div>

                {onSetActiveGame && (
                  <button
                    onClick={() => {
                      sound.playPick('pick');
                      onSetCardStatus(selectedGame.id, 'current');
                      onSetActiveGame(selectedGame.id);
                      setSelectedGame(null);
                    }}
                    className="w-full py-2.5 px-4 rounded-xl border border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold flex items-center justify-center gap-2 mb-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-amber-300" />
                    <span>تعيين كلعبة الجولة الحالية للمباراة</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    sound.playTick();
                    onSetCardStatus(selectedGame.id, 'available');
                    setSelectedGame(null);
                  }}
                  className="w-full py-2 px-3 text-xs text-slate-400 hover:text-white bg-slate-800/80 rounded-xl"
                >
                  إعادة للحالة المتاحة (إلغاء الحظر أو الاختيار)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
