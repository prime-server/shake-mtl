import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

interface DailySummary {
  orderCount: number;
  totalSales: number;
  averageOrder: number;
  pendingOrders: number;
}

interface SquareOrder {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; priceCents: number }[];
  totalCents: number;
  status: string;
  source: string;
  createdAt: string | null;
}

interface Props {
  onNavigate: (section: 'dashboard' | 'orders' | 'sales' | 'inventory' | 'terminal') => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#e5a035',
  preparing: '#3d6b35',
  ready: '#2563eb',
  completed: '#6b7280',
  open: '#e5a035',
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
  open: 'Open',
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'GOOD MORNING';
  if (h < 17) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

export default function AdminDashboard({ onNavigate }: Props) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [recentOrders, setRecentOrders] = useState<SquareOrder[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

        // Both endpoints now hit Square
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const [sumResp, salesResp] = await Promise.all([
          fetch('/api/daily-summary', { headers }),
          fetch('/api/sales-report', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              startDate: todayStart.toISOString(),
              endDate: now.toISOString(),
            }),
          }),
        ]);

        if (mounted && sumResp.ok) {
          const sumData = await sumResp.json();
          setSummary(sumData);
          setPendingCount(sumData.pendingOrders ?? 0);
        }
        if (mounted && salesResp.ok) {
          const data = await salesResp.json();
          const orders: SquareOrder[] = data.orders || [];
          setRecentOrders(orders.slice(0, 10));
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatTime = (iso: string | null) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    });
  };

  return (
    <div className="adm-dashboard">
      <h1 className="adm-greeting">{getGreeting()}</h1>
      <p className="adm-greeting-sub">Here is your daily overview.</p>

      {/* Stat cards */}
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : (summary?.orderCount ?? 0)}
          </span>
          <span className="adm-stat-label">Today's Orders</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : `$${((summary?.totalSales ?? 0) / 100).toFixed(2)}`}
          </span>
          <span className="adm-stat-label">Today's Sales</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : `$${((summary?.averageOrder ?? 0) / 100).toFixed(2)}`}
          </span>
          <span className="adm-stat-label">Avg Order Value</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num adm-stat-pending">
            {loading ? '--' : pendingCount}
          </span>
          <span className="adm-stat-label">Pending Orders</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="adm-quick-actions">
        <button className="btn btn-primary" onClick={() => onNavigate('orders')}>
          View Active Orders
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('terminal')}>
          Open Terminal
        </button>
      </div>

      {/* Recent orders */}
      <div className="adm-recent-section">
        <div className="adm-recent-header">
          <h2>Recent Orders</h2>
          <button className="adm-link-btn" onClick={() => onNavigate('orders')}>
            View All
          </button>
        </div>
        {loading ? (
          <p className="adm-muted">Loading...</p>
        ) : recentOrders.length === 0 ? (
          <p className="adm-muted">No orders yet today.</p>
        ) : (
          <div className="adm-recent-list">
            {recentOrders.map((order) => (
              <div key={order.id} className="adm-recent-item">
                <div className="adm-recent-info">
                  <span className="adm-recent-name">{order.customerName}</span>
                  <span className="adm-recent-time">{formatTime(order.createdAt)}</span>
                </div>
                <div className="adm-recent-items-text">
                  {(order.items || []).map((it, i) => (
                    <span key={i}>{it.quantity}x {it.name}{i < order.items.length - 1 ? ', ' : ''}</span>
                  ))}
                  {' — '}
                </div>
                <div className="adm-recent-meta">
                  <span className="adm-recent-total">${(order.totalCents / 100).toFixed(2)}</span>
                  <span
                    className="adm-recent-status"
                    style={{
                      background: (STATUS_COLORS[order.status] || '#6b7280') + '18',
                      color: STATUS_COLORS[order.status] || '#6b7280',
                    }}
                  >
                    {STATUS_LABELS[order.status] || order.status}
                  </span>
                  <span className="adm-recent-source">{order.source}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
