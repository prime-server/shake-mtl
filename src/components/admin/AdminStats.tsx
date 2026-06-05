import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

/* ── Types ────────────────────────────────────── */

interface SalesOrder {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; priceCents: number }[];
  totalCents: number;
  totalTaxCents: number;
  status: string;
  source: string;
  cardBrand: string | null;
  cardLast4: string | null;
  createdAt: string | null;
}

interface CatalogCategory { id: string; name: string }
interface CatalogItem { id: string; name: string; categoryId: string | null }

/* ── Helpers ──────────────────────────────────── */

function toET(d: Date): Date {
  return new Date(d.toLocaleString('en-US', { timeZone: 'America/Toronto' }));
}

function fmtMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

const PAYMENT_COLORS: Record<string, string> = {
  VISA: '#1A1F71',
  MASTERCARD: '#EB001B',
  AMEX: '#006FCF',
  INTERAC: '#FFB600',
  DISCOVER: '#FF6000',
  CASH: '#3d6b35',
  OTHER: '#7a7167',
};

function normalizeCardBrand(brand: string | null): string {
  if (!brand) return 'CASH';
  const b = brand.toUpperCase().replace(/\s/g, '');
  if (b.includes('VISA')) return 'VISA';
  if (b.includes('MASTER')) return 'MASTERCARD';
  if (b.includes('AMEX') || b.includes('AMERICAN')) return 'AMEX';
  if (b.includes('INTERAC')) return 'INTERAC';
  if (b.includes('DISCOVER')) return 'DISCOVER';
  return 'OTHER';
}

/* ── Component ────────────────────────────────── */

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'last30' | 'custom';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function getPresetRange(preset: Preset): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'today': return { start: today, end: now };
    case 'yesterday': { const y = new Date(today); y.setDate(y.getDate() - 1); return { start: y, end: today }; }
    case 'week': { const w = new Date(today); w.setDate(w.getDate() - 7); return { start: w, end: now }; }
    case 'month': return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now };
    case 'last30': { const d = new Date(today); d.setDate(d.getDate() - 30); return { start: d, end: now }; }
    default: return { start: new Date(today), end: now };
  }
}

