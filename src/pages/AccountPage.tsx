import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import LoginForm from '../components/LoginForm';
import Ticker from '../components/Ticker';
import Footer from '../components/Footer';

interface OrderDoc {
  id: string;
  items: { name?: string; variationId: string; quantity: number }[];
  status: string;
  createdAt: { toDate?: () => Date } | null;
  customerName?: string;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending_payment: { bg: 'rgba(229,160,53,0.12)', color: '#e5a035' },
  preparing: { bg: 'rgba(61,107,53,0.12)', color: '#3d6b35' },
  ready: { bg: 'rgba(37,99,235,0.12)', color: '#2563eb' },
  completed: { bg: 'rgba(107,114,128,0.12)', color: '#6b7280' },
};

const STATUS_LABELS: Record<string, string> = {
  pending_payment: 'Awaiting Payment',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

export default function AccountPage() {
  const { user, loading, signOut } = useAuth();
  const { t } = useLang();
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    setOrdersLoading(true);

    const q = query(
      collection(db, 'orders'),
      where('customerEmail', '==', user.email),
      orderBy('createdAt', 'desc'),
      limit(20),
    );

    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as OrderDoc[];
      setOrders(docs);
      setOrdersLoading(false);
    }, () => {
      setOrdersLoading(false);
    });

    return unsub;
  }, [user?.email]);

  const formatDate = (ts: OrderDoc['createdAt']) => {
    if (!ts || !ts.toDate) return '';
    const d = ts.toDate();
    return d.toLocaleDateString('en-CA', {
      timeZone: 'America/Toronto',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <>
        <div className="page-hero">
          <div className="page-hero-content">
            <h1>{t('account.title')}</h1>
          </div>
        </div>
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
          Loading...
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <div className="page-hero">
          <div className="page-hero-content">
            <h1>{t('account.title')}</h1>
          </div>
        </div>
        <div style={{ paddingBottom: '80px' }}>
          <LoginForm mode="customer" />
        </div>
        <Ticker />
        <Footer />
      </>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="page-hero-content">
          <h1>{t('account.title')}</h1>
        </div>
      </div>

      <div className="section-inner" style={{ paddingTop: 0 }}>
        <div className="account-header">
          <span className="account-email">{user.email}</span>
          <button className="account-signout" onClick={signOut}>{t('account.signOut')}</button>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          color: 'var(--text-primary)',
          marginBottom: '20px',
        }}>
          {t('account.orderHistory')}
        </h2>

        {ordersLoading ? (
          <div className="account-empty"><p>Loading orders...</p></div>
        ) : orders.length === 0 ? (
          <div className="account-empty">
            <p>{t('account.noOrders')}</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>
              {t('account.noOrdersSub')}
            </p>
          </div>
        ) : (
          <div className="order-history-grid">
            {orders.map((order) => {
              const sc = STATUS_COLORS[order.status] ?? STATUS_COLORS.completed;
              return (
                <div key={order.id} className="order-history-card">
                  <div className="order-history-left">
                    <h4>Order #{order.id.slice(-6).toUpperCase()}</h4>
                    <div className="order-history-items">
                      {order.items?.map((it, i) => (
                        <div key={i}>{it.quantity}x {it.name || it.variationId}</div>
                      ))}
                    </div>
                  </div>
                  <div className="order-history-right">
                    <span
                      className="order-history-status"
                      style={{ background: sc.bg, color: sc.color }}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <div className="order-history-date">{formatDate(order.createdAt)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Ticker />
      <Footer />
    </>
  );
}
