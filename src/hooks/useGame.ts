import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Difficulty, Hint, GameHistoryEntry, Settings } from '@/types';
import {
  generatePuzzle, cloneGrid, findConflicts, isSolved, peers,
  rowOf, colOf, boxOf, DIFFICULTY_LABELS,
} from '@/lib/sudoku';
import { getNextHint } from '@/lib/hints';
import { addHistoryEntry, loadHistory } from '@/lib/storage';

export const HINTS_PER_GAME = 10;
export const MAX_MISTAKES = 5;

export type GameStatus = 'idle' | 'playing' | 'paused' | 'won' | 'lost';

type History = { grid: number[]; notes: number[][] }[];

export interface GameState {
  difficulty: Difficulty | null;
  puzzle: number[];      // original givens (immutable)
  solution: number[];    // full solution
  grid: number[];        // current working grid
  notes: number[][];     // per-cell candidate lists
  selected: number | null;
  notesMode: boolean;
  mistakes: number;
  hintsUsed: number;
  hintsLeft: number;
  status: GameStatus;
  elapsed: number;       // seconds
  hint: Hint | null;
  conflicts: Set<number>;
  winWaveCells: number[];
  autoHintCells: number[];
}

function emptyNotes(): number[][] {
  return Array.from({ length: 81 }, () => []);
}

