import React, { useEffect, useState } from 'react';
import { CurrentMatch, Team, GameItem, CategoryInfo } from '../types';
import { GameIcon } from './GameIcons';
import {
  Trophy,
  CheckCircle2,
  Play,
  Maximize2,
  Minimize2,
  X,
  Volume2,
  VolumeX,
  Keyboard,
  Sparkles,
} from 'lucide-react';
import { sound } from '../utils/audio';

interface ArenaStageViewProps {
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  categories: CategoryInfo[];
  onClose: () => void;
  onOpenHotkeys?: () => void;
}

export const ArenaStageView: React.FC<ArenaStageViewProps> = ({
  currentMatch,
  teams,
  games,
  categories,
  onClose,
  onOpenHotkeys,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];

  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);
  const activeCategory = activeGame
    ? categories.find((c) => c.id === activeGame.categoryId)
    : null;

  const isMatchDecided = currentMatch.teamAScore >= 3 || currentMatch.teamBScore >= 3;
  const matchWinner =
    currentMatch.teamAScore >= 3 ? teamA : currentMatch.teamBScore >= 3 ? teamB : null;

  const isMatchPointA = currentMatch.teamAScore === 2 && currentMatch.teamBScore < 3;
  const isMatchPointB = currentMatch.teamBScore === 2 && currentMatch.teamAScore < 3;

  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreen(false);
      }
    } catch {}
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'b' || e.key === 'B') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#050814] text-white flex flex-col justify-between p-4 sm:p-8 select-none animate-fade-in overflow-hidden">
      {/* Ambient Arena Stadium Neon Glows (hardware-accelerated, no blur-3xl) */}
      <div
        className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20 pointer-events-none transition-colors"
        style={{
          background: `radial-gradient(circle, ${teamA?.color || '#A855F7'} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 pointer-events-none transition-colors"
        style={{
          background: `radial-gradient(circle, ${teamB?.color || '#06B6D4'} 0%, transparent 70%)`,
        }}
      />

      {/* Top Floating Stage Bar */}
      <header className="relative z-10 flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white font-orbitron text-sm shadow-lg">
            CE
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black font-changa text-white flex items-center gap-2">
              <span>دوري صراع النخبة</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                ARENA STAGE VIEW
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-changa">
              شاشة العرض المباشر المخصصة للمسرح والجمهور والبث المباشر
            </p>
          </div>
        </div>

        {/* Quick Stage Actions */}
        <div className="flex items-center gap-2">
          {onOpenHotkeys && (
            <button
              onClick={onOpenHotkeys}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold font-changa flex items-center gap-1.5 transition-colors"
              title="دليل اختصارات لوحة المفاتيح"
            >
              <Keyboard className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">الاختصارات</span>
            </button>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-purple-500/50 text-purple-300'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
            title={soundEnabled ? 'كتم الصوت' : 'تفعيل المؤثرات'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-colors"
            title="ملء الشاشة (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 text-rose-200 text-xs font-bold font-changa transition-colors"
            title="خروج من وضع المسرح (ESC أو B)"
          >
            <X className="w-4 h-4" />
            <span>خروج (ESC)</span>
          </button>
        </div>
      </header>

      {/* Main Massive Stage Arena View */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center my-4 sm:my-6 w-full max-w-6xl mx-auto">
        {/* Active Game & Category Banner */}
        <div className="mb-6 flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#0A0F24] border border-cyan-500/40 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-center">
          {activeGame ? (
            <>
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                <GameIcon name={activeGame.iconType} className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-changa">اللعبة الجارية الآن:</span>
                <span className="text-base sm:text-lg font-black font-changa text-cyan-200">
                  {activeGame.nameAr}
                  <span className="text-xs text-slate-400 font-mono ml-2">({activeGame.nameEn})</span>
                </span>
              </div>
              {activeCategory && (
                <span
                  className="px-2.5 py-1 rounded-lg text-xs font-bold font-changa ml-2 border"
                  style={{
                    backgroundColor: `${activeCategory.accentColor}20`,
                    borderColor: `${activeCategory.accentColor}60`,
                    color: activeCategory.accentColor,
                  }}
                >
                  {activeCategory.nameAr}
                </span>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 font-changa text-sm py-1">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>مواجهة Best of 5 — بانتظار تحديد لعبة الجولة الحالية</span>
            </div>
          )}
        </div>

        {/* MEGA VS STAGE SCOREBOARD */}
        <div className="w-full bg-[#070D1F] rounded-3xl border-2 border-slate-700/80 shadow-[0_0_60px_rgba(0,0,0,0.9)] p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          {/* Team A Stage Side */}
          <div className="flex-1 flex flex-col md:flex-row items-center justify-start gap-6 w-full text-center md:text-right">
            {/* Giant Score Digit */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center font-orbitron font-black text-6xl sm:text-8xl text-white shadow-2xl transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: teamA?.color || '#A855F7',
                boxShadow: `0 0 45px ${teamA?.color || '#A855F7'}70`,
              }}
            >
              {currentMatch.teamAScore}
            </div>

            {/* Team Crest & Name */}
            <div className="flex flex-col items-center md:items-start">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 border-purple-400/60 bg-purple-950/60 text-purple-200 mb-2 shadow-lg"
              >
                <GameIcon name={teamA?.logo || 'crown'} className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-changa text-white uppercase tracking-wide">
                {teamA?.shortName || teamA?.name}
              </h2>
              <p className="text-sm sm:text-base text-purple-300 font-bold mt-0.5">
                {teamA?.name}
              </p>
              {isMatchPointA && !isMatchDecided && (
                <span className="mt-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black font-orbitron text-xs shadow-lg animate-pulse">
                  ⚡ MATCH POINT
                </span>
              )}
            </div>
          </div>

          {/* Central Emblem & VS Separator */}
          <div className="flex flex-col items-center justify-center shrink-0 my-2 md:my-0 px-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_40px_rgba(99,102,241,0.6)]">
              <div className="w-full h-full bg-[#050814] rounded-[22px] flex flex-col items-center justify-center">
                <span className="font-orbitron font-black text-2xl sm:text-3xl tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-cyan-300 to-amber-300">
                  VS
                </span>
              </div>
            </div>
            <span className="mt-2 text-xs font-orbitron text-slate-400 font-bold tracking-widest uppercase bg-slate-900 px-3 py-0.5 rounded-full border border-slate-800">
              BEST OF 5
            </span>
          </div>

          {/* Team B Stage Side */}
          <div className="flex-1 flex flex-col md:flex-row-reverse items-center justify-start gap-6 w-full text-center md:text-left">
            {/* Giant Score Digit */}
            <div
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl flex items-center justify-center font-orbitron font-black text-6xl sm:text-8xl text-white shadow-2xl transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: teamB?.color || '#06B6D4',
                boxShadow: `0 0 45px ${teamB?.color || '#06B6D4'}70`,
              }}
            >
              {currentMatch.teamBScore}
            </div>

            {/* Team Crest & Name */}
            <div className="flex flex-col items-center md:items-end">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center border-2 border-cyan-400/60 bg-cyan-950/60 text-cyan-200 mb-2 shadow-lg"
              >
                <GameIcon name={teamB?.logo || 'shield'} className="w-9 h-9 sm:w-11 sm:h-11" />
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black font-changa text-white uppercase tracking-wide">
                {teamB?.shortName || teamB?.name}
              </h2>
              <p className="text-sm sm:text-base text-cyan-300 font-bold mt-0.5">
                {teamB?.name}
              </p>
              {isMatchPointB && !isMatchDecided && (
                <span className="mt-2 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black font-orbitron text-xs shadow-lg animate-pulse">
                  ⚡ MATCH POINT
                </span>
              )}
            </div>
          </div>
        </div>

        {/* INTERACTIVE ROUND TIMELINE TRACKER (FOR AUDIENCE & SPECTATORS) */}
        <div className="w-full mt-6 p-4 rounded-2xl bg-[#070D1E] border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-changa">
            <span className="font-bold text-slate-300">مسار ومجريات جولات المواجهة:</span>
            <span>الفائز أول من يحسم 3 جولات</span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((roundNum) => {
              const totalWon = currentMatch.teamAScore + currentMatch.teamBScore;
              const isWonByA = roundNum <= currentMatch.teamAScore;
              const isWonByB = roundNum > currentMatch.teamAScore && roundNum <= totalWon;
              const isCurrent = roundNum === totalWon + 1 && !isMatchDecided;

              return (
                <div
                  key={roundNum}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    isWonByA
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-lg shadow-purple-600/30'
                      : isWonByB
                      ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-lg shadow-cyan-600/30'
                      : isCurrent
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-2 ring-amber-400/40 animate-pulse'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                    <span className="font-bold">جولة {roundNum}</span>
                    {isWonByA && <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />}
                    {isWonByB && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />}
                    {isCurrent && <Play className="w-3 h-3 text-amber-400 fill-amber-400 animate-bounce" />}
                  </div>

                  <div className="text-xs font-black font-changa truncate">
                    {isWonByA ? (
                      <span className="text-purple-300">{teamA?.shortName} ✓</span>
                    ) : isWonByB ? (
                      <span className="text-cyan-300">{teamB?.shortName} ✓</span>
                    ) : isCurrent ? (
                      <span className="text-amber-300">جارية الآن 🔴</span>
                    ) : (
                      <span className="text-slate-600">قادمة</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Victory Banner if Match Decided */}
        {isMatchDecided && matchWinner && (
          <div className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-900/70 via-purple-900/60 to-amber-900/70 border-2 border-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center gap-4 text-center animate-bounce">
            <Trophy className="w-8 h-8 text-amber-400" />
            <div>
              <span className="text-amber-200 text-xs sm:text-sm font-bold font-changa block">
                حسمت المواجهة رسمياً لصالح
              </span>
              <span className="text-2xl sm:text-3xl font-black font-changa text-white">
                👑 {matchWinner.name} ({matchWinner.shortName})
              </span>
            </div>
            <Trophy className="w-8 h-8 text-amber-400" />
          </div>
        )}
      </main>

      {/* Footer Hotkey Cue */}
      <footer className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-3">
          <span>⌨️ الاختصارات:</span>
          <span>[ ↑ / ↓ ] نقاط الفريق 1</span>
          <span>·</span>
          <span>[ → / ← ] نقاط الفريق 2</span>
          <span>·</span>
          <span>[ F ] ملء الشاشة</span>
          <span>·</span>
          <span>[ ESC ] خروج</span>
        </div>
        <div>
          <span>دوري صراع النخبة | بث المسرح</span>
        </div>
      </footer>
    </div>
  );
};
