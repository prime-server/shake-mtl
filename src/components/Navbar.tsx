import { useState } from 'react';

const links = [
  { href: '#menu', label: 'Menu' },
  { href: '#loyalty', label: 'Rewards' },
  { href: '#catering', label: 'Catering' },
  { href: '#contact', label: 'Find Us' },
];

export default function Navbar({ scrolled }: { scrolled: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <a href="#" className="nav-logo">
          SHAKE<span className="dot">.</span>
        </a>

        <div className={`nav-links ${open ? 'open' : ''}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#menu" className="nav-cta" onClick={() => setOpen(false)}>
            Order Now
          </a>
        </div>

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
    </nav>
  );
}
