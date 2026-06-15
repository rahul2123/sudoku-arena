import { describe, it, expect } from 'vitest'
import type { Grid } from '@/types'
import { generatePuzzle, idx, solve } from '@/lib/sudoku'
import {
  computeCandidates,
  getNextHint,
  STRATEGY_INFO,
} from '@/lib/hints'

const STRATEGY_NAMES = STRATEGY_INFO.map((s) => s.name)

describe('computeCandidates', () => {
  it('gives all digits 1-9 for every empty cell on an empty grid', () => {
    const grid: Grid = new Array(81).fill(0)
    const cands = computeCandidates(grid)
    expect(cands).toHaveLength(81)
    for (let i = 0; i < 81; i++) {
      expect(cands[i]).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    }
  })

  it('returns empty candidate list for filled cells', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 0)] = 5
    const cands = computeCandidates(grid)
    expect(cands[idx(0, 0)]).toEqual([])
  })

  it('excludes a digit placed in the same row, column, and box', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 0)] = 5
    const cands = computeCandidates(grid)
    expect(cands[idx(0, 1)]).not.toContain(5)
    expect(cands[idx(1, 0)]).not.toContain(5)
    expect(cands[idx(1, 1)]).not.toContain(5)
    expect(cands[idx(0, 1)]).toHaveLength(8)
  })

  it('leaves a non-peer cell unaffected by the placed digit', () => {
    const grid: Grid = new Array(81).fill(0)
    grid[idx(0, 0)] = 5
    const cands = computeCandidates(grid)
    expect(cands[idx(4, 4)]).toContain(5)
    expect(cands[idx(4, 4)]).toHaveLength(9)
  })
})

describe('getNextHint', () => {
  it('returns a Full House hint for a grid missing a single cell', () => {
    const { solution } = generatePuzzle('beginner')
    const nearComplete = solution.slice()
    const target = idx(0, 0)
    nearComplete[target] = 0
    const hint = getNextHint(nearComplete)
    expect(hint).not.toBeNull()
    expect(hint!.strategy).toBe('Full House')
    expect(hint!.cells).toContain(target)
    expect(hint!.reasoning).toBeTruthy()
    expect(hint!.value).toBe(solution[target])
  })

  it('returns null for a fully solved grid', () => {
    const { solution } = generatePuzzle('easy')
    expect(getNextHint(solution)).toBeNull()
  })

  it('returns a non-null hint with strategy, reasoning, and cells for an in-progress puzzle', () => {
    const { puzzle, solution } = generatePuzzle('easy')
    const progress = puzzle.slice()
    const empties: number[] = []
    for (let i = 0; i < 81; i++) if (progress[i] === 0) empties.push(i)
    const toReveal = Math.floor(empties.length / 2)
    for (let k = 0; k < toReveal; k++) {
      progress[empties[k]] = solution[empties[k]]
    }
    const hint = getNextHint(progress)
    expect(hint).not.toBeNull()
    expect(typeof hint!.strategy).toBe('string')
    expect(hint!.strategy.length).toBeGreaterThan(0)
    expect(typeof hint!.reasoning).toBe('string')
    expect(hint!.reasoning.length).toBeGreaterThan(0)
    expect(Array.isArray(hint!.cells)).toBe(true)
    expect(hint!.cells.length).toBeGreaterThan(0)
  })

  it('reports a strategy name from the known STRATEGY_INFO list for an easy puzzle', () => {
    const { puzzle, solution } = generatePuzzle('easy')
    const progress = puzzle.slice()
    const empties: number[] = []
    for (let i = 0; i < 81; i++) if (progress[i] === 0) empties.push(i)
    const toReveal = Math.floor(empties.length / 2)
    for (let k = 0; k < toReveal; k++) {
      progress[empties[k]] = solution[empties[k]]
    }
    const hint = getNextHint(progress)
    expect(hint).not.toBeNull()
    expect(STRATEGY_NAMES).toContain(hint!.strategy)
  })

  it('can walk an easy puzzle to completion using only engine hints', () => {
    const { puzzle, solution } = generatePuzzle('easy')
    const grid = puzzle.slice()
    let guard = 0
    while (!grid.every((v, i) => v === solution[i])) {
      guard++
      if (guard > 200) {
        throw new Error('hint loop did not converge')
      }
      const hint = getNextHint(grid)
      if (!hint || hint.value === undefined) {
        throw new Error('engine produced no placement hint mid-solve')
      }
      const cell = hint.cells[0]
      if (cell === undefined) {
        throw new Error('hint has no cell')
      }
      grid[cell] = hint.value
    }
    expect(grid).toEqual(solution)
    expect(solve(puzzle)).toEqual(solution)
  })
})
