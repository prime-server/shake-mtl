import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Ticker from '../components/Ticker';
import Menu from '../components/Menu';
import Footer from '../components/Footer';
import UpsellModal from '../components/UpsellModal';
import { useLang } from '../context/LangContext';
import { fetchCatalog, type MenuItem, type ModifierList, type CategoryItem } from '../data/menu';
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

const UPSELL_CATEGORIES = ['Smoothie & Bowls', 'Post Workout Smoothie'];

export default function MenuPage({ onAddToCart }: MenuPageProps) {
  const { t } = useLang();
  const [topItems, setTopItems] = useState<MenuItem[]>([]);
  const [modifierLists, setModifierLists] = useState<ModifierList[]>([]);
  const [addOnItems, setAddOnItems] = useState<MenuItem[]>([]);
  const [allCategories, setAllCategories] = useState<CategoryItem[]>([]);
  const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchCatalog().then((data) => {
      const sellers = TOP_SELLERS
        .map((name) => data.items.find((i) => i.name.toLowerCase() === name.toLowerCase()))
        .filter((item): item is MenuItem => item != null && Boolean(item.imageUrl));
      setTopItems(sellers);
      setModifierLists(data.modifierLists || []);
      setAddOnItems(data.addOns || []);
      setAllCategories(data.categories || []);
    });
  }, []);

  const handleAdd = (item: MenuItem) => {
    const cat = allCategories.find(c => c.id === item.categoryId);
    const hasUpsell = cat && UPSELL_CATEGORIES.includes(cat.name);
    const hasModifiers = (item.modifierListIds || []).length > 0;
    const hasAddOns = addOnItems.length > 0;

    if (hasUpsell && (hasModifiers || hasAddOns)) {
      setUpsellItem(item);
      return;
    }

    onAddToCart({
      id: item.id,
      cartKey: '',
      variationId: item.variationId || item.id,
      name: item.name,
      price: item.price,
      basePrice: item.price,
      imageUrl: item.imageUrl,
    });
  };

  const handleUpsellConfirm = (cartItem: Omit<CartItem, 'quantity'>) => {
    onAddToCart(cartItem);
    setUpsellItem(null);
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

      {upsellItem && (
        <UpsellModal
          item={upsellItem}
          modifierLists={modifierLists}
          addOns={addOnItems}
          onConfirm={handleUpsellConfirm}
          onClose={() => setUpsellItem(null)}
        />
      )}
    </>
  );
}
