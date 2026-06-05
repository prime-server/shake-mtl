import { useState, useEffect } from 'react';

interface DaySchedule {
  open: string;   // "05:00"
  close: string;  // "23:00"
  enabled: boolean;
}

export type WeekSchedule = Record<string, DaySchedule>;

const CACHE_KEY = 'shake_order_schedule';
const CACHE_TTL = 60 * 1000;

export const DEFAULT_SCHEDULE: WeekSchedule = {
  '0': { open: '07:00', close: '19:00', enabled: true },
  '1': { open: '05:00', close: '23:00', enabled: true },
  '2': { open: '05:00', close: '23:00', enabled: true },
  '3': { open: '05:00', close: '23:00', enabled: true },
  '4': { open: '05:00', close: '23:00', enabled: true },
  '5': { open: '05:00', close: '22:00', enabled: true },
  '6': { open: '07:00', close: '19:00', enabled: true },
};

export function useOrderSchedule() {
  const [schedule, setSchedule] = useState<WeekSchedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setSchedule(data);
          setLoading(false);
          return;
        }
      }
    } catch { /* cache miss */ }

    fetch('/api/order-schedule')
      .then(r => r.json())
      .then(data => {
        setSchedule(data.schedule);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data.schedule, ts: Date.now() }));
      })
      .catch(() => {
        // Use default schedule as fallback
        setSchedule(DEFAULT_SCHEDULE);
      })
      .finally(() => setLoading(false));
  }, []);

  return { schedule, loading };
}

export function getOrderSlots(date: Date, schedule: WeekSchedule): string[] {
  const day = String(date.getDay());
  const daySchedule = schedule[day];
  if (!daySchedule || !daySchedule.enabled) return [];

  const [openH, openM] = daySchedule.open.split(':').map(Number);
  const [closeH, closeM] = daySchedule.close.split(':').map(Number);
  const openMins = openH * 60 + openM;
  const closeMins = closeH * 60 + closeM - 15;

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const minTime = isToday ? now.getHours() * 60 + now.getMinutes() + 15 : 0;

  const slots: string[] = [];
  for (let m = Math.max(openMins, minTime); m <= closeMins; m += 15) {
    const rounded = Math.ceil(m / 15) * 15;
    if (rounded > closeMins) break;
    const h = Math.floor(rounded / 60);
    const min = rounded % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    const label = `${hr}:${min.toString().padStart(2, '0')} ${ampm}`;
    if (!slots.includes(label)) slots.push(label);
  }
  return slots;
}

export function isOrderingOpen(schedule: WeekSchedule): boolean {
  const now = new Date();
  const day = String(now.getDay());
  const daySchedule = schedule[day];
  if (!daySchedule || !daySchedule.enabled) return false;
  const [openH, openM] = daySchedule.open.split(':').map(Number);
  const [closeH, closeM] = daySchedule.close.split(':').map(Number);
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= openH * 60 + openM && mins < closeH * 60 + closeM;
}
