import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { Game } from '@/hooks/useGame';
import { formatTime, DIFFICULTY_LABELS } from '@/lib/sudoku';

export function WinModal({ game, onNewGame, onHome }: { game: Game; onNewGame: () => void; onHome: () => void }) {
  const { elapsed, mistakes, hintsUsed, difficulty } = game;

  useEffect(() => {
    const end = Date.now() + 1800;
    const colors = ['#4f46e5', '#16a34a', '#facc15', '#f97316', '#ec4899'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 70, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 70, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
    const burst = () => confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors });
    burst();
    const t = setTimeout(burst, 400);
    return () => clearTimeout(t);
  }, []);

  const cleanSolve = mistakes === 0 && hintsUsed === 0;

  return (
    <div className="win-overlay">
      <div className="win-card">
        <div className="trophy">{cleanSolve ? '🏆' : '🎉'}</div>
        <h2>{cleanSolve ? 'Flawless!' : 'Solved!'}</h2>
        <div className="subtitle">
          {difficulty ? `${DIFFICULTY_LABELS[difficulty]} Sudoku conquered` : 'Puzzle conquered'}
        </div>
        <div className="win-stats">
          <div className="win-stat">
            <div className="v">{formatTime(elapsed)}</div>
            <div className="k">Time</div>
          </div>
          <div className="win-stat">
            <div className="v">{mistakes}</div>
            <div className="k">Mistakes</div>
          </div>
          <div className="win-stat">
            <div className="v">{hintsUsed}</div>
            <div className="k">Hints</div>
          </div>
        </div>
        <div className="win-actions">
          <button className="btn btn-primary" onClick={onNewGame}>🔁 New Game</button>
          <button className="btn btn-ghost" onClick={onHome}>🏠 Home</button>
        </div>
      </div>
    </div>
  );
}
