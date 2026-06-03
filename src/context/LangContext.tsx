import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import translations from '../i18n/translations';

type Lang = 'en' | 'fr';

interface LangState {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
}

const LangContext = createContext<LangState | null>(null);

function getInitialLang(): Lang {
  try {
    const stored = localStorage.getItem('shake-lang');
    if (stored === 'fr') return 'fr';
  } catch { /* localStorage unavailable */ }
  return 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(getInitialLang);

  const toggleLang = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'en' ? 'fr' : 'en';
      try { localStorage.setItem('shake-lang', next); } catch { /* noop */ }
      return next;
    });
  }, []);

  const t = useCallback(
    (key: string): string => translations[lang]?.[key] ?? translations.en?.[key] ?? key,
    [lang],
  );

  return (
    <LangContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within LangProvider');
  return ctx;
}
