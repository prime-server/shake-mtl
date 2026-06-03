import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Catering from '../components/Catering';
import Footer from '../components/Footer';
import { useLang } from '../context/LangContext';

export default function CateringPage() {
  const { t } = useLang();

  return (
    <>
      <div className="page-hero" style={{ minHeight: '35vh', paddingBottom: 48 }}>
        <div className="page-hero-content">
          <h1 style={{ whiteSpace: 'pre-line' }}>{t('catering.title')}</h1>
          <p className="section-sub" style={{ marginBottom: 20 }}>{t('catering.introText')}</p>
          <div className="page-hero-buttons">
            <a href="#catering-form" className="btn btn-primary">{t('catering.send')}</a>
            <Link to="/menu" className="btn btn-ghost">{t('nav.menu')}</Link>
          </div>
        </div>
      </div>

      {/* Stats bar right under hero */}
      <div className="catering-stats-bar">
        <div className="catering-stat">
          <span className="catering-stat-num">50+</span>
          <span className="catering-stat-label">{t('catering.events')}</span>
        </div>
        <div className="catering-stat">
          <span className="catering-stat-num">1000+</span>
          <span className="catering-stat-label">{t('catering.drinks')}</span>
        </div>
        <div className="catering-stat">
          <span className="catering-stat-num">100%</span>
          <span className="catering-stat-label">{t('catering.fresh')}</span>
        </div>
      </div>

      <Ticker />

      {/* Form is the main content — immediately visible */}
      <div id="catering-form">
        <Catering />
      </div>

      <Footer />
    </>
  );
}
