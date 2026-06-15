export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type CellValue = Digit | 0; // 0 = empty
export type Grid = number[]; // length 81, 0 = empty

export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert';

export interface Puzzle {
  puzzle: Grid; // starting grid (givens)
  solution: Grid; // full solution
  difficulty: Difficulty;
}

export interface CellNotes {
  [index: number]: number[]; // candidate digits per cell index
}

export interface Hint {
  strategy: string;
  title: string;
  description: string;
  cells: number[]; // indices the hint refers to
  value?: Digit; // the value to place (if applicable)
  highlight: 'cell' | 'row' | 'col' | 'box' | 'group';
  reasoning: string;
}

export interface GameHistoryEntry {
  id: string;
  difficulty: Difficulty;
  result: 'won' | 'abandoned';
  timeSeconds: number;
  hintsUsed: number;
  mistakes: number;
  date: number; // epoch ms
}

export interface Settings {
  idleHintSeconds: number; // 0 = disabled
  autoValidate: boolean;
  highlightPeers: boolean;
  notesAutoClean: boolean;
}

export type RuleLevel = 'Basic' | 'Intermediate' | 'Advanced';

export interface RuleExample {
  grid: number[];                        // 81 cells, 0 = empty (the example board givens)
  notes: number[][];                     // length-81 array of candidate lists (pre-filled where relevant)
  task: 'place' | 'eliminate';
  targets: number[];                     // cell indices the user must act on
  placeAnswer?: Record<number, number>;  // task 'place': cell -> correct digit
  eliminateAnswer?: Record<number, number[]>; // task 'eliminate': cell -> notes to remove
  highlight: number[];                   // cells to highlight to reveal the pattern
  caption: string;                       // one-line instruction shown to the user
  explain: string;                       // reasoning specific to this example
}

export interface Rule {
  id: string;
  order: number;
  name: string;
  level: RuleLevel;
  blurb: string;     // short summary
  detail: string;    // longer explanation (paraphrased from sudoku.com)
  example: RuleExample;
}
