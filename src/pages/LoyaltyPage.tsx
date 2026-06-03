import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Loyalty from '../components/Loyalty';
import Footer from '../components/Footer';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function LoyaltyPage() {
  const steps = useReveal();
  const ctaSection = useReveal();
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('loyalty.title')}</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>
            {t('loyalty.subtitle')}
          </p>
          <div className="page-hero-buttons">
            <Link to="/menu" className="btn btn-primary">{t('nav.menu')}</Link>
            <Link to="/about" className="btn btn-ghost">{t('menu.aboutUs')}</Link>
          </div>
        </div>
      </div>

      <Ticker />
      <Loyalty />

      {/* How It Works */}
      <section className="section-inner">
        <div ref={steps.ref} className={`reveal ${steps.visible ? 'visible' : ''}`}>
          <div className="section-header">
            <h2>{t('loyalty.howItWorks')}</h2>
          </div>
          <div className="loyalty-steps">
            <div className="loyalty-step">
              <div className="loyalty-step-num">1</div>
              <h3>{t('loyalty.howItWorks.signUp')}</h3>
              <p>{t('loyalty.howItWorks.signUpDesc')}</p>
            </div>
            <div className="loyalty-step">
              <div className="loyalty-step-num">2</div>
              <h3>{t('loyalty.howItWorks.earn')}</h3>
              <p>{t('loyalty.howItWorks.earnDesc')}</p>
            </div>
            <div className="loyalty-step">
              <div className="loyalty-step-num">3</div>
              <h3>{t('loyalty.howItWorks.redeem')}</h3>
              <p>{t('loyalty.howItWorks.redeemDesc')}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div ref={ctaSection.ref} className={`reveal ${ctaSection.visible ? 'visible' : ''}`} style={{ textAlign: 'center' }}>
          <p className="section-sub" style={{ marginBottom: 24 }}>
            {t('loyalty.joinCta')}
          </p>
          <Link to="/menu" className="btn btn-primary">{t('hero.order')}</Link>
        </div>
      </section>

      <Footer />
    </>
  );
}
