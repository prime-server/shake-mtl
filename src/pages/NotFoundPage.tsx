import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import { useLang } from '../context/LangContext';

export default function NotFoundPage() {
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('notFound.title')}</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>
            {t('notFound.sub')}
          </p>
          <div className="page-hero-buttons">
            <Link to="/" className="btn btn-primary">{t('notFound.home')}</Link>
            <Link to="/menu" className="btn btn-ghost">{t('nav.menu')}</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
