import type { Game } from '@/hooks/useGame';
import { Cell } from './Cell';

export function Board({ game }: { game: Game }) {
  return (
    <div className="board-wrap">
      <div className="board">
        {Array.from({ length: 81 }, (_, i) => (
          <Cell key={i} index={i} game={game} />
        ))}
      </div>
    </div>
  );
}
