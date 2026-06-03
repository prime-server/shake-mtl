import { Link } from 'react-router-dom';
import Ticker from './Ticker';
import { useLang } from '../context/LangContext';

export default function Footer() {
  const { t } = useLang();

  return (
    <footer className="footer">
      <Ticker className="footer-ticker" />

      <div className="footer-inner">
        <div className="footer-col footer-brand">
          <span className="footer-logo">SHAKE<span className="dot">.</span></span>
          <p>{t('footer.tagline')}</p>
        </div>

        <div className="footer-col footer-nav">
          <div className="footer-links">
            <Link to="/menu">{t('nav.menu')}</Link>
            <Link to="/about">{t('nav.about')}</Link>
            <Link to="/loyalty">{t('loyalty.title')}</Link>
            <Link to="/catering">{t('nav.catering')}</Link>
            <Link to="/contact">{t('nav.location')}</Link>
            <Link to="/account">{t('footer.myAccount')}</Link>
          </div>
        </div>

        <div className="footer-col footer-social">
          <a href="https://instagram.com/shakemtl" target="_blank" rel="noopener noreferrer">
            @SHAKEMTL
          </a>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; 2026 SHAKE.</p>
        <p>{t('footer.tagline')}</p>
      </div>
    </footer>
  );
}
