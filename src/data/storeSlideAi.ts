// Names for the ready slides of the restaurant, shop and car showroom, for «ابن صفحتي»: each slide
// gets a fixed id (slide.aiTemplate, like the 17 designs of weeSlideTemplates) and its texts,
// buttons and photos get slot names (element.aiSlot). The dishes, products and cars come from the
// admin window, so the AI only writes the titles around them. Listed in the order of each file's
// SLIDES.

type Kind = 'restaurant' | 'shop' | 'cars';
// How a slide's extra headings and paragraphs are named: 'points' (why-us cards: a title and a
// sentence each), 'facts' (a number above its label) or 'ticker' (the running text strip).
type Body = 'points' | 'facts' | 'ticker';

const IDS: Record<Kind, [string, Body?][]> = {
  restaurant: [
    ['rest.front'], ['rest.featured'], ['rest.featuredStrip'], ['rest.featuredShake'], ['rest.ticker', 'ticker'],
    ['rest.menuSections'], ['rest.menuRows'], ['rest.menuBig'], ['rest.menuOne'], ['rest.cart'], ['rest.why', 'points'], ['rest.order'],
  ],
  shop: [
    ['shop.front'], ['shop.twoPhotos'], ['shop.zigzag'], ['shop.wide'], ['shop.small'], ['shop.large'], ['shop.searchSimple'],
    ['shop.searchBg'], ['shop.featuredStrip'], ['shop.moving'], ['shop.featuredShake'], ['shop.ticker', 'ticker'], ['shop.cart2'], ['shop.cartDark'],
  ],
  cars: [
    ['cars.front'], ['cars.frontSearch'], ['cars.featured'], ['cars.all'], ['cars.rows'], ['cars.big'], ['cars.strip'],
    ['cars.shake'], ['cars.ticker', 'ticker'], ['cars.searchBar'], ['cars.why', 'points'], ['cars.about'], ['cars.numbers', 'facts'], ['cars.request'],
  ],
};

interface Named {
  type: string;
  linkType?: string;
  contactType?: string;
  aiSlot?: string;
}

// Why-us cards and figures are numbered in page order: points.0.title, points.0.text, …;
// facts.0.number, facts.0.label, ….
const slotFor = (el: Named, seen: Set<string>, body: Body | undefined, count: { heading: number; paragraph: number }): string | undefined => {
  if (el.type === 'image') return seen.has('image') ? undefined : 'image';
  if (el.type === 'badge' || (el.type === 'button' && !el.linkType)) return 'eyebrow';
  if (el.type === 'button') return el.contactType === 'whatsapp' ? 'whatsapp' : 'cta';
  if (el.type !== 'heading' && el.type !== 'paragraph') return undefined;
  if (body === 'ticker') return 'ticker';
  if (body === 'facts') return el.type === 'heading' ? `facts.${count.heading++}.number` : `facts.${count.paragraph++}.label`;
  // Why-us slides: the first heading is the title, the rest are the cards' titles and sentences.
  if (body === 'points') {
    if (el.type === 'heading' && !seen.has('title')) return 'title';
    return el.type === 'heading' ? `points.${count.heading++}.title` : `points.${count.paragraph++}.text`;
  }
  const first = el.type === 'heading' ? 'title' : 'sub';
  return seen.has(first) ? undefined : first;
};

/** The ready slide with its AI id and slot names. */
export const withStoreSlideNames = <T extends { elements: Named[] }>(kind: string, index: number, slide: T): T & { aiTemplate?: string } => {
  const entry = IDS[kind as Kind]?.[index];
  if (!entry) return slide;
  const [aiTemplate, body] = entry;
  const seen = new Set<string>();
  const count = { heading: 0, paragraph: 0 };
  const elements = slide.elements.map((el) => {
    const aiSlot = slotFor(el, seen, body, count);
    if (!aiSlot) return el;
    seen.add(aiSlot);
    return { ...el, aiSlot };
  });
  return { ...slide, aiTemplate, elements };
};

export const STORE_SLIDE_IDS = Object.fromEntries(
  (Object.keys(IDS) as Kind[]).map((k) => [k, IDS[k].map(([id]) => id)]),
) as Record<Kind, string[]>;
