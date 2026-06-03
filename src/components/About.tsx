import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function About() {
  const { ref, visible } = useReveal();
  const { t } = useLang();

  return (
    <section id="about" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="about-grid">
            <div className="about-visual">
              <div className="about-card-stack">
                <div className="about-icon-card">
                  <span>&#x1F964;</span>
                  <p>{t('about.freshBlended')}</p>
                </div>
                <div className="about-icon-card">
                  <span>&#x26A1;</span>
                  <p>{t('about.readyIn10')}</p>
                </div>
                <div className="about-icon-card">
                  <span>&#x1F4AA;</span>
                  <p>{t('about.protein32g')}</p>
                </div>
                <div className="about-icon-card">
                  <span>&#x1F331;</span>
                  <p>{t('about.realIngredients')}</p>
                </div>
              </div>
            </div>

            <div className="about-info">
              <h2>{t('about.heading')}</h2>
              <p className="about-text">
                {t('about.p1')}
              </p>
              <p className="about-text">
                {t('about.p2')}
              </p>
              <div className="about-values">
                <div className="value-pill">{t('about.noArtificial')}</div>
                <div className="value-pill">{t('about.freshDaily')}</div>
                <div className="value-pill">{t('about.gymTested')}</div>
                <div className="value-pill">{t('about.veganOptions')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
