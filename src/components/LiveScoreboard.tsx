import React from 'react';
import { CurrentMatch, Team, GameItem, CategoryInfo } from '../types';
import { GameIcon } from './GameIcons';
import { Plus, Minus, Trophy, CheckCircle2, RotateCcw, Play, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface LiveScoreboardProps {
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  categories: CategoryInfo[];
  onUpdateScore: (team: 'A' | 'B', delta: number) => void;
  onChangeTeam: (slot: 'A' | 'B', teamId: string) => void;
  onFinishMatch: () => void;
  onResetCurrentMatch: () => void;
  onOpenBanPickTab: () => void;
}

export const LiveScoreboard: React.FC<LiveScoreboardProps> = ({
  currentMatch,
  teams,
  games,
  categories,
  onUpdateScore,
  onChangeTeam,
  onFinishMatch,
  onResetCurrentMatch,
  onOpenBanPickTab,
}) => {
  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];

  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);
  const activeCategory = activeGame ? categories.find((c) => c.id === activeGame.categoryId) : null;

  const isMatchDecided = currentMatch.teamAScore >= 3 || currentMatch.teamBScore >= 3;
  const matchWinner = currentMatch.teamAScore >= 3 ? teamA : currentMatch.teamBScore >= 3 ? teamB : null;

  const handleScore = (team: 'A' | 'B', delta: number) => {
    if (delta > 0) {
      sound.playScorePoint(team === 'A');
      const currentScore = team === 'A' ? currentMatch.teamAScore : currentMatch.teamBScore;
      if (currentScore + 1 === 2) {
        setTimeout(() => sound.playMatchPoint(), 250);
      }
    } else {
      sound.playTick();
    }
    onUpdateScore(team, delta);
  };

  return (
    <div className="w-full bg-[#0C1226] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
      {/* Background ambient lighting (hardware accelerated radial gradient) */}
      <div
        className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-15 pointer-events-none transition-colors"
        style={{
          background: `radial-gradient(circle, ${teamA?.color || '#A855F7'} 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute -top-32 -right-32 w-80 h-80 rounded-full opacity-15 pointer-events-none transition-colors"
        style={{
          background: `radial-gradient(circle, ${teamB?.color || '#06B6D4'} 0%, transparent 70%)`,
        }}
      />

      {/* Top Controls: Team Selection & Status */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">مواجهة دوري صراع النخبة:</span>
          <span className="bg-purple-900/40 text-purple-300 border border-purple-600/40 px-2.5 py-0.5 rounded-full font-medium">
            نظام Best of 5 (الفائز أول من يصل لـ 3 نقاط)
          </span>
        </div>

        {/* Current Active Game indicator */}
        <div className="flex items-center gap-2">
          {activeGame ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-700">
              <span className="text-slate-400">اللعبة الجارية:</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                <GameIcon name={activeGame.iconType} className="w-4 h-4 text-cyan-400" />
                {activeGame.nameAr} ({activeGame.nameEn})
              </span>
            </div>
          ) : (
            <button
              onClick={onOpenBanPickTab}
              className="text-cyan-400 hover:text-cyan-300 underline underline-offset-4 flex items-center gap-1 font-medium transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>حدد اللعبة من مرحلة الاختيار</span>
            </button>
          )}
        </div>
      </div>

      {/* Match Setup Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Team A Picker */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-purple-900/40">
          <label className="text-xs text-purple-300 font-semibold whitespace-nowrap">الفريق الأول (الأرجواني):</label>
          <select
            value={currentMatch.teamAId}
            onChange={(e) => onChangeTeam('A', e.target.value)}
            className="w-full bg-[#070B19] text-white text-sm font-semibold rounded-lg px-3 py-1.5 border border-purple-500/40 focus:border-purple-400 focus:outline-none"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamBId}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </select>
        </div>

        {/* Team B Picker */}
        <div className="flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-cyan-900/40">
          <label className="text-xs text-cyan-300 font-semibold whitespace-nowrap">الفريق الثاني (السماوي):</label>
          <select
            value={currentMatch.teamBId}
            onChange={(e) => onChangeTeam('B', e.target.value)}
            className="w-full bg-[#070B19] text-white text-sm font-semibold rounded-lg px-3 py-1.5 border border-cyan-500/40 focus:border-cyan-400 focus:outline-none"
          >
            {teams.map((t) => (
              <option key={t.id} value={t.id} disabled={t.id === currentMatch.teamAId}>
                {t.name} ({t.shortName})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* MAIN BROADCAST SCOREBOARD */}
      <div className="relative my-4">
        {/* Outer Banner */}
        <div className="bg-[#050814] rounded-2xl md:rounded-full border-2 border-slate-700/80 shadow-[0_10px_35px_rgba(0,0,0,0.8)] p-2 md:p-3 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Team A Block */}
          <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto justify-between md:justify-start">
            {/* Score Pill A */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-extrabold font-orbitron text-white shadow-lg transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: teamA?.color || '#A855F7',
                boxShadow: `0 0 25px ${teamA?.color || '#A855F7'}60`,
              }}
            >
              {currentMatch.teamAScore}
            </div>

            {/* Team A Name & Crest */}
            <div className="flex items-center gap-3 text-right">
              <div>
                <h3 className="text-lg md:text-2xl font-black font-changa tracking-wide text-white uppercase">
                  {teamA?.shortName || teamA?.name}
                </h3>
                <p className="text-xs text-purple-300/80 font-medium">{teamA?.name}</p>
              </div>
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border-2 border-purple-400/50 bg-purple-950/40 text-purple-300"
              >
                <GameIcon name={teamA?.logo || 'crown'} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>

            {/* Quick +/- Score Stepper for Team A */}
            <div className="flex flex-col gap-1 mr-2">
              <button
                onClick={() => handleScore('A', 1)}
                disabled={currentMatch.teamAScore >= 3}
                title="إضافة جولة للفريق الأول"
                className="w-7 h-7 rounded-md bg-purple-600/40 hover:bg-purple-600 disabled:opacity-30 disabled:hover:bg-purple-600/40 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScore('A', -1)}
                disabled={currentMatch.teamAScore <= 0}
                title="خصم جولة من الفريق الأول"
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Center Hexagonal Emblem */}
          <div className="relative flex flex-col items-center justify-center my-2 md:my-0">
            <div className="relative">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_25px_rgba(99,102,241,0.5)]">
                <div className="w-full h-full bg-[#070B19] rounded-[14px] flex flex-col items-center justify-center">
                  <GameIcon
                    name={activeGame?.iconType || 'trophy'}
                    className="w-7 h-7 md:w-9 md:h-9 text-cyan-300"
                  />
                </div>
              </div>
              <div className="absolute -bottom-2 inset-x-0 mx-auto text-center">
                <span className="text-[10px] font-orbitron uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300">
                  BO5
                </span>
              </div>
            </div>
          </div>

          {/* Team B Block */}
          <div className="flex items-center gap-3 md:gap-5 w-full md:w-auto justify-between md:justify-end">
            {/* Quick +/- Score Stepper for Team B */}
            <div className="flex flex-col gap-1 ml-2">
              <button
                onClick={() => handleScore('B', 1)}
                disabled={currentMatch.teamBScore >= 3}
                title="إضافة جولة للفريق الثاني"
                className="w-7 h-7 rounded-md bg-cyan-600/40 hover:bg-cyan-600 disabled:opacity-30 disabled:hover:bg-cyan-600/40 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleScore('B', -1)}
                disabled={currentMatch.teamBScore <= 0}
                title="خصم جولة من الفريق الثاني"
                className="w-7 h-7 rounded-md bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>

            {/* Team B Name & Crest */}
            <div className="flex items-center gap-3 text-left">
              <div
                className="w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center border-2 border-cyan-400/50 bg-cyan-950/40 text-cyan-300"
              >
                <GameIcon name={teamB?.logo || 'shield'} className="w-5 h-5 md:w-6 md:h-6" />
              </div>
              <div>
                <h3 className="text-lg md:text-2xl font-black font-changa tracking-wide text-white uppercase">
                  {teamB?.shortName || teamB?.name}
                </h3>
                <p className="text-xs text-cyan-300/80 font-medium">{teamB?.name}</p>
              </div>
            </div>

            {/* Score Pill B */}
            <div
              className="w-16 h-16 md:w-20 md:h-20 rounded-xl md:rounded-2xl flex items-center justify-center text-3xl md:text-4xl font-extrabold font-orbitron text-white shadow-lg transition-transform hover:scale-105 shrink-0"
              style={{
                backgroundColor: teamB?.color || '#06B6D4',
                boxShadow: `0 0 25px ${teamB?.color || '#06B6D4'}60`,
              }}
            >
              {currentMatch.teamBScore}
            </div>
          </div>
        </div>

        {/* 5-ROUNDS INTERACTIVE TIMELINE TRACKER */}
        <div className="mt-4 p-3 rounded-2xl bg-[#070D1E] border border-slate-800">
          <div className="flex items-center justify-between mb-2 text-xs text-slate-400 font-changa">
            <span className="font-bold text-slate-300">مسار الجولات (Round Timeline):</span>
            <span className="text-[11px] font-mono text-amber-400">حسم 3 جولات = الفوز بالمباراة</span>
          </div>

          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5].map((roundNum) => {
              const totalRoundsPlayed = currentMatch.teamAScore + currentMatch.teamBScore;
              const isWonByA = roundNum <= currentMatch.teamAScore;
              const isWonByB = roundNum > currentMatch.teamAScore && roundNum <= totalRoundsPlayed;
              const isCurrent = roundNum === totalRoundsPlayed + 1 && !isMatchDecided;

              return (
                <div
                  key={roundNum}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isWonByA
                      ? 'bg-purple-950/80 border-purple-500 text-white shadow-sm'
                      : isWonByB
                      ? 'bg-cyan-950/80 border-cyan-500 text-white shadow-sm'
                      : isCurrent
                      ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-400/50 animate-pulse'
                      : 'bg-slate-900/60 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[11px] font-mono">
                    <span className="font-bold">جولة {roundNum}</span>
                    {isWonByA && <CheckCircle2 className="w-3.5 h-3.5 text-purple-300" />}
                    {isWonByB && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-300" />}
                    {isCurrent && <Play className="w-3 h-3 text-amber-400 fill-amber-400" />}
                  </div>

                  <div className="text-xs font-black font-changa truncate">
                    {isWonByA ? (
                      <span className="text-purple-300">{teamA?.shortName} ✓</span>
                    ) : isWonByB ? (
                      <span className="text-cyan-300">{teamB?.shortName} ✓</span>
                    ) : isCurrent ? (
                      <span className="text-amber-300">جارية 🔴</span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Match Result Announcement Banner if Decided */}
      {isMatchDecided && matchWinner && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-purple-950/50 to-amber-950/60 border-2 border-amber-500/60 shadow-[0_0_35px_rgba(245,158,11,0.25)] flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-right">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400 flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7 text-amber-400 animate-bounce" />
            </div>
            <div>
              <div className="text-amber-300 text-sm md:text-base font-bold flex items-center gap-2">
                <span>حسمت المواجهة رسمياً لصالح: </span>
                <span className="text-white font-black text-lg underline underline-offset-4">
                  {matchWinner.name} ({matchWinner.shortName})
                </span>
                <span className="text-amber-300">
                  بنتيجة ({Math.max(currentMatch.teamAScore, currentMatch.teamBScore)} - {Math.min(currentMatch.teamAScore, currentMatch.teamBScore)})
                </span>
              </div>
              <p className="text-xs text-amber-200/70 mt-0.5">
                تأهل واحتساب 3 نقاط في جدول الترتيب العام لدوري صراع النخبة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
        <button
          onClick={onResetCurrentMatch}
          className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>تصفير نتيجة المباراة</span>
        </button>

        <button
          onClick={onFinishMatch}
          disabled={currentMatch.teamAScore === 0 && currentMatch.teamBScore === 0}
          className={`w-full sm:w-auto px-6 py-3 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 shadow-lg ${
            isMatchDecided
              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-600/30 scale-102 ring-2 ring-emerald-400/40'
              : currentMatch.teamAScore > 0 || currentMatch.teamBScore > 0
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>إنهاء المباراة وتحديث الترتيب</span>
        </button>
      </div>
    </div>
  );
};
