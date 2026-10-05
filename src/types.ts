export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string; // e.g. '#A855F7', '#06B6D4'
  bgBadge: string;
  logo: string; // key of avatar/badge icon
}

export interface MatchRound {
  round: number;
  gameId?: string;
  gameName?: string;
  winnerTeamId?: string;
}

export interface CurrentMatch {
  teamAId: string;
  teamBId: string;
  teamAScore: number; // 0 to 3 (Best of 5)
  teamBScore: number; // 0 to 3
  activeGameId: string | null;
  currentRound: number;
  rounds: MatchRound[];
}

export interface MatchRecord {
  id: string;
  date: string;
  timestamp: number;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  winnerId: string;
  loserId: string;
  categoryNames?: string[];
  rounds?: MatchRound[];
}

export interface LeagueRow {
  teamId: string;
  team: Team;
  played: number; // P
  won: number;    // W
  lost: number;   // L
  gf: number;     // له (جولات فاز بها)
  ga: number;     // عليه (جولات خسرها)
  gd: number;     // فارق الجولات (gf - ga)
  points: number; // PTS (3 per match win, 0 for loss)
  form: ('W' | 'L')[];
}

export type CategoryKey = 'digital' | 'mental' | 'physical' | '1v1' | 'fan_vote' | 'captains';

export type CategorySelectedGames = Record<string, string[]>;

export interface CategoryInfo {
  id: CategoryKey;
  nameAr: string;
  nameEn: string;
  description: string;
  accentColor: string;
  glowColor: string;
  icon: string;
}

export type BanPickStatus = 
  | 'available' 
  | 'banned_team_a' 
  | 'banned_team_b' 
  | 'picked_team_a' 
  | 'picked_team_b' 
  | 'current' 
  | 'completed';

export interface GameItem {
  id: string;
  categoryId: CategoryKey;
  nameAr: string;
  nameEn: string;
  description?: string;
  iconType: string;
  customImage?: string;
  isCustom?: boolean;
  rules?: string;
}

export interface CardState {
  gameId: string;
  status: BanPickStatus;
  order?: number;
}

export interface DualTimerSyncState {
  countdownTimeLeft: number; // seconds
  countdownRunning: boolean;
  countdownInitial: number;
  stopwatchElapsedMs: number;
  stopwatchRunning: boolean;
  teamATimeMs?: number;
  teamBTimeMs?: number;
  timestamp: number;
}
