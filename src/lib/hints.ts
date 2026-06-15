import type { Grid, Hint, Digit } from '@/types';
import { rowOf, colOf, boxOf, rowIndices, colIndices, boxIndices, isValidPlacement } from './sudoku';

export type CandidateGrid = number[][]; // index -> sorted candidate digits

export function computeCandidates(grid: Grid): CandidateGrid {
  const cands: CandidateGrid = Array.from({ length: 81 }, () => []);
  const peersOf = (i: number) => {
    const r = rowOf(i), c = colOf(i), b = boxOf(i);
    const set = new Set<number>();
    for (let j = 0; j < 81; j++) {
      if (j === i) continue;
      if (rowOf(j) === r || colOf(j) === c || boxOf(j) === b) set.add(j);
    }
    return set;
  };
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    const used = new Set<number>();
    for (const p of peersOf(i)) if (grid[p] !== 0) used.add(grid[p]);
    const list: number[] = [];
    for (let d = 1; d <= 9; d++) if (!used.has(d)) list.push(d);
    cands[i] = list;
  }
  return cands;
}

const cellRef = (i: number) => `R${rowOf(i) + 1}C${colOf(i) + 1}`;
const unitName = (kind: 'row' | 'col' | 'box', id: number) =>
  kind === 'row' ? `row ${id + 1}` : kind === 'col' ? `column ${id + 1}` : `box ${id + 1}`;

// ---------- Strategy 1: Naked Single ----------
function nakedSingle(grid: Grid, cands: CandidateGrid): Hint | null {
  for (let i = 0; i < 81; i++) {
    if (grid[i] !== 0) continue;
    if (cands[i].length === 1) {
      const v = cands[i][0];
      return {
        strategy: 'Naked Single',
        title: 'Only one possibility here',
        description: `Cell ${cellRef(i)} can only be ${v}.`,
        cells: [i],
        value: v as Digit,
        highlight: 'cell',
        reasoning: `Look at cell ${cellRef(i)}. Scanning its row, column, and box, every other digit 1–9 is already used by a neighbor — so ${v} is the only value that can fit. This is the simplest move: when a cell has a single candidate, place it.`,
      };
    }
  }
  return null;
}

// ---------- Strategy 2: Hidden Single ----------
function hiddenSingle(grid: Grid, cands: CandidateGrid): Hint | null {
  const units: { kind: 'row' | 'col' | 'box'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    units.push({ kind: 'row', id: u, cells: rowIndices(u) });
    units.push({ kind: 'col', id: u, cells: colIndices(u) });
    units.push({ kind: 'box', id: u, cells: boxIndices(u) });
  }
  for (const u of units) {
    for (let d = 1; d <= 9; d++) {
      const spots = u.cells.filter((c) => grid[c] === 0 && cands[c].includes(d));
      const alreadyPlaced = u.cells.some((c) => grid[c] === d);
      if (alreadyPlaced) continue;
      if (spots.length === 1) {
        const cell = spots[0];
        return {
          strategy: 'Hidden Single',
          title: `${d} can only go in one spot`,
          description: `In ${unitName(u.kind, u.id)}, ${d} must go in ${cellRef(cell)}.`,
          cells: [cell],
          value: d as Digit,
          highlight: u.kind,
          reasoning: `Focus on ${unitName(u.kind, u.id)} and the digit ${d}. It already appears in the other units that cross this one, leaving only cell ${cellRef(cell)} as a valid home. When a digit has exactly one possible cell in a unit, place it there.`,
        };
      }
    }
  }
  return null;
}

// ---------- Strategy 3: Pointing Pair/Triple (box -> line) ----------
function pointingPair(grid: Grid, cands: CandidateGrid): Hint | null {
  for (let b = 0; b < 9; b++) {
    const cells = boxIndices(b);
    for (let d = 1; d <= 9; d++) {
      const spots = cells.filter((c) => grid[c] === 0 && cands[c].includes(d));
      if (spots.length < 2 || spots.length > 3) continue;
      const rows = new Set(spots.map(rowOf));
      const cols = new Set(spots.map(colOf));
      if (rows.size === 1) {
        const r = spots[0] !== undefined ? rowOf(spots[0]) : 0;
        return elimHint(
          'Pointing Pair',
          `${d} in box ${b + 1} points along row ${r + 1}`,
          spots,
          'box',
          d,
          `In box ${b + 1}, all candidate cells for ${d} lie on a single row ${r + 1}. That means ${d} in row ${r + 1} must come from this box — so you can remove ${d} from the other cells of row ${r + 1} outside this box.`,
          rowIndices(r).filter((c) => boxOf(c) !== b && grid[c] === 0 && cands[c].includes(d))
        );
      }
      if (cols.size === 1) {
        const c = spots[0] !== undefined ? colOf(spots[0]) : 0;
        return elimHint(
          'Pointing Pair',
          `${d} in box ${b + 1} points along column ${c + 1}`,
          spots,
          'box',
          d,
          `In box ${b + 1}, all candidate cells for ${d} lie on a single column ${c + 1}. So ${d} in column ${c + 1} must be inside this box — remove ${d} from the other cells of column ${c + 1} outside the box.`,
          colIndices(c).filter((cc) => boxOf(cc) !== b && grid[cc] === 0 && cands[cc].includes(d))
        );
      }
    }
  }
  return null;
}

