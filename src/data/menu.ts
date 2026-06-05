export interface Modifier {
  id: string;
  name: string;
  priceCents: number;
}

export interface ModifierList {
  id: string;
  name: string;
  modifiers: Modifier[];
}

export interface MenuItem {
  id: string;
  variationId: string | null;
  name: string;
  description: string;
  price: number;
  priceCents?: number;
  categoryId: string | null;
  imageUrl: string | null;
  modifierListIds?: string[];
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface CatalogData {
  categories: CategoryItem[];
  items: MenuItem[];
  modifierLists: ModifierList[];
  addOns: MenuItem[];
}

const CACHE_KEY = 'shake_catalog';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedEntry {
  data: CatalogData;
  ts: number;
}

// In-memory reference so concurrent callers don't re-fetch
let inflightFetch: Promise<CatalogData> | null = null;

function getCached(): CachedEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedEntry;
      if (parsed?.data?.categories && parsed?.data?.items) return parsed;
    }
  } catch { /* miss */ }
  return null;
}

function saveCache(data: CatalogData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* quota exceeded — ignore */ }
}

function isStale(ts: number): boolean {
  return Date.now() - ts >= CACHE_TTL;
}

async function fetchFresh(): Promise<CatalogData> {
  const resp = await fetch('/api/catalog');
  if (!resp.ok) throw new Error('API error');
  const data: CatalogData = await resp.json();
  saveCache(data);
  return data;
}

function refreshInBackground(): void {
  // Dedupe: only one background refresh at a time
  if (inflightFetch) return;
  inflightFetch = fetchFresh()
    .catch(() => { /* silent — stale data is still showing */ })
    .finally(() => { inflightFetch = null; }) as Promise<CatalogData>;
}

export async function fetchCatalog(): Promise<CatalogData> {
  // 1. Return cached data immediately if available
  const cached = getCached();
  if (cached) {
    // If stale, kick off a background refresh for next time
    if (isStale(cached.ts)) {
      refreshInBackground();
    }
    return cached.data;
  }

  // 2. No cache — fetch synchronously (dedupe concurrent calls)
  if (!inflightFetch) {
    inflightFetch = fetchFresh().finally(() => { inflightFetch = null; });
  }

  try {
    return await inflightFetch;
  } catch {
    return { categories: [], items: [], modifierLists: [], addOns: [] };
  }
}
