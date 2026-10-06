import React, { useEffect } from 'react';
import { Team, CurrentMatch } from '../types';
import { GameIcon } from './GameIcons';
import { Trophy, Sparkles, X, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/audio';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  winnerTeam: Team;
  loserTeam: Team;
  currentMatch: CurrentMatch;
  onNextMatch?: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  onClose,
  winnerTeam,
  loserTeam,
  currentMatch,
  onNextMatch,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playChampionshipVictory();

      // Multi-stage confetti celebration
      try {
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          colors: [winnerTeam.color, '#F59E0B', '#10B981', '#A855F7', '#06B6D4'],
        });

        const timer = setTimeout(() => {
          confetti({
            particleCount: 100,
            angle: 60,
            spread: 80,
            origin: { x: 0 },
            colors: [winnerTeam.color, '#F59E0B'],
          });
          confetti({
            particleCount: 100,
            angle: 120,
            spread: 80,
            origin: { x: 1 },
            colors: [winnerTeam.color, '#10B981'],
          });
        }, 400);

        return () => clearTimeout(timer);
      } catch {}
    }
  }, [isOpen, winnerTeam]);

  if (!isOpen) return null;

  const winnerScore = Math.max(currentMatch.teamAScore, currentMatch.teamBScore);
  const loserScore = Math.min(currentMatch.teamAScore, currentMatch.teamBScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 select-none animate-fade-in">
      {/* Ambient glowing spotlight for winner */}
      <div
        className="absolute inset-0 max-w-2xl mx-auto rounded-full opacity-30 pointer-events-none transition-colors"
        style={{
          background: `radial-gradient(circle, ${winnerTeam.color} 0%, transparent 70%)`,
        }}
      />

      <div className="relative z-10 max-w-xl w-full bg-[#080D21] border-2 border-amber-400/80 rounded-3xl p-6 sm:p-10 shadow-[0_0_80px_rgba(245,158,11,0.35)] text-center">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Crown & Trophy Header */}
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
          <span className="font-orbitron font-black text-xs sm:text-sm tracking-widest text-amber-400 uppercase bg-amber-950/80 px-4 py-1 rounded-full border border-amber-500/50">
            MATCH CHAMPION
          </span>
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
        </div>

        {/* Winner Crest with Neon Ring */}
        <div className="relative my-6 flex justify-center">
          <div
            className="w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-1 flex items-center justify-center shadow-2xl transition-transform hover:scale-105"
            style={{
              backgroundColor: `${winnerTeam.color}25`,
              border: `3px solid ${winnerTeam.color}`,
              boxShadow: `0 0 50px ${winnerTeam.color}80`,
            }}
          >
            <GameIcon name={winnerTeam.logo || 'crown'} className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
          </div>

          <div className="absolute -top-4 -right-2 sm:-right-4 w-12 h-12 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center shadow-lg animate-bounce">
            <Trophy className="w-7 h-7 text-slate-950" />
          </div>
        </div>

        {/* Winner Name */}
        <h2 className="text-3xl sm:text-5xl font-black font-changa text-white uppercase tracking-wide">
          {winnerTeam.name}
        </h2>
        <p className="text-base sm:text-lg text-amber-300 font-bold font-changa mt-1">
          بطل المواجهة الرسمية بنتيجة ({winnerScore} - {loserScore})
        </p>

        {/* Score comparison pill */}
        <div className="my-6 inline-flex items-center justify-center gap-6 px-6 py-3 rounded-2xl bg-[#050814] border border-slate-700 shadow-inner">
          <div className="text-center">
            <span className="text-xs text-slate-400 font-changa block">{winnerTeam.shortName}</span>
            <span className="text-3xl font-orbitron font-black text-amber-400">{winnerScore}</span>
          </div>
          <span className="text-lg font-orbitron font-bold text-slate-600">-</span>
          <div className="text-center">
            <span className="text-xs text-slate-400 font-changa block">{loserTeam.shortName}</span>
            <span className="text-3xl font-orbitron font-black text-slate-500">{loserScore}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {onNextMatch && (
            <button
              onClick={() => {
                onClose();
                onNextMatch();
              }}
              className="flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold font-changa text-sm shadow-xl transition-all active:scale-95"
            >
              بدء مواجهة جديدة ⚔️
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold font-changa text-sm transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
