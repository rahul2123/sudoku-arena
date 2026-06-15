import { NavLink } from 'react-router-dom';

export function Header() {
  return (
    <header className="topbar">
      <NavLink to="/" className="brand">
        <div className="brand-mark">数</div>
        <div className="brand-name">Sudoku<span>Arena</span></div>
      </NavLink>
      <nav className="nav">
        <NavLink to="/" end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>Play</NavLink>
        <NavLink to="/history" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-full">History</span><span className="nav-short">Stats</span>
        </NavLink>
        <NavLink to="/tips" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
          <span className="nav-full">Tips &amp; Tricks</span><span className="nav-short">Tips</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')} title="Settings">⚙</NavLink>
      </nav>
    </header>
  );
}
