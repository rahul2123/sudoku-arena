import type { Grid, Difficulty, Puzzle } from '@/types';

export const N = 9;

export const idx = (r: number, c: number) => r * 9 + c;
export const rowOf = (i: number) => Math.floor(i / 9);
export const colOf = (i: number) => i % 9;
export const boxOf = (i: number) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);

export function boxIndex(i: number): number {
  return boxOf(i);
}

const PEER_CACHE: number[][] = Array.from({ length: 81 }, () => []);
for (let i = 0; i < 81; i++) {
  const r = rowOf(i), c = colOf(i), b = boxOf(i);
  for (let j = 0; j < 81; j++) {
    if (i === j) continue;
    if (rowOf(j) === r || colOf(j) === c || boxOf(j) === b) PEER_CACHE[i].push(j);
  }
}
export const peers = (i: number): number[] => PEER_CACHE[i];

export function rowIndices(r: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) out.push(idx(r, c));
  return out;
}
export function colIndices(c: number): number[] {
  const out: number[] = [];
  for (let r = 0; r < 9; r++) out.push(idx(r, c));
  return out;
}
export function boxIndices(b: number): number[] {
  const out: number[] = [];
  const br = Math.floor(b / 3) * 3, bc = (b % 3) * 3;
  for (let r = br; r < br + 3; r++) for (let c = bc; c < bc + 3; c++) out.push(idx(r, c));
  return out;
}

export function cloneGrid(g: Grid): Grid {
  return g.slice();
}

export function isValidPlacement(grid: Grid, i: number, val: number): boolean {
  if (val === 0) return true;
  for (const p of peers(i)) {
    if (grid[p] === val) return false;
  }
  return true;
}

export function findConflicts(grid: Grid): Set<number> {
  const bad = new Set<number>();
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) continue;
    for (const p of peers(i)) {
      if (grid[p] === grid[i]) { bad.add(i); bad.add(p); }
    }
  }
  return bad;
}

export function isSolved(grid: Grid): boolean {
  for (let i = 0; i < 81; i++) {
    if (grid[i] === 0) return false;
    if (!isValidPlacement(grid, i, grid[i])) return false;
  }
  return true;
}

// ---- Solver (backtracking with candidate ordering) ----
function candidatesFor(grid: Grid, i: number): number[] {
  if (grid[i] !== 0) return [];
  const used = new Set<number>();
  for (const p of peers(i)) if (grid[p] !== 0) used.add(grid[p]);
  const out: number[] = [];
  for (let d = 1; d <= 9; d++) if (!used.has(d)) out.push(d);
  return out;
}

export function solve(grid: Grid): Grid | null {
  const g = cloneGrid(grid);
  return backtrack(g) ? g : null;
}

function backtrack(g: Grid): boolean {
  let best = -1, bestCands: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    const cands = candidatesFor(g, i);
    if (best === -1 || cands.length < bestCands.length) {
      best = i; bestCands = cands;
      if (cands.length <= 1) break;
    }
  }
  if (best === -1) return true; // solved
  if (bestCands.length === 0) return false;
  for (const d of bestCands) {
    if (isValidPlacement(g, best, d)) {
      g[best] = d;
      if (backtrack(g)) return true;
      g[best] = 0;
    }
  }
  return false;
}

function countSolutions(grid: Grid, limit: number): number {
  const g = cloneGrid(grid);
  const counter = { n: 0 };
  countBacktrack(g, limit, counter);
  return counter.n;
}

function countBacktrack(g: Grid, limit: number, counter: { n: number }): void {
  if (counter.n >= limit) return;
  let best = -1, bestCands: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i] !== 0) continue;
    const cands = candidatesFor(g, i);
    if (best === -1 || cands.length < bestCands.length) {
      best = i; bestCands = cands;
    }
  }
  if (best === -1) { counter.n++; return; }
  if (bestCands.length === 0) return;
  for (const d of bestCands) {
    if (isValidPlacement(g, best, d)) {
      g[best] = d;
      countBacktrack(g, limit, counter);
      g[best] = 0;
      if (counter.n >= limit) return;
    }
  }
}

export function hasUniqueSolution(grid: Grid): boolean {
  return countSolutions(grid, 2) === 1;
}

// ---- Puzzle generation ----
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function fillSolution(): Grid {
  const g: Grid = new Array(81).fill(0);
  fillDiagonalBoxes(g);
  backtrack(g);
  return g;
}

export function generateSolvedGrid(): Grid {
  return fillSolution();
}

function fillDiagonalBoxes(g: Grid): void {
  for (let b = 0; b < 9; b += 4) {
    const cells = boxIndices(b);
    const digits = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    cells.forEach((c, k) => { g[c] = digits[k]; });
  }
}

export const DIFFICULTY_CLUES: Record<Difficulty, number> = {
  beginner: 45,
  easy: 38,
  medium: 32,
  hard: 28,
  expert: 24,
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
};

export const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];

export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const solution = fillSolution();
  const cluesTarget = DIFFICULTY_CLUES[difficulty];
  const puzzle = cloneGrid(solution);

  // remove cells in random order while keeping unique solution
  const order = shuffle(Array.from({ length: 81 }, (_, i) => i));
  let remaining = 81;
  for (const cell of order) {
    if (remaining <= cluesTarget) break;
    const saved = puzzle[cell];
    puzzle[cell] = 0;
    if (!hasUniqueSolution(puzzle)) {
      puzzle[cell] = saved; // restore
    } else {
      remaining--;
    }
  }

  // for easier difficulties, ensure we actually reached target by being lenient
  // (unique-solution constraint may prevent reaching very low clue counts; that's fine)
  return { puzzle, solution, difficulty };
}

export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
