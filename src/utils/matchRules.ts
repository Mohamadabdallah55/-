import type { CurrentMatch, GameItem, MatchRecord } from '../types';

export function applyRoundScore(match: CurrentMatch, slot: 'A' | 'B', delta: number, games: GameItem[]): CurrentMatch {
  if (delta !== 1 && delta !== -1) return match;
  if (match.teamAId === match.teamBId || !match.teamAId || !match.teamBId) return match;
  if (delta > 0 && Math.max(match.teamAScore, match.teamBScore) >= 3) return match;
  const key = slot === 'A' ? 'teamAScore' : 'teamBScore';
  const teamId = slot === 'A' ? match.teamAId : match.teamBId;
  const score = Math.max(0, Math.min(3, match[key] + delta));
  if (score === match[key]) return match;
  const next: CurrentMatch = { ...match, [key]: score, rounds: [...(match.rounds || [])] };
  const known = next.rounds.length === match.teamAScore + match.teamBScore &&
    next.rounds.filter(r => r.winnerTeamId === match.teamAId).length === match.teamAScore &&
    next.rounds.filter(r => r.winnerTeamId === match.teamBId).length === match.teamBScore;
  if (known && delta === 1) {
    next.rounds.push({round: next.rounds.length + 1, winnerTeamId: teamId, gameId: match.activeGameId || undefined, gameName: games.find(g => g.id === match.activeGameId)?.nameAr});
  } else if (known && delta === -1) {
    const index = next.rounds.map(r => r.winnerTeamId).lastIndexOf(teamId);
    if (index >= 0) next.rounds.splice(index, 1);
    next.rounds = next.rounds.map((r,i) => ({...r,round:i+1}));
  } else next.rounds = [];
  next.currentRound = Math.min(5, next.teamAScore + next.teamBScore + 1);
  return next;
}

export function isCertifiedFinal(record: MatchRecord): boolean {
  if (record.stage !== 'final' || record.teamAId === record.teamBId) return false;
  const a = record.teamAScore, b = record.teamBScore;
  if (!Number.isInteger(a) || !Number.isInteger(b) || Math.min(a,b) < 0 || Math.min(a,b) > 2 || Math.max(a,b) !== 3) return false;
  return record.winnerId === (a > b ? record.teamAId : record.teamBId) &&
    record.loserId === (a > b ? record.teamBId : record.teamAId);
}
