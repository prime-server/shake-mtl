import { useState, useEffect } from 'react';
import { useLang } from '../context/LangContext';

export default function Banner() {
  const [visible, setVisible] = useState(true);
  const { t } = useLang();

  useEffect(() => {
    document.documentElement.style.setProperty('--banner-h', visible ? '38px' : '0px');
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="announcement-banner">
      <span className="banner-text">{t('banner.text')}</span>
      <button
        className="banner-close"
        onClick={() => setVisible(false)}
        aria-label="Close announcement"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
