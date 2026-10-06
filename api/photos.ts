// Vercel serverless function: searches Unsplash photos for the editor's image gallery.
//
//   GET /api/photos?q=<search>&category=<arabic category>&page=1&perPage=24
//     → { items, total, totalPages, page }
//   GET /api/photos?track=<photo id>
//     → tells Unsplash the photo was used (required by its API guidelines)
//
// The Unsplash access key lives only in the Vercel environment variable UNSPLASH_ACCESS_KEY,
// never in the frontend code. Answers are cached by Vercel's CDN for an hour, so the same
// search from many users costs one Unsplash request.

const MAX_PER_PAGE = 30;

const json = (body: unknown, status = 200, cache = false) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(cache ? { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } : {}),
    },
  });

// The gallery's categories, as the English searches that find good photos for them.
const CATEGORY_SEARCH: Record<string, string> = {
  خلفيات: 'minimal abstract background texture',
  رخام: 'marble texture',
  طعام: 'food photography',
  بورتريه: 'portrait',
  طبيعة: 'nature landscape',
  أعمال: 'business office',
  معمار: 'architecture',
  تقنية: 'technology',
  مطاعم: 'restaurant interior',
  قهوة: 'coffee',
  حلويات: 'dessert pastry',
  أزياء: 'fashion',
  جمال: 'beauty salon',
  رياضة: 'sport fitness',
  سفر: 'travel',
  سيارات: 'car',
  طب: 'medical clinic',
  تعليم: 'education classroom',
};

// Common Arabic words people search for, in English, since Unsplash finds far more that way.
const AR_WORDS: Record<string, string> = {
  قهوة: 'coffee', قهوه: 'coffee', شاي: 'tea', مطعم: 'restaurant', مطاعم: 'restaurant', طعام: 'food', اكل: 'food', أكل: 'food',
  بيتزا: 'pizza', برغر: 'burger', برجر: 'burger', شاورما: 'shawarma', فلافل: 'falafel', حمص: 'hummus', كباب: 'kebab',
  مشاوي: 'grill', دجاج: 'chicken', لحم: 'meat', سمك: 'fish', خبز: 'bread', مخبز: 'bakery', حلويات: 'dessert', حلو: 'sweets',
  كيك: 'cake', كعك: 'cake', بوظة: 'ice cream', ايس: 'ice', عصير: 'juice', فواكه: 'fruits', خضار: 'vegetables', سلطة: 'salad',
  طبيعة: 'nature', بحر: 'sea', شاطئ: 'beach', جبل: 'mountain', جبال: 'mountains', غابة: 'forest', سماء: 'sky', ورد: 'flowers',
  زهور: 'flowers', وردة: 'rose', شجرة: 'tree', صحراء: 'desert', مدينة: 'city', دمشق: 'damascus', حلب: 'aleppo', بيروت: 'beirut',
  رخام: 'marble', خشب: 'wood', حجر: 'stone', خلفية: 'background', خلفيات: 'background', ملمس: 'texture', تجريدي: 'abstract',
  مكتب: 'office', أعمال: 'business', عمل: 'work', فريق: 'team', تقنية: 'technology', كمبيوتر: 'computer', هاتف: 'phone',
  موبايل: 'smartphone', سيارة: 'car', سيارات: 'cars', بيت: 'house', منزل: 'home', غرفة: 'room', مطبخ: 'kitchen', أثاث: 'furniture',
  معمار: 'architecture', بناء: 'building', عمارة: 'building', مسجد: 'mosque', رمضان: 'ramadan', عيد: 'celebration', عرس: 'wedding',
  زفاف: 'wedding', طفل: 'child', أطفال: 'children', امرأة: 'woman', رجل: 'man', ناس: 'people', عائلة: 'family', صحة: 'health',
  طبيب: 'doctor', عيادة: 'clinic', أسنان: 'dental', صيدلية: 'pharmacy', رياضة: 'sport', نادي: 'gym', جمال: 'beauty',
  صالون: 'salon', شعر: 'hair', مكياج: 'makeup', عطر: 'perfume', أزياء: 'fashion', ملابس: 'clothes', فستان: 'dress', حذاء: 'shoes',
  ساعة: 'watch', ذهب: 'gold', مجوهرات: 'jewelry', تسوق: 'shopping', متجر: 'shop', سوق: 'market', سفر: 'travel', فندق: 'hotel',
  طائرة: 'airplane', مدرسة: 'school', تعليم: 'education', كتاب: 'book', كتب: 'books', قلم: 'pen', فن: 'art', موسيقى: 'music',
  تصوير: 'photography', كاميرا: 'camera', قطة: 'cat', كلب: 'dog', حيوانات: 'animals', حصان: 'horse', ليل: 'night', شمس: 'sun',
  مطر: 'rain', ثلج: 'snow', شتاء: 'winter', صيف: 'summer', ربيع: 'spring', خريف: 'autumn', أبيض: 'white', أسود: 'black',
  أزرق: 'blue', أحمر: 'red', أخضر: 'green', أصفر: 'yellow', وردي: 'pink', بنفسجي: 'purple', ذهبي: 'golden',
};