// ---------- Strategy 4: Box/Line Reduction (Claiming, line -> box) ----------
function boxLineReduction(grid: Grid, cands: CandidateGrid): Hint | null {
  const lines: { kind: 'row' | 'col'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    lines.push({ kind: 'row', id: u, cells: rowIndices(u) });
    lines.push({ kind: 'col', id: u, cells: colIndices(u) });
  }
  for (const l of lines) {
    for (let d = 1; d <= 9; d++) {
      const spots = l.cells.filter((c) => grid[c] === 0 && cands[c].includes(d));
      if (spots.length < 2 || spots.length > 3) continue;
      const boxes = new Set(spots.map(boxOf));
      if (boxes.size === 1) {
        const b = spots[0] !== undefined ? boxOf(spots[0]) : 0;
        return elimHint(
          'Box/Line Reduction',
          `${d} in ${unitName(l.kind, l.id)} locks into box ${b + 1}`,
          spots,
          l.kind,
          d,
          `All candidate cells for ${d} in ${unitName(l.kind, l.id)} fall inside a single box ${b + 1}. Therefore ${d} for that line must live in the box, so you can remove ${d} from the other cells of box ${b + 1}.`,
          boxIndices(b).filter((c) => (l.kind === 'row' ? rowOf(c) !== l.id : colOf(c) !== l.id) && grid[c] === 0 && cands[c].includes(d))
        );
      }
    }
  }
  return null;
}

// ---------- Strategy 5: Naked Pair ----------
function nakedPair(grid: Grid, cands: CandidateGrid): Hint | null {
  const units: { kind: 'row' | 'col' | 'box'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    units.push({ kind: 'row', id: u, cells: rowIndices(u) });
    units.push({ kind: 'col', id: u, cells: colIndices(u) });
    units.push({ kind: 'box', id: u, cells: boxIndices(u) });
  }
  for (const u of units) {
    const pairs = u.cells.filter((c) => grid[c] === 0 && cands[c].length === 2);
    for (let a = 0; a < pairs.length; a++) {
      for (let b = a + 1; b < pairs.length; b++) {
        const ca = cands[pairs[a]], cb = cands[pairs[b]];
        if (ca[0] === cb[0] && ca[1] === cb[1]) {
          const elim = u.cells.filter(
            (c) => c !== pairs[a] && c !== pairs[b] && grid[c] === 0 && (cands[c].includes(ca[0]) || cands[c].includes(ca[1]))
          );
          if (elim.length > 0) {
            return elimHint(
              'Naked Pair',
              `Twin candidates ${ca.join('/')} in ${unitName(u.kind, u.id)}`,
              [pairs[a], pairs[b]],
              u.kind,
              undefined,
              `Cells ${cellRef(pairs[a])} and ${cellRef(pairs[b])} in ${unitName(u.kind, u.id)} both have exactly the candidates ${ca.join(' and ')}. One of them must be ${ca[0]} and the other ${ca[1]}, so neither digit can appear elsewhere in this unit — cross those candidates off the other cells.`,
              elim
            );
          }
        }
      }
    }
  }
  return null;
}

// ---------- Strategy 6: Hidden Pair ----------
function hiddenPair(grid: Grid, cands: CandidateGrid): Hint | null {
  const units: { kind: 'row' | 'col' | 'box'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    units.push({ kind: 'row', id: u, cells: rowIndices(u) });
    units.push({ kind: 'col', id: u, cells: colIndices(u) });
    units.push({ kind: 'box', id: u, cells: boxIndices(u) });
  }
  for (const u of units) {
    const digitCells: Record<number, number[]> = {};
    for (let d = 1; d <= 9; d++) {
      const spots = u.cells.filter((c) => grid[c] === 0 && cands[c].includes(d));
      if (spots.length === 2) digitCells[d] = spots;
    }
    const ds = Object.keys(digitCells).map(Number);
    for (let i = 0; i < ds.length; i++) {
      for (let j = i + 1; j < ds.length; j++) {
        const a = digitCells[ds[i]], b = digitCells[ds[j]];
        if (a[0] === b[0] && a[1] === b[1]) {
          return {
            strategy: 'Hidden Pair',
            title: `Hidden pair ${ds[i]}/${ds[j]} in ${unitName(u.kind, u.id)}`,
            description: `Digits ${ds[i]} & ${ds[j]} only appear in ${cellRef(a[0])} and ${cellRef(a[1])}.`,
            cells: a,
            highlight: u.kind,
            reasoning: `In ${unitName(u.kind, u.id)}, the digits ${ds[i]} and ${ds[j]} can only ever go into cells ${cellRef(a[0])} and ${cellRef(a[1])}. Those two cells are therefore reserved for just these digits — any other candidates in them can be removed.`,
          };
        }
      }
    }
  }
  return null;
}

