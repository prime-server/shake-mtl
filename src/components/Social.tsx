import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

const REVIEW_KEYS = ['social.review1', 'social.review2', 'social.review3', 'social.review4'];

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
            {REVIEW_KEYS.map((key, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {'★★★★★'}
                </div>
                <p className="review-text">"{t(`${key}.text`)}"</p>
                <span className="review-author">&mdash; {t(`${key}.author`)}</span>
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
