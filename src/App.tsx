/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Team,
  CurrentMatch,
  MatchRecord,
  CategoryKey,
  BanPickStatus,
  GameItem,
} from './types';
import { CATEGORIES } from './data/defaultGames';
import {
  loadTeams,
  saveTeams,
  loadGames,
  saveGames,
  loadSelectedCategories,
  saveSelectedCategories,
  loadCurrentMatch,
  saveCurrentMatch,
  loadMatchesHistory,
  saveMatchesHistory,
  loadCardStates,
  saveCardStates,
  computeStandings,
  subscribeToBroadcast,
  loadArenaColumnGames,
  saveArenaColumnGames,
} from './utils/storage';
import { sound } from './utils/audio';
import { Header } from './components/Header';
import { LiveScoreboard } from './components/LiveScoreboard';
import { CategoryPicker } from './components/CategoryPicker';
import { StandingsTable } from './components/StandingsTable';
import { DualTimer } from './components/DualTimer';
import { TeamsModal } from './components/TeamsModal';
import { MatchHistoryModal } from './components/MatchHistoryModal';
import { BroadcastOverlay } from './components/BroadcastOverlay';
import { GamesLibraryMap } from './components/GamesLibraryMap';
import { ArenaBattleBoard } from './components/ArenaBattleBoard';
import { MobileRemoteController } from './components/MobileRemoteController';
import { MobileConnectModal } from './components/MobileConnectModal';
import { ArenaStageView } from './components/ArenaStageView';
import { VictoryModal } from './components/VictoryModal';
import { HotkeysModal } from './components/HotkeysModal';

