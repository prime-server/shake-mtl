import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

interface SalesOrder {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; priceCents: number }[];
  totalCents: number;
  status: string;
  source: string;
  createdAt: string | null;
}

interface SalesReport {
  orders: SalesOrder[];
  totalSales: number;
  orderCount: number;
  avgOrder: number;
}

type Preset = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

function getDateRange(preset: Preset): { start: Date; end: Date } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (preset) {
    case 'yesterday': {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { start: y, end: today };
    }
    case 'week': {
      const w = new Date(today);
      w.setDate(w.getDate() - 7);
      return { start: w, end: new Date(now) };
    }
    case 'month': {
      const m = new Date(today);
      m.setMonth(m.getMonth() - 1);
      return { start: m, end: new Date(now) };
    }
    default: // today
      return { start: today, end: new Date(now) };
  }
}

function getTopProduct(orders: SalesOrder[]): string {
  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    (o.items || []).forEach((it) => {
      counts[it.name] = (counts[it.name] || 0) + it.quantity;
    });
  });
  let top = '--';
  let max = 0;
  Object.entries(counts).forEach(([name, count]) => {
    if (count > max) { max = count; top = name; }
  });
  return top;
}

function getOrdersByHour(orders: SalesOrder[]): number[] {
  const hours = new Array(24).fill(0);
  orders.forEach((o) => {
    if (o.createdAt) {
      const h = new Date(o.createdAt).getHours();
      hours[h]++;
    }
  });
  return hours;
}

export default function AdminSales() {
  const [preset, setPreset] = useState<Preset>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (preset === 'custom') return;
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const fetchReport = async (startOverride?: Date, endOverride?: Date) => {
    setLoading(true);
    try {
      const token = await getToken();
      let startDate: string;
      let endDate: string;

      if (startOverride && endOverride) {
        startDate = startOverride.toISOString();
        endDate = endOverride.toISOString();
      } else {
        const range = getDateRange(preset);
        startDate = range.start.toISOString();
        endDate = range.end.toISOString();
      }

      const resp = await fetch('/api/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ startDate, endDate }),
      });

      if (resp.ok) {
        setReport(await resp.json());
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleCustomFetch = () => {
    if (!customStart || !customEnd) return;
    fetchReport(new Date(customStart), new Date(customEnd + 'T23:59:59'));
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    });
  };

  const ordersByHour = report ? getOrdersByHour(report.orders) : [];
  const maxHour = Math.max(...ordersByHour, 1);
  // Only show hours 6am-11pm
  const displayHours = ordersByHour.slice(6, 23);

  const presets: { key: Preset; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'yesterday', label: 'Yesterday' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="adm-sales">
      <div className="adm-page-header">
        <h1>Sales</h1>
      </div>

      {/* Date presets */}
      <div className="adm-filters">
        {presets.map((p) => (
          <button
            key={p.key}
            className={`adm-filter-btn ${preset === p.key ? 'active' : ''}`}
            onClick={() => setPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {preset === 'custom' && (
        <div className="adm-custom-range">
          <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          <span>to</span>
          <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          <button className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '12px' }} onClick={handleCustomFetch}>
            Go
          </button>
        </div>
      )}

      {/* Summary cards */}
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : `$${((report?.totalSales ?? 0) / 100).toFixed(2)}`}
          </span>
          <span className="adm-stat-label">Total Sales</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : (report?.orderCount ?? 0)}
          </span>
          <span className="adm-stat-label">Total Orders</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : `$${((report?.avgOrder ?? 0) / 100).toFixed(2)}`}
          </span>
          <span className="adm-stat-label">Avg Order</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num adm-stat-top">
            {loading ? '--' : getTopProduct(report?.orders || [])}
          </span>
          <span className="adm-stat-label">Top Product</span>
        </div>
      </div>

      {/* Bar chart — orders per hour */}
      {!loading && report && report.orders.length > 0 && (
        <div className="adm-chart-section">
          <h2 className="adm-section-title">Orders by Hour</h2>
          <div className="adm-bar-chart">
            {displayHours.map((count, i) => (
              <div key={i} className="adm-bar-col">
                <div
                  className="adm-bar"
                  style={{ height: `${(count / maxHour) * 100}%` }}
                >
                  {count > 0 && <span className="adm-bar-val">{count}</span>}
                </div>
                <span className="adm-bar-label">{i + 6}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Orders table */}
      <div className="adm-table-section">
        <h2 className="adm-section-title">Orders</h2>
        {loading ? (
          <p className="adm-muted">Loading...</p>
        ) : !report || report.orders.length === 0 ? (
          <p className="adm-muted">No orders for this period.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Source</th>
                </tr>
              </thead>
              <tbody>
                {report.orders.map((order) => (
                    <tr key={order.id}>
                      <td>{formatTime(order.createdAt)}</td>
                      <td>{order.customerName}</td>
                      <td className="adm-table-items">
                        {(order.items || []).map((it, i) => (
                          <span key={i}>{it.quantity}x {it.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                        ))}
                      </td>
                      <td>${(order.totalCents / 100).toFixed(2)}</td>
                      <td>
                        <span className="adm-table-status" style={{ color: order.status === 'completed' ? '#3d6b35' : '#e5a035' }}>
                          {order.status}
                        </span>
                      </td>
                      <td>{order.source}</td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
