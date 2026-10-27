import { Link, NavLink } from 'react-router-dom';
import { CATEGORIES } from '../registry/categories';
import EnvBadge from './EnvBadge';

export default function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="logo" aria-label="FT_Acade ホーム">
          <span className="logo__mark" aria-hidden="true">▶</span>
          <span className="logo__text">FT_Acade</span>
        </Link>
        <nav className="nav" aria-label="メインメニュー">
          <NavLink to="/" end className="nav__link">ホーム</NavLink>
          {CATEGORIES.map((c) => (
            <NavLink key={c.id} to={c.path} className={`nav__link nav__link--${c.id}`}>
              <span aria-hidden="true">{c.emoji}</span> {c.label}
            </NavLink>
          ))}
          <NavLink to="/about" className="nav__link">About</NavLink>
          <NavLink to="/git" className="nav__link nav__link--git" title="ローカル専用の Git ビジュアライザー">
            <span aria-hidden="true">🌿</span> Git<span className="nav__tag">ローカル</span>
          </NavLink>
        </nav>
        <EnvBadge />
      </div>
    </header>
  );
}
