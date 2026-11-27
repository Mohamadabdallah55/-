import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CurrentMatch, Team, GameItem, CategoryInfo } from '../types';
import { GameIcon } from './GameIcons';
import { Plus, Minus, Trophy, CheckCircle2, RotateCcw, Play, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';
import { CountUpValue } from './CountUpValue';

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

  const reducedMotion = useReducedMotion();
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
    <div className="match-card rb-match-glow w-full bg-[#0C1226] border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
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
      <div className="match-meta flex flex-col sm:flex-row items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800/60 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-300">مواجهة دوري صراع النخبة:</span>
            <span className="format-chip bg-purple-900/40 text-purple-300 border border-purple-600/40 px-2.5 py-0.5 rounded-full font-medium">
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
        <div className="team-picker flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-purple-900/40">
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
        <div className="team-picker flex items-center gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-cyan-900/40">
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
        <section aria-label="مركز المواجهة" className="relative isolate overflow-hidden rounded-sm border border-white/15 bg-[#080d0c] px-3 py-5 sm:px-8 sm:py-12">
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-60" style={{background: `radial-gradient(ellipse at 100% 35%, ${teamA?.color || '#a855f7'}55, transparent 48%), radial-gradient(ellipse at 0% 35%, ${teamB?.color || '#06b6d4'}55, transparent 48%), linear-gradient(160deg,#101918,#080d0c 60%)`}} />
          <div aria-hidden="true" className="absolute inset-0 -z-10 opacity-[0.08]" style={{backgroundImage:'linear-gradient(120deg,transparent 49%,white 50%,transparent 51%)',backgroundSize:'48px 48px'}} />
          {/* Found Studio's stadium-scale light structures, translated into original ELITE CLASH geometry. */}
          <svg aria-hidden="true" viewBox="0 0 1000 460" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 h-full w-full -z-10 pointer-events-none">
            <defs>
              <linearGradient id="arena-floor" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#a3e635" stopOpacity=".16"/><stop offset="1" stopColor="#a3e635" stopOpacity="0"/></linearGradient>
            </defs>
            <path d="M-100 420 500 230 1100 420M-100 450 500 250 1100 450" fill="none" stroke="url(#arena-floor)" strokeWidth="2"/>
            <g fill="none" strokeWidth="2" opacity=".45">
              <path d="M-50 380 180 65 340 65 460 190" stroke={teamB?.color || '#06b6d4'}/>
              <path d="M1050 380 820 65 660 65 540 190" stroke={teamA?.color || '#a855f7'}/>
              <path d="M-50 310 150 38 350 38 465 150M1050 310 850 38 650 38 535 150" stroke="#d9f99d" strokeOpacity=".24"/>
            </g>
            <path d="M500 110 536 180 500 250 464 180Z" fill="#d9f99d" fillOpacity=".045" stroke="#d9f99d" strokeOpacity=".18"/>
          </svg>
          <div className="absolute inset-x-0 top-0 h-[3px]" style={{background:'linear-gradient(90deg,transparent,#bef264,transparent)'}}/>
          <div className="mb-6 text-center">
            <span className="font-orbitron text-[10px] sm:text-xs font-bold tracking-[0.25em] text-emerald-300">ELITE CLASH / MATCH CENTER</span>
            <h2 className="mt-2 font-changa text-2xl sm:text-4xl font-black text-white">ساحة المواجهة</h2>
            <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-xs text-slate-200">
              <span className={`h-2 w-2 rounded-full ${isMatchDecided ? 'bg-amber-400' : currentMatch.teamAScore + currentMatch.teamBScore > 0 ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              {isMatchDecided ? 'حُسمت المواجهة — بانتظار اعتماد النتيجة' : currentMatch.teamAScore + currentMatch.teamBScore > 0 ? 'المواجهة جارية' : 'جاهزون للمواجهة'}
            </span>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start gap-2 sm:gap-8" dir="rtl">
            {(['A','B'] as const).map(slot => {
              const team = slot === 'A' ? teamA : teamB;
              const score = slot === 'A' ? currentMatch.teamAScore : currentMatch.teamBScore;
              const accent = team?.color || (slot === 'A' ? '#a855f7' : '#06b6d4');
              const block = (
                <motion.div key={team?.id || slot} initial={reducedMotion ? false : {opacity:0, x:slot === 'A' ? 16 : -16}} animate={{opacity:1,x:0}} transition={{duration:0.55,ease:[0.22,1,0.36,1],delay:slot === "A" ? 0 : 0.08}} className="min-w-0 flex flex-col items-center text-center">
                  <div className="relative grid aspect-square w-[clamp(4rem,15vw,12rem)] place-items-center" style={{color:accent}}><div aria-hidden="true" className="absolute inset-0 rotate-45 border border-current opacity-40"/><div aria-hidden="true" className="absolute inset-[12%] rotate-45 border-2 border-current bg-black/30" style={{boxShadow:`0 0 28px ${accent}45, inset 0 0 20px ${accent}30`}}/>
                    <GameIcon name={team?.logo || 'shield'} className="relative h-[55%] w-[55%] text-white" />
                  </div>
                  <h3 className="mt-3 break-words w-full font-changa text-sm sm:text-2xl font-black text-white">{team?.name || 'اختر الفريق'}</h3>
                  <p className="text-[10px] sm:text-xs text-slate-300">{team?.shortName || '—'}</p>
                  <div className="mt-3 flex gap-1.5" aria-label="الجولات المحسومة">
                    {[1,2,3].map(n=><span key={n} className="h-2 w-5 sm:w-8 rounded-full border border-white/15" style={{backgroundColor:score>=n?accent:'#ffffff12'}} />)}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" aria-label={`إضافة جولة للفريق ${slot}`} onClick={()=>handleScore(slot,1)} disabled={score>=3 || isMatchDecided || !team} className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl border border-white/15 bg-white/10 text-white transition-colors hover:bg-white/20 disabled:opacity-30"><Plus className="h-5 w-5" /></button>
                    <button type="button" aria-label={`خصم جولة للفريق ${slot}`} onClick={()=>handleScore(slot,-1)} disabled={score<=0} className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl border border-white/15 bg-black/30 text-slate-300 transition-colors hover:bg-white/10 disabled:opacity-30"><Minus className="h-5 w-5" /></button>
                  </div>
                </motion.div>
              );
              return slot === 'A' ? <React.Fragment key={slot}>{block}<div className="self-center text-center"><div aria-hidden="true" className="mb-2 font-orbitron text-[10px] sm:text-sm tracking-[.25em] text-lime-300">VERSUS</div>
                <div className="flex items-center justify-center gap-1 sm:gap-3 font-orbitron text-3xl sm:text-7xl font-black tabular-nums text-white" dir="ltr">
                  <CountUpValue value={currentMatch.teamAScore} /><span className="text-slate-500 text-xl sm:text-4xl">:</span><CountUpValue value={currentMatch.teamBScore} />
                </div>
                <span className="mt-3 inline-block border-y border-lime-300/30 px-2 py-1 font-orbitron text-[10px] tracking-wider text-lime-200">BEST OF 5</span>
                <p className="mt-2 max-w-[110px] break-words text-[10px] sm:text-xs text-emerald-200">{activeGame?.nameAr || 'أول من يصل إلى 3'}</p>
              </div></React.Fragment> : <React.Fragment key={slot}>{block}</React.Fragment>;
            })}
          </div>
        </section>

        {/* 5-ROUNDS INTERACTIVE TIMELINE TRACKER */}
        <div className="round-track mt-4 p-3 rounded-2xl bg-[#070D1E] border border-slate-800">
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
                  className={`round-cell ${isCurrent ? 'round-live' : ''} p-2.5 rounded-xl border text-center transition-all ${
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
