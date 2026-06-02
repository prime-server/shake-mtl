import { useReveal } from '../hooks/useReveal';

const reviews = [
  {
    name: 'Alex T.',
    text: "Best post-workout smoothie in Montreal. The Peanut Power is insane — tastes like a milkshake but it's actually healthy.",
    rating: 5,
  },
  {
    name: 'Sarah M.',
    text: "I order the Green Machine every morning before my workout. The QR ordering at my locker is a game changer.",
    rating: 5,
  },
  {
    name: 'Jordan K.',
    text: "The immunity shots got me through flu season. Real ginger, real turmeric — you can taste the quality.",
    rating: 5,
  },
  {
    name: 'Mike D.',
    text: "Protein Iced Coffee before 6 AM legs day. Nothing else compares. Fast pickup, never a long wait.",
    rating: 5,
  },
];

export default function Social() {
  const { ref, visible } = useReveal();

  return (
    <section id="social" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-tag">Community</span>
            <h2>
              What the gym <span className="accent">says.</span>
            </h2>
          </div>

          <div className="reviews-grid">
            {reviews.map((r, i) => (
              <div key={i} className="review-card" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="review-stars">
                  {'★'.repeat(r.rating)}
                </div>
                <p className="review-text">"{r.text}"</p>
                <span className="review-author">— {r.name}</span>
              </div>
            ))}
          </div>

          <div className="social-cta">
            <p>Follow us for daily specials and new drops</p>
            <a
              href="https://instagram.com/shakemtl"
              target="_blank"
              rel="noopener"
              className="btn btn-ghost"
            >
              @shakemtl on Instagram
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
