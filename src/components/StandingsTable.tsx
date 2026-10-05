import React from 'react';
import { LeagueRow, MatchRecord } from '../types';
import { GameIcon } from './GameIcons';
import { Trophy, Medal, History, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface StandingsTableProps {
  standings: LeagueRow[];
  matchesHistory: MatchRecord[];
  onOpenHistoryModal: () => void;
  onResetLeague: () => void;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  matchesHistory,
  onOpenHistoryModal,
  onResetLeague,
}) => {
  return (
    <div className="w-full bg-[#0C1226]/80 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      {/* Table Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>جدول ترتيب دوري صراع النخبة (الفرق الـ 6)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            يُحتسب الترتيب تلقائياً بعد كل مباراة: النقاط (3 للفوز) &larr; فارق الجولات &larr; الجولات المسجلة
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistoryModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-300 bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>سجل المواجهات ({matchesHistory.length})</span>
          </button>

          {matchesHistory.length > 0 && (
            <button
              onClick={onResetLeague}
              title="تصفير نتائج وبطولة الدوري بالكامل"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-200 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-900/50 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden md:inline">تصفير الدوري</span>
            </button>
          )}
        </div>
      </div>

      {/* Standings Responsive Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-2 text-center w-12">#</th>
              <th className="py-3 px-4">الفريق</th>
              <th className="py-3 px-3 text-center">لعب</th>
              <th className="py-3 px-3 text-center">فاز</th>
              <th className="py-3 px-3 text-center">خسر</th>
              <th className="py-3 px-3 text-center">له</th>
              <th className="py-3 px-3 text-center">عليه</th>
              <th className="py-3 px-3 text-center">الفارق</th>
              <th className="py-3 px-4 text-center font-extrabold text-amber-300">النقاط</th>
              <th className="py-3 px-3 text-center hidden sm:table-cell">المستوى</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {standings.map((row, index) => {
              const rank = index + 1;
              const isFirst = rank === 1 && row.played > 0;
              const isSecond = rank === 2 && row.played > 0;
              const isThird = rank === 3 && row.played > 0;

              return (
                <tr
                  key={row.teamId}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    isFirst ? 'bg-amber-950/20' : ''
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-2 text-center font-orbitron font-bold">
                    {isFirst ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs shadow-sm">
                        <Medal className="w-4 h-4 text-amber-400" />
                      </span>
                    ) : isSecond ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-400/20 text-slate-200 border border-slate-400/40 text-xs">
                        2
                      </span>
                    ) : isThird ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-800/20 text-amber-600 border border-amber-700/40 text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-500 text-xs">{rank}</span>
                    )}
                  </td>

                  {/* Team Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 border border-white/20"
                        style={{ backgroundColor: row.team.color }}
                      >
                        <GameIcon name={row.team.logo} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-white font-changa text-base flex items-center gap-2">
                          <span>{row.team.name}</span>
                          <span className="text-xs font-mono text-slate-400 font-normal">
                            ({row.team.shortName})
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Stats */}
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-300">
                    {row.played}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-emerald-400 font-bold">
                    {row.won}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-rose-400 font-medium">
                    {row.lost}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-400">
                    {row.gf}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums text-slate-400">
                    {row.ga}
                  </td>
                  <td className="py-3 px-3 text-center font-mono tabular-nums font-semibold">
                    <span
                      className={
                        row.gd > 0
                          ? 'text-emerald-400'
                          : row.gd < 0
                          ? 'text-rose-400'
                          : 'text-slate-400'
                      }
                    >
                      {row.gd > 0 ? `+${row.gd}` : row.gd}
                    </span>
                  </td>

                  {/* Points */}
                  <td className="py-3 px-4 text-center font-orbitron font-extrabold text-lg text-amber-300 tabular-nums">
                    {row.points}
                  </td>

                  {/* Form */}
                  <td className="py-3 px-3 text-center hidden sm:table-cell">
                    <div className="flex items-center justify-center gap-1">
                      {row.form.length === 0 ? (
                        <span className="text-xs text-slate-600">-</span>
                      ) : (
                        row.form.map((res, i) => (
                          <span
                            key={i}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              res === 'W'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}
                          >
                            {res === 'W' ? 'ف' : 'خ'}
                          </span>
                        ))
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {matchesHistory.length === 0 && (
        <div className="py-8 text-center text-xs text-slate-500">
          لم يتم إنهاء أي مباراة حتى الآن. اختر الفريقين بالأعلى واضغط "إنهاء المباراة وتحديث الترتيب" لتحديث جدول الدوري تلقائياً.
        </div>
      )}
    </div>
  );
};
