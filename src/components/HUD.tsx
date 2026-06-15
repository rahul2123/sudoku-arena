import type { Game } from '@/hooks/useGame';
import { formatTime, DIFFICULTY_LABELS } from '@/lib/sudoku';
import { HINTS_PER_GAME, MAX_MISTAKES } from '@/hooks/useGame';

export function HUD({ game }: { game: Game }) {
  const { elapsed, difficulty, mistakes, hintsLeft, status, pause, resume } = game;
  const stars = difficulty ? { beginner: '★', easy: '★★', medium: '★★★', hard: '★★★★', expert: '★★★★★' }[difficulty] : '';

  return (
    <div className="hud">
      <div className="hud-chip accent">
        <span className="lbl">Level</span>
        <span>{difficulty ? DIFFICULTY_LABELS[difficulty] : '—'}</span>
        <span style={{ color: 'var(--warn)' }}>{stars}</span>
      </div>
      <div className="hud-chip mono">
        <span className="lbl">Time</span>
        {formatTime(elapsed)}
      </div>
      <div className={`hud-chip ${mistakes > 0 ? 'bad' : ''}`}>
        <span className="lbl">Mistakes</span>
        {mistakes}/{MAX_MISTAKES}
      </div>
      <div className={`hud-chip ${hintsLeft <= 3 ? 'warn' : 'good'}`}>
        <span className="lbl">Hints</span>
        {hintsLeft}/{HINTS_PER_GAME}
      </div>
      <div className="hud-spacer" />
      {status === 'playing' && (
        <button className="hud-chip" onClick={pause} style={{ cursor: 'pointer' }}>
          ⏸ Pause
        </button>
      )}
      {status === 'paused' && (
        <button className="hud-chip accent" onClick={resume} style={{ cursor: 'pointer' }}>
          ▶ Resume
        </button>
      )}
    </div>
  );
}
