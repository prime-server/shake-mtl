import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';

const linkKeys: { to: string; key: string }[] = [
  { to: '/menu', key: 'nav.menu' },
  { to: '/about', key: 'nav.about' },
  { to: '/contact', key: 'nav.location' },
  { to: '/catering', key: 'nav.catering' },
];

interface NavbarProps {
  scrolled: boolean;
  cartCount: number;
  onCartOpen: () => void;
}

export default function Navbar({ scrolled, cartCount, onCartOpen }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { lang, toggleLang, t } = useLang();

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          SHAKE<span className="dot">.</span>
        </Link>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {linkKeys.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)}>
              {t(l.key)}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <button className="lang-toggle" onClick={toggleLang}>
            {lang === 'en' ? 'FR' : 'EN'}
          </button>

          <Link to="/account" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40 }} aria-label="My account">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {user && <span className="nav-account-dot" />}
          </Link>

          <button className="cart-btn" onClick={onCartOpen} aria-label="Open cart">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartCount > 0 && <span className="cart-badge-count">{cartCount}</span>}
          </button>

          <button
            className={`hamburger ${open ? 'active' : ''}`}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>
    </nav>
  );
}
