import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import Admin from './components/Admin';
import { useCart } from './hooks/useCart';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { useLang } from './context/LangContext';

import HomePage from './pages/HomePage';
import MenuPage from './pages/MenuPage';
import AboutPage from './pages/AboutPage';
import LoyaltyPage from './pages/LoyaltyPage';
import CateringPage from './pages/CateringPage';
import ContactPage from './pages/ContactPage';
import AccountPage from './pages/AccountPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const [scrolled, setScrolled] = useState(false);
  const cart = useCart();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  const { t } = useLang();
  const [orderSuccess, setOrderSuccess] = useState(false);
  useEffect(() => {
    if (window.location.search.includes('order=success')) {
      setOrderSuccess(true);
      cart.clear();
      window.history.replaceState({}, '', '/');
      setTimeout(() => setOrderSuccess(false), 8000);
    }
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAdmin) return <Admin />;

  return (
    <>
      <Banner />
      <Navbar scrolled={scrolled} cartCount={cart.count} onCartOpen={() => cart.setOpen(true)} />

      {orderSuccess && (
        <div className="order-success-banner">
          <span>&#x2713;</span> {t('order.success')}
        </div>
      )}

      <ScrollToTop />

      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/menu" element={<MenuPage onAddToCart={cart.add} />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/loyalty" element={<LoyaltyPage />} />
          <Route path="/catering" element={<CateringPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </main>

      <Cart
        items={cart.items}
        subtotal={cart.subtotal}
        open={cart.open}
        onClose={() => cart.setOpen(false)}
        onUpdateQty={cart.updateQty}
        onRemove={cart.remove}
        onClear={cart.clear}
      />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LangProvider>
          <AppShell />
        </LangProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
