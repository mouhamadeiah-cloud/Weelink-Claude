// Template of «تأجير فنادق ومساحات عقارية» (Eyad 26 Oct): the rental's pages (الرئيسية، المتاح، من نحن،
// تواصل معنا, السلة) in the words of a stay, with the shop's live product cards standing for the rooms,
// halls and villas and the shop's search to find one. Filled from the warehouse; booked from the cart.
import type { CanvasElement, Page } from '../types';
import { getCarShowroomTemplate, CAR_PAGE_IDS } from './carShowroomTemplate';
import { withRentalCart } from './rentalCartPage';

const WORDS: Record<string, string> = {
  'car-hero-badge': 'احجز الآن',
  'car-hero-heading': 'إقامتك أو مناسبتك بانتظارك',
  'car-hero-text': 'غرف وصالات وفلل نظيفة ومجهّزة بأسعار واضحة، احجز بسهولة من الصفحة.',
  'car-hero-cta': 'شوف المتاح',
  'car-featured-heading': 'مميز عندنا',
  'car-featured-sub': 'الأكثر طلباً عند ضيوفنا',
  'car-featured-more': 'كل المتاح للحجز',
  'car-perks-heading': 'ليش تقيم عندنا؟',
  'car-perk-1-title': 'نظافة وراحة',
  'car-perk-1-text': 'كل غرفة منجهّزها بعناية قبل وصولك.',
  'car-perk-2-title': 'أسعار واضحة',
  'car-perk-2-text': 'سعر الليلة مكتوب، بلا مفاجآت.',
  'car-perk-3-title': 'حجز سهل',
  'car-perk-3-text': 'احجز من الصفحة أو على واتساب بدقيقة.',
  'car-perk-4-title': 'ضيافة قريبة',
  'car-perk-4-text': 'نجاوبك بسرعة ونساعدك تختار الغرفة المناسبة.',
  'car-cta-heading': 'ما لقيت المناسب؟',
  'car-cta-text': 'خبّرنا عدد الأشخاص والأيام ومنقترح عليك الأنسب.',
  'car-showhead-heading': 'المتاح للحجز',
  'car-showhead-text': 'كل الغرف والصالات والفلل المتاحة، اضغط على أي واحد لتشوف تفاصيله وصوره',
  'car-about-heading': 'ضيافة بخبرة طويلة',
  'car-about-text': 'بدأنا بهدف بسيط: إنو الضيف يرتاح كأنو ببيته. منجهّز كل غرفة بعناية، ومنكتب سعرها ومواصفاتها بوضوح، ومنكون جنبك من الوصول للمغادرة.',
  'car-about-cta': 'زورنا',
  'car-stat-1-t': 'سنة خبرة',
  'car-stat-2-t': 'ضيف سعيد',
  'car-contact-sub': 'للحجز أو لأي سؤال، نحن بانتظارك.',
  'car-home-search-bar': 'شو بدك تحجز؟',
};

const PAGE_NAMES: Record<string, string> = { [CAR_PAGE_IDS.showroom]: 'المتاح' };

// The shop's live product cards and search, in the places of the car cards and the car search.
const asRooms = (e: CanvasElement): CanvasElement => {
  if (e.type === 'carListings') {
    const featured = e.carSource === 'featured';
    const { carLayout: _l, carLimit: _n, carSource: _s, carFilters: _f, ...rest } = e;
    return { ...rest, type: 'shopProducts', name: 'المتاح للحجز', shopLayout: 'grid', shopLimit: featured ? 4 : 30, ...(featured ? { shopSource: 'featured' as const } : {}) };
  }
  if (e.type === 'carSearch') return { ...e, type: 'shopSearch', name: 'بحث', content: 'شو بدك تحجز؟' };
  return e;
};

export function getHotelTemplate(): { pages: Page[]; elements: CanvasElement[] } {
  const base = getCarShowroomTemplate();
  const pages = base.pages.map((p) => ({
    ...p,
    name: PAGE_NAMES[p.id] || p.name,
    navbar: {
      ...p.navbar,
      brandName: 'اسم مكانك',
      ctaText: 'شوف المتاح',
      items: p.navbar.items.map((i) => (i.linkTargetId === CAR_PAGE_IDS.showroom ? { ...i, label: 'المتاح' } : i)),
    },
    slides: p.slides.map((s) => (s.id === 'car-home-search' ? { ...s, name: 'ابحث' } : s.id === 'car-showroom-all' ? { ...s, name: 'كل المتاح' } : s)),
  }));
  const elements = base.elements.map((e) => asRooms(WORDS[e.id] !== undefined ? { ...e, content: WORDS[e.id] } : e));
  return withRentalCart(pages, elements, 1) || { pages, elements };
}
