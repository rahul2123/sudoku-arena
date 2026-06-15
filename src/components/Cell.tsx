import { memo } from 'react';
import type { Game } from '@/hooks/useGame';
import { rowOf, colOf } from '@/lib/sudoku';

interface CellProps {
  index: number;
  game: Game;
}

function CellBase({ index, game }: CellProps) {
  const {
    grid, notes, selected, conflicts,
    peerCells, sameValueCells, winWaveCells, autoHintCells,
    setSelected, isGiven,
  } = game;

  const value = grid[index];
  const given = isGiven(index);
  const cellNotes = notes[index];
  const isSelected = selected === index;
  const isPeer = peerCells.has(index);
  const isSame = sameValueCells.has(index);
  const isError = conflicts.has(index);
  const isHintTarget = autoHintCells.includes(index);
  const isWinWave = winWaveCells.includes(index);

  const r = rowOf(index), c = colOf(index);
  const boldRight = (c + 1) % 3 === 0 && c !== 8;
  const boldBottom = (r + 1) % 3 === 0 && r !== 8;
  const highlightOn = game.settings.highlightPeers;

  const classes = ['cell'];
  if (given) classes.push('given');
  if (highlightOn && isPeer && !isSelected) classes.push('peer');
  if (highlightOn && isSame && !isSelected) classes.push('same');
  if (isSelected) classes.push('selected');
  if (isError) classes.push('error');
  if (boldRight) classes.push('rb');
  if (boldBottom) classes.push('bb');
  if (isHintTarget) classes.push('hint-target');
  if (isWinWave) classes.push('win-wave');

  const showNotes = !value && cellNotes.length > 0;

  return (
    <div
      className={classes.join(' ')}
      onClick={() => setSelected(index)}
      role="button"
      tabIndex={-1}
    >
      {value !== 0 ? (
        value
      ) : showNotes ? (
        <div className="notes-grid">
          {Array.from({ length: 9 }, (_, k) => k + 1).map((d) => (
            <span key={d} className={selected !== null && grid[selected] === d ? 'match' : ''}>
              {cellNotes.includes(d) ? d : ''}
            </span>
          ))}
        </div>
      ) : (
        ''
      )}
    </div>
  );
}

export const Cell = memo(CellBase);
