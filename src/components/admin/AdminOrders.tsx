import { useState, useEffect, useCallback } from 'react';
import { auth } from '../../firebase';

interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  pickupNote: string;
  items: { name?: string; variationId: string; quantity: number }[];
  status: string;
  createdAt: string | null;
  paidAt: string | null;
  readyAt: string | null;
  smsSent?: boolean;
}

interface SquareTransaction {
  id: string;
  customerName: string;
  items: { name: string; quantity: number; priceCents: number }[];
  totalCents: number;
  status: string;
  source: string;
  createdAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  preparing: 'Preparing',
  ready: 'Ready for Pickup',
  completed: 'Picked Up',
};

const STATUS_COLORS: Record<string, string> = {
  pending_payment: '#e5a035',
  preparing: '#3d6b35',
  ready: '#2563eb',
  completed: '#6b7280',
};

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

function getTimerColor(iso: string | null): string {
  if (!iso) return '#6b7280';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 5) return '#3d6b35';
  if (mins < 15) return '#e5a035';
  return '#dc2626';
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<SquareTransaction[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const url = filter === 'all' ? '/api/orders' : `/api/orders?status=${filter}`;
      const resp = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setOrders(data.orders || []);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const fetchTransactions = useCallback(async () => {
    try {
      const token = await getToken();
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const resp = await fetch('/api/sales-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          startDate: todayStart.toISOString(),
          endDate: now.toISOString(),
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        setTransactions(data.orders || []);
      }
    } catch {
      console.error('Failed to fetch transactions');
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTransactions();
    const interval = setInterval(() => {
      fetchOrders();
      fetchTransactions();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, fetchTransactions]);

  const markReady = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await getToken();
      await fetch('/api/order-ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const markComplete = async (orderId: string) => {
    setActionLoading(orderId);
    try {
      const token = await getToken();
      await fetch('/api/order-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      await fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (iso: string | null) => {
    if (!iso) return '--';
    return new Date(iso).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    });
  };

  const timeSince = (iso: string | null) => {
    if (!iso) return '';
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  const filters = ['all', 'preparing', 'ready', 'completed'];

  return (
    <div className="adm-orders">
      <div className="adm-page-header">
        <h1>Active Orders</h1>
        <span className="adm-order-count">{orders.length} orders</span>
      </div>

      <div className="adm-filters">
        {filters.map((f) => (
          <button
            key={f}
            className={`adm-filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => { setFilter(f); setLoading(true); }}
          >
            {f === 'all' ? 'All' : STATUS_LABELS[f] || f}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="adm-muted" style={{ padding: '40px 0', textAlign: 'center' }}>Loading orders...</p>
      ) : orders.length === 0 ? (
        <div className="adm-empty-state">
          <p>No orders</p>
          <p className="adm-muted">Orders will appear here when customers place them</p>
        </div>
      ) : (
        <div className="adm-orders-grid">
          {orders.map((order) => (
            <div key={order.id} className={`adm-order-card adm-order-${order.status}`}>
              <div className="adm-order-top">
                <div>
                  <span className="adm-order-name">{order.customerName}</span>
                  <span className="adm-order-phone">{order.customerPhone}</span>
                </div>
                <span
                  className="adm-order-badge"
                  style={{
                    background: (STATUS_COLORS[order.status] || '#6b7280') + '18',
                    color: STATUS_COLORS[order.status] || '#6b7280',
                  }}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>

              {order.items?.length > 0 && (
                <div className="adm-order-items">
                  {order.items.map((item, i) => (
                    <span key={i} className="adm-order-item-tag">
                      {item.quantity}x {item.name || item.variationId}
                    </span>
                  ))}
                </div>
              )}

              {order.pickupNote && (
                <p className="adm-order-note">"{order.pickupNote}"</p>
              )}

              <div className="adm-order-meta">
                <span>
                  Ordered {formatTime(order.createdAt)}{' '}
                  <span
                    className="adm-order-timer"
                    style={{ color: getTimerColor(order.createdAt) }}
                  >
                    ({timeSince(order.createdAt)})
                  </span>
                </span>
                {order.smsSent && <span className="adm-sms-badge">SMS sent</span>}
              </div>

              <div className="adm-order-actions">
                {order.status === 'preparing' && (
                  <button
                    className="adm-btn-ready"
                    onClick={() => markReady(order.id)}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? 'Sending...' : 'MARK READY'}
                  </button>
                )}
                {order.status === 'ready' && (
                  <button
                    className="adm-btn-pickup"
                    onClick={() => markComplete(order.id)}
                    disabled={actionLoading === order.id}
                  >
                    {actionLoading === order.id ? '...' : 'PICKED UP'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Square Transactions */}
      <div className="adm-tx-section" style={{ marginTop: 32 }}>
        <div className="adm-page-header">
          <h2>Today's Transactions (Square)</h2>
          <span className="adm-order-count">{transactions.length} transactions</span>
        </div>
        {txLoading ? (
          <p className="adm-muted" style={{ padding: '20px 0', textAlign: 'center' }}>Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="adm-muted" style={{ padding: '20px 0', textAlign: 'center' }}>No transactions yet today.</p>
        ) : (
          <div className="adm-table-wrap">
            <table className="adm-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Source</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>{formatTime(tx.createdAt)}</td>
                    <td>{tx.customerName}</td>
                    <td className="adm-table-items">
                      {(tx.items || []).map((it, i) => (
                        <span key={i}>{it.quantity}x {it.name}{i < tx.items.length - 1 ? ', ' : ''}</span>
                      ))}
                    </td>
                    <td>${(tx.totalCents / 100).toFixed(2)}</td>
                    <td>{tx.source}</td>
                    <td>
                      <span
                        className="adm-table-status"
                        style={{ color: tx.status === 'completed' ? '#3d6b35' : '#e5a035' }}
                      >
                        {tx.status}
                      </span>
                    </td>
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
