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

const slotFor = (el: Named, seen: Set<string>, body?: Body): string | undefined => {
  if (el.type === 'image') return 'image';
  if (el.type === 'badge' || (el.type === 'button' && !el.linkType)) return 'eyebrow';
  if (el.type === 'button') return el.contactType === 'whatsapp' ? 'whatsapp' : 'cta';
  if (el.type !== 'heading' && el.type !== 'paragraph') return undefined;
  if (body === 'ticker' || body === 'facts') return body;
  // Why-us slides: the first heading is the title, the rest are the cards' titles and sentences.
  if (body === 'points') return el.type === 'heading' && !seen.has('title') ? 'title' : 'points';
  const first = el.type === 'heading' ? 'title' : 'sub';
  return seen.has(first) ? undefined : first;
};

/** The ready slide with its AI id and slot names. */
export const withStoreSlideNames = <T extends { elements: Named[] }>(kind: Kind, index: number, slide: T): T & { aiTemplate?: string } => {
  const entry = IDS[kind][index];
  if (!entry) return slide;
  const [aiTemplate, body] = entry;
  const seen = new Set<string>();
  const elements = slide.elements.map((el) => {
    const aiSlot = slotFor(el, seen, body);
    if (!aiSlot) return el;
    seen.add(aiSlot);
    return { ...el, aiSlot };
  });
  return { ...slide, aiTemplate, elements };
};

export const STORE_SLIDE_IDS = Object.fromEntries(
  (Object.keys(IDS) as Kind[]).map((k) => [k, IDS[k].map(([id]) => id)]),
) as Record<Kind, string[]>;
