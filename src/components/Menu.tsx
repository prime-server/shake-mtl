import { useState, useEffect } from 'react';
import { fetchCatalog, type MenuItem, type CategoryItem, type ModifierList } from '../data/menu';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';
import type { CartItem } from '../hooks/useCart';
import UpsellModal from './UpsellModal';

interface MenuProps {
  onAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
}

// Categories to show in the menu (ordered), hide internal ones
const VISIBLE_CATEGORIES = [
  'Smoothie & Bowls',
  'Post Workout Smoothie',
  'Coffee & Matcha',
  'Snacks',
  'Energy Drinks',
  'Supplements',
  'Merch',
];

// Items to hide (internal/operational)
const HIDDEN_ITEMS = [
  'DELIVERY FEE', 'DELIVERY', 'Service Fee',
  'Extra Vanilla pump', 'Milk extra', 'Protein scoop',
  'Espresso Shot', 'Creatine Scoop', 'Collagene Scoop',
  'PVL Creatine scoop', 'Peanut Butter',
];

// Categories that should show the upsell modal
const UPSELL_CATEGORIES = ['Smoothie & Bowls', 'Post Workout Smoothie'];

export default function Menu({ onAddToCart }: MenuProps) {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [modifierLists, setModifierLists] = useState<ModifierList[]>([]);
  const [addOnItems, setAddOnItems] = useState<MenuItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null);
  const { ref, visible } = useReveal();
  const { t } = useLang();

  useEffect(() => {
    fetchCatalog().then((data) => {
      // Filter and order categories
      const ordered = VISIBLE_CATEGORIES
        .map((name) => data.categories.find((c) => c.name === name))
        .filter(Boolean) as CategoryItem[];

      // Filter out hidden/internal items
      const clean = data.items.filter(
        (i) => !HIDDEN_ITEMS.some((h) => i.name.toLowerCase() === h.toLowerCase())
      );

      setCategories(ordered);
      setItems(clean);
      setModifierLists(data.modifierLists || []);
      setAddOnItems(data.addOns || []);
      if (ordered.length > 0) setActiveId(ordered[0].id);
      setLoading(false);
    });
  }, []);

  const filtered = showAll
    ? items
    : activeId
      ? items.filter((i) => i.categoryId === activeId)
      : items;

  const switchTab = (id: string | null) => {
    if (id === activeId && !showAll) return;
    setShowAll(id === null);
    setActiveId(id);
    setAnimKey((k) => k + 1);
  };

  const handleAdd = (item: MenuItem) => {
    // Check if this item's category qualifies for upsell
    const cat = categories.find(c => c.id === item.categoryId);
    const hasUpsell = cat && UPSELL_CATEGORIES.includes(cat.name);
    const hasModifiers = (item.modifierListIds || []).length > 0;
    const hasAddOns = addOnItems.length > 0;

    if (hasUpsell && (hasModifiers || hasAddOns)) {
      setUpsellItem(item);
      return;
    }

    // Direct add (no upsell)
    onAddToCart({
      id: item.id,
      cartKey: '',
      variationId: item.variationId || item.id,
      name: item.name,
      price: item.price,
      basePrice: item.price,
      imageUrl: item.imageUrl,
    });
    setAddedId(item.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  const handleUpsellConfirm = (cartItem: Omit<CartItem, 'quantity'>) => {
    onAddToCart(cartItem);
    setAddedId(upsellItem?.id || null);
    setUpsellItem(null);
    setTimeout(() => setAddedId(null), 1200);
  };

  return (
    <section id="menu">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <h2>{t('menu.heading')}</h2>
            <p className="section-sub">
              {t('menu.headingSub')}
            </p>
          </div>

          {loading ? (
            <div className="menu-loading">{t('menu.loading')}</div>
          ) : (
            <>
              <div className="modifiers-bar">
                <span className="modifiers-label">{t('menu.customize')}</span>
                <div className="modifiers-pills">
                  <span className="mod-pill">&#x1F95B; {t('mod.almondMilk')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1F95B; {t('mod.oatMilk')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1F965; {t('mod.coconutMilk')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1F4AA; {t('mod.wheyProtein')} <em>+$2</em></span>
                  <span className="mod-pill">&#x1F331; {t('mod.plantProtein')} <em>+$2</em></span>
                  <span className="mod-pill">&#x26A1; {t('mod.creatine')} <em>+$2</em></span>
                  <span className="mod-pill">&#x2728; {t('mod.collagen')} <em>+$2</em></span>
                  <span className="mod-pill">&#x1F353; {t('mod.extraFruit')} <em>+$1.50</em></span>
                  <span className="mod-pill">&#x1F95C; {t('mod.peanutButter')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1FAD8; {t('mod.chiaSeeds')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1F96C; {t('mod.spinach')} <em>+$1</em></span>
                  <span className="mod-pill">&#x1F4CF; {t('mod.sizeUp')} <em>+$2</em></span>
                </div>
              </div>

              <div className="menu-tabs">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    className={`menu-tab ${activeId === c.id && !showAll ? 'active' : ''}`}
                    onClick={() => switchTab(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
                <button
                  className={`menu-tab ${showAll ? 'active' : ''}`}
                  onClick={() => switchTab(null)}
                >
                  {t('menu.all')}
                </button>
              </div>

              <div className="menu-grid" key={animKey}>
                {filtered.map((item, i) => (
                  <div
                    key={item.id}
                    className="menu-card"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <div className="card-img">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      ) : (
                        <div className="card-img-placeholder">
                          <span>SHAKE.</span>
                        </div>
                      )}
                    </div>

                    <div className="card-body">
                      <div className="card-top">
                        <div className="card-info">
                          <h3>{item.name}</h3>
                          {item.description && <p>{item.description}</p>}
                        </div>
                        <span className="card-price">${item.price.toFixed(2)}</span>
                      </div>

                      <button
                        className={`add-to-cart-btn ${addedId === item.id ? 'added' : ''}`}
                        onClick={() => handleAdd(item)}
                      >
                        {addedId === item.id ? t('menu.added') : t('menu.addToOrder')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && !loading && (
                <p className="menu-empty">{t('menu.empty')}</p>
              )}
            </>
          )}

        </div>
      </div>

      {upsellItem && (
        <UpsellModal
          item={upsellItem}
          modifierLists={modifierLists}
          addOns={addOnItems}
          onConfirm={handleUpsellConfirm}
          onClose={() => setUpsellItem(null)}
        />
      )}
    </section>
  );
}
