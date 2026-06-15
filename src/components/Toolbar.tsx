import type { Game } from '@/hooks/useGame';
import { HINTS_PER_GAME } from '@/hooks/useGame';

export function Toolbar({ game }: { game: Game }) {
  const { notesMode, setNotesMode, undo, eraseCell, requestHint, hintsLeft, status } = game;

  return (
    <>
      <div className="action-row">
        <button
          className={`act-btn ${notesMode ? 'active' : ''}`}
          onClick={() => setNotesMode(!notesMode)}
          disabled={status !== 'playing'}
          title="Toggle notes / pencil marks (N)"
        >
          <span className="ic">✏️</span>
          Notes
        </button>
        <button className="act-btn" onClick={eraseCell} disabled={status !== 'playing'} title="Erase (Backspace)">
          <span className="ic">⌫</span>
          Erase
        </button>
        <button className="act-btn" onClick={undo} disabled={status !== 'playing'} title="Undo (Ctrl/Cmd+Z)">
          <span className="ic">↩</span>
          Undo
        </button>
        <button className="act-btn" onClick={requestHint} disabled={status !== 'playing'} title="Get a hint (H)">
          <span className="ic">💡</span>
          Hint
          {hintsLeft < HINTS_PER_GAME && <span className="badge">{hintsLeft}</span>}
        </button>
        <button className="act-btn" onClick={requestHint} disabled={status !== 'playing'} title="Highlight next step">
          <span className="ic">🎯</span>
          Assist
        </button>
      </div>
    </>
  );
}
