import { useMemo, useState } from 'react';
import { loadHistory, computeStats, clearHistory } from '@/lib/storage';
import { formatTime, DIFFICULTY_LABELS } from '@/lib/sudoku';
import type { Difficulty } from '@/types';
import { Link } from 'react-router-dom';

export function HistoryPage() {
  const [tick, setTick] = useState(0);
  const entries = useMemo(() => loadHistory(), [tick]);
  const stats = useMemo(() => computeStats(entries), [entries]);

  const reset = () => { clearHistory(); setTick((n) => n + 1); };

  if (entries.length === 0) {
    return (
      <main className="page">
        <h2 className="section-title">History &amp; Stats</h2>
        <p className="section-sub">Track your progress and personal bests over time.</p>
        <div className="paper empty">
          <div className="big">🗂️</div>
          <p>No games yet. Solve your first puzzle to start building history.</p>
          <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Play now</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="section-title">History &amp; Stats</h2>
          <p className="section-sub" style={{ marginBottom: 0 }}>Track your progress and personal bests over time.</p>
        </div>
        <button className="btn btn-ghost" onClick={reset}>🗑 Clear history</button>
      </div>

      <section className="stats-row">
        <div className="stat-card"><div className="v">{stats.played}</div><div className="k">Played</div></div>
        <div className="stat-card green"><div className="v">{stats.won}</div><div className="k">Won · {stats.winRate}%</div></div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warn)' }}><div className="v" style={{ color: 'var(--warn)' }}>{stats.currentStreak}</div><div className="k">Current streak</div></div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--bad)' }}><div className="v" style={{ color: 'var(--bad)' }}>{stats.bestStreak}</div><div className="k">Best streak</div></div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--accent)' }}><div className="v">{stats.totalHints}</div><div className="k">Hints used</div></div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--bad)' }}><div className="v">{stats.totalMistakes}</div><div className="k">Mistakes</div></div>
      </section>

      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Personal bests</h3>
        <div className="stats-row" style={{ marginBottom: 28 }}>
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => {
            const best = stats.bestTimeByDiff[d];
            const avg = stats.avgTimeByDiff[d];
            return (
              <div className="stat-card" key={d}>
                <div className="k" style={{ marginBottom: 4 }}>{DIFFICULTY_LABELS[d]}</div>
                <div className="v" style={{ fontSize: 20 }}>{best !== undefined ? formatTime(best) : '—'}</div>
                <div className="k" style={{ marginTop: 4 }}>avg {avg !== undefined ? formatTime(avg) : '—'}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 20, marginBottom: 12 }}>Recent games</h3>
        <div className="history-list">
          {entries.slice(0, 50).map((e) => (
            <div className="history-row" key={e.id}>
              <div className={`res ${e.result}`}>{e.result === 'won' ? '🏆 Won' : 'Abandoned'}</div>
              <div className="diff">{DIFFICULTY_LABELS[e.difficulty]} {e.mistakes > 0 && <span style={{ color: 'var(--bad)', fontWeight: 600 }}>· {e.mistakes}✗</span>}</div>
              <div className="t">⏱ {formatTime(e.timeSeconds)}</div>
              <div className="t" style={{ color: 'var(--warn)' }}>💡 {e.hintsUsed}</div>
              <div className="dt">{new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} {new Date(e.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
