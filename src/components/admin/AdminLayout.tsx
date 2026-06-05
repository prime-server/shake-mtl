import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../firebase';
import LoginForm from '../LoginForm';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminSales from './AdminSales';
import AdminInventory from './AdminInventory';
import AdminTerminal from './AdminTerminal';
import AdminSchedule from './AdminSchedule';
import AdminStats from './AdminStats';

type Section = 'dashboard' | 'orders' | 'sales' | 'stats' | 'schedule' | 'inventory' | 'terminal';

const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u25A6' },
  { key: 'orders', label: 'Active Orders', icon: '\u2691' },
  { key: 'sales', label: 'Sales', icon: '\u2197' },
  { key: 'stats', label: 'Statistics', icon: '\uD83D\uDCCA' },
  { key: 'schedule', label: 'Schedule', icon: '\uD83D\uDD50' },
  { key: 'inventory', label: 'Inventory', icon: '\u2637' },
  { key: 'terminal', label: 'Terminal', icon: '\u25FB' },
];

const ADMIN_EMAILS = ['shakemtl@gmail.com'];

// Safari-compatible audio: create AudioContext on user gesture, reuse for alerts
let audioCtx: AudioContext | null = null;

function unlockAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playOrderAlert() {
  if (!audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    // Loud repeating alert — 6 tones
    [0, 0.18, 0.36, 0.54, 0.72, 0.9].forEach((delay, i) => {
      const osc = audioCtx!.createOscillator();
      const gain = audioCtx!.createGain();
      osc.connect(gain);
      gain.connect(audioCtx!.destination);
      osc.frequency.value = i % 2 === 0 ? 1000 : 1300;
      gain.gain.value = 1.0;
      osc.start(now + delay);
      osc.stop(now + delay + 0.14);
    });
  } catch { /* ignore */ }
}

export default function AdminLayout() {
  const { user, role, loading: authLoading, signOut } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const prevIds = useRef<Set<string>>(new Set());

  // Poll for new orders across ALL admin tabs
  const checkNewOrders = useCallback(async () => {
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) return;
      const resp = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) return;
      const data = await resp.json();
      const orders = data.orders || [];
      const activeOrders = orders.filter((o: any) => o.status !== 'completed');
      const currentIds = new Set<string>(activeOrders.map((o: any) => o.id as string));
      const pending = orders.filter((o: any) => o.status === 'pending_payment');
      setNewOrderCount(pending.length);

      // Detect genuinely new orders
      if (prevIds.current.size > 0 && soundEnabled) {
        const hasNew = activeOrders.some((o: any) => !prevIds.current.has(o.id));
        if (hasNew) playOrderAlert();
      }
      prevIds.current = currentIds;
    } catch { /* ignore */ }
  }, [soundEnabled]);

  useEffect(() => {
    if (!user) return;
    checkNewOrders();
    const interval = setInterval(checkNewOrders, 10000);
    return () => clearInterval(interval);
  }, [user, checkNewOrders]);

  if (authLoading) {
    return (
      <div className="adm-loading-screen">
        <div className="adm-loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="admin">
        <div className="admin-header">
          <h1>SHAKE<span className="dot">.</span> Staff</h1>
        </div>
        <LoginForm mode="staff" />
      </div>
    );
  }

  // Auth gate: must be staff/admin role OR in ADMIN_EMAILS
  const isAdminEmail = user.email ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;
  if (role !== 'staff' && role !== 'admin' && !isAdminEmail) {
    return (
      <div className="admin">
        <div className="admin-header">
          <h1>SHAKE<span className="dot">.</span> Staff</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2 style={{ color: '#dc2626', marginBottom: 12 }}>Access Denied</h2>
          <p style={{ color: '#9ca3af', marginBottom: 24 }}>
            You do not have permission to access the admin panel.
          </p>
          <button className="btn btn-primary" onClick={signOut} style={{ padding: '10px 24px' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const navigate = (s: Section) => {
    setSection(s);
    setSidebarOpen(false);
  };

  return (
    <div className="adm-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="adm-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`adm-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="adm-sidebar-top">
          <div className="adm-sidebar-logo">
            SHAKE<span>.</span>
          </div>
          <div className="adm-sidebar-subtitle">ADMIN</div>
          <button
            onClick={() => { unlockAudio(); setSoundEnabled(!soundEnabled); if (!soundEnabled) playOrderAlert(); }}
            style={{ marginTop: 12, padding: '6px 14px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 1000, background: soundEnabled ? '#3d6b35' : 'transparent', color: '#E8DDD0', fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer', letterSpacing: 0.5 }}
          >
            {soundEnabled ? '🔔 SOUND ON' : '🔕 SOUND OFF'}
          </button>
        </div>

        <nav className="adm-sidebar-nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              className={`adm-nav-item ${section === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span className="adm-nav-icon">{item.icon}</span>
              <span className="adm-nav-label">{item.label}</span>
              {item.key === 'orders' && newOrderCount > 0 && (
                <span style={{ marginLeft: 'auto', minWidth: 20, height: 20, borderRadius: '50%', background: '#dc2626', color: '#fff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'badgePulse 1.5s ease-in-out infinite' }}>{newOrderCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="adm-sidebar-bottom">
          <div className="adm-sidebar-email">{user.email}</div>
          <button className="adm-signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="adm-main">
        {/* Mobile top bar */}
        <div className="adm-topbar">
          <button className="adm-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <span /><span /><span />
          </button>
          <div className="adm-topbar-title">SHAKE<span className="dot">.</span></div>
          <div style={{ width: 40 }} />
        </div>

        <div className="adm-content">
          {section === 'dashboard' && <AdminDashboard onNavigate={setSection} />}
          {section === 'orders' && <AdminOrders />}
          {section === 'sales' && <AdminSales />}
          {section === 'stats' && <AdminStats />}
          {section === 'schedule' && <AdminSchedule />}
          {section === 'inventory' && <AdminInventory />}
          {section === 'terminal' && <AdminTerminal />}
        </div>
      </div>
    </div>
  );
}
