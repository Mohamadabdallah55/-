import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { CurrentMatch, Team, GameItem, LeagueRow, CategoryInfo, BanPickStatus } from '../types';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { GameIcon } from './GameIcons';
import { BrandMark } from './BrandMark';
import { CinematicStage } from './CinematicStage';
import { TeamCrest } from './TeamCrest';
import { EliteTrophy } from './EliteTrophy';
import './BigScreen.css';
import { subscribeToBroadcast, DEFAULT_ARENA_COLUMN_GAMES } from '../utils/storage';
import { revealWithGsap } from '../utils/gsapMotion';
import {
  Trophy,
  Maximize2,
  Minimize2,
  Sparkles,
  Swords,
  Layers,
  Ban,
  Check,
  Flame,
} from 'lucide-react';

interface BroadcastOverlayProps {
  currentMatch: CurrentMatch;
  teams: Team[];
  games: GameItem[];
  standings: LeagueRow[];
  categories: CategoryInfo[];
  cardStates?: Record<string, { gameId: string; status: BanPickStatus }>;
  arenaColumnGames?: Record<string, string[]>;
  initialView?: 'scoreboard' | 'games';
  onViewChange?: (view: 'scoreboard' | 'games') => void;
  onClose: () => void;
}

export const BroadcastOverlay: React.FC<BroadcastOverlayProps> = ({
  currentMatch,
  teams,
  games,
  standings,
  categories,
  cardStates = {},
  arenaColumnGames = {},
  initialView = 'scoreboard',
  onViewChange,
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [broadcastView, setBroadcastView] = useState<'scoreboard' | 'games'>(initialView);
  const broadcastRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setBroadcastView(initialView);
  }, [initialView]);

  useLayoutEffect(() => revealWithGsap(
    broadcastRootRef.current,
    broadcastView === 'games' ? '.ce-games-column' : '.broadcast-round-track',
    { y: 26, stagger: broadcastView === 'games' ? 0.09 : 0.14, duration: 0.78 },
  ), [broadcastView]);

  // Real-time listener from phone commands
  useEffect(() => {
    const unsub = subscribeToBroadcast((type, payload) => {
      if (type === 'BROADCAST_VIEW_UPDATED' && (payload === 'scoreboard' || payload === 'games')) {
        setBroadcastView(payload);
        onViewChange?.(payload);
      }
    });
    return unsub;
  }, [onViewChange]);

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];
  const isFinal = currentMatch.stage === 'final';
  const activeGame = games.find((g) => g.id === currentMatch.activeGameId);
  const activeCategory = activeGame ? categories.find((c) => c.id === activeGame.categoryId) : null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const arenaColumns: Array<{
    catId: string;
    label: string;
    subLabel: string;
    headerColor: string;
    glowColor: string;
    isFanVote?: boolean;
  }> = [
    {
      catId: 'digital',
      label: 'DIGITAL',
      subLabel: 'إلكتروني',
      headerColor: '#38BDF8',
      glowColor: 'rgba(56, 189, 248, 0.5)',
    },
    {
      catId: 'mental',
      label: 'MENTAL',
      subLabel: 'ذكاء',
      headerColor: '#10B981',
      glowColor: 'rgba(16, 185, 129, 0.5)',
    },
    {
      catId: 'physical',
      label: 'PHYSICAL',
      subLabel: 'بدني',
      headerColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.5)',
    },
    {
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      isFanVote: true,
    },
    {
      catId: '1v1',
      label: '1V1',
      subLabel: 'تحدي الكباتن',
      headerColor: '#d8f27a',
      glowColor: 'rgba(216, 242, 122, 0.55)',
    },
  ];

  return (
    <div ref={broadcastRootRef} className="broadcast-screen fixed inset-0 z-50 bg-[#050814] text-white flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Top TV Header Bar */}
      <div className="broadcast-topbar flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="broadcast-brand w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center p-1"><BrandMark /></div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-changa tracking-wide uppercase text-white">
              دوري صراع النخبة · LIVE BROADCAST
            </h1>
            <p className="text-[11px] text-amber-400/90 font-orbitron tracking-wider">
              CLASH OF ELITES ARENA PRESENTATION
            </p>
          </div>
        </div>

        {/* View Switcher: Scoreboard vs Games Grid */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 shadow-md">
          <button
            onClick={() => {setBroadcastView('scoreboard');onViewChange?.('scoreboard');}}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold font-changa text-xs transition-all ${
              broadcastView === 'scoreboard'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md border border-purple-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>لوحة النتيجة المباشرة</span>
          </button>

          <button
            onClick={() => {setBroadcastView('games');onViewChange?.('games');}}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold font-changa text-xs transition-all ${
              broadcastView === 'games'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md border border-cyan-400'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            <span>شاشة الألعاب (Ban & Pick)</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
            title="ملء الشاشة"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            إغلاق البث
          </button>
        </div>
      </div>

      {/* VIEW 1: SCOREBOARD VIEW */}
      {broadcastView === 'scoreboard' && (
        <div className="broadcast-scoreboard my-auto max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
          {/* Active Game Spotlight */}
          {activeGame && (
            <div className="text-center animate-fade-in">
              <span className="text-xs uppercase tracking-widest text-cyan-400 font-mono bg-cyan-950/70 border border-cyan-800/80 px-4 py-1 rounded-full">
                {activeCategory?.nameAr} · {activeGame.nameEn}
              </span>
              <h2 className="text-3xl md:text-5xl font-black font-changa text-white mt-2 drop-shadow-lg flex items-center justify-center gap-3">
                <GameIcon name={activeGame.iconType} className="w-9 h-9 md:w-12 md:h-12 text-cyan-400" />
                <span>{activeGame.nameAr}</span>
              </h2>
            </div>
          )}

          <section className="relative isolate overflow-hidden border bg-[#080e0c] px-2 py-6 sm:px-8 sm:py-10" style={{borderColor:isFinal?'#d8b66b88':'#c5ed5a44'}}>
            <div className="absolute inset-0 -z-10"><CinematicStage left={teamB?.color} right={teamA?.color} gold={isFinal}/></div>
            <div className="mb-6 text-center"><p className="font-orbitron text-xs sm:text-lg font-black tracking-[.2em]" style={{color:isFinal?'#f5d58b':'#d3f189'}}>{isFinal?'THE GRAND FINAL':'CLASH OF ELITES'}</p><h2 className="mt-1 text-xl sm:text-4xl font-changa font-black">{isFinal?'المباراة النهائية':'مركز المواجهة'}</h2></div>
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:gap-6" dir="rtl">
              {([teamA,teamB] as const).map((team,i)=><React.Fragment key={i}>{i===1&&<div className="text-center">
                {isFinal&&<EliteTrophy className="mx-auto mb-1 h-16 w-14 sm:h-28 sm:w-24"/>}
                <div className="flex items-center justify-center gap-2 sm:gap-4 text-4xl sm:text-7xl md:text-8xl font-black font-orbitron tabular-nums" dir="rtl"><span>{currentMatch.teamAScore}</span><span className="text-slate-400">:</span><span>{currentMatch.teamBScore}</span></div>
                <p className="mt-3 font-orbitron text-[10px] sm:text-xs text-amber-200">BEST OF 5</p>
              </div>}<div className="min-w-0 flex flex-col items-center text-center"><TeamCrest team={team} className="w-[clamp(3.6rem,17vw,12rem)]"/><h3 className="mt-2 break-words max-w-full font-changa text-sm sm:text-3xl font-black">{team?.name||'—'}</h3></div></React.Fragment>)}
            </div>
          </section>

          {/* Best of 5 Rounds Track */}
          <div className="broadcast-round-track flex items-center justify-center gap-2 md:gap-3">
            {[1, 2, 3, 4, 5].map((roundNum) => {
              const totalRoundsPlayed = currentMatch.teamAScore + currentMatch.teamBScore;
              const savedRound = currentMatch.rounds?.find(r=>r.round===roundNum);
              const isWonByA = savedRound?.winnerTeamId===currentMatch.teamAId;
              const isWonByB = savedRound?.winnerTeamId===currentMatch.teamBId;
              const isCurrent = roundNum === totalRoundsPlayed + 1 && currentMatch.teamAScore < 3 && currentMatch.teamBScore < 3;

              return (
                <div
                  key={roundNum}
                  className={`px-3 md:px-5 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold font-changa flex items-center gap-2 ${
                    isWonByA
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/50'
                      : isWonByB
                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/50'
                      : isCurrent
                      ? 'bg-slate-800 text-amber-300 border-2 border-amber-400 animate-pulse'
                      : 'bg-slate-900/90 text-slate-600 border border-slate-800'
                  }`}
                >
                  <span>الجولة {roundNum}{roundNum<=totalRoundsPlayed&&!isWonByA&&!isWonByB?' · محسومة':''}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {broadcastView === 'games' && (
        <section dir="rtl" className="ce-games-wall">
          <div className="ce-games-title"><div><span className="ce-eyebrow">CLASH OF ELITES / BAN & PICK</span><h2>ساحة اختيار الألعاب</h2></div><div className="ce-games-versus"><span style={{color:teamA?.color}}>{teamA?.name}</span><b>VS</b><span style={{color:teamB?.color}}>{teamB?.name}</span></div></div>
          <div className="ce-games-grid">
            {arenaColumns.map(col=>{
              const keys=arenaColumnGames[col.catId]||DEFAULT_ARENA_COLUMN_GAMES[col.catId]||[];
              let colGames=keys.map(key=>games.find(g=>g.id===key)||DEFAULT_GAMES.find(g=>g.id===key)).filter(Boolean) as GameItem[];
              if(colGames.length<3)colGames=[...colGames,...DEFAULT_GAMES.filter(g=>g.categoryId===col.catId&&!colGames.some(c=>c.id===g.id)).slice(0,3-colGames.length)];
              return <section key={col.catId} className="ce-games-column" style={{'--cat':col.headerColor} as React.CSSProperties}>
                <header className="ce-games-category"><span>{col.label}</span><h3>{col.subLabel}</h3></header>
                <div className="ce-games-stack">{colGames.map(game=>{
                  const state=cardStates[game.id]?.status||'available';
                  const current=currentMatch.activeGameId===game.id||state==='current';
                  const banned=state==='banned_team_a'||state==='banned_team_b';
                  const picked=state==='picked_team_a'||state==='picked_team_b';
                  const team=state.endsWith('team_a')?teamA:state.endsWith('team_b')?teamB:undefined;
                  const completed=state==='completed';
                  const label=current?'الجارية الآن':banned?'حظر '+(team?.shortName||''):picked?'اختيار '+(team?.shortName||''):completed?'انتهت':'متاحة';
                  const stateColor=current?'#f9da86':banned?'#ff7a84':picked?(team?.color||col.headerColor):completed?'#a8b7ae':col.headerColor;
                  return <article key={game.id} className={'ce-game-tile '+(current?'ce-game-current':banned?'ce-game-banned':picked?'ce-game-picked':completed?'ce-game-completed':'')} style={{'--status':stateColor} as React.CSSProperties}>
                    <div className="ce-game-art">{game.customImage?<img src={game.customImage} alt="" onError={e=>{e.currentTarget.style.display='none';}}/>:<GameIcon name={game.iconType} className="ce-game-icon"/>}</div>
                    <h4>{game.nameAr}</h4><div className="ce-game-state">{banned&&!current?<Ban/>:picked||completed?<Check/>:current?<Flame/>:<i/>}<span>{label}</span></div>
                  </article>;
                })}</div>
              </section>;
            })}
          </div>
        </section>
      )}

      {/* Bottom Leaderboard Strip */}
      <div className={broadcastView==='games'?'ce-games-rankstrip':'broadcast-leaderboard bg-[#0C1226]/80 rounded-2xl p-3 border border-slate-800/80 mt-4'}>
        <div className="text-[11px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>ترتيب دوري صراع النخبة المباشر:</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {standings.map((row, idx) => (
            <div
              key={row.teamId}
              className={`broadcast-standing p-1.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px] rank-${idx + 1}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-slate-500 font-bold">#{idx + 1}</span>
                <span className="font-bold text-white font-changa">{row.team.shortName}</span>
              </div>
              <span className="font-orbitron font-extrabold text-amber-400">{row.points} PTS</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
