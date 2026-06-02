export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string | null;
  imageUrl: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
}

export interface CatalogData {
  categories: CategoryItem[];
  items: MenuItem[];
}

const CACHE_KEY = 'shake_catalog';
const CACHE_TTL = 60 * 1000;

export async function fetchCatalog(): Promise<CatalogData> {
  // Check cache
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < CACHE_TTL) return data;
    }
  } catch { /* miss */ }

  try {
    const resp = await fetch('/api/catalog');
    if (!resp.ok) throw new Error('API error');
    const data: CatalogData = await resp.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
    return data;
  } catch {
    // Return empty if API unreachable
    return { categories: [], items: [] };
  }
}