// ---------- Strategy 7: Naked Triple ----------
function nakedTriple(grid: Grid, cands: CandidateGrid): Hint | null {
  const units: { kind: 'row' | 'col' | 'box'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    units.push({ kind: 'row', id: u, cells: rowIndices(u) });
    units.push({ kind: 'col', id: u, cells: colIndices(u) });
    units.push({ kind: 'box', id: u, cells: boxIndices(u) });
  }
  for (const u of units) {
    const trips = u.cells.filter((c) => grid[c] === 0 && cands[c].length >= 2 && cands[c].length <= 3);
    for (let i = 0; i < trips.length; i++) {
      for (let j = i + 1; j < trips.length; j++) {
        for (let k = j + 1; k < trips.length; k++) {
          const union = new Set([...cands[trips[i]], ...cands[trips[j]], ...cands[trips[k]]]);
          if (union.size === 3) {
            const uarr = [...union];
            const elim = u.cells.filter(
              (c) => c !== trips[i] && c !== trips[j] && c !== trips[k] && grid[c] === 0 && (cands[c].includes(uarr[0]) || cands[c].includes(uarr[1]) || cands[c].includes(uarr[2]))
            );
            if (elim.length > 0) {
              return elimHint(
                'Naked Triple',
                `Three cells share three candidates in ${unitName(u.kind, u.id)}`,
                [trips[i], trips[j], trips[k]],
                u.kind,
                undefined,
                `Cells ${cellRef(trips[i])}, ${cellRef(trips[j])} and ${cellRef(trips[k])} together contain only the candidates ${uarr.join(', ')}. Between them they must hold exactly those three digits, so those candidates can be erased from the other cells of this unit.`,
                elim
              );
            }
          }
        }
      }
    }
  }
  return null;
}

// ---------- Strategy 8: X-Wing ----------
function xWing(grid: Grid, cands: CandidateGrid): Hint | null {
  for (let d = 1; d <= 9; d++) {
    // row-based X-Wing
    const rowSpots: number[][] = [];
    for (let r = 0; r < 9; r++) {
      const spots = rowIndices(r).filter((c) => grid[c] === 0 && cands[c].includes(d));
      if (spots.length === 2) rowSpots.push(spots);
      else rowSpots.push([]);
    }
    for (let r1 = 0; r1 < 9; r1++) {
      if (rowSpots[r1].length !== 2) continue;
      for (let r2 = r1 + 1; r2 < 9; r2++) {
        if (rowSpots[r2].length !== 2) continue;
        const c1a = colOf(rowSpots[r1][0]), c1b = colOf(rowSpots[r1][1]);
        const c2a = colOf(rowSpots[r2][0]), c2b = colOf(rowSpots[r2][1]);
        const cols = new Set([c1a, c1b, c2a, c2b]);
        if (cols.size === 2) {
          const colArr = [...cols];
          const elim = colArr.flatMap((c) => colIndices(c).filter((cell) => rowOf(cell) !== r1 && rowOf(cell) !== r2 && grid[cell] === 0 && cands[cell].includes(d)));
          if (elim.length > 0) {
            return elimHint(
              'X-Wing',
              `X-Wing on ${d} in rows ${r1 + 1} & ${r2 + 1}`,
              [rowSpots[r1][0], rowSpots[r1][1], rowSpots[r2][0], rowSpots[r2][1]],
              'group',
              d,
              `Digit ${d} has exactly two spots in both row ${r1 + 1} and row ${r2 + 1}, and they line up in the same two columns. This X-Wing pattern means ${d} must occupy two corners of this rectangle — so ${d} can be removed from the other cells of those two columns.`,
              elim
            );
          }
        }
      }
    }
  }
  return null;
}

