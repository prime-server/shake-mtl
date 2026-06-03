import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Menu from '../components/Menu';
import Footer from '../components/Footer';
import { useLang } from '../context/LangContext';
import type { CartItem } from '../hooks/useCart';

interface MenuPageProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
}

export default function MenuPage({ onAddToCart }: MenuPageProps) {
  const { t } = useLang();

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('menu.title')}</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>
            {t('menu.subtitle')}
          </p>
          <div className="page-hero-buttons">
            <Link to="/about" className="btn btn-primary">{t('menu.aboutUs')}</Link>
            <Link to="/contact" className="btn btn-ghost">{t('menu.findUs')}</Link>
          </div>
        </div>
      </div>

      <Ticker />
      <Menu onAddToCart={onAddToCart} />
      <Footer />
    </>
  );
}
