import { useReveal } from '../hooks/useReveal';

export default function About() {
  const { ref, visible } = useReveal();

  return (
    <section id="about" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="about-grid">
            <div className="about-visual">
              <div className="about-card-stack">
                <div className="about-icon-card">
                  <span>🥤</span>
                  <p>Fresh Blended</p>
                </div>
                <div className="about-icon-card">
                  <span>⚡</span>
                  <p>Ready in 10 min</p>
                </div>
                <div className="about-icon-card">
                  <span>💪</span>
                  <p>Up to 32g Protein</p>
                </div>
                <div className="about-icon-card">
                  <span>🌱</span>
                  <p>Real Ingredients</p>
                </div>
              </div>
            </div>

            <div className="about-info">
              <span className="section-tag">Our Story</span>
              <h2>
                Built for the <span className="accent">gym floor.</span>
              </h2>
              <p className="about-text">
                SHAKE. was born inside Gold's Gym Ville Saint-Laurent with one
                mission: real ingredients, no shortcuts, ready before your
                cooldown ends.
              </p>
              <p className="about-text">
                Every smoothie is blended to order with whole fruits, premium
                proteins, and zero artificial anything. From pre-workout beet
                shots to post-workout protein smoothies — we fuel the grind.
              </p>
              <div className="about-values">
                <div className="value-pill">No artificial sweeteners</div>
                <div className="value-pill">Fresh daily</div>
                <div className="value-pill">Gym-tested recipes</div>
                <div className="value-pill">Vegan options</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