// ---------- Strategy 9: Cross-hatching scan (digit placement by box scanning) ----------
function crossHatch(grid: Grid, _cands: CandidateGrid): Hint | null {
  for (let b = 0; b < 9; b++) {
    const cells = boxIndices(b);
    for (let d = 1; d <= 9; d++) {
      if (cells.some((c) => grid[c] === d)) continue;
      const valid = cells.filter((c) => grid[c] === 0 && isValidPlacement(grid, c, d));
      if (valid.length === 1) {
        const cell = valid[0];
        return {
          strategy: 'Cross-hatching',
          title: `Scan box ${b + 1} for ${d}`,
          description: `${d} fits only in ${cellRef(cell)} inside box ${b + 1}.`,
          cells: [cell],
          value: d as Digit,
          highlight: 'box',
          reasoning: `Cross-hatching is the bread-and-butter scanning move. In box ${b + 1}, the digit ${d} is blocked everywhere except cell ${cellRef(cell)} by the ${d}s already placed in the crossing rows and columns. Draw those block lines mentally and place ${d}.`,
        };
      }
    }
  }
  return null;
}

// ---------- Strategy 10: Last empty cell in a unit (Full House) ----------
function fullHouse(grid: Grid, cands: CandidateGrid): Hint | null {
  const units: { kind: 'row' | 'col' | 'box'; id: number; cells: number[] }[] = [];
  for (let u = 0; u < 9; u++) {
    units.push({ kind: 'row', id: u, cells: rowIndices(u) });
    units.push({ kind: 'col', id: u, cells: colIndices(u) });
    units.push({ kind: 'box', id: u, cells: boxIndices(u) });
  }
  for (const u of units) {
    const empty = u.cells.filter((c) => grid[c] === 0);
    if (empty.length === 1) {
      const cell = empty[0];
      const present = new Set(u.cells.filter((c) => grid[c] !== 0).map((c) => grid[c]));
      const missing: number[] = [];
      for (let d = 1; d <= 9; d++) if (!present.has(d)) missing.push(d);
      const v = missing[0];
      if (v !== undefined && cands[cell].includes(v)) {
        return {
          strategy: 'Full House',
          title: `Last cell in ${unitName(u.kind, u.id)}`,
          description: `${cellRef(cell)} is the only empty cell here.`,
          cells: [cell],
          value: v as Digit,
          highlight: u.kind,
          reasoning: `${capitalize(u.kind)} ${u.id + 1} has just one empty square left: ${cellRef(cell)}. The digit still missing from this unit is ${v}, so that value must go there. Always fill in near-complete units — they're free moves.`,
        };
      }
    }
  }
  return null;
}

function elimHint(
  strategy: string,
  title: string,
  cells: number[],
  highlight: Hint['highlight'],
  digit: number | undefined,
  reasoning: string,
  elim: number[]
): Hint {
  return {
    strategy,
    title,
    description: `Eliminate ${digit !== undefined ? digit : 'candidates'} — reduces notes elsewhere.`,
    cells,
    highlight,
    reasoning: elim.length > 0 ? reasoning + ` (helps clean ${elim.length} cell${elim.length > 1 ? 's' : ''}.)` : reasoning,
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Ordered from simplest to most advanced. The engine returns the first that applies.
export const STRATEGY_ORDER = [
  fullHouse,
  nakedSingle,
  hiddenSingle,
  crossHatch,
  pointingPair,
  boxLineReduction,
  nakedPair,
  hiddenPair,
  nakedTriple,
  xWing,
];

export const STRATEGY_INFO: { name: string; blurb: string }[] = [
  { name: 'Full House', blurb: 'Fill the last empty cell of a nearly complete unit.' },
  { name: 'Naked Single', blurb: 'A cell with only one possible candidate.' },
  { name: 'Hidden Single', blurb: 'A digit with only one possible cell in a unit.' },
  { name: 'Cross-hatching', blurb: 'Scan a box — blocked cells leave one open spot.' },
  { name: 'Pointing Pair', blurb: 'A box candidate confined to one line removes it elsewhere.' },
  { name: 'Box/Line Reduction', blurb: 'A line candidate locked in one box removes it in that box.' },
  { name: 'Naked Pair', blurb: 'Two cells with the same two candidates eliminate them elsewhere.' },
  { name: 'Hidden Pair', blurb: 'Two digits confined to two cells clear other candidates.' },
  { name: 'Naked Triple', blurb: 'Three cells sharing three candidates eliminate them elsewhere.' },
  { name: 'X-Wing', blurb: 'A rectangle pattern removes a candidate from two lines.' },
];

export function getNextHint(grid: Grid): Hint | null {
  const cands = computeCandidates(grid);
  for (const strat of STRATEGY_ORDER) {
    const hint = strat(grid, cands);
    if (hint) return hint;
  }
  return null;
}

export function getHintByStrategy(strategyName: string): { name: string; blurb: string } | undefined {
  return STRATEGY_INFO.find((s) => s.name === strategyName);
}
