import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Hero from '../components/Hero';
import Ticker from '../components/Ticker';
import Social from '../components/Social';
import Footer from '../components/Footer';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';
import { fetchCatalog, type MenuItem } from '../data/menu';

// Top sellers — show these on the homepage (match by name)
const TOP_SELLER_NAMES = [
  'Berry Bliss',
  'AM Power',
  'Operator Brew',
  'Engine Green',
  'Fuel Ros\u00E9e',
  'Don\'t be Jelly',
  'Muscle Roll',
  'Golden Citrus',
];

export default function HomePage() {
  const showcase = useReveal();
  const stats = useReveal();
  const cta = useReveal();
  const { t } = useLang();
  const [topSellers, setTopSellers] = useState<MenuItem[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    fetchCatalog().then((data) => {
      setProductCount(data.items.length);
      const sellers = TOP_SELLER_NAMES
        .map((name) => data.items.find((i) => i.name.toLowerCase() === name.toLowerCase()))
        .filter((item): item is MenuItem => item != null);
      setTopSellers(sellers);
    });
  }, []);

  return (
    <>
      <Hero />
      <Ticker categoryFilter={['smoothie', 'bowl', 'workout']} speed={35} />

      {/* Top Sellers */}
      <section className="product-showcase">
        <div className="section-inner" ref={showcase.ref}>
          <div className={`reveal ${showcase.visible ? 'visible' : ''}`}>
            <div className="section-header">
              <span className="section-tag">{t('home.popular')}</span>
              <h2>{t('home.whatWeServe')}</h2>
              <p className="section-sub">{t('home.whatWeServeSub')}</p>
            </div>

            {topSellers.length > 0 ? (
              <div className="top-sellers-grid">
                {topSellers.map((item, i) => (
                  <Link
                    to="/menu"
                    key={item.id}
                    className="top-seller-card"
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    <div className="top-seller-img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="card-img-placeholder"><span>SHAKE.</span></div>
                      )}
                    </div>
                    <div className="top-seller-info">
                      <h3>{item.name}</h3>
                      {item.description && <p>{item.description}</p>}
                      <span className="top-seller-price">${item.price.toFixed(2)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="menu-loading">LOADING...</div>
            )}

            <div className="showcase-cta">
              <Link to="/menu" className="btn btn-primary">{t('home.viewMenu')}</Link>
            </div>
          </div>
        </div>
      </section>

      <Ticker categoryFilter={['coffee', 'matcha', 'energy', 'snack']} speed={45} />

      <Social />

      {/* Stats Bar */}
      <div ref={stats.ref} className={`stats-bar reveal ${stats.visible ? 'visible' : ''}`}>
        <div className="stat-block">
          <span className="stat-block-num">{productCount || '...'}</span>
          <span className="stat-block-label">{t('home.products')}</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-num">10 MIN</span>
          <span className="stat-block-label">{t('home.pickup')}</span>
        </div>
        <div className="stat-block">
          <span className="stat-block-num">32G</span>
          <span className="stat-block-label">{t('home.maxProtein')}</span>
        </div>
      </div>

      {/* CTA Banner */}
      <div ref={cta.ref} className={`cta-banner reveal ${cta.visible ? 'visible' : ''}`}>
        <h2>{t('home.ctaTitle')}</h2>
        <Link to="/menu" className="btn btn-primary">{t('home.ctaBtn')}</Link>
      </div>

      <Footer />
    </>
  );
}