export default function App() {
  // Check if opened as standalone window via URL hash #standalone-timer or #remote / /remote / ?mode=remote
  const [isStandaloneTimer, setIsStandaloneTimer] = useState<boolean>(false);
  const [isRemoteMode, setIsRemoteMode] = useState<boolean>(false);
  const [isMobileConnectModalOpen, setIsMobileConnectModalOpen] = useState<boolean>(false);

  // Arena Polish States
  const [isStageViewOpen, setIsStageViewOpen] = useState<boolean>(false);
  const [isHotkeysModalOpen, setIsHotkeysModalOpen] = useState<boolean>(false);
  const [isVictoryModalOpen, setIsVictoryModalOpen] = useState<boolean>(false);
  const [victoryWinner, setVictoryWinner] = useState<Team | null>(null);
  const [victoryLoser, setVictoryLoser] = useState<Team | null>(null);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);

  // PWA Install prompt state
  const [deferredPwaPrompt, setDeferredPwaPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPwaPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPwaPrompt) {
      deferredPwaPrompt.prompt();
      deferredPwaPrompt.userChoice.then(() => {
        setDeferredPwaPrompt(null);
      });
    }
  };

  useEffect(() => {
    const checkRoute = () => {
      const isTimer =
        window.location.hash === '#standalone-timer' ||
        window.location.pathname.startsWith('/timer');

      const isRemote =
        window.location.hash === '#remote' ||
        window.location.pathname.startsWith('/remote') ||
        window.location.pathname === '/remote' ||
        new URLSearchParams(window.location.search).get('mode') === 'remote' ||
        new URLSearchParams(window.location.search).get('remote') === 'true' ||
        new URLSearchParams(window.location.search).get('tab') === 'remote';

      setIsStandaloneTimer(isTimer);
      setIsRemoteMode(isRemote);
    };

    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    window.addEventListener('popstate', checkRoute);
    return () => {
      window.removeEventListener('hashchange', checkRoute);
      window.removeEventListener('popstate', checkRoute);
    };
  }, []);

  // Main Persistent States
  const [teams, setTeams] = useState<Team[]>(() => loadTeams());
  const [games, setGames] = useState<GameItem[]>(() => loadGames());
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>(() =>
    loadSelectedCategories()
  );
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch>(() =>
    loadCurrentMatch(teams)
  );
  const [matchesHistory, setMatchesHistory] = useState<MatchRecord[]>(() =>
    loadMatchesHistory()
  );
  const [cardStates, setCardStates] = useState<Record<string, { gameId: string; status: BanPickStatus }>>(() =>
    loadCardStates()
  );
  const [arenaColumnGames, setArenaColumnGames] = useState<Record<string, string[]>>(() =>
    loadArenaColumnGames()
  );

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'match' | 'arena' | 'library' | 'standings' | 'timer' | 'broadcast'
  >('match');

  // Modals
  const [isTeamsModalOpen, setIsTeamsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Cross-tab & WebSocket synchronization listener
  useEffect(() => {
    const unsubscribe = subscribeToBroadcast((type, payload) => {
      if (type === 'TEAMS_UPDATED') setTeams(payload as Team[]);
      if (type === 'MATCH_UPDATED') setCurrentMatch(payload as CurrentMatch);
      if (type === 'HISTORY_UPDATED') setMatchesHistory(payload as MatchRecord[]);
      if (type === 'CATEGORIES_UPDATED') setSelectedCategories(payload as CategoryKey[]);
      if (type === 'CARDS_UPDATED') setCardStates(payload as Record<string, { gameId: string; status: BanPickStatus }>);
      if (type === 'GAMES_UPDATED') setGames(payload as GameItem[]);
      if (type === 'ARENA_GAMES_UPDATED') setArenaColumnGames(payload as Record<string, string[]>);
      if (type === 'SWITCH_TAB_COMMAND') {
        const targetTab = payload as string;
        if (['match', 'arena', 'library', 'standings', 'timer', 'broadcast'].includes(targetTab)) {
          setActiveTab(targetTab as any);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Handle Score Updates (+ / -)
  const handleUpdateScore = (teamSlot: 'A' | 'B', delta: number) => {
    const nextMatch = { ...currentMatch };
    if (teamSlot === 'A') {
      const nextScore = Math.max(0, Math.min(3, nextMatch.teamAScore + delta));
      nextMatch.teamAScore = nextScore;
    } else {
      const nextScore = Math.max(0, Math.min(3, nextMatch.teamBScore + delta));
      nextMatch.teamBScore = nextScore;
    }
    setCurrentMatch(nextMatch);
    saveCurrentMatch(nextMatch);
  };

  // Keyboard Hotkeys Manager
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Space: tick sound or countdown toggle
      if (e.code === 'Space') {
        e.preventDefault();
        sound.playTick();
        return;
      }

      // ArrowUp / ArrowDown: Team A score
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        sound.playScorePoint(true);
        handleUpdateScore('A', 1);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        sound.playTick();
        handleUpdateScore('A', -1);
        return;
      }

      // ArrowRight / ArrowLeft / + / -: Team B score
      if (e.key === 'ArrowRight' || e.key === '=' || e.key === '+') {
        e.preventDefault();
        sound.playScorePoint(false);
        handleUpdateScore('B', 1);
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === '-') {
        e.preventDefault();
        sound.playTick();
        handleUpdateScore('B', -1);
        return;
      }

      // 'B' or 'b': Toggle Arena Stage View
      if (e.key === 'b' || e.key === 'B' || e.key === 'لا') {
        e.preventDefault();
        setIsStageViewOpen((prev) => !prev);
        return;
      }

      // 'F' or 'f': Fullscreen toggle
      if (e.key === 'f' || e.key === 'F' || e.key === 'ب') {
        e.preventDefault();
        try {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen?.().catch(() => {});
          } else {
            document.exitFullscreen?.().catch(() => {});
          }
        } catch {}
        return;
      }

      // 'T' or 't': Switch to Timer tab
      if (e.key === 't' || e.key === 'T' || e.key === 'ف') {
        e.preventDefault();
        setActiveTab('timer');
        return;
      }

      // 'M' or 'm': Switch to Match tab
      if (e.key === 'm' || e.key === 'M' || e.key === 'ة') {
        e.preventDefault();
        setActiveTab('match');
        return;
      }

      // Escape: Close modals
      if (e.key === 'Escape') {
        setIsStageViewOpen(false);
        setIsHotkeysModalOpen(false);
        setIsVictoryModalOpen(false);
        setIsMobileConnectModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMatch]);

  // Column game swap handler (from phone or PC)
  const handleChangeColumnGame = (categoryId: string, slotIndex: number, newGameId: string) => {
    const next = { ...arenaColumnGames };
    const currentList = [...(next[categoryId] || [])];
    currentList[slotIndex] = newGameId;
    next[categoryId] = currentList;
    setArenaColumnGames(next);
    saveArenaColumnGames(next);
  };

  // Computed 6-Team Standings Table
  const standings = computeStandings(teams, matchesHistory);

  // Current Teams in Match
  const teamA = teams.find((t) => t.id === currentMatch.teamAId) || teams[0];
  const teamB = teams.find((t) => t.id === currentMatch.teamBId) || teams[1] || teams[0];

  // If Standalone Timer Screen, render just the DualTimer in full-screen mode
  if (isStandaloneTimer) {
    return (
      <DualTimer
        teamA={teamA}
        teamB={teamB}
        isStandalone={true}
      />
    );
  }

  // Change Team A or B
  const handleChangeTeam = (slot: 'A' | 'B', newTeamId: string) => {
    const nextMatch = { ...currentMatch };
    if (slot === 'A') {
      if (newTeamId === nextMatch.teamBId) return;
      nextMatch.teamAId = newTeamId;
    } else {
      if (newTeamId === nextMatch.teamAId) return;
      nextMatch.teamBId = newTeamId;
    }
    setCurrentMatch(nextMatch);
    saveCurrentMatch(nextMatch);
  };

  // Finish Match and Update Standings (CRITICAL PRD REQUIREMENT)
  const handleFinishMatch = () => {
    if (currentMatch.teamAScore === 0 && currentMatch.teamBScore === 0) {
      return;
    }

    if (currentMatch.teamAScore === currentMatch.teamBScore) {
      return;
    }

    const winnerId =
      currentMatch.teamAScore > currentMatch.teamBScore
        ? currentMatch.teamAId
        : currentMatch.teamBId;
    const loserId =
      currentMatch.teamAScore > currentMatch.teamBScore
        ? currentMatch.teamBId
        : currentMatch.teamAId;

    const winnerObj = teams.find((t) => t.id === winnerId) || (winnerId === currentMatch.teamAId ? teamA : teamB);
    const loserObj = teams.find((t) => t.id === loserId) || (loserId === currentMatch.teamAId ? teamA : teamB);

    const newRecord: MatchRecord = {
      id: `match-${Date.now()}`,
      date: new Date().toLocaleDateString('ar-SA', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: Date.now(),
      teamAId: currentMatch.teamAId,
      teamBId: currentMatch.teamBId,
      teamAName: teamA?.name || 'فريق 1',
      teamBName: teamB?.name || 'فريق 2',
      teamAScore: currentMatch.teamAScore,
      teamBScore: currentMatch.teamBScore,
      winnerId,
      loserId,
      categoryNames: selectedCategories.map(
        (cId) => CATEGORIES.find((c) => c.id === cId)?.nameAr || cId
      ),
    };

    const updatedHistory = [newRecord, ...matchesHistory];
    setMatchesHistory(updatedHistory);
    saveMatchesHistory(updatedHistory);

    // Trigger Screen Shake & Victory Modal
    setIsScreenShaking(true);
    setTimeout(() => setIsScreenShaking(false), 500);

    setVictoryWinner(winnerObj);
    setVictoryLoser(loserObj);
    setIsVictoryModalOpen(true);

    // Confetti burst
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A855F7', '#06B6D4', '#F59E0B', '#10B981'],
      });
    } catch {}

    // Reset current match score for next encounter
    const resetMatch: CurrentMatch = {
      teamAId: currentMatch.teamAId,
      teamBId: currentMatch.teamBId,
      teamAScore: 0,
      teamBScore: 0,
      activeGameId: null,
      currentRound: 1,
      rounds: [],
    };
    setCurrentMatch(resetMatch);
    saveCurrentMatch(resetMatch);

    // Also reset active game states for next round
    const nextCardStates = { ...cardStates };
    Object.keys(nextCardStates).forEach((gId) => {
      if (nextCardStates[gId].status === 'current') {
        nextCardStates[gId] = { gameId: gId, status: 'completed' };
      }
    });
    setCardStates(nextCardStates);
    saveCardStates(nextCardStates);
  };

  // Reset current match
  const handleResetCurrentMatch = () => {
    const resetMatch: CurrentMatch = {
      teamAId: currentMatch.teamAId,
      teamBId: currentMatch.teamBId,
      teamAScore: 0,
      teamBScore: 0,
      activeGameId: null,
      currentRound: 1,
      rounds: [],
    };
    setCurrentMatch(resetMatch);
    saveCurrentMatch(resetMatch);
  };

  // Reset all Ban/Pick cards
  const handleResetAllBansPicks = () => {
    const resetCards: Record<string, { gameId: string; status: BanPickStatus }> = {};
    setCardStates(resetCards);
    saveCardStates(resetCards);
  };

  // Set card status
  const handleSetCardStatus = (gameId: string, status: BanPickStatus) => {
    sound.playPick(status.startsWith('banned') ? 'ban' : 'pick');
    const nextCards = {
      ...cardStates,
      [gameId]: { gameId, status },
    };
    setCardStates(nextCards);
    saveCardStates(nextCards);
  };

  // Set active game for current match
  const handleSetActiveGame = (gameId: string | null) => {
    if (gameId) {
      sound.playPick('pick');
      sound.playRoundBell();
    }
    const nextMatch = { ...currentMatch, activeGameId: gameId };
    setCurrentMatch(nextMatch);
    saveCurrentMatch(nextMatch);
  };

  // Save customized teams
  const handleSaveTeams = (updatedTeams: Team[]) => {
    setTeams(updatedTeams);
    saveTeams(updatedTeams);
  };

  // Save selected categories
  const handleSelectCategories = (cats: CategoryKey[]) => {
    setSelectedCategories(cats);
    saveSelectedCategories(cats);
  };

  // Save game item
  const handleSaveGame = (updatedGame: GameItem) => {
    const next = games.map((g) => (g.id === updatedGame.id ? updatedGame : g));
    setGames(next);
    saveGames(next);
  };

  // Delete match from history
  const handleDeleteMatch = (matchId: string) => {
    const next = matchesHistory.filter((m) => m.id !== matchId);
    setMatchesHistory(next);
    saveMatchesHistory(next);
  };

  // Reset entire League
  const handleResetLeague = () => {
    setMatchesHistory([]);
    saveMatchesHistory([]);
    handleResetCurrentMatch();
    handleResetAllBansPicks();
  };

  // If Mobile Remote Mode, render dedicated smartphone controller
  if (isRemoteMode) {
    return (
      <MobileRemoteController
        currentMatch={currentMatch}
        teams={teams}
        games={games}
        categories={CATEGORIES}
        cardStates={cardStates}
        arenaColumnGames={arenaColumnGames}
        onUpdateScore={handleUpdateScore}
        onChangeTeam={handleChangeTeam}
        onFinishMatch={handleFinishMatch}
        onResetCurrentMatch={handleResetCurrentMatch}
        onSetCardStatus={handleSetCardStatus}
        onSetActiveGame={handleSetActiveGame}
        onResetAllBansPicks={handleResetAllBansPicks}
        onChangeColumnGame={handleChangeColumnGame}
        onClose={() => {
          if (window.location.hash === '#remote') {
            window.location.hash = '';
          }
          if (window.location.pathname.startsWith('/remote')) {
            window.history.pushState(null, '', '/');
          }
          setIsRemoteMode(false);
        }}
      />
    );
  }

  return (
    <div
      className={`min-h-screen bg-[#070B19] text-slate-100 flex flex-col font-cairo transition-transform ${
        isScreenShaking ? 'animate-screen-shake' : ''
      }`}
    >
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTeamsModal={() => setIsTeamsModalOpen(true)}
        onOpenResetModal={handleResetLeague}
        onOpenMobileConnectModal={() => setIsMobileConnectModalOpen(true)}
        onToggleStageView={() => setIsStageViewOpen(true)}
        onOpenHotkeys={() => setIsHotkeysModalOpen(true)}
        canInstallPwa={Boolean(deferredPwaPrompt)}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-8">
        {/* TAB 1: LIVE MATCH */}
        {activeTab === 'match' && (
          <div className="space-y-8 animate-fade-in">
            {/* Live Scoreboard Banner */}
            <LiveScoreboard
              currentMatch={currentMatch}
              teams={teams}
              games={games}
              categories={CATEGORIES}
              onUpdateScore={handleUpdateScore}
              onChangeTeam={handleChangeTeam}
              onFinishMatch={handleFinishMatch}
              onResetCurrentMatch={handleResetCurrentMatch}
              onOpenBanPickTab={() => setActiveTab('arena')}
            />

            {/* Category Selector Grid */}
            <CategoryPicker
              categories={CATEGORIES}
              selectedCategories={selectedCategories}
              onToggleCategory={(catId) => {
                const exists = selectedCategories.includes(catId);
                let next: CategoryKey[];
                if (exists) {
                  if (selectedCategories.length <= 3) return;
                  next = selectedCategories.filter((c) => c !== catId);
                } else {
                  next = [...selectedCategories, catId];
                }
                setSelectedCategories(next);
                saveSelectedCategories(next);
              }}
            />

            {/* Standings Leaderboard Table */}
            <StandingsTable
              standings={standings}
              matchesHistory={matchesHistory}
              onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
              onResetLeague={handleResetLeague}
            />
          </div>
        )}

        {/* TAB 2: ARENA BAN & PICK ENGINE */}
        {activeTab === 'arena' && (
          <div className="space-y-6 animate-fade-in">
            <ArenaBattleBoard
              games={games}
              categories={CATEGORIES}
              cardStates={cardStates}
              teamA={teamA}
              teamB={teamB}
              activeGameId={currentMatch.activeGameId}
              onSetCardStatus={handleSetCardStatus}
              onSetActiveGame={handleSetActiveGame}
              onResetAllBansPicks={handleResetAllBansPicks}
            />
          </div>
        )}

        {/* TAB 3: GAMES VAULT LIBRARY */}
        {activeTab === 'library' && (
          <div className="space-y-6 animate-fade-in">
            <GamesLibraryMap
              games={games}
              cardStates={cardStates}
              activeGameId={currentMatch.activeGameId}
              teamA={teamA}
              teamB={teamB}
              onSetCardStatus={handleSetCardStatus}
              onSetActiveGame={handleSetActiveGame}
            />
          </div>
        )}

        {/* TAB 4: LEAGUE STANDINGS */}
        {activeTab === 'standings' && (
          <div className="space-y-6 animate-fade-in">
            <StandingsTable
              standings={standings}
              matchesHistory={matchesHistory}
              onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
              onResetLeague={handleResetLeague}
            />
          </div>
        )}

        {/* TAB: DEDICATED DUAL TIMER */}
        {activeTab === 'timer' && (
          <div className="space-y-6 animate-fade-in">
            <DualTimer
              teamA={teamA}
              teamB={teamB}
              isStandalone={false}
            />
          </div>
        )}

        {/* TAB: BROADCAST OVERLAY */}
        {activeTab === 'broadcast' && (
          <BroadcastOverlay
            currentMatch={currentMatch}
            teams={teams}
            games={games}
            standings={standings}
            categories={CATEGORIES}
            cardStates={cardStates}
            arenaColumnGames={arenaColumnGames}
            onClose={() => setActiveTab('match')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050814] py-6 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-changa font-bold text-amber-300">دوري صراع النخبة (CLASH OF ELITES)</span>
            <span>·</span>
            <span>نظام الإدارة الميدانية والتحكيم للفرق الستة</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsStageViewOpen(true)}
              className="hover:text-amber-300 transition-colors flex items-center gap-1"
            >
              <span>وضع المسرح (B) 📺</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsHotkeysModalOpen(true)}
              className="hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              <span>الاختصارات ⌨️</span>
            </button>
            <span>·</span>
            <span>Zero Latency & 60fps</span>
          </div>
        </div>
      </footer>

      {/* Teams Customization Modal */}
      <TeamsModal
        isOpen={isTeamsModalOpen}
        onClose={() => setIsTeamsModalOpen(false)}
        teams={teams}
        onSaveTeams={handleSaveTeams}
      />

      {/* Match History Modal */}
      <MatchHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        matches={matchesHistory}
        onDeleteMatch={handleDeleteMatch}
      />

      {/* Mobile Remote Connect QR Modal */}
      <MobileConnectModal
        isOpen={isMobileConnectModalOpen}
        onClose={() => setIsMobileConnectModalOpen(false)}
        onOpenRemoteDirectly={() => setIsRemoteMode(true)}
      />

      {/* Arena Stage View for Audience & Projector (Clean Broadcast) */}
      {isStageViewOpen && (
        <ArenaStageView
          currentMatch={currentMatch}
          teams={teams}
          games={games}
          categories={CATEGORIES}
          onClose={() => setIsStageViewOpen(false)}
          onOpenHotkeys={() => setIsHotkeysModalOpen(true)}
        />
      )}

      {/* Victory Celebration Modal */}
      {isVictoryModalOpen && victoryWinner && victoryLoser && (
        <VictoryModal
          isOpen={isVictoryModalOpen}
          onClose={() => setIsVictoryModalOpen(false)}
          winnerTeam={victoryWinner}
          loserTeam={victoryLoser}
          currentMatch={currentMatch}
          onNextMatch={() => {
            setIsVictoryModalOpen(false);
            handleResetCurrentMatch();
          }}
        />
      )}

      {/* Keyboard Hotkeys Modal Guide */}
      <HotkeysModal
        isOpen={isHotkeysModalOpen}
        onClose={() => setIsHotkeysModalOpen(false)}
      />
    </div>
  );
}
