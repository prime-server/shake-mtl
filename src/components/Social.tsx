import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

const reviews = [
  {
    name: 'ALEX T.',
    text: "Best post-workout smoothie in Montreal. The Peanut Power is insane \u2014 tastes like a milkshake but it\u2019s actually healthy.",
    rating: 5,
  },
  {
    name: 'SARAH M.',
    text: "I order the Green Machine every morning before my workout. The QR ordering at my locker is a game changer.",
    rating: 5,
  },
  {
    name: 'JORDAN K.',
    text: "The immunity shots got me through flu season. Real ginger, real turmeric \u2014 you can taste the quality.",
    rating: 5,
  },
  {
    name: 'MIKE D.',
    text: "Protein Iced Coffee before 6 AM legs day. Nothing else compares. Fast pickup, never a long wait.",
    rating: 5,
  },
];

export default function Social() {
  const { ref, visible } = useReveal();
  const { t } = useLang();

  return (
    <section id="social">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <h2>{t('social.heading')}</h2>
          </div>

          <div className="reviews-grid">
            {reviews.map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {'★'.repeat(r.rating)}
                </div>
                <p className="review-text">"{r.text}"</p>
                <span className="review-author">&mdash; {r.name}</span>
              </div>
            ))}
          </div>

          <div className="social-cta">
            <p>{t('social.follow')}</p>
            <a
              href="https://instagram.com/shakemtl"
              target="_blank"
              rel="noopener"
              className="btn btn-ghost"
            >
              {t('social.instagram')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
