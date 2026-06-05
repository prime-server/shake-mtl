import { useState, useEffect } from 'react';
import { auth } from '../../firebase';

interface DailySummary {
  orderCount: number;
  totalSales: number;    // cents
  totalTax: number;      // cents
  averageOrder: number;  // cents
  pendingOrders: number;
}

interface Transaction {
  id: string;
  customerName: string;
  items: { name: string; quantity: number }[];
  totalCents: number;
  totalTaxCents: number;
  status: string;
  source: string;
  tenderType: string;
  cardBrand: string | null;
  cardLast4: string | null;
  entryMethod: string | null;
  collectedBy: string;
  createdAt: string;
}

const CARD_BRANDS: Record<string, { label: string; color: string; bg: string }> = {
  VISA: { label: 'VISA', color: '#1a1f71', bg: '#f0f1fa' },
  MASTERCARD: { label: 'MC', color: '#eb001b', bg: '#fef0f0' },
  AMERICAN_EXPRESS: { label: 'AMEX', color: '#006fcf', bg: '#eef5fc' },
  INTERAC: { label: 'INTERAC', color: '#ffb900', bg: '#fff8e6' },
  DISCOVER: { label: 'DISC', color: '#ff6000', bg: '#fff3eb' },
};

interface Props {
  onNavigate: (section: 'dashboard' | 'orders' | 'sales' | 'stats' | 'schedule' | 'inventory' | 'terminal') => void;
}

async function getToken() {
  return auth.currentUser?.getIdToken() ?? null;
}

function formatTxTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/Toronto',
  }).toLowerCase();
}

function formatDateHeader(): string {
  return new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/Toronto',
  });
}

function cents(n: number): string {
  return `$${(n / 100).toFixed(2)}`;
}

export default function AdminDashboard({ onNavigate }: Props) {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await getToken();
        const headers: Record<string, string> = { Authorization: `Bearer ${token}` };

        // Fetch summary first (fast, server-side cached for 30s)
        const sumResp = await fetch('/api/daily-summary', { headers });
        if (mounted && sumResp.ok) {
          setSummary(await sumResp.json());
          setLoading(false); // Show stats immediately
        }

        // Then fetch transactions lazily (slower — hits Square orders search)
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const salesResp = await fetch('/api/sales-report', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: todayStart.toISOString(),
            endDate: now.toISOString(),
          }),
        });

        if (mounted && salesResp.ok) {
          const data = await salesResp.json();
          const orders: Transaction[] = (data.orders || []).filter(
            (o: Transaction) => o.status === 'completed'
          );
          setTransactions(orders);
        }
      } catch {
        /* ignore */
      } finally {
        if (mounted) {
          setLoading(false);
          setTxLoading(false);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const totalCollected = summary?.totalSales ?? 0;
  const totalTax = summary?.totalTax ?? 0;
  const netSales = totalCollected - totalTax;
  // Square processing fees: 2.65% + $0.10 per transaction (card only)
  const cardTx = transactions.filter((t) => t.tenderType === 'CARD').length;
  const cardTotal = transactions.filter((t) => t.tenderType === 'CARD').reduce((s, t) => s + t.totalCents, 0);
  const percentFee = Math.round(cardTotal * 0.0265);
  const perTxFee = cardTx * 10; // 10 cents per transaction
  const totalFees = percentFee + perTxFee;

  return (
    <div className="adm-dashboard">
      {/* Date header + eye toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div className="adm-date-header" style={{ marginBottom: 0 }}>{formatDateHeader()}</div>
        <button
          onClick={() => setHidden((h) => !h)}
          style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 1000, cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: 0.5, color: '#7a7167', padding: '6px 14px' }}
          title={hidden ? 'Show numbers' : 'Hide numbers'}
        >
          {hidden ? 'SHOW' : 'HIDE'}
        </button>
      </div>

      {/* 3 stat cards */}
      <div className="adm-stat-row">
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : hidden ? '••' : (summary?.orderCount ?? 0)}
          </span>
          <span className="adm-stat-label">Complete Transactions</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : hidden ? '••••' : cents(totalCollected)}
          </span>
          <span className="adm-stat-label">Total Collected</span>
        </div>
        <div className="adm-stat-card">
          <span className="adm-stat-num">
            {loading ? '--' : hidden ? '••••' : cents(netSales)}
          </span>
          <span className="adm-stat-label">Net Sales</span>
        </div>
      </div>

      {/* Processing fees */}
      {!txLoading && cardTx > 0 && (
        <div className="adm-fees-bar">
          <div className="adm-fee-item">
            <span className="adm-fee-label">Card Transactions</span>
            <span className="adm-fee-val">{hidden ? '••' : cardTx}</span>
          </div>
          <div className="adm-fee-item">
            <span className="adm-fee-label">Rate Fee (2.65%)</span>
            <span className="adm-fee-val">{hidden ? '••••' : cents(percentFee)}</span>
          </div>
          <div className="adm-fee-item">
            <span className="adm-fee-label">Per-Tx Fee ($0.10)</span>
            <span className="adm-fee-val">{hidden ? '••••' : cents(perTxFee)}</span>
          </div>
          <div className="adm-fee-item adm-fee-total">
            <span className="adm-fee-label">Total Fees</span>
            <span className="adm-fee-val">{hidden ? '••••' : cents(totalFees)}</span>
          </div>
          <div className="adm-fee-item adm-fee-net">
            <span className="adm-fee-label">Net After Fees</span>
            <span className="adm-fee-val">{hidden ? '••••' : cents(netSales - totalFees)}</span>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="adm-quick-actions">
        <button className="btn btn-primary" onClick={() => onNavigate('orders')}>
          View Active Orders
        </button>
        <button className="btn btn-ghost" onClick={() => onNavigate('terminal')}>
          Open Terminal
        </button>
      </div>

      {/* Transaction list */}
      <div className="adm-tx-list">
        {txLoading ? (
          <p className="adm-muted">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="adm-muted">No completed transactions yet today.</p>
        ) : (
          transactions.map((tx) => (
            <div key={tx.id} className="adm-tx-row">
              <div className="adm-tx-time">
                {tx.createdAt ? formatTxTime(tx.createdAt) : '--'}
              </div>
              <div className="adm-tx-detail">
                <div className="adm-tx-items">
                  {tx.items.map((it) => it.name).join(', ') || 'Item'}
                </div>
                <div className="adm-tx-collector">
                  <span className="adm-tx-payment">
                    {tx.tenderType === 'CASH' ? (
                      <span className="adm-card-badge" style={{ background: '#e8f5e9', color: '#2e7d32' }}>CASH</span>
                    ) : tx.cardBrand && CARD_BRANDS[tx.cardBrand] ? (
                      <span className="adm-card-badge" style={{ background: CARD_BRANDS[tx.cardBrand].bg, color: CARD_BRANDS[tx.cardBrand].color }}>
                        {CARD_BRANDS[tx.cardBrand].label}
                        {tx.cardLast4 && <span className="adm-card-last4"> •••{tx.cardLast4}</span>}
                      </span>
                    ) : (
                      <span className="adm-card-badge" style={{ background: '#f5f5f5', color: '#666' }}>CARD</span>
                    )}
                    {tx.entryMethod === 'CONTACTLESS' && <span className="adm-tap-icon" title="Tap">📶</span>}
                  </span>
                  Collected by {tx.collectedBy || 'Shake MTL'}
                </div>
              </div>
              <div className="adm-tx-amount">
                {hidden ? '••••' : cents(tx.totalCents)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
