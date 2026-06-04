import { useState, useEffect } from 'react';
import { fetchCatalog, type MenuItem } from '../data/menu';

interface TickerProps {
  className?: string;
  speed?: number;
  categoryFilter?: string[];
}

export default function Ticker({ className = '', speed = 40, categoryFilter }: TickerProps) {
  const [products, setProducts] = useState<MenuItem[]>([]);

  useEffect(() => {
    fetchCatalog().then((data) => {
      let items = data.items.filter((i) => i.imageUrl);
      if (categoryFilter && categoryFilter.length > 0) {
        const catIds = data.categories
          .filter((c) => categoryFilter.some((f) => c.name.toLowerCase().includes(f.toLowerCase())))
          .map((c) => c.id);
        items = items.filter((i) => i.categoryId && catIds.includes(i.categoryId));
      }
      setProducts(items.slice(0, 20));
    });
  }, [categoryFilter]);

  if (products.length === 0) {
    return (
      <div className={`ticker ${className}`}>
        <div className="ticker-track" style={{ animationDuration: `${speed}s` }}>
          <span className="ticker-text">SMOOTHIES 🥤 MATCHA 🍵 COFFEE ☕ COLD-PRESSED JUICES 🧃 WELLNESS SHOTS ⚡ PROTEIN 💪 FRESH DAILY 🌿 </span>
          <span className="ticker-text">SMOOTHIES 🥤 MATCHA 🍵 COFFEE ☕ COLD-PRESSED JUICES 🧃 WELLNESS SHOTS ⚡ PROTEIN 💪 FRESH DAILY 🌿 </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`ticker ticker-products ${className}`}>
      <div className="ticker-track" style={{ animationDuration: `${speed}s` }}>
        {[0, 1].map((set) => (
          <div key={set} className="ticker-set">
            {products.map((item, i) => (
              <div key={`${set}-${i}`} className="ticker-product">
                <img src={item.imageUrl!} alt={item.name} className="ticker-product-img" />
                <span className="ticker-product-name">{item.name}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
