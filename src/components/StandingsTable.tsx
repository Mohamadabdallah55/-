import React, { useLayoutEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LeagueRow, MatchRecord } from '../types';
import { GameIcon } from './GameIcons';
import { Trophy, History, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { CountUpValue } from './CountUpValue';
import { TeamCrest } from './TeamCrest';

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
  const reducedMotion = useReducedMotion();
  const previousRanks = useRef<Record<string, number>>({});
  const [rankChanges, setRankChanges] = useState<Record<string, number>>({});
  const orderKey = JSON.stringify(standings.map(row => row.teamId));
  useLayoutEffect(() => {
    const ids: string[] = JSON.parse(orderKey);
    const next: Record<string, number> = {};
    const changes: Record<string, number> = {};
    ids.forEach((id, index) => {
      next[id] = index + 1;
      if (matchesHistory.length && previousRanks.current[id] !== undefined) {
        changes[id] = previousRanks.current[id] - next[id];
      }
    });
    previousRanks.current = next;
    setRankChanges(changes);
  }, [orderKey, matchesHistory.length]);

  return (
    <div className="standings-card w-full bg-[#080d0c] border border-white/15 rounded-sm p-3 sm:p-5 shadow-xl">
      {/* Table Header Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-800/80">
        <div>
          <h2 className="text-xl font-bold font-changa text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>جدول الترتيب الرسمي</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            يُحتسب الترتيب تلقائياً حسب نقاط الفوز المحددة لكل أسبوع، ثم فارق الجولات والجولات المسجلة.
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

      {/* Broadcast-style editorial leader strip. No champion is inferred from provisional ranking. */}
      <div className="mb-4 overflow-hidden border-y border-lime-300/25 bg-[#101b15]">
        <div className="flex items-center justify-between gap-3 px-3 py-2 sm:px-5" dir="rtl">
          <span className="font-orbitron text-[10px] font-bold tracking-widest text-lime-300">ELITE CLASH / LEAGUE TABLE</span>
          <span className="text-xs font-bold text-white">{matchesHistory.length} مواجهة مكتملة</span>
        </div>
        {standings[0]?.played > 0 && (
          <div className="relative flex items-center justify-between gap-3 overflow-hidden border-t border-white/10 px-3 py-4 sm:px-5" style={{background:`linear-gradient(105deg,transparent,${standings[0].team.color}35)`}}>
            <div className="flex min-w-0 items-center gap-3">
              <span className="font-orbitron text-3xl font-black text-lime-300">01</span>
              <TeamCrest team={standings[0].team} className="w-12 shrink-0"/>
              <div className="min-w-0"><div className="text-[10px] font-bold text-lime-300">متصدر الدوري</div><strong className="break-words font-changa text-lg text-white">{standings[0].team.name}</strong></div>
            </div>
            <div className="shrink-0 text-center"><strong className="font-orbitron text-3xl font-black text-white"><CountUpValue value={standings[0].points}/></strong><div className="text-[10px] text-slate-300">نقطة</div></div>
          </div>
        )}
      </div>

      {/* Standings Responsive Table */}
      <div className="space-y-2 sm:hidden" aria-label="ترتيب الفرق على الهاتف">
        {standings.map((row,index)=><motion.div key={row.teamId} layout={reducedMotion?false:"position"} transition={{layout:{duration:.36}}} className="grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-2 border border-white/10 bg-[#111b15] p-2" style={{borderInlineStart:`3px solid ${row.team.color}`}}><strong className="font-orbitron text-lime-200">{String(index+1).padStart(2,"0")}</strong><div className="flex min-w-0 items-center gap-2"><TeamCrest team={row.team} className="w-10 shrink-0"/><div className="min-w-0"><strong className="block break-words text-sm text-white">{row.team.name}</strong><p className="text-[10px] text-slate-300">{row.played} لعب · {row.won} فاز · {row.lost} خسر · الفارق {row.gd}</p></div></div><div className="text-center"><strong className="font-orbitron text-xl text-lime-200">{row.points}</strong><div className="text-[10px] text-slate-400">{rankChanges[row.teamId]>0?"↑ "+rankChanges[row.teamId]:rankChanges[row.teamId]<0?"↓ "+Math.abs(rankChanges[row.teamId]):"نقطة"}</div></div></motion.div>)}
      </div>
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full min-w-[650px] border-separate border-spacing-y-1.5 text-right text-sm">
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
                <motion.tr
                  key={row.teamId}
                  layout={reducedMotion ? false : "position"}
                  transition={{ layout: { duration: 0.36, ease: [0.22, 1, 0.36, 1] } }}
                  className={`standing-row rank-row-${rank} transition-colors ${isFirst ? "bg-lime-950/60" : index % 2 === 0 ? "bg-[#13201b]" : "bg-[#101713]"}`}
                >
                  {/* Rank */}
                  <td className="py-3 px-2 text-center font-orbitron font-bold" style={{borderInlineStart:`4px solid ${row.team.color}`}}>
                    {isFirst ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs shadow-sm">
                        01
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
                          {Boolean(rankChanges[row.teamId]) && (
                            <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${rankChanges[row.teamId] > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`} aria-label={`${rankChanges[row.teamId] > 0 ? 'صعد' : 'هبط'} ${Math.abs(rankChanges[row.teamId])} مراكز`}>
                              {rankChanges[row.teamId] > 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                              {Math.abs(rankChanges[row.teamId])}
                            </span>
                          )}
                          <span className="text-xs font-mono text-slate-400 font-normal">
                            ({row.team.shortName})
                          </span>
                        </div>
                        {row.team.captain && <small className="block text-[11px] text-amber-200/75 mt-0.5">الكابتن: {row.team.captain}</small>}
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
                  <td className="bg-lime-300/10 py-3 px-4 text-center font-orbitron font-extrabold text-xl text-lime-200 tabular-nums">
                    <CountUpValue value={row.points} />
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
                </motion.tr>
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
