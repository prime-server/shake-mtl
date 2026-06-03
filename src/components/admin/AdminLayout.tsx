import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import LoginForm from '../LoginForm';
import AdminDashboard from './AdminDashboard';
import AdminOrders from './AdminOrders';
import AdminSales from './AdminSales';
import AdminInventory from './AdminInventory';
import AdminTerminal from './AdminTerminal';

type Section = 'dashboard' | 'orders' | 'sales' | 'inventory' | 'terminal';

const NAV_ITEMS: { key: Section; label: string; icon: string }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: '\u25A6' },
  { key: 'orders', label: 'Active Orders', icon: '\u2691' },
  { key: 'sales', label: 'Sales', icon: '\u2197' },
  { key: 'inventory', label: 'Inventory', icon: '\u2637' },
  { key: 'terminal', label: 'Terminal', icon: '\u25FB' },
];

export default function AdminLayout() {
  const { user, loading: authLoading, signOut } = useAuth();
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Any authenticated user can see the admin UI.
  // Backend APIs still verify staff/admin role via token — no data leaks.

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
          {section === 'inventory' && <AdminInventory />}
          {section === 'terminal' && <AdminTerminal />}
        </div>
      </div>
    </div>
  );
}
