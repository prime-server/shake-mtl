import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Menu from '../components/Menu';
import Footer from '../components/Footer';
import { useLang } from '../context/LangContext';
import { fetchCatalog, type MenuItem } from '../data/menu';
import type { CartItem } from '../hooks/useCart';

interface MenuPageProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
}

const TOP_SELLERS = [
  'Berry Bliss',
  'AM Power',
  'Operator Brew',
  'Engine Green',
];

export default function MenuPage({ onAddToCart }: MenuPageProps) {
  const { t } = useLang();
  const [topItems, setTopItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchCatalog().then((data) => {
      const sellers = TOP_SELLERS
        .map((name) => data.items.find((i) => i.name.toLowerCase() === name.toLowerCase()))
        .filter((item): item is MenuItem => item != null && Boolean(item.imageUrl));
      setTopItems(sellers);
    });
  }, []);

  const handleAdd = (item: MenuItem) => {
    onAddToCart({
      id: item.id,
      variationId: item.variationId || item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    });
  };

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('home.popular')}</h1>
          <p className="section-sub" style={{ marginBottom: 28 }}>
            {t('menu.subtitle')}
          </p>
          <div className="page-hero-buttons">
            <Link to="/about" className="btn btn-primary">{t('menu.aboutUs')}</Link>
            <Link to="/contact" className="btn btn-ghost">{t('menu.findUs')}</Link>
          </div>
        </div>
      </div>

      {/* Top 4 most sold */}
      {topItems.length > 0 && (
        <section className="menu-top-sellers">
          <div className="menu-top-grid">
            {topItems.map((item) => (
              <div key={item.id} className="menu-top-card">
                <div className="menu-top-img">
                  <img src={item.imageUrl!} alt={item.name} loading="lazy" />
                </div>
                <div className="menu-top-body">
                  <div className="menu-top-info">
                    <h3>{item.name}</h3>
                    <span className="menu-top-price">${item.price.toFixed(2)}</span>
                  </div>
                  {item.description && <p className="menu-top-desc">{item.description}</p>}
                  <button className="adm-pane-card-btn accept" style={{ marginTop: 8 }} onClick={() => handleAdd(item)}>
                    ADD TO ORDER
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <Ticker />
      <Menu onAddToCart={onAddToCart} />
      <Footer />
    </>
  );
}
