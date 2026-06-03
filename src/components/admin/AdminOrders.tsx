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

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

function getTimerClass(iso: string | null): string {
  if (!iso) return 'green';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 5) return 'green';
  if (mins < 15) return 'yellow';
  return 'red';
}

function timeSince(iso: string | null): string {
  if (!iso) return '';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelCode, setCancelCode] = useState('');

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const resp = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      setOrders(data.orders || []);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const poll = setInterval(fetchOrders, 5000);
    const tick = setInterval(() => setTick((t) => t + 1), 30000);
    return () => { clearInterval(poll); clearInterval(tick); };
  }, [fetchOrders]);

  const callAction = async (endpoint: string, orderId: string) => {
    setActionLoading(orderId);
    setActionError(null);
    try {
      const token = await getToken();
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `Failed (${resp.status})`);
      }
      await fetchOrders();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Action failed';
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } finally {
      setActionLoading(null);
    }
  };

  const newOrders = orders.filter((o) => o.status === 'pending_payment');
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  const renderCard = (order: Order, type: 'new' | 'preparing' | 'ready') => (
    <div key={order.id} className="adm-pane-card">
      <div className="adm-pane-card-name">{order.customerName || 'Walk-in'}</div>
      {order.customerPhone && (
        <div className="adm-pane-card-phone">{order.customerPhone}</div>
      )}
      {order.items?.length > 0 && (
        <div className="adm-pane-card-items">
          {order.items.map((it, i) => (
            <span key={i}>
              {it.quantity}x {it.name || it.variationId}
              {i < order.items.length - 1 ? ', ' : ''}
            </span>
          ))}
        </div>
      )}
      <div className={`adm-pane-card-time ${getTimerClass(order.createdAt)}`}>
        {timeSince(order.createdAt)}
      </div>
      {type === 'new' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="adm-pane-card-btn accept"
            style={{ flex: 1 }}
            onClick={() => callAction('/api/order-start', order.id)}
            disabled={actionLoading === order.id}
          >
            {actionLoading === order.id ? '...' : 'START PREPARING'}
          </button>
          <button
            className="adm-pane-card-btn cancel"
            style={{ flex: 0, minWidth: 80 }}
            onClick={() => { setCancelTarget(order.id); setCancelCode(''); }}
            disabled={actionLoading === order.id}
          >
            CANCEL
          </button>
        </div>
      )}
      {type === 'preparing' && (
        <button
          className="adm-pane-card-btn ready"
          onClick={() => callAction('/api/order-ready', order.id)}
          disabled={actionLoading === order.id}
        >
          {actionLoading === order.id ? 'Sending...' : 'MARK READY'}
        </button>
      )}
      {type === 'ready' && (
        <button
          className="adm-pane-card-btn pickup"
          onClick={() => callAction('/api/order-complete', order.id)}
          disabled={actionLoading === order.id}
        >
          {actionLoading === order.id ? '...' : 'PICKED UP'}
        </button>
      )}
    </div>
  );

  return (
    <div className="adm-orders">
      <div className="adm-page-header">
        <h1>Active Orders</h1>
        <span className="adm-order-count">{orders.length} orders</span>
      </div>

      {actionError && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '10px 16px',
          borderRadius: 8,
          marginBottom: 16,
          fontSize: 14,
        }}>
          {actionError}
        </div>
      )}

      {loading ? (
        <p className="adm-muted" style={{ padding: '40px 0', textAlign: 'center' }}>Loading orders...</p>
      ) : (
        <div className="adm-orders-panes">
          {/* NEW */}
          <div className="adm-pane">
            <div className="adm-pane-header">
              <span className="adm-pane-title">New QR Orders</span>
              <span className={`adm-pane-badge red`}>{newOrders.length}</span>
            </div>
            <div className="adm-pane-cards">
              {newOrders.length === 0 ? (
                <div className="adm-pane-empty">No new orders</div>
              ) : (
                newOrders.map((o) => renderCard(o, 'new'))
              )}
            </div>
          </div>

          {/* PREPARING */}
          <div className="adm-pane">
            <div className="adm-pane-header">
              <span className="adm-pane-title">Preparing</span>
              <span className={`adm-pane-badge green`}>{preparingOrders.length}</span>
            </div>
            <div className="adm-pane-cards">
              {preparingOrders.length === 0 ? (
                <div className="adm-pane-empty">No orders being prepared</div>
              ) : (
                preparingOrders.map((o) => renderCard(o, 'preparing'))
              )}
            </div>
          </div>

          {/* READY */}
          <div className="adm-pane">
            <div className="adm-pane-header">
              <span className="adm-pane-title">Ready</span>
              <span className={`adm-pane-badge blue`}>{readyOrders.length}</span>
            </div>
            <div className="adm-pane-cards">
              {readyOrders.length === 0 ? (
                <div className="adm-pane-empty">No orders ready for pickup</div>
              ) : (
                readyOrders.map((o) => renderCard(o, 'ready'))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div className="adm-cancel-overlay" onClick={() => setCancelTarget(null)}>
          <div className="adm-cancel-modal" onClick={(e) => e.stopPropagation()}>
            <h3>CANCEL ORDER</h3>
            <p>Enter code <strong>1234</strong> to confirm cancellation.</p>
            <input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="Enter code"
              value={cancelCode}
              onChange={(e) => setCancelCode(e.target.value)}
              autoFocus
            />
            <div className="adm-cancel-actions">
              <button className="btn btn-ghost" onClick={() => setCancelTarget(null)}>BACK</button>
              <button
                className="btn adm-cancel-confirm"
                disabled={cancelCode !== '1234' || actionLoading === cancelTarget}
                onClick={async () => {
                  if (cancelCode !== '1234') return;
                  await callAction('/api/order-complete', cancelTarget);
                  setCancelTarget(null);
                  setCancelCode('');
                }}
              >
                {actionLoading === cancelTarget ? '...' : 'CONFIRM CANCEL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
