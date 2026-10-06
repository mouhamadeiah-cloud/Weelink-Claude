import { GalleryImageItem, UNSPLASH_GALLERY_PHOTOS } from '../data/graphicsPresets';

// Safe retrieval of Unsplash Access Key
export const getUnsplashAccessKey = (): string => {
  if (typeof window !== 'undefined') {
    const userOverride = localStorage.getItem('weelink_unsplash_access_key');
    if (userOverride && userOverride.trim()) {
      return userOverride.trim();
    }
  }

  // Check process.env (injected by Vite define)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.UNSPLASH_ACCESS_KEY) {
      return process.env.UNSPLASH_ACCESS_KEY;
    }
  } catch (e) {
    // Ignore error
  }

  // Check Vite import.meta.env
  try {
    if (import.meta && import.meta.env && (import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string)) {
      return import.meta.env.VITE_UNSPLASH_ACCESS_KEY as string;
    }
  } catch (e) {
    // Ignore error
  }

  return '';
};

// Memory cache to avoid repeated requests and conserve API rate limits
const cache = new Map<string, { items: GalleryImageItem[]; totalPages: number; total: number; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes cache

// Translation mapping from Arabic category to optimal Unsplash search terms
const CATEGORY_SEARCH_MAP: Record<string, string> = {
  خلفيات: 'minimal abstract texture wallpaper background',
  رخام: 'marble texture stone luxury minimal',
  طعام: 'gourmet food photography culinary dishes delicious',
  بورتريه: 'portrait editorial people face creative',
  طبيعة: 'nature landscape mountains ocean forest scenic',
  أعمال: 'modern business workspace office teamwork technology',
  معمار: 'modern architecture buildings minimalist aesthetic',
  تقنية: 'modern technology computers cyber abstract',
};

export interface FetchPhotosOptions {
  query?: string;
  category?: string;
  page?: number;
  perPage?: number;
}

export interface FetchPhotosResult {
  items: GalleryImageItem[];
  totalPages: number;
  total: number;
  isLive: boolean;
  page: number;
  error?: string;
}

/**
 * Fetch photos directly from Unsplash API with automatic pagination,
 * Arabic translation, caching, and fallback presets.
 */
export async function fetchUnsplashPhotos(options: FetchPhotosOptions): Promise<FetchPhotosResult> {
  const { query = '', category = 'all', page = 1, perPage = 15 } = options;
  const cacheKey = `server|${category}|${query.trim().toLowerCase()}|${page}|${perPage}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return { items: cached.items, totalPages: cached.totalPages, total: cached.total, isLive: true, page };
  }

  // The server function holds the Unsplash key; the browser never sees it.
  let serverError = 'not_configured';
  try {
    const params = new URLSearchParams({ q: query.trim(), category, page: String(page), perPage: String(perPage) });
    const res = await fetch(`/api/photos?${params}`);
    const data = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(data.items)) {
      cache.set(cacheKey, { items: data.items, totalPages: data.totalPages, total: data.total, timestamp: Date.now() });
      return { items: data.items, totalPages: data.totalPages, total: data.total, isLive: true, page };
    }
    if (data.error) serverError = data.error;
  } catch {
    serverError = 'offline';
  }

  // Without the server (local development), a key saved in this browser still works.
  if (getUnsplashAccessKey()) return fetchUnsplashDirect(options);
  return getFallbackPhotos(query.trim(), category, page, perPage, false, serverError);
}

async function fetchUnsplashDirect({
  query = '',
  category = 'all',
  page = 1,
  perPage = 15,
}: FetchPhotosOptions): Promise<FetchPhotosResult> {
  const accessKey = getUnsplashAccessKey();
  const trimmedQuery = query.trim();

  // If no API key is available, use curated presets
  if (!accessKey) {
    return getFallbackPhotos(trimmedQuery, category, page, perPage, false);
  }

  // Build cache key
  const cacheKey = `${category}|${trimmedQuery.toLowerCase()}|${page}|${perPage}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return {
      items: cached.items,
      totalPages: cached.totalPages,
      total: cached.total,
      isLive: true,
      page,
    };
  }

  try {
    let url = '';
    const isSearching = trimmedQuery.length > 0;
    const hasCategoryFilter = category !== 'all' && CATEGORY_SEARCH_MAP[category];

    if (isSearching) {
      // Search by user's search text
      let searchTerms = trimmedQuery;
      // If a category is also selected, enrich the search
      if (hasCategoryFilter) {
        searchTerms = `${trimmedQuery} ${CATEGORY_SEARCH_MAP[category]}`;
      }
      url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerms
      )}&page=${page}&per_page=${perPage}&order_by=relevant&content_filter=high`;
    } else if (hasCategoryFilter) {
      // Search by category
      const searchTerms = CATEGORY_SEARCH_MAP[category];
      url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(
        searchTerms
      )}&page=${page}&per_page=${perPage}&order_by=relevant&content_filter=high`;
    } else {
      // General popular / editorial photos from Unsplash
      url = `https://api.unsplash.com/photos?page=${page}&per_page=${perPage}&order_by=popular`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn('Unsplash API responded with status', response.status, errorText);
      return getFallbackPhotos(trimmedQuery, category, page, perPage, false, `API Status ${response.status}`);
    }

    const data = await response.json();
    let rawItems: any[] = [];
    let total = 0;
    let totalPages = 1;

    if (Array.isArray(data)) {
      // Direct /photos returns an array
      rawItems = data;
      total = 10000; // Unsplash editorial catalog is practically limitless
      totalPages = Math.ceil(total / perPage);
    } else if (data && Array.isArray(data.results)) {
      // /search/photos returns { total, total_pages, results }
      rawItems = data.results;
      total = data.total || 0;
      totalPages = data.total_pages || Math.ceil(total / perPage);
    }

    const items: GalleryImageItem[] = rawItems.map((photo: any) => {
      // Pick best title description in Arabic or clean English
      const title =
        photo.alt_description ||
        photo.description ||
        `صورة ${category !== 'all' ? category : ''} من Unsplash`.trim();

      return {
        id: `unsplash-${photo.id}`,
        title: title.slice(0, 70),
        category: category !== 'all' ? category : 'عام',
        thumbUrl: photo.urls?.small || photo.urls?.thumb || photo.urls?.regular,
        fullUrl: photo.urls?.regular || photo.urls?.full || photo.urls?.small,
        photographer: photo.user?.name || photo.user?.username || 'Unsplash',
        photographerUrl: photo.user?.links?.html,
        downloadLocation: photo.links?.download_location,
        width: photo.width,
        height: photo.height,
      };
    });

    // Store in cache
    cache.set(cacheKey, {
      items,
      totalPages,
      total,
      timestamp: Date.now(),
    });

    return {
      items,
      totalPages,
      total,
      isLive: true,
      page,
    };
  } catch (error: any) {
    console.error('Failed to fetch from Unsplash API:', error);
    return getFallbackPhotos(trimmedQuery, category, page, perPage, false, error?.message || 'Network error');
  }
}

/**
 * Triggers Unsplash download tracking per API Guidelines
 */
export async function trackUnsplashDownload(downloadLocation?: string, unsplashId?: string): Promise<void> {
  if (unsplashId) {
    fetch(`/api/photos?track=${encodeURIComponent(unsplashId)}`).catch(() => null);
    return;
  }
  if (!downloadLocation) return;
  const accessKey = getUnsplashAccessKey();
  if (!accessKey) return;

  try {
    await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
      },
    });
  } catch (e) {
    // Non-blocking fire & forget
  }
}

/**
 * Fallback to curated preset photos when offline or without API key
 */
function getFallbackPhotos(
  query: string,
  category: string,
  page: number,
  perPage: number,
  isLive = false,
  error?: string
): FetchPhotosResult {
  let filtered = UNSPLASH_GALLERY_PHOTOS;

  if (category !== 'all') {
    filtered = filtered.filter((p) => p.category === category);
  }

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        q.includes(p.category.toLowerCase()) ||
        (p.photographer && p.photographer.toLowerCase().includes(q))
    );
  }

  const start = (page - 1) * perPage;
  const items = filtered.slice(start, start + perPage);
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return {
    items,
    total,
    totalPages,
    isLive,
    page,
    error,
  };
}
