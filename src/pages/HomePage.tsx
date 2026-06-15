import type { Difficulty } from '@/types';
import { DifficultyPicker } from '@/components/DifficultyPicker';
import { computeStats, loadHistory } from '@/lib/storage';
import { Link } from 'react-router-dom';

export function HomePage({ onStart }: { onStart: (d: Difficulty) => void }) {
  const stats = computeStats(loadHistory());
  return (
    <main className="page">
      <section className="hero">
        <h1>Train your mind with <em>Sudoku</em>.</h1>
        <p>
          Five difficulty levels, smart pencil-notes, 10 reasoning-based hints, and proactive coaching
          when you stall out. Your stats are saved automatically.
        </p>
      </section>

      <section className="paper" style={{ marginTop: 8 }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 22 }}>Choose your challenge</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Pick a level to generate a fresh, uniquely-solvable puzzle.
        </p>
        <DifficultyPicker onStart={onStart} />
      </section>

      <section className="stats-row" style={{ marginTop: 24 }}>
        <Link to="/history" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="v">{stats.played}</div>
          <div className="k">Games played</div>
        </Link>
        <Link to="/history" className="stat-card green" style={{ textDecoration: 'none' }}>
          <div className="v">{stats.won}</div>
          <div className="k">Wins · {stats.winRate}% rate</div>
        </Link>
        <Link to="/history" className="stat-card" style={{ textDecoration: 'none', borderLeftColor: 'var(--warn)' }}>
          <div className="v" style={{ color: 'var(--warn)' }}>{stats.currentStreak}</div>
          <div className="k">Current streak</div>
        </Link>
        <Link to="/tips" className="stat-card" style={{ textDecoration: 'none', borderLeftColor: 'var(--bad)' }}>
          <div className="v" style={{ color: 'var(--bad)' }}>📖</div>
          <div className="k">Tips &amp; Tricks</div>
        </Link>
      </section>
    </main>
  );
}
