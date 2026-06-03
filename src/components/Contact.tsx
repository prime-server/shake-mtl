import { useReveal } from '../hooks/useReveal';
import { useGymHours, getTodayHours } from '../hooks/useGymHours';
import { useLang } from '../context/LangContext';

export default function Contact() {
  const { ref, visible } = useReveal();
  const { weekdayDescriptions, openNow, address, loading } = useGymHours();
  const todayHours = getTodayHours(weekdayDescriptions);
  const { t } = useLang();

  return (
    <section id="contact" className="alt-bg">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="section-header">
            <h2>{t('contact.heading')}</h2>
          </div>

          <div className="contact-grid">
            <div className="contact-card">
              <div className="contact-icon">&#x1F4CD;</div>
              <h3>{t('contact.gym')}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>{address}</p>
              <a
                href="https://maps.google.com/?q=Golds+Gym+Ville+Saint+Laurent"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-link"
              >
                {t('contact.directions')}
              </a>
            </div>

            <div className="contact-card">
              <div className="contact-icon">&#x1F550;</div>
              <h3>
                {t('contact.hours')}
                {!loading && (
                  <span className={`open-badge ${openNow ? 'is-open' : 'is-closed'}`}>
                    {openNow ? t('contact.openNow') : t('contact.closed')}
                  </span>
                )}
              </h3>
              {todayHours && (
                <p className="today-hours">
                  <strong>{t('contact.today')}</strong> {todayHours}
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
              <div className="contact-icon">&#x1F4F1;</div>
              <h3>{t('contact.connect')}</h3>
              <p>
                <a href="https://instagram.com/shakemtl" target="_blank" rel="noopener noreferrer">
                  @shakemtl
                </a>
              </p>
              <p className="contact-sub">{t('contact.dmUs')}</p>
            </div>

            <div className="contact-card">
              <div className="contact-icon">&#x1F6CD;&#xFE0F;</div>
              <h3>{t('contact.pickup')}</h3>
              <p style={{ whiteSpace: 'pre-line' }}>
                {t('contact.pickupDesc')}
              </p>
            </div>
          </div>

          <div className="qr-banner">
            <div className="qr-banner-content">
              <h3>{t('contact.qrHeading')}</h3>
              <p>
                {t('contact.qrSub')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
