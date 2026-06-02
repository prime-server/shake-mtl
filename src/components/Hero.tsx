import { useCountUp } from '../hooks/useReveal';

export default function Hero() {
  const items = useCountUp(21);
  const mins = useCountUp(10);
  const protein = useCountUp(32);

  return (
    <section id="hero">
      <div className="hero-bg">
        <div className="hero-grain" />
        <div className="hero-gradient" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />
      </div>

      <div className="hero-content">
        <div className="hero-badge">
          <span className="pulse" />
          Inside Gold's Gym Ville Saint-Laurent
        </div>

        <h1 className="hero-title">
          <span className="hero-line">Fresh fuel</span>
          <span className="hero-line accent">for your grind.</span>
        </h1>

        <p className="hero-sub">
          Smoothies, matcha, coffee, cold-pressed juices & wellness shots —
          made fresh, picked up fast.
        </p>

        <div className="hero-actions">
          <a href="#menu" className="btn btn-primary">
            <span>Order Now</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
          <a href="#loyalty" className="btn btn-ghost">
            Join Rewards
          </a>
        </div>

        <div className="hero-stats">
          <div className="stat">
            <span className="stat-num" ref={items.ref}>{items.value}</span>
            <span className="stat-label">Menu Items</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num" ref={mins.ref}>{mins.value}</span>
            <span className="stat-label">Min Pickup</span>
          </div>
          <div className="stat-divider" />
          <div className="stat">
            <span className="stat-num" ref={protein.ref}>{protein.value}g</span>
            <span className="stat-label">Max Protein</span>
          </div>
        </div>
      </div>

      <div className="scroll-indicator">
        <div className="scroll-line" />
      </div>
    </section>
  );
}
