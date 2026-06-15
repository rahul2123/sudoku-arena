import { Link } from 'react-router-dom';

interface Tip {
  name: string;
  level: 'easy' | 'med' | 'hard';
  summary: string;
  detail: string;
  example: string;
}

const TIPS: Tip[] = [
  {
    name: '1. Scan rows, columns & boxes',
    level: 'easy',
    summary: 'The golden rule: every row, column, and 3×3 box must contain 1–9 exactly once.',
    detail: 'Before placing anything, mentally cross off digits already present in the row, column, and box of an empty cell. The cell can only hold digits NOT yet seen in those three groups. This "cross-hatching" finds most easy placements.',
    example: 'If a row already shows 1,2,4,7,9 and its box shows 3,5,6, then the empty cells in that row/box overlap can only be 8.',
  },
  {
    name: '2. Cross-hatching',
    level: 'easy',
    summary: 'Pick a digit, then scan each box for the only legal cell.',
    detail: 'Choose one digit (say, 5). Look at a 3×3 box: the 5s in crossing rows and columns "block" certain cells. If only one cell in the box is left unblocked, the 5 goes there. Repeat digit by digit, box by box.',
    example: 'In box 1, rows 1 & 2 already contain a 5 elsewhere, and column 2 contains a 5 → only R3C3 can hold the 5 for that box.',
  },
  {
    name: '3. Naked Single (sole candidate)',
    level: 'easy',
    summary: 'A cell with just one possible digit must take it.',
    detail: 'When all but one digit are eliminated from a cell (by its row, column, and box), that remaining digit is the only choice. Use pencil notes to track candidates — a single number in a note means place it.',
    example: 'A cell\'s notes show only {7} → write 7 immediately.',
  },
  {
    name: '4. Hidden Single (only home)',
    level: 'easy',
    summary: 'A digit that fits in only one cell within a unit goes there.',
    detail: 'Even if a cell has several candidates, focus on a single digit across a whole row/column/box. If that digit can only legally go in one cell of the unit, place it — regardless of how many other candidates that cell has.',
    example: 'In a row, the digit 4 can only go in one empty cell (others are blocked) → that cell is 4.',
  },
  {
    name: '5. Use pencil notes for candidates',
    level: 'easy',
    summary: 'Track 2–3 candidates per cell to see patterns emerge.',
    detail: 'Mark every possible digit for empty cells. As you place numbers, clean up notes in the affected row/column/box. Patterns like pairs and triples become visible only when notes are complete and tidy.',
    example: 'Two cells in a box both showing {2,8} and nothing else — a naked pair — means 2 and 8 are locked there.',
  },
  {
    name: '6. Naked Pairs & Triples',
    level: 'med',
    summary: 'N cells holding only N candidates lock those digits in.',
    detail: 'If two cells in a unit share exactly the same two candidates, those two digits are used up between them — erase them from every other cell in the unit. The same logic extends to three cells sharing three candidates (naked triple).',
    example: 'R2C1 and R2C5 both have only {3,6}. So no other cell in row 2 can be 3 or 6.',
  },
  {
    name: '7. Hidden Pairs',
    level: 'med',
    summary: 'Two digits confined to the same two cells clear other notes.',
    detail: 'If two digits can only appear in the same two cells of a unit, those cells are reserved for just those digits — even if they currently show extra candidates. Remove the extra candidates.',
    example: 'In a box, digits 4 and 9 only ever appear in R1C2 and R3C3 → erase any other candidates in those two cells.',
  },
  {
    name: '8. Pointing Pairs',
    level: 'med',
    summary: 'A box candidate confined to one line removes it from the rest of the line.',
    detail: 'When all candidates for a digit inside a 3×3 box lie on a single row (or column), that digit must be in the box AND on that line. Therefore you can remove it from the other cells of that row/column outside the box.',
    example: 'In box 3, all candidate 7s sit in row 1 → erase 7 from the rest of row 1.',
  },
  {
    name: '9. Box/Line Reduction (Claiming)',
    level: 'med',
    summary: 'A line candidate locked inside one box removes it elsewhere in the box.',
    detail: 'The mirror of pointing pairs: if all candidates for a digit on a row/column lie within a single box, that digit is locked into that box for the line. Remove it from the other cells of the box.',
    example: 'On column 4, all candidate 2s are inside box 5 → erase 2 from the rest of box 5.',
  },
  {
    name: '10. X-Wing',
    level: 'hard',
    summary: 'A rectangle of candidates removes them from two whole lines.',
    detail: 'If a digit has exactly two candidate spots in two different rows, and those spots share the same two columns, you have an X-Wing (a rectangle). The digit must occupy two opposite corners — so remove it from every other cell in those two columns.',
    example: 'Digit 5 appears in only R1C2/R1C6 and R6C2/R6C6 → erase 5 from columns 2 and 6 elsewhere.',
  },
];

const META: Record<Tip['level'], { label: string; cls: string }> = {
  easy: { label: 'Beginner', cls: 'easy' },
  med: { label: 'Intermediate', cls: 'med' },
  hard: { label: 'Advanced', cls: 'hard' },
};

export function TipsPage() {
  return (
    <main className="page">
      <h2 className="section-title">Tips &amp; Tricks</h2>
      <p className="section-sub">
        Master Sudoku from scanning basics to advanced patterns. Work top to bottom — each
        technique builds on the last.
      </p>

      <section className="paper" style={{ marginBottom: 20, borderLeftColor: 'var(--accent)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 20 }}>🧭 The solving order</h3>
        <p style={{ marginTop: 8, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          Always go from easy to hard. First fill every <strong>Naked/Hidden Single</strong> you can find,
          then re-scan. Only when no singles remain, move to <strong>pairs/triples</strong> and
          finally <strong>X-Wing</strong>. After every placement, re-check the affected row, column,
          and box for new singles. Patience beats guessing — a valid Sudoku never requires trial-and-error.
        </p>
      </section>

      <section className="tip-grid">
        {TIPS.map((t) => (
          <div className="tip-card" key={t.name}>
            <h3>
              {t.name}
              <span className={`lvl ${META[t.level].cls}`}>{META[t.level].label}</span>
            </h3>
            <p><strong>{t.summary}</strong></p>
            <p>{t.detail}</p>
            <div className="ex">💡 {t.example}</div>
          </div>
        ))}
      </section>

      <section className="paper" style={{ marginTop: 24, borderLeftColor: 'var(--good)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 20 }}>✨ Habits of great solvers</h3>
        <ul style={{ marginTop: 10, paddingLeft: 20, color: 'var(--ink-soft)', lineHeight: 1.8 }}>
          <li>Keep notes tidy — erase candidates as soon as a digit is placed.</li>
          <li>Double-check by row, then by column, then by box — rotating focus spots errors.</li>
          <li>If stuck, re-scan for hidden singles on the digit you placed least recently.</li>
          <li>Never guess. Every number should have a logical reason.</li>
          <li>Practice easier levels to build pattern recognition before tackling Expert.</li>
        </ul>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>Put it into practice →</Link>
      </section>
    </main>
  );
}
