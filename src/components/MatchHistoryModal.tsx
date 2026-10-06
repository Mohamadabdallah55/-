import React from 'react';
import { MatchRecord } from '../types';
import { X, Trash2, Calendar, Trophy, Swords } from 'lucide-react';

interface MatchHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  matches: MatchRecord[];
  onDeleteMatch: (matchId: string) => void;
}

export const MatchHistoryModal: React.FC<MatchHistoryModalProps> = ({
  isOpen,
  onClose,
  matches,
  onDeleteMatch,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 animate-fade-in">
      <div className="bg-[#0C1226] border border-slate-700 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative text-right">
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-white p-1.5 rounded-xl bg-slate-800/80 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 pb-3 border-b border-slate-800">
          <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
            <Swords className="w-5 h-5 text-purple-400" />
            <span>سجل المواجهات المكتملة في الدوري ({matches.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            جميع المباريات المحسومة بالدوري. يمكنك حذف أي مواجهة لإلغاء احتسابها من جدول الترتيب عند الخطأ.
          </p>
        </div>

        {matches.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            لا توجد مباريات مسجلة حتى الآن.
          </div>
        ) : (
          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {matches.map((match, idx) => {
              const isWinnerA = match.winnerId === match.teamAId;
              const isWinnerB = match.winnerId === match.teamBId;

              return (
                <div
                  key={match.id}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-orbitron font-bold text-slate-500 text-xs w-6 text-center">
                      #{matches.length - idx}
                    </span>

                    {/* Scoreboard line */}
                    <div className="flex items-center gap-3">
                      {/* Team A */}
                      <div
                        className={`text-sm font-bold font-changa flex items-center gap-1.5 ${
                          isWinnerA ? 'text-purple-300' : 'text-slate-400'
                        }`}
                      >
                        {isWinnerA && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{match.teamAName}</span>
                      </div>

                      {/* Result Pill */}
                      <div className="px-3 py-1 rounded-lg bg-black/60 border border-slate-700 font-orbitron font-extrabold text-sm text-white">
                        <span className={isWinnerA ? 'text-purple-400' : 'text-slate-300'}>
                          {match.teamAScore}
                        </span>
                        <span className="mx-1 text-slate-500">-</span>
                        <span className={isWinnerB ? 'text-cyan-400' : 'text-slate-300'}>
                          {match.teamBScore}
                        </span>
                      </div>

                      {/* Team B */}
                      <div
                        className={`text-sm font-bold font-changa flex items-center gap-1.5 ${
                          isWinnerB ? 'text-cyan-300' : 'text-slate-400'
                        }`}
                      >
                        {isWinnerB && <Trophy className="w-3.5 h-3.5 text-amber-400" />}
                        <span>{match.teamBName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 hidden sm:inline-block">
                      {match.date}
                    </span>

                    <button
                      onClick={() => {
                        if (window.confirm('هل تريد حذف هذه المباراة وإعادة حساب جدول الترتيب؟')) {
                          onDeleteMatch(match.id);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors"
                      title="حذف هذه المواجهة وإلغاء نقاطها"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800 text-left">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
