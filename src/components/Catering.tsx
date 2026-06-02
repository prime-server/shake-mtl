import { useState, type FormEvent } from 'react';
import { useReveal } from '../hooks/useReveal';

export default function Catering() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', date: '', guests: '', type: '', message: '',
  });
  const { ref, visible } = useReveal();

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    // TODO: write form data to Firestore catering collection
    console.log('Catering request:', form);
    setSubmitted(true);
  };

  return (
    <section id="catering">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="catering-grid">
            <div className="catering-info">
              <span className="section-tag">Catering & Events</span>
              <h2>
                Fuel your <span className="accent">event.</span>
              </h2>
              <p className="section-sub">
                Custom smoothie bars, cold-pressed juice packs, and wellness
                stations for any occasion.
              </p>

              <div className="catering-types">
                <div className="catering-type">
                  <span className="ct-icon">🏋️</span>
                  <span>Gym Events</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">🏢</span>
                  <span>Corporate</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">🎂</span>
                  <span>Birthdays</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">🧘</span>
                  <span>Yoga & Pilates</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">🏃</span>
                  <span>Sports Teams</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">🎉</span>
                  <span>Private Parties</span>
                </div>
              </div>
            </div>

            <div className="catering-form-wrap">
              {submitted ? (
                <div className="form-success">
                  <span className="success-icon">✓</span>
                  <h3>Request received!</h3>
                  <p>We'll be in touch within 24 hours.</p>
                </div>
              ) : (
                <form className="catering-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cat-name">Name</label>
                      <input id="cat-name" type="text" required placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cat-email">Email</label>
                      <input id="cat-email" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cat-date">Event Date</label>
                      <input id="cat-date" type="date" required value={form.date} onChange={(e) => update('date', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cat-guests">Guests</label>
                      <input id="cat-guests" type="number" min="5" required placeholder="~25" value={form.guests} onChange={(e) => update('guests', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cat-type">Event Type</label>
                    <select id="cat-type" required value={form.type} onChange={(e) => update('type', e.target.value)}>
                      <option value="">Select...</option>
                      <option>Gym Event</option>
                      <option>Corporate</option>
                      <option>Birthday</option>
                      <option>Yoga / Pilates</option>
                      <option>Sports Team</option>
                      <option>Private Party</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cat-msg">Details</label>
                    <textarea id="cat-msg" rows={3} placeholder="Tell us about your event..." value={form.message} onChange={(e) => update('message', e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    Send Request
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
