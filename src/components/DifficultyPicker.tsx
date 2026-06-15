import type { Difficulty } from '@/types';
import { DIFFICULTY_LABELS, DIFFICULTY_CLUES, DIFFICULTY_ORDER } from '@/lib/sudoku';
import { computeStats, loadHistory } from '@/lib/storage';
import { formatTime } from '@/lib/sudoku';

const META: Record<Difficulty, { stars: string; desc: string }> = {
  beginner: { stars: '★', desc: 'Plenty of clues. Perfect for learning the ropes.' },
  easy: { stars: '★★', desc: 'Relaxed solving with generous starting numbers.' },
  medium: { stars: '★★★', desc: 'A balanced challenge for regular players.' },
  hard: { stars: '★★★★', desc: 'Fewer clues — notes & logic required.' },
  expert: { stars: '★★★★★', desc: 'Minimal clues. For seasoned solvers only.' },
};

export function DifficultyPicker({ onStart }: { onStart: (d: Difficulty) => void }) {
  const stats = computeStats(loadHistory());

  return (
    <div className="diff-grid">
      {DIFFICULTY_ORDER.map((d) => {
        const best = stats.bestTimeByDiff[d];
        return (
          <button key={d} className="diff-card" onClick={() => onStart(d)}>
            <div className="diff-stars">{META[d].stars}</div>
            <div className="diff-name">{DIFFICULTY_LABELS[d]}</div>
            <div className="diff-desc">{META[d].desc}</div>
            <div className="diff-meta">
              {DIFFICULTY_CLUES[d]} clues{best !== undefined ? ` · best ${formatTime(best)}` : ''}
            </div>
          </button>
        );
      })}
    </div>
  );
}
