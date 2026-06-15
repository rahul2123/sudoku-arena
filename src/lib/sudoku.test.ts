import { describe, it, expect } from 'vitest'
import type { Grid, Difficulty } from '@/types'
import {
  generatePuzzle,
  solve,
  isSolved,
  isValidPlacement,
  findConflicts,
  peers,
  hasUniqueSolution,
  formatTime,
  idx,
  DIFFICULTY_CLUES,
  DIFFICULTY_ORDER,
} from '@/lib/sudoku'

const DIFFICULTIES: Difficulty[] = DIFFICULTY_ORDER

function countGivens(grid: Grid): number {
  return grid.reduce((n, v) => (v !== 0 ? n + 1 : n), 0)
}

describe('generatePuzzle', () => {
  for (const difficulty of DIFFICULTIES) {
    describe(`difficulty: ${difficulty}`, () => {
      it('returns 81-length puzzle and solution grids', () => {
        const { puzzle, solution } = generatePuzzle(difficulty)
        expect(puzzle).toHaveLength(81)
        expect(solution).toHaveLength(81)
      })

      it('has at least DIFFICULTY_CLUES - 2 givens', () => {
        const { puzzle } = generatePuzzle(difficulty)
        const target = DIFFICULTY_CLUES[difficulty]
        expect(countGivens(puzzle)).toBeGreaterThanOrEqual(target - 2)
      })

      it('has a unique solution', () => {
        const { puzzle } = generatePuzzle(difficulty)
        expect(hasUniqueSolution(puzzle)).toBe(true)
      })

      it('puzzle is a subset of its solution (givens match)', () => {
        const { puzzle, solution } = generatePuzzle(difficulty)
        for (let i = 0; i < 81; i++) {
          if (puzzle[i] !== 0) {
            expect(puzzle[i]).toBe(solution[i])
          }
        }
      })
    })
  }
})

describe('solve', () => {
  for (const difficulty of DIFFICULTIES) {
    it(`solves a generated ${difficulty} puzzle back to the stored solution`, () => {
      const { puzzle, solution } = generatePuzzle(difficulty)
      const solved = solve(puzzle)
      expect(solved).not.toBeNull()
      expect(solved).toEqual(solution)
      expect(isSolved(solved as Grid)).toBe(true)
    })
  }

  it('returns null for a grid with an unsolvable cell (zero candidates)', () => {
    const { solution } = generatePuzzle('easy')
    const bad = solution.slice()
    const target = idx(0, 0)
    bad[target] = 0
    bad[idx(0, 1)] = solution[target]
    expect(solve(bad)).toBeNull()
  })
})

describe('isSolved', () => {
  it('returns true for a full valid solution', () => {
    const { solution } = generatePuzzle('easy')
    expect(isSolved(solution)).toBe(true)
  })

  it('returns false for an incomplete puzzle', () => {
    const { puzzle } = generatePuzzle('easy')
    expect(isSolved(puzzle)).toBe(false)
  })

  it('returns false for a full grid with a conflict', () => {
    const { solution } = generatePuzzle('easy')
    const bad = solution.slice()
    bad[0] = bad[1]
    expect(isSolved(bad)).toBe(false)
  })
})

describe('isValidPlacement', () => {
  it('allows placing a digit on an empty grid', () => {
    const grid: Grid = new Array(81).fill(0)
    expect(isValidPlacement(grid, idx(0, 0), 5)).toBe(true)
  })

  it('treats 0 (empty) as always valid', () => {
    const grid: Grid = new Array(81).fill(0)
    expect(isValidPlacement(grid, idx(0, 0), 0)).toBe(true)
  })

  it('rejects a duplicate in the same row', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 1)] = 5
    expect(isValidPlacement(grid, idx(0, 0), 5)).toBe(false)
  })

  it('rejects a duplicate in the same column', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(1, 0)] = 5
    expect(isValidPlacement(grid, idx(0, 0), 5)).toBe(false)
  })

  it('rejects a duplicate in the same box', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(1, 1)] = 5
    expect(isValidPlacement(grid, idx(0, 0), 5)).toBe(false)
  })

  it('allows a digit not present among peers', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 1)] = 5
    expect(isValidPlacement(grid, idx(0, 0), 6)).toBe(true)
  })
})

describe('findConflicts', () => {
  it('returns an empty set for a clean grid', () => {
    const grid: Grid = new Array(81).fill(0)
    expect(findConflicts(grid).size).toBe(0)
  })

  it('returns an empty set for a valid solution', () => {
    const { solution } = generatePuzzle('easy')
    expect(findConflicts(solution).size).toBe(0)
  })

  it('flags both cells when a row has a duplicate', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 0)] = 5
    grid[idx(0, 3)] = 5
    const conflicts = findConflicts(grid)
    expect(conflicts.has(idx(0, 0))).toBe(true)
    expect(conflicts.has(idx(0, 3))).toBe(true)
    expect(conflicts.size).toBe(2)
  })

  it('flags duplicates within a box', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 0)] = 7
    grid[idx(2, 2)] = 7
    const conflicts = findConflicts(grid)
    expect(conflicts.has(idx(0, 0))).toBe(true)
    expect(conflicts.has(idx(2, 2))).toBe(true)
  })
})

describe('peers', () => {
  it('returns 20 peers for a corner cell', () => {
    expect(peers(idx(0, 0))).toHaveLength(20)
  })

  it('returns 20 peers for the center cell', () => {
    expect(peers(idx(4, 4))).toHaveLength(20)
  })

  it('does not include the cell itself', () => {
    const i = idx(3, 3)
    expect(peers(i)).not.toContain(i)
  })

  it('includes all row, column, and box neighbors without duplicates', () => {
    const i = idx(4, 4)
    const p = peers(i)
    expect(new Set(p).size).toBe(p.length)
  })
})

describe('formatTime', () => {
  it('formats zero seconds', () => {
    expect(formatTime(0)).toBe('00:00')
  })

  it('formats seconds under a minute with padding', () => {
    expect(formatTime(5)).toBe('00:05')
  })

  it('formats minutes and seconds', () => {
    expect(formatTime(65)).toBe('01:05')
  })

  it('formats exactly one hour with H:MM:SS', () => {
    expect(formatTime(3600)).toBe('1:00:00')
  })

  it('formats hours, minutes, and seconds', () => {
    expect(formatTime(3661)).toBe('1:01:01')
  })
})
