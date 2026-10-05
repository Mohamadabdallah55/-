import React, { useState, useEffect } from 'react';
import { CurrentMatch, Team, GameItem, LeagueRow, CategoryInfo, BanPickStatus } from '../types';
import { DEFAULT_GAMES } from '../data/defaultGames';
import { GameIcon } from './GameIcons';
import { subscribeToBroadcast, DEFAULT_ARENA_COLUMN_GAMES } from '../utils/storage';
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
  onClose,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [broadcastView, setBroadcastView] = useState<'scoreboard' | 'games'>('scoreboard');

  // Real-time listener from phone commands
  useEffect(() => {
    const unsub = subscribeToBroadcast((type, payload) => {
      if (type === 'BROADCAST_VIEW_UPDATED' && (payload === 'scoreboard' || payload === 'games')) {
        setBroadcastView(payload);
      }
    });
    return unsub;
  }, []);

  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];
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
      catId: '1v1',
      label: '1V1',
      subLabel: 'تحدي الكباتن',
      headerColor: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.6)',
    },
    {
      catId: 'fan_vote',
      label: 'FAN VOTE',
      subLabel: 'تصويت الجمهور',
      headerColor: '#EC4899',
      glowColor: 'rgba(236, 72, 153, 0.6)',
      isFanVote: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#050814] text-white flex flex-col justify-between p-4 md:p-8 select-none overflow-y-auto">
      {/* Top TV Header Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-amber-500 via-purple-600 to-indigo-600 flex items-center justify-center font-orbitron font-extrabold text-lg md:text-xl text-white shadow-lg shadow-purple-500/30">
            CE
          </div>
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
            onClick={() => setBroadcastView('scoreboard')}
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
            onClick={() => setBroadcastView('games')}
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
        <div className="my-auto max-w-5xl mx-auto w-full space-y-6 animate-fade-in">
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

          {/* Big Match Score Bar */}
          <div className="bg-[#070B19] rounded-3xl border-2 border-slate-700 shadow-[0_15px_50px_rgba(0,0,0,0.9)] p-4 md:p-6 flex items-center justify-between gap-6 relative">
            {/* Team A */}
            <div className="flex items-center gap-4 md:gap-6">
              <div
                className="w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-4xl md:text-7xl font-black font-orbitron text-white shadow-2xl"
                style={{
                  backgroundColor: teamA?.color || '#A855F7',
                  boxShadow: `0 0 30px ${teamA?.color || '#A855F7'}70`,
                }}
              >
                {currentMatch.teamAScore}
              </div>

              <div className="text-right">
                <h3 className="text-xl md:text-4xl font-black font-changa text-white uppercase tracking-wider">
                  {teamA?.shortName || teamA?.name}
                </h3>
                <p className="text-xs md:text-sm text-purple-300 font-medium">{teamA?.name}</p>
              </div>
            </div>

            {/* Center Emblem */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-0.5 shadow-[0_0_35px_rgba(99,102,241,0.6)]">
                <div className="w-full h-full bg-[#070B19] rounded-[14px] flex items-center justify-center">
                  <GameIcon
                    name={activeGame?.iconType || 'trophy'}
                    className="w-8 h-8 md:w-12 md:h-12 text-cyan-300"
                  />
                </div>
              </div>
              <span className="mt-2 text-[10px] md:text-xs font-mono uppercase tracking-widest text-slate-400">
                FIRST TO 3
              </span>
            </div>

            {/* Team B */}
            <div className="flex items-center gap-4 md:gap-6">
              <div className="text-left">
                <h3 className="text-xl md:text-4xl font-black font-changa text-white uppercase tracking-wider">
                  {teamB?.shortName || teamB?.name}
                </h3>
                <p className="text-xs md:text-sm text-cyan-300 font-medium">{teamB?.name}</p>
              </div>

              <div
                className="w-20 h-20 md:w-32 md:h-32 rounded-3xl flex items-center justify-center text-4xl md:text-7xl font-black font-orbitron text-white shadow-2xl"
                style={{
                  backgroundColor: teamB?.color || '#06B6D4',
                  boxShadow: `0 0 30px ${teamB?.color || '#06B6D4'}70`,
                }}
              >
                {currentMatch.teamBScore}
              </div>
            </div>
          </div>

          {/* Best of 5 Rounds Track */}
          <div className="flex items-center justify-center gap-2 md:gap-3">
            {[1, 2, 3, 4, 5].map((roundNum) => {
              const totalRoundsPlayed = currentMatch.teamAScore + currentMatch.teamBScore;
              const isWonByA = roundNum <= currentMatch.teamAScore;
              const isWonByB = roundNum > currentMatch.teamAScore && roundNum <= totalRoundsPlayed;
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
                  <span>الجولة {roundNum}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ARENA GAMES GRID VIEW (BAN & PICK STAGE ON BROADCAST) */}
      {broadcastView === 'games' && (
        <div className="my-auto max-w-7xl mx-auto w-full py-2 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {arenaColumns.map((col) => {
              let configuredKeys =
                arenaColumnGames[col.catId] ||
                DEFAULT_ARENA_COLUMN_GAMES[col.catId] ||
                [];

              if (
                col.catId === '1v1' &&
                (!configuredKeys ||
                  configuredKeys.length < 3 ||
                  configuredKeys.includes('g-box-of-liars') ||
                  !configuredKeys.includes('g-fatal-fury'))
              ) {
                configuredKeys = DEFAULT_ARENA_COLUMN_GAMES['1v1'];
              }

              if (col.catId === 'fan_vote' && (!configuredKeys || configuredKeys.length < 3)) {
                configuredKeys = DEFAULT_ARENA_COLUMN_GAMES['fan_vote'];
              }

              let colGames = configuredKeys
                .map((key) => games.find((g) => g.id === key) || DEFAULT_GAMES.find((g) => g.id === key))
                .filter(Boolean) as GameItem[];

              if (colGames.length < 3) {
                const fallbackPool = DEFAULT_GAMES.filter((g) => g.categoryId === col.catId);
                const extra = fallbackPool
                  .filter((g) => !colGames.some((cg) => cg.id === g.id))
                  .slice(0, 3 - colGames.length);
                colGames = [...colGames, ...extra];
              }

              return (
                <div
                  key={col.catId}
                  className="rounded-2xl bg-[#090D24]/90 border border-slate-800 p-2.5 flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  {/* Category Header */}
                  <div
                    className="p-2 rounded-xl text-center mb-3 border"
                    style={{
                      borderColor: `${col.headerColor}60`,
                      background: `linear-gradient(180deg, ${col.headerColor}25 0%, rgba(10,13,36,0.8) 100%)`,
                    }}
                  >
                    <span className="text-[10px] font-orbitron font-extrabold tracking-wider block" style={{ color: col.headerColor }}>
                      {col.label}
                    </span>
                    <h3 className="font-changa font-bold text-sm text-white">
                      {col.subLabel}
                    </h3>
                  </div>

                  {/* 3 Games Stack */}
                  <div className="space-y-2.5">
                    {colGames.map((game) => {
                      const state = cardStates[game.id]?.status || 'available';
                      const isCurrent = currentMatch.activeGameId === game.id;
                      const isBannedA = state === 'banned_team_a';
                      const isBannedB = state === 'banned_team_b';
                      const isPickedA = state === 'picked_team_a';
                      const isPickedB = state === 'picked_team_b';

                      return (
                        <div
                          key={game.id}
                          className={`p-2.5 rounded-xl border transition-all relative ${
                            isCurrent
                              ? 'bg-cyan-950/80 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.5)] ring-2 ring-cyan-400'
                              : isBannedA || isBannedB
                              ? 'bg-rose-950/30 border-rose-900/80 opacity-70'
                              : isPickedA
                              ? 'bg-purple-950/60 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                              : isPickedB
                              ? 'bg-cyan-950/60 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                              : 'bg-slate-900/70 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                              <GameIcon name={game.iconType} className="w-4 h-4 text-amber-300" />
                            </div>
                            <div className="truncate">
                              <h4 className="font-changa font-bold text-xs text-white truncate">
                                {game.nameAr}
                              </h4>
                              <span className="text-[9px] text-slate-400 font-mono block truncate">
                                {game.nameEn}
                              </span>
                            </div>
                          </div>

                          {/* Overlay Badges for Broadcast */}
                          {isCurrent && (
                            <div className="mt-1.5 text-center">
                              <span className="px-2 py-0.5 rounded-full bg-cyan-500 text-slate-950 font-black font-changa text-[9px] shadow animate-pulse">
                                ★ الجارية الآن
                              </span>
                            </div>
                          )}

                          {isBannedA && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-rose-300 font-bold bg-rose-950/80 rounded py-0.5 border border-rose-800">
                              <Ban className="w-2.5 h-2.5 text-rose-400" />
                              <span>حظر {teamA.shortName}</span>
                            </div>
                          )}

                          {isBannedB && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-rose-300 font-bold bg-rose-950/80 rounded py-0.5 border border-rose-800">
                              <Ban className="w-2.5 h-2.5 text-rose-400" />
                              <span>حظر {teamB.shortName}</span>
                            </div>
                          )}

                          {isPickedA && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-purple-200 font-bold bg-purple-950/80 rounded py-0.5 border border-purple-600">
                              <Check className="w-2.5 h-2.5 text-purple-300" />
                              <span>اختيار {teamA.shortName}</span>
                            </div>
                          )}

                          {isPickedB && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-[9px] text-cyan-200 font-bold bg-cyan-950/80 rounded py-0.5 border border-cyan-600">
                              <Check className="w-2.5 h-2.5 text-cyan-300" />
                              <span>اختيار {teamB.shortName}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Leaderboard Strip */}
      <div className="bg-[#0C1226]/80 rounded-2xl p-3 border border-slate-800/80 mt-4">
        <div className="text-[11px] text-slate-400 font-semibold mb-1.5 flex items-center gap-1.5">
          <Trophy className="w-3 h-3 text-amber-400" />
          <span>ترتيب دوري صراع النخبة المباشر:</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {standings.map((row, idx) => (
            <div
              key={row.teamId}
              className="p-1.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-[11px]"
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
