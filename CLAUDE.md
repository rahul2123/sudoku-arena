# CLAUDE.md

Project guidance for Claude Code (and any AI assistant) working in this repo.

## Project Overview

**Sudoku Arena** — a single-page web app to play, learn, and solve Sudoku puzzles.
Built with Vite + React 18 + TypeScript. No backend: all state and persistence live
in the browser via `localStorage`.

The app generates puzzles, validates moves, provides strategy-based hints, tracks
game history/stats, and includes a "Tips" section that teaches Sudoku solving
techniques (naked singles, hidden pairs, etc.) with interactive examples.

## Tech Stack

- **Runtime**: Node.js (LTS)
- **Build**: Vite 5
- **Framework**: React 18 + react-router-dom 6
- **Language**: TypeScript 5 (strict, project references via `tsconfig.app.json` / `tsconfig.node.json`)
- **Tests**: Vitest (node environment, `src/**/*.test.ts`)
- **Extras**: canvas-confetti (win animation)

## Commands

| Task            | Command           |
| --------------- | ----------------- |
| Dev server      | `npm run dev`     |
| Type-check      | `npm run typecheck` |
| Lint (typecheck)| `npm run lint`    |
| Build           | `npm run build`   |
| Preview build   | `npm run preview` |
| Run tests       | `npm test`        |

> **Always run `npm run typecheck` and `npm test` after non-trivial code changes.**
> There is no ESLint configured; `lint` is an alias for the TypeScript build check.

## Architecture

```
src/
  App.tsx            Root component + routes (react-router)
  main.tsx           Entry point
  types/index.ts     All shared types — source of truth for data shapes
  lib/
    sudoku.ts        Pure puzzle engine: peers, validation, generation, solving
    hints.ts         Strategy-based hint engine (returns Hint[] with reasoning)
    storage.ts       localStorage persistence: settings, history, stats
    *.test.ts        Vitest unit tests for the engines
  hooks/
    useGame.ts       Central game state hook (grid, notes, history, timer)
  components/        Presentational + interactive UI (Board, Cell, HUD, Toolbar, ...)
  pages/             Route-level pages (Home, Game, History, Tips, Settings)
  styles/
    theme.css        CSS variables / theme tokens
```

### Key conventions

- **Path alias**: `@/*` maps to `src/*` (configured in both `vite.config.ts` and
  `vitest.config.ts`). Always import via `@/...` rather than long relative paths.
- **Grid representation**: a Sudoku board is a flat `number[]` of length 81
  (`0` = empty). Index math: `i = row * 9 + col`. See `src/types/index.ts`.
- **Pure logic, dumb UI**: keep all puzzle/hint/stats logic pure and unit-tested
  under `src/lib`. Components should consume that logic, not re-implement it.
- **Tests live next to the code** they test (e.g. `sudoku.test.ts` beside
  `sudoku.ts`). New engine functions should come with tests in the same pattern.
- **Persistence is defensive**: every `storage.ts` read is wrapped in try/catch
  and returns a safe default. Never assume `localStorage` contents are valid.

## Coding Style

- TypeScript strict mode — no implicit `any`, no unchecked `null`.
- Functional React with hooks; no class components.
- Prefer named exports for components and utilities.
- No code comments unless behavior is genuinely non-obvious.
- Keep files focused; one component or one logical module per file.

## Environment / Setup

```bash
npm install
npm run dev      # http://localhost:5173
```

Requires Node 18+.

## Notes for Contributors

- `dist/`, `node_modules/`, and `*.tsbuildinfo` are build artifacts — never commit them.
- `.claude/settings.local.json` and `.superpowers/` are local agent state and are gitignored.
- Bump `package.json` `version` when cutting a release.
