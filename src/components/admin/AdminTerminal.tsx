import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

interface CatalogItem {
  id: string;
  variationId: string | null;
  name: string;
  description: string;
  price: number;
  priceCents: number;
  imageUrl: string | null;
  categoryId: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends CatalogItem {
  quantity: number;
}

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

export default function AdminTerminal() {
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [charging, setCharging] = useState(false);
  const [chargeResult, setChargeResult] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    fetch('/api/catalog')
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items || []);
        setCategories(data.categories || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const addToCart = (item: CatalogItem) => {
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.id !== id));
    } else {
      setCart((prev) => prev.map((c) => c.id === id ? { ...c, quantity: qty } : c));
    }
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((s, c) => s + c.priceCents * c.quantity, 0);

  const handleCharge = async () => {
    if (cart.length === 0) return;
    setCharging(true);
    setChargeResult(null);
    try {
      const token = await getToken();
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          items: cart.map((c) => ({
            variationId: c.variationId,
            quantity: c.quantity,
            name: c.name,
            priceCents: c.priceCents,
          })),
          customerName: customerName || 'Walk-in',
          customerPhone: customerPhone || '',
          customerEmail: '',
          pickupNote: 'POS order',
        }),
      });
      const data = await resp.json();
      if (data.checkoutUrl) {
        setChargeResult({ type: 'success', msg: `Payment link created. Order #${data.orderId?.slice(-6) || ''}` });
        // Open checkout URL in new tab for Square payment
        window.open(data.checkoutUrl, '_blank');
        // Clear cart
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
      } else {
        setChargeResult({ type: 'error', msg: data.error || 'Checkout failed' });
      }
    } catch {
      setChargeResult({ type: 'error', msg: 'Connection error' });
    } finally {
      setCharging(false);
    }
  };

  const displayItems = activeCategory
    ? items.filter((it) => it.categoryId === activeCategory)
    : items;

  return (
    <div className="adm-terminal">
      <div className="adm-terminal-grid">
        {/* Product side */}
        <div className="adm-terminal-products">
          <h2 className="adm-terminal-title">Products</h2>

          {/* Category tabs */}
          <div className="adm-terminal-cats">
            <button
              className={`adm-filter-btn ${!activeCategory ? 'active' : ''}`}
              onClick={() => setActiveCategory(null)}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`adm-filter-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {loading ? (
            <p className="adm-muted" style={{ padding: 40, textAlign: 'center' }}>Loading...</p>
          ) : (
            <div className="adm-terminal-product-grid">
              {displayItems.map((item) => (
                <button
                  key={item.id}
                  className="adm-terminal-item"
                  onClick={() => addToCart(item)}
                >
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="adm-terminal-item-img" />
                  ) : (
                    <div className="adm-terminal-item-img adm-terminal-no-img" />
                  )}
                  <span className="adm-terminal-item-name">{item.name}</span>
                  <span className="adm-terminal-item-price">${(item.priceCents / 100).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart side */}
        <div className="adm-terminal-cart">
          <h2 className="adm-terminal-title">Cart</h2>

          {cart.length === 0 ? (
            <p className="adm-muted" style={{ padding: '40px 0', textAlign: 'center' }}>
              Tap products to add
            </p>
          ) : (
            <div className="adm-terminal-cart-items">
              {cart.map((item) => (
                <div key={item.id} className="adm-terminal-cart-item">
                  <div className="adm-terminal-cart-info">
                    <span className="adm-terminal-cart-name">{item.name}</span>
                    <span className="adm-terminal-cart-price">
                      ${(item.priceCents * item.quantity / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="adm-terminal-cart-qty">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)}>+</button>
                    <button className="adm-terminal-remove" onClick={() => removeFromCart(item.id)}>
                      &#10005;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="adm-terminal-form">
            <input
              placeholder="Customer name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
            <input
              placeholder="Phone (optional)"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
          </div>

          <div className="adm-terminal-total">
            <span>Total</span>
            <span className="adm-terminal-total-amount">${(subtotal / 100).toFixed(2)}</span>
          </div>

          {chargeResult && (
            <div className={`adm-terminal-result ${chargeResult.type}`}>
              {chargeResult.msg}
            </div>
          )}

          <button
            className="adm-charge-btn"
            disabled={cart.length === 0 || charging}
            onClick={handleCharge}
          >
            {charging ? 'Processing...' : `CHARGE $${(subtotal / 100).toFixed(2)}`}
          </button>

          {cart.length > 0 && (
            <button className="adm-terminal-clear" onClick={() => setCart([])}>
              Clear Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
