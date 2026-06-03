import { useState, useEffect, useMemo } from 'react';
import type { CartItem } from '../hooks/useCart';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import { useGymHours, getPickupSlots } from '../hooks/useGymHours';

interface CartProps {
  items: CartItem[];
  subtotal: number;
  open: boolean;
  onClose: () => void;
  onUpdateQty: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function Cart({ items, subtotal, open, onClose, onUpdateQty, onRemove, onClear }: CartProps) {
  const { user } = useAuth();
  const { t } = useLang();
  const { periods } = useGymHours();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [pickupType, setPickupType] = useState<'asap' | 'scheduled'>('asap');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user?.email, email]);

  // Generate date options: today + next 6 days
  const dateOptions = useMemo(() => {
    const days: { value: string; label: string }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const val = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : `${dayNames[d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
      days.push({ value: val, label });
    }
    return days;
  }, []);

  // Get time slots for selected date
  const timeSlots = useMemo(() => {
    if (!pickupDate) return [];
    const d = new Date(pickupDate + 'T12:00:00');
    return getPickupSlots(d, periods);
  }, [pickupDate, periods]);

  // Set default date when switching to scheduled
  useEffect(() => {
    if (pickupType === 'scheduled' && !pickupDate) {
      setPickupDate(dateOptions[0]?.value || '');
    }
  }, [pickupType, pickupDate, dateOptions]);

  // Reset time when date changes
  useEffect(() => {
    setPickupTime('');
  }, [pickupDate]);

  const tax = subtotal * 0.14975;
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (!name.trim()) { setError(t('cart.nameRequired')); return; }
    if (!phone.trim()) { setError(t('cart.phoneRequired')); return; }
    if (pickupType === 'scheduled' && !pickupTime) { setError('Please select a pickup time'); return; }
    setError('');
    setLoading(true);

    try {
      const resp = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ variationId: i.variationId, quantity: i.quantity })),
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          pickupNote: note,
          pickupType,
          pickupDate: pickupType === 'scheduled' ? pickupDate : undefined,
          pickupTime: pickupType === 'scheduled' ? pickupTime : undefined,
        }),
      });

      const data = await resp.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch {
      setError('Connection error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={`cart-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`cart-drawer ${open ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>{t('cart.title')}</h3>
          <button className="cart-close" onClick={onClose} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <p>{t('cart.empty')}</p>
            <p className="cart-empty-sub">{t('cart.emptySub')}</p>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.name} className="cart-item-img" />
                  )}
                  <div className="cart-item-info">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="cart-item-qty">
                    <button onClick={() => onUpdateQty(item.id, item.quantity - 1)}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => onUpdateQty(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className="cart-item-remove" onClick={() => onRemove(item.id)}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Pickup Time Selector */}
            <div className="cart-pickup-info">
              <div className="pickup-badge">🏋️ {t('cart.pickupAt')}</div>
              <div className="pickup-type-toggle">
                <button
                  className={`pickup-type-btn ${pickupType === 'asap' ? 'active' : ''}`}
                  onClick={() => setPickupType('asap')}
                >
                  ASAP (~15 min)
                </button>
                <button
                  className={`pickup-type-btn ${pickupType === 'scheduled' ? 'active' : ''}`}
                  onClick={() => setPickupType('scheduled')}
                >
                  Schedule
                </button>
              </div>

              {pickupType === 'scheduled' && (
                <div className="pickup-schedule">
                  <select
                    className="pickup-select"
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  >
                    <option value="">Select date...</option>
                    {dateOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>

                  {pickupDate && (
                    timeSlots.length > 0 ? (
                      <select
                        className="pickup-select"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                      >
                        <option value="">Select time...</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>{slot}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="pickup-closed">Closed on this day</p>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="cart-form">
              <input type="text" placeholder={t('cart.name')} value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="tel" placeholder={t('cart.phone')} value={phone} onChange={(e) => setPhone(e.target.value)} required />
              <input type="email" placeholder={t('cart.email')} value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="text" placeholder={t('cart.note')} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>

            <div className="cart-totals">
              <div className="cart-row"><span>{t('cart.subtotal')}</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="cart-row"><span>{t('cart.tax')}</span><span>${tax.toFixed(2)}</span></div>
              <div className="cart-row cart-total"><span>{t('cart.total')}</span><span>${total.toFixed(2)}</span></div>
            </div>

            {error && <p className="cart-error">{error}</p>}

            <button className="btn btn-primary btn-full cart-checkout-btn" onClick={handleCheckout} disabled={loading}>
              {loading ? t('cart.processing') : `${t('cart.pay')} — $${total.toFixed(2)}`}
            </button>

            <div className="cart-delivery-alt">
              <p>{t('cart.delivery')}</p>
              <a href="https://www.ubereats.com" target="_blank" rel="noopener" className="delivery-link">{t('cart.uberEats')}</a>
            </div>

            <button className="cart-clear" onClick={onClear}>{t('cart.clear')}</button>
          </>
        )}
      </div>
    </>
  );
}
