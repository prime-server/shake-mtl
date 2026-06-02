import { useReveal } from '../hooks/useReveal';
import { useGymHours, getTodayHours } from '../hooks/useGymHours';

export default function Contact() {
  const { ref, visible } = useReveal();
  const { weekdayDescriptions, openNow, address, loading } = useGymHours();
  const todayHours = getTodayHours(weekdayDescriptions);

  return (
    <section id="contact" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <span className="section-tag">Location</span>
            <h2>
              Find <span className="accent">us.</span>
            </h2>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">📍</div>
              <h3>Gold's Gym VSL</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{address}</p>
              <a
                href="https://maps.google.com/?q=Golds+Gym+Ville+Saint+Laurent"
                target="_blank"
                rel="noopener"
                className="contact-link"
              >
                Get Directions →
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">🕐</div>
              <h3>
                Hours
                {!loading && (
                  <span className={`open-badge ${openNow ? 'is-open' : 'is-closed'}`}>
                    {openNow ? 'Open Now' : 'Closed'}
                  </span>
                )}
              </h3>
              {todayHours && (
                <p className="today-hours">
                  <strong>Today:</strong> {todayHours}
                </p>
              )}
              <div className="hours-list">
                {weekdayDescriptions.map((line, i) => {
                  const [day, time] = line.split(': ');
                  const isToday =
                    day ===
                    ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
                      new Date().getDay()
                    ];
                  return (
                    <div key={i} className={`hours-row ${isToday ? 'is-today' : ''}`}>
                      <span className="hours-day">{day}</span>
                      <span className="hours-time">{time}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon">📱</div>
              <h3>Connect</h3>
              <p>
                <a href="https://instagram.com/shakemtl" target="_blank" rel="noopener">
                  @shakemtl
                </a>
              </p>
              <p className="contact-sub">DM us for questions or custom orders</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">🛍️</div>
              <h3>Pickup</h3>
              <p>
                Scan a QR code anywhere in the gym.<br />
                Ready in 10–15 min.
              </p>
            </div>
          </div>

          <div className="qr-banner">
            <div className="qr-banner-glow" />
            <div className="qr-banner-content">
              <h3>Skip the line. Scan. Order. Pick up at SHAKE.</h3>
              <p>
                QR codes at the front desk, smoothie bar, locker room, cardio
                area, and supplement wall.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
