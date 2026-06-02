import { useReveal } from '../hooks/useReveal';

export default function Loyalty() {
  const { ref, visible } = useReveal();

  return (
    <section id="loyalty" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="loyalty-grid">
            <div className="loyalty-info">
              <span className="section-tag">Rewards</span>
              <h2>
                Earn points.<br />
                <span className="accent">Sip free.</span>
              </h2>
              <p className="section-sub">
                Join SHAKE. Rewards with just your phone number. Earn points on
                every purchase — in-store, online, or through QR ordering at the
                gym.
              </p>

              <div className="loyalty-perks">
                <div className="perk">
                  <div className="perk-icon">1</div>
                  <div>
                    <strong>Earn</strong>
                    <p>1 point for every $1 spent</p>
                  </div>
                </div>
                <div className="perk">
                  <div className="perk-icon">2</div>
                  <div>
                    <strong>Redeem</strong>
                    <p>100 points = $5 off or 10 visits = free smoothie</p>
                  </div>
                </div>
                <div className="perk">
                  <div className="perk-icon">3</div>
                  <div>
                    <strong>Repeat</strong>
                    <p>Points stack from POS, online & QR orders</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="loyalty-card">
              <div className="reward-card">
                <div className="reward-card-glow" />
                <div className="reward-card-inner">
                  <div className="reward-card-top">
                    <span className="reward-logo">SHAKE<span className="dot">.</span></span>
                    <span className="reward-tier">REWARDS</span>
                  </div>
                  <div className="reward-card-mid">
                    <div className="reward-progress">
                      <div className="reward-bar">
                        <div className="reward-fill" style={{ width: '65%' }} />
                      </div>
                      <span className="reward-pts">65 / 100 pts</span>
                    </div>
                  </div>
                  <div className="reward-card-bot">
                    <span>Next reward: Free Smoothie</span>
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
