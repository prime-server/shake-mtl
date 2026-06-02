import { useState, useEffect } from 'react';
import { fetchCatalog, type MenuItem, type CategoryItem } from '../data/menu';
import { useReveal } from '../hooks/useReveal';

export default function Menu() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const { ref, visible } = useReveal();

  useEffect(() => {
    fetchCatalog().then((data) => {
      setCategories(data.categories);
      setItems(data.items);
      if (data.categories.length > 0) setActiveId(data.categories[0].id);
      setLoading(false);
    });
  }, []);

  const filtered = activeId ? items.filter((i) => i.categoryId === activeId) : items;

  const switchTab = (id: string) => {
    if (id === activeId) return;
    setActiveId(id);
    setAnimKey((k) => k + 1);
  };

  return (
    <section id="menu">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-tag">Menu</span>
            <h2>
              What's <span className="accent">blending.</span>
            </h2>
            <p className="section-sub">
              Every drink made fresh to order. Add protein, creatine, collagen, or
              swap your milk — your call.
            </p>
          </div>

          {loading ? (
            <div className="menu-loading">Loading menu from Square...</div>
          ) : (
            <>
              {categories.length > 0 && (
                <div className="menu-tabs">
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      className={`menu-tab ${activeId === c.id ? 'active' : ''}`}
                      onClick={() => switchTab(c.id)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              )}

              <div className="menu-grid" key={animKey}>
                {filtered.map((item, i) => (
                  <div
                    key={item.id}
                    className="menu-card"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    {item.imageUrl && (
                      <div className="card-img">
                        <img src={item.imageUrl} alt={item.name} loading="lazy" />
                      </div>
                    )}

                    <div className="card-body">
                      <div className="card-top">
                        <div className="card-info">
                          <h3>{item.name}</h3>
                          <p>{item.description}</p>
                        </div>
                        <span className="card-price">${item.price.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 && !loading && (
                <p className="menu-empty">No items in this category yet.</p>
              )}
            </>
          )}

          <div className="menu-footer-box">
            <div className="menu-footer-accent" />
            <p>
              <strong>Modifiers:</strong> Almond milk, oat milk, coconut milk (+$1)
              &nbsp;·&nbsp; Whey or plant protein (+$2) &nbsp;·&nbsp; Creatine,
              collagen (+$2) &nbsp;·&nbsp; Extra fruit, PB, chia, spinach, flax
              (+$1–$1.50) &nbsp;·&nbsp; Size up to 24oz (+$2)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
