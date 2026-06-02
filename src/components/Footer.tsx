export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">SHAKE<span className="dot">.</span></span>
          <p>Fresh fuel for your grind.</p>
        </div>
        <div className="footer-links">
          <a href="#menu">Menu</a>
          <a href="#loyalty">Rewards</a>
          <a href="#catering">Catering</a>
          <a href="#contact">Location</a>
          <a href="https://instagram.com/shakemtl" target="_blank" rel="noopener">Instagram</a>
        </div>
        <div className="footer-copy">
          <p>&copy; {new Date().getFullYear()} SHAKE. All rights reserved.</p>
          <p>Inside Gold's Gym Ville Saint-Laurent, Montréal</p>
        </div>
      </div>
    </footer>
  );
}
