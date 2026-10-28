// The owner's Wee AI answers as the facts «ابن صفحتي» works from (see pageBuilder.ts).

export interface WeeAnswers {
  // A free restaurant, shop or showroom page (plans.ts flavorOf): a page that builds from that type's free model.
  flavor?: 'restaurant' | 'shop' | 'cars' | 'rental' | 'hotel';
  personalInfo?: { title?: string; fullName?: string; pageName?: string; logoUrl?: string };
  addressInfo?: { governorate?: string; placeType?: string; city?: string; area?: string; district?: string; subdistrict?: string; village?: string; street?: string; details?: string; coordinates?: { lat: number; lng: number } | null };
  contactInfo?: { whatsapp?: string; phone?: string; email?: string; facebook?: string; tiktok?: string };
  catalogInfo?: { category?: string; subCategory?: string; specialty?: string; customCategory?: string; customSpecialty?: string };
  aiAnswers?: {
    description?: string;
    motionEffects?: string;
    specialInstructions?: string;
    colorPalette?: string;
    customColor?: string;
    lookId?: string;
    customPalette?: string[];
    dividerStyle?: string;
    wantsGallery?: boolean;
    galleryImages?: string[];
    heroBgImage?: string;
    services?: { name: string; price: string }[];
    features?: string[];
    // The optional sections the owner ticked (src/data/optionalSections.ts); nothing saved = the defaults.
    optionalSections?: string[];
    // The answers of the section questions (src/data/sectionQuestions.ts), by `${section}.${question}`.
    sectionAnswers?: Record<string, any>;
  };
}

const plain = (html: string) =>
  html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

// The owner's services as «name: price» lines (a service without a price says so).
export const ownerServices = (rows: { name: string; price: string }[] | undefined) =>
  (rows || []).map((r) => ({ name: (r.name || '').trim(), price: (r.price || '').trim() })).filter((r) => r.name).slice(0, 8);
const serviceLines = (rows: { name: string; price: string }[] | undefined) =>
  ownerServices(rows).map((r) => `${r.name}: ${r.price || 'حسب الطلب'}`).join('؛ ');

type Row = Record<string, string>;
const rowsOf = (v: unknown): Row[] => (Array.isArray(v) ? (v as Row[]).filter((r) => (r?.name || '').trim()) : []);
const rowLines = (rows: Row[]) => rows.map((r) => (r.price?.trim() ? `${r.name.trim()}: ${r.price.trim()}` : r.name.trim())).join('؛ ').slice(0, 600);

/** What the owner answered to the section questions, as facts for the writer (the menu groups and items, the team, the work shown...). */
export const sectionFacts = (a: Record<string, any> | undefined): Record<string, string> => {
  if (!a) return {};
  const pick = (k: string) => rowsOf(a[k]);
  const groups = [...pick('restaurant:main.groups'), ...pick('shop:main.groups'), ...pick('cars:main.groups')];
  const items = [...pick('restaurant:main.dishes'), ...pick('shop:main.products'), ...pick('cars:main.cars')];
  const text = (k: string) => (typeof a[k] === 'string' ? a[k].trim() : '');
  const facts: Record<string, string> = {
    جملة_الواجهة: text('intro.tagline'),
    ميزة_الواجهة: text('restaurant:front.dishNote') || text('shop:front.shopNote') || text('cars:front.carsNote'),
    المجموعات_الرئيسية: groups.map((r) => r.name.trim()).join('، '),
    عناصر_القائمة: rowLines(items),
    الفريق: pick('team.team').map((r) => [r.name.trim(), r.role?.trim()].filter(Boolean).join(' - ')).join('؛ '),
    الأعمال: rowLines(pick('projects.projects')),
    عروض_خاصة: rowLines(pick('special_offer.offer')),
    فيديو: text('video.video'),
    ساعات_العمل: text('contact.hours'),
  };
  return Object.fromEntries(Object.entries(facts).filter(([, v]) => v));
};

// What the owner told Wee AI, as the few facts the writer needs.
export const businessFacts = (a: WeeAnswers, siteName: string): Record<string, string> => {
  const p = a.personalInfo || {};
  const ad = a.addressInfo || {};
  const c = a.contactInfo || {};
  const cat = a.catalogInfo || {};
  const ai = a.aiAnswers || {};
  const facts: Record<string, string> = {
    اسم_الصفحة: (p.pageName || '').trim(),
    اسم_الموقع: (p.pageName || '').trim() || siteName,
    صاحب_العمل: [p.title, p.fullName].filter(Boolean).join(' '),
    التصنيف: cat.customCategory || cat.category || '',
    الكتالوج_الفرعي: cat.subCategory || '',
    الاختصاص: cat.customSpecialty || cat.specialty || '',
    الوصف: ai.description || '',
    العنوان: (ad.placeType === 'rural' ? [ad.governorate, ad.district, ad.subdistrict, ad.village, ad.street, ad.details] : [ad.governorate, ad.city, ad.area, ad.street, ad.details]).filter(Boolean).join('، '),
    // The pin the owner put on the map: the map of the contact slide shows it (pageBuilder.ts).
    الموقع: ad.coordinates && Number.isFinite(ad.coordinates.lat) && Number.isFinite(ad.coordinates.lng) ? `${ad.coordinates.lat.toFixed(6)},${ad.coordinates.lng.toFixed(6)}` : '',
    واتساب: c.whatsapp || '',
    هاتف: c.phone || '',
    بريد: c.email || '',
    طابع_الصفحة: ai.motionEffects || '',
    ملاحظات: ai.specialInstructions || '',
    الخدمات: serviceLines(ai.services),
    المزايا: (ai.features || []).slice(0, 12).join('، '),
    ...sectionFacts(ai.sectionAnswers),
  };
  return Object.fromEntries(Object.entries(facts).filter(([, v]) => v && v.trim()));
};
