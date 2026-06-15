import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Difficulty, Settings } from '@/types';
import { DIFFICULTY_ORDER } from '@/lib/sudoku';
import { useGame } from '@/hooks/useGame';
import { Board } from '@/components/Board';
import { HUD } from '@/components/HUD';
import { NumberPad } from '@/components/NumberPad';
import { Toolbar } from '@/components/Toolbar';
import { HintPanel } from '@/components/HintPanel';
import { WinModal } from '@/components/WinModal';

function isDifficulty(v: string | undefined): v is Difficulty {
  return !!v && (DIFFICULTY_ORDER as string[]).includes(v);
}

export function GamePage({ settings }: { settings: Settings }) {
  const params = useParams();
  const navigate = useNavigate();
  const game = useGame(settings);

  const startedRef = useRef(false);
  const idleCheckedRef = useRef(0);

  // start game when difficulty changes / on mount
  useEffect(() => {
    const d = params.difficulty;
    if (!isDifficulty(d)) { navigate('/'); return; }
    if (!startedRef.current || game.difficulty !== d) {
      startedRef.current = true;
      game.startGame(d);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.difficulty]);

  // keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (game.status !== 'playing') return;
      const k = e.key;
      if (k >= '1' && k <= '9') {
        e.preventDefault();
        game.inputDigit(parseInt(k, 10));
      } else if (k === 'Backspace' || k === 'Delete' || k === '0') {
        e.preventDefault();
        game.eraseCell();
      } else if (k === 'n' || k === 'N') {
        game.setNotesMode(!game.notesMode);
      } else if (k === 'h' || k === 'H') {
        game.requestHint();
      } else if ((e.ctrlKey || e.metaKey) && (k === 'z' || k === 'Z')) {
        e.preventDefault();
        game.undo();
      } else if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        moveSelection(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.status, game.selected, game.notesMode]);

  function moveSelection(key: string) {
    const sel = game.selected ?? 40;
    const r = Math.floor(sel / 9), c = sel % 9;
    let nr = r, nc = c;
    if (key === 'ArrowUp') nr = Math.max(0, r - 1);
    if (key === 'ArrowDown') nr = Math.min(8, r + 1);
    if (key === 'ArrowLeft') nc = Math.max(0, c - 1);
    if (key === 'ArrowRight') nc = Math.min(8, c + 1);
    game.setSelected(nr * 9 + nc);
  }

  // idle coaching: peek a hint after inactivity
  useEffect(() => {
    if (settings.idleHintSeconds <= 0) return;
    const interval = setInterval(() => {
      if (game.status !== 'playing') return;
      const idleMs = Date.now() - game.lastInputRef.current;
      if (idleMs >= settings.idleHintSeconds * 1000 && !game.hint && idleCheckedRef.current === 0) {
        idleCheckedRef.current = 1;
        game.peekHint();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.idleHintSeconds, game.status, game.hint]);

  // reset idle latch when user becomes active again (hint cleared / input made)
  useEffect(() => {
    if (!game.hint) idleCheckedRef.current = 0;
  }, [game.hint]);

  const newGame = () => {
    const d = params.difficulty;
    if (isDifficulty(d)) game.startGame(d);
  };

  return (
    <main className="page">
      <div className="game-layout">
        <div className="game-main">
          <HUD game={game} />

          {game.status === 'paused' && (
            <div className="paper" style={{ textAlign: 'center', padding: '40px' }}>
              <div style={{ fontSize: 40 }}>⏸</div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 900, fontSize: 24, marginTop: 8 }}>Paused</h3>
              <p style={{ color: 'var(--muted)', marginTop: 6 }}>Take a break — your timer is stopped.</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={game.resume}>▶ Resume</button>
            </div>
          )}

          {(game.status === 'playing' || game.status === 'paused') && <Board game={game} />}
          <NumberPad game={game} />
        </div>

        <aside className="controls">
          <Toolbar game={game} />
          <HintPanel game={game} />
          <div className="paper" style={{ padding: 16 }}>
            <h4 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 16 }}>How to play</h4>
            <ul style={{ marginTop: 8, paddingLeft: 18, color: 'var(--ink-soft)', fontSize: 13, lineHeight: 1.7 }}>
              <li>Tap a cell, then a number. Use <strong>✏️ Notes</strong> for pencil marks.</li>
              <li>Keyboard: <strong>1–9</strong> enter, <strong>N</strong> notes, <strong>H</strong> hint, arrows move.</li>
              <li><strong>💡 Hint</strong> explains the logic (10 per game).</li>
              <li>5 mistakes ends the game.</li>
            </ul>
          </div>
        </aside>
      </div>

      {game.status === 'won' && (
        <WinModal game={game} onNewGame={newGame} onHome={() => navigate('/')} />
      )}

      {game.status === 'lost' && (
        <div className="win-overlay">
          <div className="win-card" style={{ borderLeftColor: 'var(--bad)' }}>
            <div className="trophy">💥</div>
            <h2>Out of mistakes</h2>
            <div className="subtitle">Don't give up — every solve makes you sharper.</div>
            <div className="win-actions" style={{ marginTop: 22 }}>
              <button className="btn btn-primary" onClick={newGame}>🔁 Try again</button>
              <button className="btn btn-ghost" onClick={() => navigate('/')}>🏠 Home</button>
            </div>
          </div>
        </div>
      )}

      {game.toast && <div className="toast">{game.toast}</div>}
    </main>
  );
}
