import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Banner from './components/Banner';
import Navbar from './components/Navbar';
import Cart from './components/Cart';
import { useCart } from './hooks/useCart';
import { AuthProvider } from './context/AuthContext';
import { LangProvider } from './context/LangContext';
import { useLang } from './context/LangContext';
import { fetchCatalog } from './data/menu';

const HomePage = lazy(() => import('./pages/HomePage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LoyaltyPage = lazy(() => import('./pages/LoyaltyPage'));
const CateringPage = lazy(() => import('./pages/CateringPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const Admin = lazy(() => import('./components/Admin'));

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
  const clearCart = cart.clear;
  useEffect(() => {
    if (window.location.search.includes('order=success')) {
      setOrderSuccess(true);
      clearCart();
      window.history.replaceState({}, '', '/');
      setTimeout(() => setOrderSuccess(false), 8000);
    }
  }, [clearCart]);

  // Prefetch catalog on app mount so /menu loads instantly
  useEffect(() => {
    fetchCatalog();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isAdmin) return <Suspense fallback={<div style={{ minHeight: '100vh' }} />}><Admin /></Suspense>;

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
        <Suspense fallback={<div style={{ minHeight: '100vh' }} />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/menu" element={<MenuPage onAddToCart={cart.add} />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/catering" element={<CateringPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
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
