import type { GameHistoryEntry, Settings } from '@/types';

const HISTORY_KEY = 'sudoku.arena.history.v1';
const SETTINGS_KEY = 'sudoku.arena.settings.v1';

export const DEFAULT_SETTINGS: Settings = {
  idleHintSeconds: 120, // proactive hint (nudge) after this many seconds idle (0 disables)
  autoValidate: true,
  highlightPeers: true,
  notesAutoClean: true,
};

export function loadHistory(): GameHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveHistory(entries: GameHistoryEntry[]): void {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
  } catch {
    /* ignore quota errors */
  }
}

export function addHistoryEntry(entry: GameHistoryEntry): GameHistoryEntry[] {
  const all = loadHistory();
  all.unshift(entry);
  const trimmed = all.slice(0, 200);
  saveHistory(trimmed);
  return trimmed;
}

export function clearHistory(): void {
  saveHistory([]);
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}

export interface Stats {
  played: number;
  won: number;
  winRate: number;
  bestTimeByDiff: Record<string, number>;
  avgTimeByDiff: Record<string, number>;
  totalHints: number;
  totalMistakes: number;
  currentStreak: number;
  bestStreak: number;
}

export function computeStats(entries: GameHistoryEntry[]): Stats {
  const stats: Stats = {
    played: entries.length,
    won: 0,
    winRate: 0,
    bestTimeByDiff: {},
    avgTimeByDiff: {},
    totalHints: 0,
    totalMistakes: 0,
    currentStreak: 0,
    bestStreak: 0,
  };
  const sumTimeByDiff: Record<string, number> = {};
  const countByDiff: Record<string, number> = {};

  for (const e of entries) {
    stats.totalHints += e.hintsUsed;
    stats.totalMistakes += e.mistakes;
    if (e.result === 'won') {
      stats.won++;
      const bt = stats.bestTimeByDiff[e.difficulty];
      if (bt === undefined || e.timeSeconds < bt) stats.bestTimeByDiff[e.difficulty] = e.timeSeconds;
      sumTimeByDiff[e.difficulty] = (sumTimeByDiff[e.difficulty] ?? 0) + e.timeSeconds;
      countByDiff[e.difficulty] = (countByDiff[e.difficulty] ?? 0) + 1;
    }
  }
  for (const k of Object.keys(sumTimeByDiff)) {
    stats.avgTimeByDiff[k] = Math.round(sumTimeByDiff[k] / countByDiff[k]);
  }
  stats.winRate = stats.played ? Math.round((stats.won / stats.played) * 100) : 0;

  // streaks by date order
  let cur = 0, best = 0;
  for (const e of entries) {
    if (e.result === 'won') { cur++; best = Math.max(best, cur); }
    else cur = 0;
  }
  stats.currentStreak = cur;
  stats.bestStreak = best;
  return stats;
}
