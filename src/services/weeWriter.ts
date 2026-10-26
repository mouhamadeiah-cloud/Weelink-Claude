// The owner's Wee AI answers as the facts «ابن صفحتي» works from (see pageBuilder.ts).

export interface WeeAnswers {
  // A free restaurant, shop or showroom page (plans.ts flavorOf): a page that builds from that type's free model.
  flavor?: 'restaurant' | 'shop' | 'cars' | 'rental';
  personalInfo?: { title?: string; fullName?: string; pageName?: string; logoUrl?: string };
  addressInfo?: { governorate?: string; placeType?: string; city?: string; area?: string; district?: string; subdistrict?: string; village?: string; street?: string; details?: string };
  contactInfo?: { whatsapp?: string; phone?: string; facebook?: string; tiktok?: string };
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
    العنوان: (ad.placeType === 'rural' ? [ad.governorate, ad.district, ad.subdistrict, ad.village, ad.street] : [ad.governorate, ad.city, ad.area, ad.street]).filter(Boolean).join('، '),
    واتساب: c.whatsapp || '',
    هاتف: c.phone || '',
    طابع_الصفحة: ai.motionEffects || '',
    ملاحظات: ai.specialInstructions || '',
    الخدمات: serviceLines(ai.services),
    المزايا: (ai.features || []).slice(0, 12).join('، '),
  };
  return Object.fromEntries(Object.entries(facts).filter(([, v]) => v && v.trim()));
};
