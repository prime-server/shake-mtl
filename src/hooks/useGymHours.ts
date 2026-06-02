import { useEffect, useState } from 'react';

const PLACE_ID = 'ChIJW9OgnwIYyUwRpAqIqA6I1tc';
const API_KEY = 'AIzaSyDgRx73He8DAVKuwpZ2YQdxqkxY7jlKurU';
const CACHE_KEY = 'shake_gym_hours';
const CACHE_TTL = 60 * 1000; // 60 seconds — near real-time, still avoids redundant calls

interface HoursData {
  weekdayDescriptions: string[];
  openNow: boolean;
  address: string;
}

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

export function getTodayHours(descriptions: string[]): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = days[new Date().getDay()];
  const match = descriptions.find((d) => d.startsWith(today));
  return match ? match.replace(`${today}: `, '') : '';
}
