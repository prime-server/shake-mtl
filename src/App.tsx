import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import About from './components/About';
import Menu from './components/Menu';
import Loyalty from './components/Loyalty';
import Social from './components/Social';
import Catering from './components/Catering';
import Contact from './components/Contact';
import Footer from './components/Footer';

export default function App() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <Navbar scrolled={scrolled} />
      <main>
        <Hero />
        <About />
        <Menu />
        <Loyalty />
        <Social />
        <Catering />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