export function useGame(settings: Settings) {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [puzzle, setPuzzle] = useState<number[]>(new Array(81).fill(0));
  const [solution, setSolution] = useState<number[]>(new Array(81).fill(0));
  const [grid, setGrid] = useState<number[]>(new Array(81).fill(0));
  const [notes, setNotes] = useState<number[][]>(emptyNotes());
  const [selected, setSelected] = useState<number | null>(null);
  const [notesMode, setNotesMode] = useState(false);
  const [mistakes, setMistakes] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_GAME);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [hint, setHint] = useState<Hint | null>(null);
  const [conflicts, setConflicts] = useState<Set<number>>(new Set());
  const [winWaveCells, setWinWaveCells] = useState<number[]>([]);
  const [autoHintCells, setAutoHintCells] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const undoStack = useRef<History>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastInputRef = useRef<number>(Date.now());
  const recordedRef = useRef(false);

  const isGiven = useCallback((i: number) => puzzle[i] !== 0, [puzzle]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  const pushHistory = useCallback(() => {
    undoStack.current.push({ grid: cloneGrid(grid), notes: notes.map((n) => n.slice()) });
    if (undoStack.current.length > 100) undoStack.current.shift();
  }, [grid, notes]);

  const startGame = useCallback((diff: Difficulty) => {
    const p = generatePuzzle(diff);
    setPuzzle(p.puzzle);
    setSolution(p.solution);
    setGrid(cloneGrid(p.puzzle));
    setNotes(emptyNotes());
    setDifficulty(diff);
    setSelected(null);
    setNotesMode(false);
    setMistakes(0);
    setHintsUsed(0);
    setHintsLeft(HINTS_PER_GAME);
    setStatus('playing');
    setElapsed(0);
    setHint(null);
    setConflicts(new Set());
    setWinWaveCells([]);
    setAutoHintCells([]);
    undoStack.current = [];
    recordedRef.current = false;
    lastInputRef.current = Date.now();
  }, []);

  // timer
  useEffect(() => {
    if (status === 'playing') {
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [status]);

  // mark input activity
  const markActivity = useCallback(() => {
    lastInputRef.current = Date.now();
    setAutoHintCells([]);
  }, []);

  const endGame = useCallback((result: 'won' | 'abandoned') => {
    if (recordedRef.current) return;
    if (!difficulty) return;
    recordedRef.current = true;
    const entry: GameHistoryEntry = {
      id: `${Date.now()}`,
      difficulty,
      result,
      timeSeconds: elapsed,
      hintsUsed,
      mistakes,
      date: Date.now(),
    };
    addHistoryEntry(entry);
    if (result === 'won') setStatus('won');
  }, [difficulty, elapsed, hintsUsed, mistakes]);

  // win detection + animation
  useEffect(() => {
    if (status !== 'playing') return;
    if (isSolved(grid)) {
      const order: number[] = [];
      for (let c = 0; c < 9; c++) for (let r = 0; r < 9; r++) order.push(r * 9 + c);
      order.forEach((cell, i) => {
        setTimeout(() => {
          setWinWaveCells((prev) => [...prev, cell]);
        }, i * 28);
      });
      setTimeout(() => endGame('won'), order.length * 28 + 200);
    }
  }, [grid, status, endGame]);

  const setCell = useCallback((i: number, val: number) => {
    if (status !== 'playing') return;
    if (isGiven(i)) return;
    markActivity();
    setHint(null);
    pushHistory();

    const nextGrid = cloneGrid(grid);
    nextGrid[i] = val;
    setGrid(nextGrid);

    // notes auto-clean on placement
    if (val !== 0 && settings.notesAutoClean) {
      setNotes((prev) => {
        const next = prev.map((n) => n.slice());
        next[i] = [];
        for (const p of peers(i)) next[p] = next[p].filter((d) => d !== val);
        return next;
      });
    } else {
      setNotes((prev) => { const next = prev.map((n) => n.slice()); next[i] = []; return next; });
    }

    // mistakes
    if (val !== 0 && settings.autoValidate && val !== solution[i]) {
      const m = mistakes + 1;
      setMistakes(m);
      if (m >= MAX_MISTAKES) {
        setStatus('lost');
        const entry: GameHistoryEntry = {
          id: `${Date.now()}`, difficulty: difficulty!, result: 'abandoned',
          timeSeconds: elapsed, hintsUsed, mistakes: m, date: Date.now(),
        };
        addHistoryEntry(entry);
        recordedRef.current = true;
      }
    }
  }, [status, isGiven, markActivity, pushHistory, grid, settings.notesAutoClean, settings.autoValidate, solution, mistakes, difficulty, elapsed, hintsUsed]);

  const toggleNote = useCallback((i: number, d: number) => {
    if (status !== 'playing') return;
    if (isGiven(i) || grid[i] !== 0) return;
    markActivity();
    pushHistory();
    setNotes((prev) => {
      const next = prev.map((n) => n.slice());
      const has = next[i].includes(d);
      next[i] = has ? next[i].filter((x) => x !== d) : [...next[i], d].sort((a, b) => a - b);
      return next;
    });
  }, [status, isGiven, grid, markActivity, pushHistory]);

  const inputDigit = useCallback((d: number) => {
    if (selected === null) return;
    if (notesMode) toggleNote(selected, d);
    else setCell(selected, d);
  }, [selected, notesMode, toggleNote, setCell]);

  const eraseCell = useCallback(() => {
    if (selected === null) return;
    if (isGiven(selected) || grid[selected] === 0) {
      if (notes[selected].length > 0) {
        markActivity();
        pushHistory();
        setNotes((prev) => { const next = prev.slice(); next[selected] = []; return next; });
      }
      return;
    }
    setCell(selected, 0);
  }, [selected, isGiven, grid, notes, markActivity, pushHistory, setCell]);

  const undo = useCallback(() => {
    const prev = undoStack.current.pop();
    if (!prev) { showToast('Nothing to undo.'); return; }
    markActivity();
    setGrid(prev.grid);
    setNotes(prev.notes);
    setHint(null);
  }, [markActivity, showToast]);

  const requestHint = useCallback(() => {
    if (status !== 'playing') return;
    markActivity();
    const h = getNextHint(grid);
    if (!h) { showToast('No logical hint found — try trial or check your entries.'); return; }
    if (hintsLeft <= 0) {
      setHint(h);
      setAutoHintCells(h.cells);
      showToast('Out of hints — showing strategy only.');
      return;
    }
    setHint(h);
    setAutoHintCells(h.cells);
    setHintsUsed((n) => n + 1);
    setHintsLeft((n) => Math.max(0, n - 1));
    if (h.cells[0] !== undefined) setSelected(h.cells[0]);
  }, [status, markActivity, grid, hintsLeft]);

  const applyHint = useCallback(() => {
    if (!hint || hint.value === undefined) {
      setHint(null);
      return;
    }
    const cell = hint.cells[0];
    if (cell === undefined) { setHint(null); return; }
    setNotesMode(false);
    setCell(cell, hint.value);
    setHint(null);
  }, [hint, setCell]);

  const pause = useCallback(() => setStatus((s) => (s === 'playing' ? 'paused' : s)), []);
  const resume = useCallback(() => setStatus((s) => (s === 'paused' ? 'playing' : s)), []);

  const dismissHint = useCallback(() => {
    setHint(null);
    setAutoHintCells([]);
  }, []);

  // Free coaching peek — does NOT consume a hint credit. Used for idle nudges.
  const peekHint = useCallback(() => {
    if (status !== 'playing') return;
    const h = getNextHint(grid);
    if (!h) return;
    setHint(h);
    setAutoHintCells(h.cells);
    if (h.cells[0] !== undefined) setSelected(h.cells[0]);
  }, [status, grid]);

  // recompute conflicts
  useEffect(() => {
    if (settings.autoValidate) setConflicts(findConflicts(grid));
    else setConflicts(new Set());
  }, [grid, settings.autoValidate]);

  // derived: same-value highlighting
  const sameValueCells = useMemo(() => {
    const set = new Set<number>();
    if (selected === null || grid[selected] === 0) return set;
    const v = grid[selected];
    for (let i = 0; i < 81; i++) if (grid[i] === v) set.add(i);
    return set;
  }, [selected, grid]);

  const peerCells = useMemo(() => {
    if (selected === null) return new Set<number>();
    return new Set(peers(selected));
  }, [selected]);

  return {
    // state
    difficulty, puzzle, solution, grid, notes, selected, notesMode,
    mistakes, hintsUsed, hintsLeft, status, elapsed, hint, conflicts,
    winWaveCells, autoHintCells, toast, settings,
    sameValueCells, peerCells,
    isGiven,
    // actions
    startGame, setSelected, setNotesMode, inputDigit, eraseCell, undo,
    requestHint, applyHint, dismissHint, peekHint, pause, resume, markActivity,
    lastInputRef, showToast,
  };
}

export type Game = ReturnType<typeof useGame>;
export { DIFFICULTY_LABELS, rowOf, colOf, boxOf, loadHistory };
