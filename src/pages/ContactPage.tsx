import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Contact from '../components/Contact';
import Footer from '../components/Footer';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function ContactPage() {
  const map = useReveal();
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('contact.title')}</h1>
          <div className="page-hero-buttons">
            <Link to="/menu" className="btn btn-primary">{t('nav.menu')}</Link>
            <Link to="/catering" className="btn btn-ghost">{t('nav.catering')}</Link>
          </div>
        </div>
      </div>

      <Ticker />

      {/* Google Maps — between hero and contact cards */}
      <div ref={map.ref} className={`map-embed reveal ${map.visible ? 'visible' : ''}`}>
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2793.5!2d-73.6825!3d45.5075!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4cc923e8f0b669cd%3A0x5c49d25ff63bccd3!2sGold's%20Gym%20VSL!5e0!3m2!1sen!2sca!4v1"
          width="100%"
          height="450"
          style={{ border: 0, borderRadius: 20 }}
          allowFullScreen
          loading="lazy"
          title="SHAKE. at Gold's Gym Ville Saint-Laurent"
        />
      </div>

      <Contact />
      <Footer />
    </>
  );
}
