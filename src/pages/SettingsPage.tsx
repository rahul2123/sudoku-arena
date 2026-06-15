import type { Settings } from '@/types';
import { Link } from 'react-router-dom';

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
}

export function SettingsPage({ settings, onChange }: Props) {
  const set = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  return (
    <main className="page">
      <h2 className="section-title">Settings</h2>
      <p className="section-sub">Tune the experience to match how you like to play.</p>

      <section className="paper" style={{ maxWidth: 640 }}>
        <div className="setting-row">
          <div className="meta">
            <div className="t">Idle coaching</div>
            <div className="d">Show a free hint automatically after you've been idle. (0 = off)</div>
          </div>
          <div className="stepper">
            <button onClick={() => set({ idleHintSeconds: Math.max(0, settings.idleHintSeconds - 1) })}>−</button>
            <span className="val">{settings.idleHintSeconds === 0 ? 'Off' : `${settings.idleHintSeconds}s`}</span>
            <button onClick={() => set({ idleHintSeconds: Math.min(120, settings.idleHintSeconds + 1) })}>+</button>
          </div>
        </div>

        <div className="setting-row">
          <div className="meta">
            <div className="t">Auto-validate entries</div>
            <div className="d">Flag wrong numbers in red and count mistakes.</div>
          </div>
          <button className={`toggle ${settings.autoValidate ? 'on' : ''}`} onClick={() => set({ autoValidate: !settings.autoValidate })} aria-label="toggle auto validate">
            <span className="knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="meta">
            <div className="t">Highlight related cells</div>
            <div className="d">Tint the row, column, box, and matching numbers of the selected cell.</div>
          </div>
          <button className={`toggle ${settings.highlightPeers ? 'on' : ''}`} onClick={() => set({ highlightPeers: !settings.highlightPeers })} aria-label="toggle highlight">
            <span className="knob" />
          </button>
        </div>

        <div className="setting-row">
          <div className="meta">
            <div className="t">Auto-clean notes</div>
            <div className="d">Remove pencil marks from neighbors when you place a number.</div>
          </div>
          <button className={`toggle ${settings.notesAutoClean ? 'on' : ''}`} onClick={() => set({ notesAutoClean: !settings.notesAutoClean })} aria-label="toggle auto clean notes">
            <span className="knob" />
          </button>
        </div>
      </section>

      <section className="paper" style={{ maxWidth: 640, marginTop: 20, borderLeftColor: 'var(--good)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontWeight: 800, fontSize: 18 }}>⌨️ Keyboard shortcuts</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 24px', marginTop: 10, color: 'var(--ink-soft)', fontSize: 14 }}>
          <div><strong>1–9</strong> — enter number</div>
          <div><strong>N</strong> — toggle notes mode</div>
          <div><strong>H</strong> — request hint</div>
          <div><strong>Backspace</strong> — erase</div>
          <div><strong>Arrow keys</strong> — move selection</div>
          <div><strong>Ctrl/Cmd+Z</strong> — undo</div>
        </div>
      </section>

      <div style={{ marginTop: 20 }}>
        <Link to="/" className="btn btn-primary">← Back to play</Link>
      </div>
    </main>
  );
}