export default function AdminStats() {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [categories, setCategories] = useState<CatalogCategory[]>([]);
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [hideMoney, setHideMoney] = useState(true);
  const mask = (val: string) => hideMoney ? '••••' : val;

  const [preset, setPreset] = useState<Preset>('last30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchData();
  }, [preset, selectedMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      let start: Date, end: Date;

      if (preset === 'custom' && customStart && customEnd) {
        start = new Date(customStart + 'T00:00:00');
        end = new Date(customEnd + 'T23:59:59');
      } else if (selectedMonth) {
        const [y, m] = selectedMonth.split('-').map(Number);
        start = new Date(y, m - 1, 1);
        end = new Date(y, m, 0, 23, 59, 59);
      } else {
        ({ start, end } = getPresetRange(preset));
      }

      const [salesResp, catalogResp] = await Promise.all([
        fetch('/api/sales-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ startDate: start.toISOString(), endDate: end.toISOString() }),
        }),
        fetch('/api/catalog'),
      ]);

      if (salesResp.ok) {
        const data = await salesResp.json();
        setOrders(data.orders || []);
      }
      if (catalogResp.ok) {
        const cat = await catalogResp.json();
        setCategories(cat.categories || []);
        setCatalogItems(cat.items || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  /* ── Computed Stats ─────────────────────────── */

  const completed = orders.filter((o) => o.status === 'completed');

  // Key metrics
  const totalRevenue = completed.reduce((s, o) => s + o.totalCents, 0);
  const totalOrders = completed.length;
  const avgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const daysInRange = 30;
  const avgPerDay = totalOrders > 0 ? (totalOrders / daysInRange).toFixed(1) : '0';

  // Top 10 best sellers
  const itemCounts: Record<string, number> = {};
  completed.forEach((o) => {
    (o.items || []).forEach((it) => {
      itemCounts[it.name] = (itemCounts[it.name] || 0) + it.quantity;
    });
  });
  const topSellers = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  const maxSold = topSellers.length > 0 ? topSellers[0][1] : 1;

  // Revenue by category
  const catMap: Record<string, string> = {};
  catalogItems.forEach((ci) => {
    if (ci.categoryId) {
      const cat = categories.find((c) => c.id === ci.categoryId);
      if (cat) catMap[ci.name.toLowerCase()] = cat.name;
    }
  });
  const revByCategory: Record<string, number> = {};
  completed.forEach((o) => {
    (o.items || []).forEach((it) => {
      const catName = catMap[it.name.toLowerCase()] || 'Uncategorized';
      revByCategory[catName] = (revByCategory[catName] || 0) + it.priceCents * it.quantity;
    });
  });
  const categoryEntries = Object.entries(revByCategory).sort((a, b) => b[1] - a[1]);
  const maxCatRev = categoryEntries.length > 0 ? categoryEntries[0][1] : 1;

  // Peak hours (6AM-10PM)
  const hourCounts = new Array(24).fill(0);
  completed.forEach((o) => {
    if (o.createdAt) {
      const h = toET(new Date(o.createdAt)).getHours();
      hourCounts[h]++;
    }
  });
  const peakHours = hourCounts.slice(6, 23);
  const maxHour = Math.max(...peakHours, 1);

  // Daily revenue trend (last 7 days)
  const dailyRev: { label: string; cents: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', timeZone: 'America/Toronto' });
    const dayCents = completed
      .filter((o) => {
        if (!o.createdAt) return false;
        const oDate = new Date(o.createdAt).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });
        return oDate === dateStr;
      })
      .reduce((s, o) => s + o.totalCents, 0);
    dailyRev.push({ label: dayLabel, cents: dayCents });
  }
  const maxDailyRev = Math.max(...dailyRev.map((d) => d.cents), 1);

  // Payment method breakdown
  const paymentCounts: Record<string, number> = {};
  completed.forEach((o) => {
    const brand = normalizeCardBrand(o.cardBrand);
    paymentCounts[brand] = (paymentCounts[brand] || 0) + 1;
  });
  const paymentEntries = Object.entries(paymentCounts).sort((a, b) => b[1] - a[1]);
  const totalPayments = paymentEntries.reduce((s, [, c]) => s + c, 0) || 1;

  // Repeat customer rate
  const customerNames = completed.map((o) => (o.customerName || '').trim().toLowerCase()).filter(Boolean);
  const uniqueCustomers = new Set(customerNames).size;
  const repeatRate = customerNames.length > 0
    ? Math.round(((customerNames.length - uniqueCustomers) / customerNames.length) * 100)
    : 0;

  /* ── Render ─────────────────────────────────── */

  if (loading) {
    return (
      <div className="adm-stats">
        <div className="adm-page-header"><h1>Statistics</h1></div>
        <p className="adm-muted" style={{ textAlign: 'center', padding: 40 }}>Loading...</p>
      </div>
    );
  }

  if (completed.length === 0) {
    return (
      <div className="adm-stats">
        <div className="adm-page-header"><h1>Statistics</h1></div>
        <p className="adm-muted" style={{ textAlign: 'center', padding: 40 }}>No data for this period</p>
      </div>
    );
  }

  return (
    <div className="adm-stats">
      <div className="adm-page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>Statistics</h1>
        <button
          onClick={() => setHideMoney((h) => !h)}
          style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 1000, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.5, color: '#7a7167', padding: '6px 14px' }}
        >
          {hideMoney ? 'SHOW $' : 'HIDE $'}
        </button>
      </div>

      {/* Date Filters */}
      <div className="adm-stats-filters">
        <div className="adm-stats-presets">
          {([['today','Today'],['yesterday','Yesterday'],['week','7 Days'],['month','This Month'],['last30','30 Days']] as [Preset,string][]).map(([key,label]) => (
            <button key={key} className={`adm-stats-preset ${preset === key && !selectedMonth ? 'active' : ''}`} onClick={() => { setPreset(key); setSelectedMonth(''); }}>{label}</button>
          ))}
        </div>
        <div className="adm-stats-custom-row">
          <select className="adm-stats-month-select" value={selectedMonth} onChange={(e) => { setSelectedMonth(e.target.value); if (e.target.value) setPreset('custom'); }}>
            <option value="">Select Month...</option>
            {Array.from({ length: 12 }, (_, i) => {
              const d = new Date();
              d.setMonth(d.getMonth() - i);
              const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              return <option key={val} value={val}>{MONTH_NAMES[d.getMonth()]} {d.getFullYear()}</option>;
            })}
          </select>
          <input type="date" className="adm-stats-date-input" value={customStart} onChange={(e) => { setCustomStart(e.target.value); setPreset('custom'); setSelectedMonth(''); }} />
          <span style={{ color: '#7a7167', fontSize: 12 }}>to</span>
          <input type="date" className="adm-stats-date-input" value={customEnd} onChange={(e) => { setCustomEnd(e.target.value); setPreset('custom'); setSelectedMonth(''); }} />
          {preset === 'custom' && customStart && customEnd && (
            <button className="adm-stats-preset active" onClick={fetchData}>APPLY</button>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="adm-stats-metrics">
        <div className="adm-stats-metric">
          <span className="adm-stats-metric-num">{mask(fmtMoney(totalRevenue))}</span>
          <span className="adm-stats-metric-label">Total Revenue</span>
        </div>
        <div className="adm-stats-metric">
          <span className="adm-stats-metric-num">{totalOrders}</span>
          <span className="adm-stats-metric-label">Total Orders</span>
        </div>
        <div className="adm-stats-metric">
          <span className="adm-stats-metric-num">{mask(fmtMoney(avgOrder))}</span>
          <span className="adm-stats-metric-label">Avg Order Value</span>
        </div>
        <div className="adm-stats-metric">
          <span className="adm-stats-metric-num">{avgPerDay}</span>
          <span className="adm-stats-metric-label">Avg Orders / Day</span>
        </div>
      </div>

      {/* Top 10 Best Sellers */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Top 10 Best Sellers</div>
        {topSellers.map(([name, count]) => (
          <div key={name} className="adm-stats-bar-row">
            <span className="adm-stats-bar-label" title={name}>{name}</span>
            <div className="adm-stats-bar-track">
              <div className="adm-stats-bar-fill" style={{ width: `${(count / maxSold) * 100}%` }}>
                <span className="adm-stats-bar-val">{count}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Revenue by Category */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Revenue by Category</div>
        {categoryEntries.map(([catName, cents]) => (
          <div key={catName} className="adm-stats-bar-row">
            <span className="adm-stats-bar-label" title={catName}>{catName}</span>
            <div className="adm-stats-bar-track">
              <div className="adm-stats-bar-fill" style={{ width: `${(cents / maxCatRev) * 100}%` }}>
                <span className="adm-stats-bar-val">{mask(fmtMoney(cents))}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Peak Hours */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Peak Hours</div>
        {peakHours.map((count, i) => {
          const hour = i + 6;
          const label = hour === 0 ? '12AM' : hour < 12 ? `${hour}AM` : hour === 12 ? '12PM' : `${hour - 12}PM`;
          if (count === 0 && hour > 14) return null; // skip empty late hours
          return (
            <div key={hour} className="adm-stats-bar-row">
              <span className="adm-stats-bar-label" style={{ minWidth: 60 }}>{label}</span>
              <div className="adm-stats-bar-track">
                {count > 0 && (
                  <div className="adm-stats-bar-fill" style={{ width: `${(count / maxHour) * 100}%` }}>
                    <span className="adm-stats-bar-val">{count}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Daily Revenue Trend */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Daily Revenue (Last 7 Days)</div>
        <div className="adm-stats-daily">
          {dailyRev.map((d) => (
            <div key={d.label} className="adm-stats-daily-bar">
              <span className="adm-stats-daily-val">{d.cents > 0 ? mask(fmtMoney(d.cents)) : ''}</span>
              <div
                className="adm-stats-daily-fill"
                style={{ height: `${(d.cents / maxDailyRev) * 100}%` }}
              />
              <span className="adm-stats-daily-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method Breakdown */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Payment Methods</div>
        <div className="adm-stats-payment-grid">
          {paymentEntries.map(([brand, count]) => {
            const pct = Math.round((count / totalPayments) * 100);
            const color = PAYMENT_COLORS[brand] || PAYMENT_COLORS.OTHER;
            return (
              <div
                key={brand}
                className="adm-stats-payment-badge"
                style={{ background: color + '18', color }}
              >
                <span className="adm-stats-payment-pct">{pct}%</span>
                <span className="adm-stats-payment-name">{brand}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Repeat Customer Rate */}
      <div className="adm-stats-section">
        <div className="adm-stats-section-title">Repeat Customer Rate</div>
        <div className="adm-stats-metrics" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="adm-stats-metric">
            <span className="adm-stats-metric-num">{customerNames.length}</span>
            <span className="adm-stats-metric-label">Total Orders</span>
          </div>
          <div className="adm-stats-metric">
            <span className="adm-stats-metric-num">{uniqueCustomers}</span>
            <span className="adm-stats-metric-label">Unique Customers</span>
          </div>
          <div className="adm-stats-metric">
            <span className="adm-stats-metric-num">{repeatRate}%</span>
            <span className="adm-stats-metric-label">Repeat Rate</span>
          </div>
        </div>
      </div>
    </div>
  );
}
