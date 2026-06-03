import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

export default function Hero() {
  const { t } = useLang();

  return (
    <section id="hero">
      <div className="hero-bg">
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          {t('hero.title')}
        </h1>

        <p className="hero-sub">
          {t('hero.sub')}
        </p>

        <div className="hero-actions">
          <Link to="/menu" className="btn btn-primary">{t('hero.order')}</Link>
          <Link to="/contact" className="btn btn-ghost">{t('hero.find')}</Link>
        </div>
      </div>

      <div className="scroll-indicator">
        <div className="scroll-line" />
      </div>
    </section>
  );
}
