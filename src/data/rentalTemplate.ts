// Rental template (Weelink / Rental, Eyad 25 Oct): the car showroom's 4 pages (الرئيسية، للإيجار، من نحن،
// تواصل معنا) in the words of renting. A rental that is mostly cars keeps the live car cards and car
// search; any other rental (equipment, chalets, halls, other things) gets the shop's live product
// cards and product search in the same places, filled from the rental's items.
import type { CanvasElement, Page } from '../types';
import { getCarShowroomTemplate, CAR_PAGE_IDS } from './carShowroomTemplate';
import { rentalCartPage } from './rentalCartPage';

type Words = Record<string, string>;

// The same for every rental, by element id.
const COMMON: Words = {
  'car-hero-badge': 'متاح للإيجار',
  'car-hero-cta': 'شوف المتاح',
  'car-featured-sub': 'الأكثر طلباً عندنا',
  'car-featured-more': 'كل المتاح للإيجار',
  'car-perks-heading': 'ليش تستأجر منّا؟',
  'car-perk-1-title': 'جاهز ونظيف',
  'car-perk-1-text': 'كل شي منأجّره مفحوص وجاهز قبل التسليم.',
  'car-perk-2-title': 'أسعار واضحة',
  'car-perk-2-text': 'السعر مكتوب، بالساعة أو باليوم، بلا مفاجآت.',
  'car-perk-3-title': 'حجز سهل',
  'car-perk-3-text': 'احجز من الصفحة أو على واتساب بدقيقة.',
  'car-perk-4-title': 'خدمة قريبة',
  'car-perk-4-text': 'نجاوبك بسرعة ونساعدك تختار المناسب.',
  'car-cta-heading': 'ما لقيت اللي بدك ياه؟',
  'car-cta-text': 'خبّرنا شو بدك تستأجر ومنلاقيلك ياه.',
  'car-showhead-heading': 'للإيجار',
  'car-showhead-text': 'كل المتاح الآن، اضغط على أي واحد لتشوف تفاصيله وصوره',
  'car-about-heading': 'خبرة طويلة بالتأجير',
  'car-about-text': 'بدأنا بهدف بسيط: إنو الزبون يستأجر وهو مرتاح. منجهّز كل شي بعناية، ومنكتب حالته وسعره بوضوح، ومنكون جنبك من الاستلام للتسليم.',
  'car-about-cta': 'زورنا',
  'car-stat-2-t': 'حجز ناجح',
  'car-contact-sub': 'للحجز أو لأي سؤال، نحن بانتظارك.',
};

// What the hero says, by what is rented.
const HERO: Record<string, { heading: string; text: string }> = {
  'سيارات': { heading: 'سيارتك للمشوار جاهزة', text: 'سيارات نظيفة ومفحوصة بأسعار واضحة، باليوم أو بالساعة، مع سائق أو بدون.' },
  'معدات وآليات': { heading: 'المعدات اللي بتلزم شغلك', text: 'آليات ومعدات جاهزة للعمل بأسعار واضحة، باليوم أو بالساعة.' },
  'شاليهات وبيوت': { heading: 'مكانك للراحة جاهز', text: 'شاليهات وبيوت نظيفة ومجهّزة، احجز أيامك بسهولة.' },
  'صالات': { heading: 'صالة تليق بمناسبتك', text: 'صالات مجهّزة للأفراح والرياضة والعزاء، احجز موعدك بسهولة.' },
};
const OTHER = { heading: 'كل اللي بدك تستأجره بمكان واحد', text: 'أغراض نظيفة وجاهزة بأسعار واضحة، احجز باليوم أو بالساعة.' };

const PAGE_NAMES: Record<string, string> = { [CAR_PAGE_IDS.showroom]: 'للإيجار' };

// The shop's live product cards and search, in the places of the car cards and the car search.
const asItems = (e: CanvasElement): CanvasElement => {
  if (e.type === 'carListings') {
    const featured = e.carSource === 'featured';
    const { carLayout: _l, carLimit: _n, carSource: _s, carFilters: _f, ...rest } = e;
    return { ...rest, type: 'shopProducts', name: 'المتاح للإيجار', shopLayout: 'grid', shopLimit: featured ? 4 : 30, ...(featured ? { shopSource: 'featured' as const } : {}) };
  }
  if (e.type === 'carSearch') return { ...e, type: 'shopSearch', name: 'بحث', content: 'شو بدك تستأجر؟' };
  return e;
};

export function getRentalTemplate(category?: string | null): { pages: Page[]; elements: CanvasElement[] } {
  const base = getCarShowroomTemplate();
  const cars = !category || category === 'سيارات';
  const hero = HERO[category || 'سيارات'] || OTHER;
  const words: Words = {
    ...COMMON,
    'car-hero-heading': hero.heading,
    'car-hero-text': hero.text,
    'car-featured-heading': cars ? 'سيارات مميزة' : 'مميز عندنا',
    'car-stat-1-t': 'سنة خبرة',
    ...(cars ? {} : { 'car-home-search-bar': 'شو بدك تستأجر؟' }),
  };
  const pages = base.pages.map((p) => ({
    ...p,
    name: PAGE_NAMES[p.id] || p.name,
    navbar: {
      ...p.navbar,
      brandName: 'اسم شركتك',
      ctaText: 'شوف المتاح',
      items: p.navbar.items.map((i) => (i.linkTargetId === CAR_PAGE_IDS.showroom ? { ...i, label: 'للإيجار' } : i)),
    },
    slides: p.slides.map((s) => (s.id === 'car-home-search' ? { ...s, name: cars ? 'ابحث عن سيارة' : 'ابحث' } : s.id === 'car-showroom-all' ? { ...s, name: 'كل المتاح' } : s)),
  }));
  const elements = base.elements.map((e) => {
    const next = words[e.id] !== undefined ? { ...e, content: words[e.id] } : e;
    return cars ? next : asItems(next);
  });
  return rentalCartPage(pages, elements, 1) || { pages, elements };
}
