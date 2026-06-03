import { useState, type FormEvent } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useReveal } from '../hooks/useReveal';
import { useLang } from '../context/LangContext';

export default function Catering() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', date: '', guests: '', type: '', message: '',
  });
  const { ref, visible } = useReveal();
  const { t } = useLang();

  const update = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'catering_inquiries'), {
        ...form,
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Failed to submit catering request:', err);
    }
  };

  return (
    <section id="catering">
      <div className="section-inner" ref={ref}>
        <div className={`reveal ${visible ? 'visible' : ''}`}>
          <div className="catering-grid">
            <div className="catering-info">
              <h2>{t('catering.heading')}</h2>
              <p className="section-sub">
                {t('catering.sub')}
              </p>

              <div className="catering-types">
                <div className="catering-type">
                  <span className="ct-icon">&#x1F3CB;&#xFE0F;</span>
                  <span>{t('catering.gymEvents')}</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">&#x1F3E2;</span>
                  <span>{t('catering.corporate')}</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">&#x1F382;</span>
                  <span>{t('catering.birthdays')}</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">&#x1F9D8;</span>
                  <span>{t('catering.yoga')}</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">&#x1F3C3;</span>
                  <span>{t('catering.sports')}</span>
                </div>
                <div className="catering-type">
                  <span className="ct-icon">&#x1F389;</span>
                  <span>{t('catering.private')}</span>
                </div>
              </div>
            </div>

            <div className="catering-form-wrap">
              {submitted ? (
                <div className="form-success">
                  <span className="success-icon">&#x2713;</span>
                  <h3>{t('catering.success')}</h3>
                  <p>{t('catering.successSub')}</p>
                </div>
              ) : (
                <form className="catering-form" onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cat-name">{t('catering.name')}</label>
                      <input id="cat-name" type="text" required placeholder={t('cart.name')} value={form.name} onChange={(e) => update('name', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cat-email">{t('catering.email')}</label>
                      <input id="cat-email" type="email" required placeholder="you@example.com" value={form.email} onChange={(e) => update('email', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="cat-date">{t('catering.eventDate')}</label>
                      <input id="cat-date" type="date" required value={form.date} onChange={(e) => update('date', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label htmlFor="cat-guests">{t('catering.guests')}</label>
                      <input id="cat-guests" type="number" min="5" required placeholder="~25" value={form.guests} onChange={(e) => update('guests', e.target.value)} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cat-type">{t('catering.eventType')}</label>
                    <select id="cat-type" required value={form.type} onChange={(e) => update('type', e.target.value)}>
                      <option value="">{t('catering.select')}</option>
                      <option value="Gym Event">{t('catering.gymEvents')}</option>
                      <option value="Corporate">{t('catering.corporate')}</option>
                      <option value="Birthday">{t('catering.birthdays')}</option>
                      <option value="Yoga / Pilates">{t('catering.yoga')}</option>
                      <option value="Sports Team">{t('catering.sports')}</option>
                      <option value="Private Party">{t('catering.private')}</option>
                      <option value="Other">{t('catering.other')}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="cat-msg">{t('catering.details')}</label>
                    <textarea id="cat-msg" rows={3} placeholder="..." value={form.message} onChange={(e) => update('message', e.target.value)} />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    {t('catering.send')}
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
