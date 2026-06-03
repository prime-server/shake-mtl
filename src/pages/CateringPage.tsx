import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Catering from '../components/Catering';
import Footer from '../components/Footer';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function CateringPage() {
  const intro = useReveal();
  const statsSection = useReveal();
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1 style={{ whiteSpace: 'pre-line' }}>{t('catering.title')}</h1>
          <div className="page-hero-buttons">
            <Link to="/contact" className="btn btn-primary">{t('catering.findUs')}</Link>
            <Link to="/menu" className="btn btn-ghost">{t('nav.menu')}</Link>
          </div>
        </div>
      </div>

      <Ticker />

      {/* Intro */}
      <section className="section-inner">
        <div ref={intro.ref} className={`catering-intro reveal ${intro.visible ? 'visible' : ''}`}>
          <h2>{t('catering.introHeading')}</h2>
          <p>{t('catering.introText')}</p>
        </div>

        {/* Stats */}
        <div ref={statsSection.ref} className={`catering-stats reveal ${statsSection.visible ? 'visible' : ''}`}>
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
      </section>

      <Catering />
      <Footer />
    </>
  );
}
