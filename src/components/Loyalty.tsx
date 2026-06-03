import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function Loyalty() {
  const { ref, visible } = useReveal();
  const { t } = useLang();

  return (
    <section id="loyalty" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="loyalty-grid">
            <div className="loyalty-info">
              <h2 style={{ whiteSpace: 'pre-line' }}>{t('loyalty.heading')}</h2>
              <p className="section-sub">
                {t('loyalty.sub')}
              </p>

              <div className="loyalty-perks">
                <div className="perk">
                  <div className="perk-icon">1</div>
                  <div>
                    <strong>{t('loyalty.earn')}</strong>
                    <p>{t('loyalty.earnDesc')}</p>
                  </div>
                </div>
                <div className="perk">
                  <div className="perk-icon">2</div>
                  <div>
                    <strong>{t('loyalty.redeem')}</strong>
                    <p>{t('loyalty.redeemDesc')}</p>
                  </div>
                </div>
                <div className="perk">
                  <div className="perk-icon">3</div>
                  <div>
                    <strong>{t('loyalty.repeat')}</strong>
                    <p>{t('loyalty.repeatDesc')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo reward card — not connected to real user data */}
            <div className="loyalty-card">
              <div className="reward-card">
                <div className="reward-card-inner">
                  <div className="reward-card-top">
                    <span className="reward-logo">SHAKE<span className="dot">.</span></span>
                    <span className="reward-tier">{t('loyalty.title')}</span>
                  </div>
                  <div className="reward-card-mid">
                    <div className="reward-progress">
                      <div className="reward-bar">
                        <div className="reward-fill" style={{ width: '65%' }} />
                      </div>
                      <span className="reward-pts">65 / 100 PTS</span>
                    </div>
                  </div>
                  <div className="reward-card-bot">
                    <span>{t('loyalty.nextReward')}</span>
                    <span className="reward-phone">514-***-**21</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
