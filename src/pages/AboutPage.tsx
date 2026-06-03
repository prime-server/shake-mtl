import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Footer from '../components/Footer';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function AboutPage() {
  const story = useReveal();
  const values = useReveal();
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('about.title')}</h1>
          <div className="page-hero-buttons">
            <Link to="/menu" className="btn btn-primary">{t('nav.menu')}</Link>
            <Link to="/contact" className="btn btn-ghost">{t('menu.findUs')}</Link>
          </div>
        </div>
      </div>

      <Ticker />

      {/* Brand Story */}
      <section className="section-inner">
        <div ref={story.ref} className={`brand-story reveal ${story.visible ? 'visible' : ''}`}>
          <h2 className="brand-story-name">SHAKE.</h2>
          <p>{t('about.p1')}</p>
          <p>{t('about.p2')}</p>
          <p>{t('about.p3')}</p>

          {/* Values Grid */}
          <div ref={values.ref} className={`values-grid reveal ${values.visible ? 'visible' : ''}`}>
            <div className="value-item">
              <span className="value-check">&#10003;</span>
              <span>{t('about.values.real')}</span>
            </div>
            <div className="value-item">
              <span className="value-check">&#10003;</span>
              <span>{t('about.values.fresh')}</span>
            </div>
            <div className="value-item">
              <span className="value-check">&#10003;</span>
              <span>{t('about.values.protein')}</span>
            </div>
            <div className="value-item">
              <span className="value-check">&#10003;</span>
              <span>{t('about.values.vegan')}</span>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
