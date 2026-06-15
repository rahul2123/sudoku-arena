import { useMemo } from 'react';
import type { Game } from '@/hooks/useGame';

export function NumberPad({ game }: { game: Game }) {
  const { grid, inputDigit, status } = game;

  const counts = useMemo(() => {
    const c: Record<number, number> = {};
    for (let d = 1; d <= 9; d++) c[d] = 0;
    for (const v of grid) if (v >= 1 && v <= 9) c[v]++;
    return c;
  }, [grid]);

  return (
    <div className="numpad">
      {Array.from({ length: 9 }, (_, k) => {
        const d = k + 1;
        const remaining = 9 - (counts[d] ?? 0);
        const done = remaining <= 0;
        return (
          <button
            key={d}
            className="numkey"
            disabled={done || status !== 'playing'}
            onClick={() => inputDigit(d)}
          >
            {d}
            <span className="count">{done ? '✓' : remaining}</span>
          </button>
        );
      })}
    </div>
  );
}
