import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { WeekSchedule } from '../../hooks/useOrderSchedule';
import { DEFAULT_SCHEDULE } from '../../hooks/useOrderSchedule';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AdminSchedule() {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<WeekSchedule>({ ...DEFAULT_SCHEDULE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/order-schedule')
      .then(r => r.json())
      .then(data => {
        if (data.schedule) setSchedule(data.schedule);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const token = await user?.getIdToken();
      const resp = await fetch('/api/order-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ schedule }),
      });
      const data = await resp.json();
      if (data.success) {
        setSaved(true);
        // Clear customer-side cache so they get new schedule
        try { localStorage.removeItem('shake_order_schedule'); } catch {}
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {}
    setSaving(false);
  };

  const updateDay = (day: string, field: 'open' | 'close' | 'enabled', value: string | boolean) => {
    setSchedule(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  if (loading) {
    return (
      <div className="adm-card" style={{ padding: 40, textAlign: 'center' }}>
        <div className="adm-loading-spinner" />
      </div>
    );
  }

  return (
    <div className="adm-schedule">
      <div className="adm-card" style={{ padding: '24px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>
          Ordering Schedule
        </h2>
        <p style={{ color: '#9ca3af', fontSize: 13, marginBottom: 24 }}>
          Set when customers can place online orders for pickup.
        </p>

        <table className="adm-schedule-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0 8px 8px 16px', fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Day</th>
              <th style={{ textAlign: 'center', padding: '0 8px 8px', fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Active</th>
              <th style={{ textAlign: 'left', padding: '0 8px 8px', fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Opens</th>
              <th style={{ textAlign: 'left', padding: '0 8px 8px 8px', fontSize: 11, textTransform: 'uppercase', color: '#9ca3af', fontWeight: 600 }}>Closes</th>
            </tr>
          </thead>
          <tbody>
            {DAY_NAMES.map((name, i) => {
              const day = String(i);
              const ds = schedule[day];
              if (!ds) return null;
              return (
                <tr key={day} className="adm-schedule-row">
                  <td>{name}</td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      className="adm-schedule-toggle"
                      checked={ds.enabled}
                      onChange={(e) => updateDay(day, 'enabled', e.target.checked)}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="adm-schedule-time"
                      value={ds.open}
                      onChange={(e) => updateDay(day, 'open', e.target.value)}
                      disabled={!ds.enabled}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="adm-schedule-time"
                      value={ds.close}
                      onChange={(e) => updateDay(day, 'close', e.target.value)}
                      disabled={!ds.enabled}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <button
          className="btn btn-primary adm-schedule-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
}
