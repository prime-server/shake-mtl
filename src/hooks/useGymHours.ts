import { useEffect, useState } from 'react';

const PLACE_ID = 'ChIJW9OgnwIYyUwRpAqIqA6I1tc';
const API_KEY = 'AIzaSyDgRx73He8DAVKuwpZ2YQdxqkxY7jlKurU';
const CACHE_KEY = 'shake_gym_hours';
const CACHE_TTL = 60 * 1000; // 60 seconds — near real-time, still avoids redundant calls

interface Period {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
}

interface HoursData {
  weekdayDescriptions: string[];
  periods: Period[];
  openNow: boolean;
  address: string;
}

const FALLBACK_PERIODS: Period[] = [
  { open: { day: 0, hour: 7, minute: 0 }, close: { day: 0, hour: 19, minute: 0 } },
  { open: { day: 1, hour: 5, minute: 0 }, close: { day: 1, hour: 23, minute: 0 } },
  { open: { day: 2, hour: 5, minute: 0 }, close: { day: 2, hour: 23, minute: 0 } },
  { open: { day: 3, hour: 5, minute: 0 }, close: { day: 3, hour: 23, minute: 0 } },
  { open: { day: 4, hour: 5, minute: 0 }, close: { day: 4, hour: 23, minute: 0 } },
  { open: { day: 5, hour: 5, minute: 0 }, close: { day: 5, hour: 22, minute: 0 } },
  { open: { day: 6, hour: 7, minute: 0 }, close: { day: 6, hour: 19, minute: 0 } },
];

const FALLBACK: HoursData = {
  weekdayDescriptions: [
    'Monday: 5:00 AM – 11:00 PM',
    'Tuesday: 5:00 AM – 11:00 PM',
    'Wednesday: 5:00 AM – 11:00 PM',
    'Thursday: 5:00 AM – 11:00 PM',
    'Friday: 5:00 AM – 10:00 PM',
    'Saturday: 7:00 AM – 7:00 PM',
    'Sunday: 7:00 AM – 7:00 PM',
  ],
  periods: FALLBACK_PERIODS,
  openNow: false,
  address: '3131 Boul. Côte-Vertu O., Suite C-35\nSaint-Laurent, QC H4R 1Y8',
};

export function useGymHours() {
  const [data, setData] = useState<HoursData>(FALLBACK);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data: d, ts } = JSON.parse(cached);
        if (Date.now() - ts < CACHE_TTL) {
          setData(d);
          setLoading(false);
          return;
        }
      }
    } catch { /* cache miss */ }

    const url = `https://places.googleapis.com/v1/places/${PLACE_ID}`;
    fetch(url, {
      headers: {
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': 'regularOpeningHours,formattedAddress',
      },
    })
      .then((r) => r.json())
      .then((place) => {
        if (place.regularOpeningHours) {
          const result: HoursData = {
            weekdayDescriptions: place.regularOpeningHours.weekdayDescriptions,
            periods: place.regularOpeningHours.periods ?? FALLBACK_PERIODS,
            openNow: place.regularOpeningHours.openNow ?? false,
            address: place.formattedAddress ?? FALLBACK.address,
          };
          setData(result);
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ data: result, ts: Date.now() })
          );
        }
      })
      .catch(() => {
        // Use fallback silently
      })
      .finally(() => setLoading(false));
  }, []);

  return { ...data, loading };
}

/** Check if a given date/time falls within business hours */
export function isWithinBusinessHours(date: Date, periods: Period[]): boolean {
  const day = date.getDay(); // 0=Sun
  const period = periods.find((p) => p.open.day === day);
  if (!period) return false;
  const mins = date.getHours() * 60 + date.getMinutes();
  const openMins = period.open.hour * 60 + period.open.minute;
  const closeMins = period.close.hour * 60 + period.close.minute;
  return mins >= openMins && mins < closeMins;
}

/** Get open/close hours for a given day (0=Sun) */
export function getHoursForDay(day: number, periods: Period[]): { open: string; close: string } | null {
  const period = periods.find((p) => p.open.day === day);
  if (!period) return null;
  const fmt = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hr = h % 12 || 12;
    return `${hr}:${m.toString().padStart(2, '0')} ${ampm}`;
  };
  return { open: fmt(period.open.hour, period.open.minute), close: fmt(period.close.hour, period.close.minute) };
}

/** Generate available 15-min pickup time slots for a given date */
export function getPickupSlots(date: Date, periods: Period[]): string[] {
  const day = date.getDay();
  const period = periods.find((p) => p.open.day === day);
  if (!period) return [];

  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  // Minimum 15 min from now for today
  const minTime = isToday ? now.getHours() * 60 + now.getMinutes() + 15 : 0;

  const openMins = period.open.hour * 60 + period.open.minute;
  const closeMins = period.close.hour * 60 + period.close.minute - 15; // last slot 15 min before close

  const slots: string[] = [];
  for (let m = Math.max(openMins, minTime); m <= closeMins; m += 15) {
    // Round up to next 15-min interval
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

export function getTodayHours(descriptions: string[]): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const match = descriptions.find((d) => d.startsWith(today));
  return match ? match.replace(`${today}: `, '') : '';
}
