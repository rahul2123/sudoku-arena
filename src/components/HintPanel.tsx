import type { Game } from '@/hooks/useGame';

export function HintPanel({ game }: { game: Game }) {
  const { hint, applyHint, requestHint } = game;
  if (!hint) {
    return (
      <div className="paper hint-panel" style={{ borderLeftColor: 'var(--accent)' }}>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: 0 }}>
          Stuck? Tap <strong>Hint</strong> for a logical nudge — each explains the <em>why</em>, not just the answer. You get {10} per game.
        </p>
        <div className="hint-actions">
          <button className="btn btn-primary" onClick={requestHint}>💡 Give me a hint</button>
        </div>
      </div>
    );
  }
  const canApply = hint.value !== undefined;
  return (
    <div className="hint-card">
      <span className="strategy">{hint.strategy}</span>
      <h4>{hint.title}</h4>
      <p>{hint.reasoning}</p>
      <div className="hint-actions">
        {canApply ? (
          <button className="btn btn-primary" onClick={applyHint}>
            Apply {hint.value !== undefined ? `(${hint.value})` : ''}
          </button>
        ) : (
          <button className="btn btn-primary" onClick={requestHint}>Find a placeable hint</button>
        )}
        <button className="btn btn-ghost" onClick={game.dismissHint}>Dismiss</button>
      </div>
    </div>
  );
}