const hasArabic = (s: string) => /[؀-ۿ]/.test(s);

// An Arabic search in English where every word is known; otherwise the Arabic as it is.
const toSearchTerms = (q: string) => {
  if (!hasArabic(q)) return { terms: q, lang: 'en' };
  const words = q.replace(/[،,.!؟?]/g, ' ').split(/\s+/).filter(Boolean);
  const known = words.map((w) => AR_WORDS[w] || AR_WORDS[w.replace(/^ال/, '')] || '');
  if (known.every(Boolean)) return { terms: known.join(' '), lang: 'en' };
  return { terms: q, lang: 'ar' };
};

const accessKey = () => process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || process.env.UNSPLASH_KEY || '';

const unsplash = (path: string, key: string) =>
  fetch(`https://api.unsplash.com${path}`, { headers: { Authorization: `Client-ID ${key}`, 'Accept-Version': 'v1' } });

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
    const key = accessKey();
    if (!key) return json({ error: 'not_configured' }, 503);

    const url = new URL(request.url);

    const track = url.searchParams.get('track');
    if (track) {
      if (!/^[A-Za-z0-9_-]{1,40}$/.test(track)) return json({ error: 'bad_request' }, 400);
      await unsplash(`/photos/${track}/download`, key).catch(() => null);
      return json({ ok: true });
    }

    const q = (url.searchParams.get('q') || '').trim().slice(0, 100);
    const category = (url.searchParams.get('category') || 'all').slice(0, 40);
    const page = Math.max(1, Math.min(200, Number(url.searchParams.get('page')) || 1));
    const perPage = Math.max(6, Math.min(MAX_PER_PAGE, Number(url.searchParams.get('perPage')) || 24));

    const search = q ? toSearchTerms(q) : category !== 'all' && CATEGORY_SEARCH[category] ? { terms: CATEGORY_SEARCH[category], lang: 'en' } : null;
    const path = search
      ? `/search/photos?query=${encodeURIComponent(search.terms)}&lang=${search.lang}&page=${page}&per_page=${perPage}&content_filter=high`
      : `/photos?page=${page}&per_page=${perPage}&order_by=popular`;

    try {
      const res = await unsplash(path, key);
      if (!res.ok) {
        console.error('Unsplash answered', res.status, await res.text().catch(() => ''));
        return json({ error: res.status === 401 ? 'bad_key' : res.status === 403 || res.status === 429 ? 'rate_limited' : 'unsplash_failed' }, 502);
      }
      const data: any = await res.json();
      const raw: any[] = Array.isArray(data) ? data : data.results || [];
      const total = Array.isArray(data) ? 10000 : data.total || 0;
      const totalPages = Array.isArray(data) ? 200 : data.total_pages || 1;
      const items = raw.map((p) => ({
        id: `unsplash-${p.id}`,
        unsplashId: p.id,
        title: String(p.alt_description || p.description || 'صورة من Unsplash').slice(0, 70),
        category: category !== 'all' ? category : 'عام',
        thumbUrl: p.urls?.small || p.urls?.thumb,
        fullUrl: p.urls?.regular || p.urls?.full,
        photographer: p.user?.name || p.user?.username || 'Unsplash',
        photographerUrl: p.user?.links?.html,
        color: p.color,
        width: p.width,
        height: p.height,
      }));
      return json({ items, total, totalPages: Math.min(totalPages, 200), page }, 200, true);
    } catch (err) {
      console.error('photos failed:', err);
      return json({ error: 'unsplash_failed' }, 502);
    }
  },
};
